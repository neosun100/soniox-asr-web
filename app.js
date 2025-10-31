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
    
    // 音频来源切换
    document.querySelectorAll('input[name="audioSource"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const fileSection = document.getElementById('fileUploadSection');
            const startBtn = document.getElementById('wsStartBtn');
            
            if (e.target.value === 'file') {
                fileSection.style.display = 'block';
                startBtn.innerHTML = '🚀 开始识别';
            } else {
                fileSection.style.display = 'none';
                startBtn.innerHTML = '🎤 开始录音';
            }
        });
    });
    
    // 翻译类型切换
    document.querySelectorAll('input[name="translationType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('oneWayOptions').style.display = 'none';
            document.getElementById('twoWayOptions').style.display = 'none';
            
            if (e.target.value === 'one_way') {
                document.getElementById('oneWayOptions').style.display = 'block';
            } else if (e.target.value === 'two_way') {
                document.getElementById('twoWayOptions').style.display = 'block';
            }
        });
    });
    
    // 调试：监听 wsFile 的点击
    const wsFileInput = document.getElementById('wsFile');
    if (wsFileInput) {
        wsFileInput.addEventListener('click', (e) => {
            console.log('wsFile 被点击了！');
            console.trace('调用堆栈:');
        });
    }
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
const MAX_FILES = 100;

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

            const MAX_DURATION = 300 * 60; // 5 hours in seconds (18000 seconds)
            
            Logger.debug(`${file.name}: 时长=${duration}秒, 阈值=${MAX_DURATION}秒, 需要切分=${duration > MAX_DURATION}`);
            
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

        // 第二步：受控并行处理所有任务
        const totalTasks = allTasks.length;
        const concurrencyLimit = parseInt(document.getElementById('concurrencyLimit').value) || 5;
        document.getElementById('totalFiles').textContent = totalTasks;
        Logger.info(`阶段 2/3: 并行处理 ${totalTasks} 个任务（并行度: ${concurrencyLimit}）...`);

        let completedTasks = 0;
        const results = [];
        
        // 受控并行执行
        for (let i = 0; i < allTasks.length; i += concurrencyLimit) {
            const batch = allTasks.slice(i, i + concurrencyLimit);
            document.getElementById('concurrency').textContent = batch.length;
            
            const batchPromises = batch.map(async (task) => {
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
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
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
    // 随机打乱 Key 顺序，实现负载均衡
    const availableKeys = [...apiKeys].sort(() => Math.random() - 0.5);
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

    // 获取模型选择
    const modelSelect = document.getElementById('restModel');
    const model = modelSelect ? modelSelect.value : 'stt-async-v3';

    // 获取语言提示
    const languageSelect = document.getElementById('restLanguage');
    const languageHints = languageSelect ? 
        Array.from(languageSelect.selectedOptions).map(opt => opt.value).filter(val => val) : 
        null;

    // 获取语言识别选项
    const languageIdCheckbox = document.getElementById('restLanguageId');
    const enableLanguageId = languageIdCheckbox ? languageIdCheckbox.checked : false;

    const transcriptionConfig = {
        file_id: uploadData.id,
        model: model,
        enable_speaker_diarization: document.getElementById('uploadEnableDiarization').checked,
        enable_language_identification: enableLanguageId
    };

    // 添加语言提示（如果有选择）
    if (languageHints && languageHints.length > 0) {
        transcriptionConfig.language_hints = languageHints;
    }

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
    let attempts = 0;

    Logger.info(`⏳ 等待转录完成 (ID: ${transcriptionId.substring(0, 8)}...)`);
    Logger.warning(`⚠️  Soniox 异步 API 处理较慢，请耐心等待...`);

    while (true) { // 无限等待
        const response = await fetch(`https://api.soniox.com/v1/transcriptions/${transcriptionId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) throw new Error('获取状态失败');

        const data = await response.json();
        
        // 每 10 次显示一次进度
        if (attempts % 10 === 0 || data.status !== 'queued') {
            Logger.debug(`📊 状态检查 ${attempts + 1}: ${data.status} (已等待 ${attempts * 2}秒)`);
        }

        if (data.status === 'completed') {
            Logger.success('✅ 转录完成，获取结果...');
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


// ==================== WebSocket 实时识别功能 ====================

// WebSocket 日志
function wsLog(message, level = 'info') {
    const logContent = document.getElementById('wsLog');
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const entry = document.createElement('div');
    entry.className = `log-entry log-${level}`;
    entry.textContent = `[${timestamp}] ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

document.getElementById('wsClearLog').addEventListener('click', () => {
    document.getElementById('wsLog').innerHTML = '';
    wsLog('日志已清空');
});

// WebSocket 实时转录
let mediaRecorder = null;
let audioStream = null;

let isProcessing = false;

document.getElementById('wsStartBtn').addEventListener('click', async () => {
    if (isProcessing) {
        console.log('正在处理中，忽略点击');
        return;
    }
    
    isProcessing = true;
    const audioSource = document.querySelector('input[name="audioSource"]:checked');
    console.log('点击开始按钮');
    console.log('选中的音频来源:', audioSource ? audioSource.value : 'null');
    
    if (!audioSource) {
        alert('无法获取音频来源选项');
        isProcessing = false;
        return;
    }
    
    try {
        if (audioSource.value === 'microphone') {
            console.log('执行麦克风录音');
            await startMicrophoneRecording();
        } else {
            console.log('执行文件上传');
            await startFileTranscription();
        }
    } finally {
        isProcessing = false;
    }
});

document.getElementById('wsStopBtn').addEventListener('click', () => {
    stopRecording();
});

async function startMicrophoneRecording() {
    const apiKey = getApiKey();
    if (!apiKey) {
        alert('请输入 API Key');
        return;
    }
    
    try {
        wsLog('🎤 请求麦克风权限...');
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        wsLog('✅ 麦克风权限已获取');
        
        document.getElementById('wsStartBtn').style.display = 'none';
        document.getElementById('wsStopBtn').style.display = 'inline-block';
        document.getElementById('wsResult').innerHTML = '';
        
        await connectWebSocket(apiKey, audioStream);
        
    } catch (error) {
        wsLog(`❌ 麦克风错误: ${error.message}`, 'error');
        alert('无法访问麦克风，请检查浏览器权限');
    }
}

async function startFileTranscription() {
    console.log('========== startFileTranscription 被调用 ==========');
    console.trace('调用堆栈:');
    const fileInput = document.getElementById('wsFile');
    console.log('fileInput:', fileInput);
    const file = fileInput ? fileInput.files[0] : null;
    console.log('file:', file);
    
    if (!file) {
        console.log('========== 没有选择文件，显示提示 ==========');
        alert('请选择音频文件');
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        alert('请输入 API Key');
        return;
    }
    
    wsLog(`📁 ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`);
    document.getElementById('wsStartBtn').disabled = true;
    document.getElementById('wsResult').innerHTML = '';
    
    await connectWebSocket(apiKey, null, file);
}

async function connectWebSocket(apiKey, stream, file) {
    const enableDiarization = document.getElementById('wsDiarization').checked;
    const enableLanguageId = document.getElementById('wsLanguageId').checked;
    const translationType = document.querySelector('input[name="translationType"]:checked').value;
    
    wsLog(`🔑 Key: ${apiKey.substring(0, 10)}...`);
    
    document.getElementById('wsStartBtn').disabled = true;
    document.getElementById('wsResult').textContent = '';
    
    try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/transcribe`;
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = async () => {
            wsLog('✅ WebSocket 连接成功');
            
            // 构建配置
            const config = {
                api_key: apiKey,
                model: 'stt-rt-v3',
                audio_format: 'auto',
                enable_speaker_diarization: enableDiarization,
                enable_language_identification: enableLanguageId,
                enable_endpoint_detection: true
            };
            
            // 添加翻译配置
            if (translationType === 'one_way') {
                config.translation = {
                    type: 'one_way',
                    target_language: document.getElementById('targetLang').value
                };
                wsLog(`🌐 单向翻译 → ${document.getElementById('targetLang').value}`);
            } else if (translationType === 'two_way') {
                config.translation = {
                    type: 'two_way',
                    language_a: document.getElementById('langA').value,
                    language_b: document.getElementById('langB').value
                };
                wsLog(`🌐 双向翻译: ${document.getElementById('langA').value} ↔ ${document.getElementById('langB').value}`);
            }
            
            wsLog('📤 发送配置...');
            ws.send(JSON.stringify(config));
            
            // 发送音频
            if (stream) {
                // 麦克风录音
                wsLog('🎤 开始录音...');
                mediaRecorder = new MediaRecorder(stream);
                
                mediaRecorder.ondataavailable = async (event) => {
                    if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                        const arrayBuffer = await event.data.arrayBuffer();
                        ws.send(arrayBuffer);
                    }
                };
                
                mediaRecorder.start(100); // 每 100ms 发送一次
                
            } else if (file) {
                // 文件上传
                wsLog('📤 开始发送音频数据...');
                const arrayBuffer = await file.arrayBuffer();
                const chunkSize = 3840;
                let offset = 0;
                
                while (offset < arrayBuffer.byteLength) {
                    const chunk = arrayBuffer.slice(offset, offset + chunkSize);
                    ws.send(chunk);
                    offset += chunkSize;
                    await new Promise(r => setTimeout(r, 10));
                }
                
                ws.send(new ArrayBuffer(0));
                wsLog('✅ 音频发送完成，等待结果...');
            }
        };
        
        let finalTokens = [];
        
        ws.onmessage = (event) => {
            console.log('收到 WebSocket 消息:', event.data.substring(0, 200));
            const response = JSON.parse(event.data);
            
            if (response.error || response.error_code) {
                const errorMsg = response.error || response.error_message || '未知错误';
                
                // 如果是超时错误，只记录日志，不关闭连接
                if (response.error_code === 408) {
                    wsLog(`⚠️ 警告: ${errorMsg}（翻译处理较慢，继续等待...）`, 'warning');
                    console.warn('超时警告:', response);
                    return; // 不关闭连接，继续等待
                }
                
                // 其他错误才关闭连接
                wsLog(`❌ 错误: ${errorMsg}`, 'error');
                console.error('WebSocket 错误:', response);
                ws.close();
                return;
            }
            
            if (response.tokens) {
                console.log('收到 tokens:', response.tokens.length);
                const nonFinalTokens = [];
                
                response.tokens.forEach(token => {
                    if (token.is_final) {
                        finalTokens.push(token);
                    } else {
                        nonFinalTokens.push(token);
                    }
                });
                
                // 渲染结果
                const html = renderTokens(finalTokens, nonFinalTokens);
                document.getElementById('wsResult').innerHTML = html;
                console.log('已更新显示，HTML 长度:', html.length);
            }
            
            if (response.finished) {
                wsLog('✅ 转录完成！', 'success');
                console.log('转录完成');
                ws.close();
            }
        };
        
        ws.onerror = (error) => {
            wsLog(`❌ WebSocket 错误`, 'error');
            console.error(error);
        };
        
        ws.onclose = () => {
            wsLog('🔌 连接已关闭');
            stopRecording();
        };
        
    } catch (error) {
        wsLog(`❌ 错误: ${error.message}`, 'error');
        stopRecording();
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
    }
    document.getElementById('wsStartBtn').style.display = 'inline-block';
    document.getElementById('wsStartBtn').disabled = false;
    document.getElementById('wsStopBtn').style.display = 'none';
    wsLog('⏹️ 录音已停止');
}

// 渲染 tokens 为可读 HTML
function renderTokens(finalTokens, nonFinalTokens) {
    const htmlParts = [];
    let currentSpeaker = null;
    let currentLanguage = null;
    
    const allTokens = [...finalTokens, ...nonFinalTokens];
    
    // 语言颜色映射
    const languageColors = {
        'zh': '#2563eb',  // 蓝色 - 中文
        'en': '#059669',  // 绿色 - 英语
        'es': '#dc2626',  // 红色 - 西班牙语
        'fr': '#7c3aed',  // 紫色 - 法语
        'de': '#ea580c',  // 橙色 - 德语
        'ja': '#db2777',  // 粉色 - 日语
        'ko': '#0891b2',  // 青色 - 韩语
        'ar': '#65a30d',  // 黄绿 - 阿拉伯语
        'ru': '#be123c',  // 深红 - 俄语
        'pt': '#0284c7',  // 天蓝 - 葡萄牙语
        'default': '#1f2937'  // 深灰 - 默认
    };
    
    for (const token of allTokens) {
        const text = token.text || '';
        const speaker = token.speaker;
        const language = token.language;
        const isTranslation = token.translation_status === 'translation';
        const isFinal = token.is_final;
        
        // 说话人改变
        if (speaker !== undefined && speaker !== currentSpeaker) {
            if (currentSpeaker !== null) {
                htmlParts.push('<br><br>');
            }
            currentSpeaker = speaker;
            currentLanguage = null;
            htmlParts.push(`<div style="font-weight: bold; color: #1f2937; margin-top: 10px;">👤 说话人 ${currentSpeaker}:</div>`);
        }
        
        // 语言改变
        if (language !== undefined && language !== currentLanguage) {
            currentLanguage = language;
            const color = languageColors[language] || languageColors['default'];
            const prefix = isTranslation ? '🌐 [翻译] ' : '';
            const langLabel = `${prefix}[${language.toUpperCase()}]`;
            htmlParts.push(`<span style="color: ${color}; font-weight: 600; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; margin: 0 4px;">${langLabel}</span> `);
        }
        
        // 检查是否是 <end> token
        if (text.trim() === '<end>') {
            htmlParts.push('<br>');
            continue;
        }
        
        // 文本内容
        const color = languageColors[currentLanguage] || languageColors['default'];
        const opacity = isFinal ? '1' : '0.6';
        const fontWeight = isFinal ? '500' : '400';
        htmlParts.push(`<span style="color: ${color}; opacity: ${opacity}; font-weight: ${fontWeight};">${escapeHtml(text)}</span>`);
    }
    
    return htmlParts.join('');
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
