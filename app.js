// API Key 持久化存储
const API_KEY_STORAGE_KEY = 'soniox_api_keys';

// 页面加载时恢复 API Key
window.addEventListener('DOMContentLoaded', () => {
    const savedKeys = localStorage.getItem(API_KEY_STORAGE_KEY);
    const apiKeyInput = document.getElementById('apiKey');
    if (savedKeys) {
        apiKeyInput.value = savedKeys;
        console.log('已加载保存的 API Keys');
    }
    
    // API Key 输入框变化时自动保存
    apiKeyInput.addEventListener('input', () => {
        const apiKeys = apiKeyInput.value.trim();
        if (apiKeys) {
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKeys);
        }
    });
});

// 日志系统
const Logger = {
    log(message, level = 'info') {
        const logContent = document.getElementById('logContent');
        const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        const entry = document.createElement('div');
        entry.className = `log-entry log-${level}`;
        entry.textContent = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
        console.log(`[${level}] ${message}`);
    },
    info(msg) { this.log(msg, 'info'); },
    success(msg) { this.log(msg, 'success'); },
    warning(msg) { this.log(msg, 'warning'); },
    error(msg) { this.log(msg, 'error'); },
    debug(msg) { this.log(msg, 'debug'); }
};

document.getElementById('clearLogBtn').addEventListener('click', () => {
    document.getElementById('logContent').innerHTML = '';
    Logger.info('日志已清空');
});

// API Key 显示/隐藏
document.getElementById('toggleKeyBtn').addEventListener('click', () => {
    const input = document.getElementById('apiKey');
    const btn = document.getElementById('toggleKeyBtn');
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🔒 隐藏';
    } else {
        input.type = 'password';
        btn.textContent = '👁️ 显示';
    }
});

// API Key 负载均衡
function getApiKey() {
    const apiKeyInput = document.getElementById('apiKey').value.trim();
    const keys = apiKeyInput.split(',').map(k => k.trim()).filter(k => k);
    
    if (keys.length === 0) {
        throw new Error('请输入 API Key');
    }
    
    if (keys.length === 1) {
        return keys[0];
    }
    
    // 随机选择一个 Key
    const selectedKey = keys[Math.floor(Math.random() * keys.length)];
    Logger.debug(`使用 API Key: ${selectedKey.substring(0, 8)}...（共 ${keys.length} 个）`);
    return selectedKey;
}

// 获取所有 API Keys（用于重试）
function getApiKeys() {
    const apiKeyInput = document.getElementById('apiKey').value.trim();
    const keys = apiKeyInput.split(',').map(k => k.trim()).filter(k => k);
    if (keys.length === 0) throw new Error('请输入 API Key');
    return keys;
}

// 文件上传功能
let selectedFiles = [];
let transcriptionResults = {};
let currentResultIndex = 0;
const MAX_FILES = 10;

document.getElementById('selectFilesBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

document.getElementById('uploadBtn').addEventListener('click', startBatchTranscription);
document.getElementById('clearBtn').addEventListener('click', clearFileList);
document.getElementById('downloadBtn').addEventListener('click', downloadCurrentTranscript);
document.getElementById('downloadAllBtn').addEventListener('click', downloadAllTranscripts);

const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (selectedFiles.length < MAX_FILES) {
        dropZone.classList.add('drag-over');
    }
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
    const fileArray = Array.from(files);
    const remainingSlots = MAX_FILES - selectedFiles.length;
    
    if (remainingSlots <= 0) {
        alert(`最多只能上传 ${MAX_FILES} 个文件`);
        Logger.warning(`已达到最大文件数限制 (${MAX_FILES})`);
        return;
    }
    
    if (fileArray.length > remainingSlots) {
        alert(`只能再添加 ${remainingSlots} 个文件（当前已有 ${selectedFiles.length} 个）`);
        selectedFiles = [...selectedFiles, ...fileArray.slice(0, remainingSlots)];
        Logger.warning(`只添加了前 ${remainingSlots} 个文件`);
    } else {
        selectedFiles = [...selectedFiles, ...fileArray];
        Logger.info(`添加了 ${fileArray.length} 个文件`);
    }
    
    updateFileList();
    document.getElementById('uploadBtn').style.display = 'inline-block';
    document.getElementById('clearBtn').style.display = 'inline-block';
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-item-name">${file.name}</span>
            <span class="file-item-status pending" id="status-${index}">等待</span>
            <button class="file-item-remove" onclick="removeFile(${index})">删除</button>
        `;
        fileList.appendChild(fileItem);
    });
}

window.removeFile = function(index) {
    const fileName = selectedFiles[index].name;
    selectedFiles.splice(index, 1);
    updateFileList();
    Logger.info(`移除文件: ${fileName}`);
    if (selectedFiles.length === 0) {
        document.getElementById('uploadBtn').style.display = 'none';
        document.getElementById('clearBtn').style.display = 'none';
    }
}

function clearFileList() {
    const count = selectedFiles.length;
    selectedFiles = [];
    transcriptionResults = {};
    updateFileList();
    document.getElementById('uploadBtn').style.display = 'none';
    document.getElementById('clearBtn').style.display = 'none';
    document.getElementById('resultTabs').innerHTML = '';
    document.getElementById('uploadTranscript').innerHTML = '';
    document.getElementById('downloadBtn').style.display = 'none';
    document.getElementById('downloadAllBtn').style.display = 'none';
    Logger.info(`清空了 ${count} 个文件`);
}

async function startBatchTranscription() {
    const overallStartTime = Date.now();
    
    try {
        const apiKeys = document.getElementById('apiKey').value.trim();
        if (!apiKeys) {
            alert('请输入 API Key');
            return;
        }

        if (selectedFiles.length === 0) {
            alert('请选择文件');
            return;
        }

        Logger.info(`========== 开始批量转录 ==========`);
        Logger.info(`文件数量: ${selectedFiles.length}`);

        document.getElementById('uploadBtn').disabled = true;
        document.getElementById('processingStatus').style.display = 'block';

        transcriptionResults = {};
        
        // 第一步：检测所有文件时长并准备分段
        Logger.info('阶段 1/3: 检测文件时长...');
        const allTasks = [];
        const fileTaskMap = {};
        
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const statusEl = document.getElementById(`status-${i}`);
            statusEl.textContent = '检测时长...';
            
            let duration = 0;
            try {
                duration = await getAudioDuration(file);
                Logger.debug(`${file.name}: ${Math.round(duration)}秒`);
            } catch (error) {
                Logger.warning(`${file.name}: 无法检测时长，直接上传`);
            }

            const MAX_DURATION = 60 * 60;
            
            if (duration === 0 || duration <= MAX_DURATION) {
                allTasks.push({
                    fileIndex: i,
                    file: file,
                    isChunk: false
                });
                fileTaskMap[i] = [allTasks.length - 1];
            } else {
                const numChunks = Math.ceil(duration / MAX_DURATION);
                Logger.info(`${file.name}: 需要切分成 ${numChunks} 段`);
                statusEl.textContent = `切分成${numChunks}段...`;
                
                const chunks = await splitAudioFile(file, numChunks);
                const taskIndices = [];
                
                chunks.forEach((chunk, chunkIndex) => {
                    allTasks.push({
                        fileIndex: i,
                        file: chunk,
                        isChunk: true,
                        chunkIndex: chunkIndex + 1,
                        totalChunks: numChunks
                    });
                    taskIndices.push(allTasks.length - 1);
                });
                
                fileTaskMap[i] = taskIndices;
                Logger.success(`${file.name}: 切分完成`);
            }
        }

        // 第二步：并行处理所有任务
        const totalTasks = allTasks.length;
        document.getElementById('totalFiles').textContent = totalTasks;
        document.getElementById('concurrency').textContent = totalTasks;
        Logger.info(`阶段 2/3: 并行处理 ${totalTasks} 个任务...`);

        let completedTasks = 0;
        
        const taskPromises = allTasks.map(async (task) => {
            const statusEl = document.getElementById(`status-${task.fileIndex}`);
            const fileName = selectedFiles[task.fileIndex].name;
            
            if (task.isChunk) {
                statusEl.textContent = `处理分段 ${task.chunkIndex}/${task.totalChunks}...`;
                Logger.debug(`${fileName} - 分段 ${task.chunkIndex}/${task.totalChunks}: 开始处理`);
            } else {
                statusEl.textContent = '处理中...';
                Logger.debug(`${fileName}: 开始处理`);
            }
            
            try {
                const taskStartTime = Date.now();
                const apiKeys = getApiKeys();
                const text = await uploadSingleFileWithRetry(apiKeys, task.file);
                const taskEndTime = Date.now();
                const taskDuration = ((taskEndTime - taskStartTime) / 1000).toFixed(2);
                
                completedTasks++;
                updateProgress(completedTasks, totalTasks);
                
                if (task.isChunk) {
                    Logger.success(`${fileName} - 分段 ${task.chunkIndex}/${task.totalChunks}: 完成 (${taskDuration}秒)`);
                } else {
                    Logger.success(`${fileName}: 完成 (${taskDuration}秒)`);
                }
                
                return { taskIndex: allTasks.indexOf(task), text: text, success: true, duration: taskDuration };
            } catch (error) {
                completedTasks++;
                updateProgress(completedTasks, totalTasks);
                
                if (task.isChunk) {
                    Logger.error(`${fileName} - 分段 ${task.chunkIndex}/${task.totalChunks}: ${error.message}`);
                } else {
                    Logger.error(`${fileName}: ${error.message}`);
                }
                
                return { taskIndex: allTasks.indexOf(task), error: error.message, success: false };
            }
        });

        const results = await Promise.all(taskPromises);
        Logger.info('阶段 3/3: 合并结果...');
        
        // 计算总处理时长
        const totalProcessingTime = ((Date.now() - overallStartTime) / 1000).toFixed(2);
        const totalTaskTime = results.filter(r => r.success).reduce((sum, r) => sum + parseFloat(r.duration || 0), 0).toFixed(2);
        
        Logger.info(`总耗时: ${totalProcessingTime}秒 | 转录总时长: ${totalTaskTime}秒 | 并行任务数: ${totalTasks}`);
        
        // 第三步：合并结果
        for (let i = 0; i < selectedFiles.length; i++) {
            const taskIndices = fileTaskMap[i];
            const taskResults = taskIndices.map(idx => results.find(r => r.taskIndex === idx));
            
            const statusEl = document.getElementById(`status-${i}`);
            const fileName = selectedFiles[i].name;
            
            if (taskResults.every(r => r.success)) {
                const texts = taskResults.map((r, idx) => {
                    if (taskResults.length > 1) {
                        return `=== 分段 ${idx + 1}/${taskResults.length} ===\n\n${r.text}`;
                    }
                    return r.text;
                });
                
                transcriptionResults[i] = {
                    fileName: fileName.replace(/\.[^/.]+$/, ''),
                    text: texts.join('\n\n')
                };
                
                statusEl.textContent = '完成';
                statusEl.className = 'file-item-status completed';
                Logger.success(`${fileName}: 所有分段已合并`);
            } else {
                const errors = taskResults.filter(r => !r.success).map(r => r.error).join('; ');
                transcriptionResults[i] = {
                    fileName: fileName.replace(/\.[^/.]+$/, ''),
                    text: `错误: ${errors}`
                };
                
                statusEl.textContent = '失败';
                statusEl.className = 'file-item-status error';
            }
        }

        document.getElementById('uploadBtn').disabled = false;
        Logger.success('========== 所有文件处理完成 ==========');
        alert('所有文件处理完成！');
        displayResults();
        
    } catch (error) {
        Logger.error('批量处理失败: ' + error.message);
        document.getElementById('uploadBtn').disabled = false;
        alert('处理失败: ' + error.message);
    }
}

function updateProgress(current, total) {
    document.getElementById('currentProcessing').textContent = current;
    const percentage = Math.round((current / total) * 100);
    document.getElementById('progressPercent').textContent = percentage;
    document.getElementById('progressBar').style.width = percentage + '%';
    document.querySelector('.progress-text').textContent = percentage + '%';
}

// 获取音频时长
function getAudioDuration(file) {
    return new Promise((resolve, reject) => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        
        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(audio.src);
            resolve(audio.duration);
        };
        
        audio.onerror = () => {
            URL.revokeObjectURL(audio.src);
            reject(new Error('无法读取音频'));
        };
        
        audio.src = URL.createObjectURL(file);
    });
}

// 分割音频文件
async function splitAudioFile(file, numChunks) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const chunkDuration = audioBuffer.duration / numChunks;
    const chunks = [];

    for (let i = 0; i < numChunks; i++) {
        const startTime = i * chunkDuration;
        const endTime = Math.min((i + 1) * chunkDuration, audioBuffer.duration);
        const chunkBuffer = sliceAudioBuffer(audioBuffer, startTime, endTime, audioContext);
        const chunkBlob = audioBufferToWav(chunkBuffer);
        chunks.push(chunkBlob);
    }

    await audioContext.close();
    return chunks;
}

// 切割音频缓冲区
function sliceAudioBuffer(buffer, start, end, context) {
    const sampleRate = buffer.sampleRate;
    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor(end * sampleRate);
    const length = endSample - startSample;

    const newBuffer = context.createBuffer(
        buffer.numberOfChannels,
        length,
        sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const oldData = buffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            newData[i] = oldData[startSample + i];
        }
    }

    return newBuffer;
}

// 转换为 WAV
function audioBufferToWav(buffer) {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const wav = new ArrayBuffer(44 + length);
    const view = new DataView(wav);

    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }

    return new Blob([wav], { type: 'audio/wav' });
}

// 上传单个文件或分段（带重试）
async function uploadSingleFileWithRetry(apiKeys, file, maxRetries = 3) {
    const availableKeys = [...apiKeys];
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries && availableKeys.length > 0; attempt++) {
        const apiKey = availableKeys.shift();
        
        try {
            Logger.debug(`尝试使用 API Key: ${apiKey.substring(0, 10)}... (尝试 ${attempt + 1}/${maxRetries})`);
            const result = await uploadSingleFile(apiKey, file);
            return result;
        } catch (error) {
            lastError = error;
            Logger.warning(`API Key 失败，尝试下一个... (${error.message})`);
            
            if (availableKeys.length === 0 && attempt < maxRetries - 1) {
                availableKeys.push(...apiKeys);
            }
        }
    }
    
    throw new Error(`所有 API Key 均失败: ${lastError.message}`);
}

// 上传单个文件或分段
async function uploadSingleFile(apiKey, file) {
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch('https://api.soniox.com/v1/files', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData
    });

    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`上传失败 (${uploadResponse.status})`);
    }

    const uploadData = await uploadResponse.json();

    const transcriptionConfig = {
        file_id: uploadData.id,
        model: 'stt-async-preview',
        enable_speaker_diarization: document.getElementById('uploadEnableDiarization').checked
    };

    const transcriptionResponse = await fetch('https://api.soniox.com/v1/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transcriptionConfig)
    });

    if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        throw new Error(`转录失败 (${transcriptionResponse.status})`);
    }

    const transcriptionData = await transcriptionResponse.json();
    return await waitForTranscription(apiKey, transcriptionData.id);
}

async function waitForTranscription(apiKey, transcriptionId) {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
        const response = await fetch(`https://api.soniox.com/v1/transcriptions/${transcriptionId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) throw new Error('获取状态失败');

        const data = await response.json();

        if (data.status === 'completed') {
            const textResponse = await fetch(`https://api.soniox.com/v1/transcriptions/${transcriptionId}/transcript`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            if (!textResponse.ok) throw new Error('获取文本失败');

            const textData = await textResponse.json();
            let text = '';

            if (textData.tokens && Array.isArray(textData.tokens)) {
                let currentSpeaker = null;
                textData.tokens.forEach(token => {
                    if (token.speaker && token.speaker !== currentSpeaker) {
                        currentSpeaker = token.speaker;
                        text += `\n说话人 ${token.speaker}: `;
                    }
                    text += token.text || '';
                });
            } else if (typeof textData === 'string') {
                text = textData;
            } else if (textData.text) {
                text = textData.text;
            }

            return text.trim();
        } else if (data.status === 'error') {
            throw new Error(data.error_message || '转录失败');
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('转录超时');
}

function displayResults() {
    const resultTabs = document.getElementById('resultTabs');
    resultTabs.innerHTML = '';
    
    Object.keys(transcriptionResults).forEach((index) => {
        const result = transcriptionResults[index];
        const tab = document.createElement('button');
        tab.className = 'result-tab';
        tab.textContent = result.fileName;
        tab.onclick = () => showResult(index);
        resultTabs.appendChild(tab);
    });

    if (Object.keys(transcriptionResults).length > 0) {
        showResult(Object.keys(transcriptionResults)[0]);
        document.getElementById('downloadAllBtn').style.display = 'inline-block';
    }
}

function showResult(index) {
    const uploadTranscript = document.getElementById('uploadTranscript');
    const result = transcriptionResults[index];
    
    uploadTranscript.textContent = result.text;
    currentResultIndex = index;
    
    document.querySelectorAll('.result-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.result-tab')[Object.keys(transcriptionResults).indexOf(index.toString())].classList.add('active');
    
    document.getElementById('downloadBtn').style.display = 'inline-block';
}

function downloadCurrentTranscript() {
    const result = transcriptionResults[currentResultIndex];
    if (!result) {
        alert('没有可下载的结果');
        return;
    }

    const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Logger.info(`下载: ${result.fileName}.txt`);
}

function downloadAllTranscripts() {
    Object.keys(transcriptionResults).forEach((index) => {
        const result = transcriptionResults[index];
        const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.fileName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    Logger.info(`批量下载: ${Object.keys(transcriptionResults).length} 个文件`);
}
