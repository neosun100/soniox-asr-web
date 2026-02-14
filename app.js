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
    
    // 强制重置音频来源为麦克风（防止浏览器缓存表单状态）
    const microphoneRadio = document.querySelector('input[name="audioSource"][value="microphone"]');
    if (microphoneRadio) {
        microphoneRadio.checked = true;
    }
    
    // API Key 输入框变化时自动保存
    apiKeyInput.addEventListener('input', () => {
        const apiKeys = apiKeyInput.value.trim();
        if (apiKeys) {
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKeys);
        }
    });
    
    // 变速选项显示/隐藏
    const enableSpeedChange = document.getElementById('enableSpeedChange');
    const speedOptions = document.getElementById('speedOptions');
    if (enableSpeedChange && speedOptions) {
        enableSpeedChange.addEventListener('change', (e) => {
            speedOptions.style.display = e.target.checked ? 'flex' : 'none';
        });
    }
    
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
    document.getElementById('downloadOptions').style.display = 'none';
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
        
        // 获取音频处理选项
        const enableNoiseReduction = document.getElementById('enableNoiseReduction').checked;
        const enableSpeedChange = document.getElementById('enableSpeedChange').checked;
        const speedRate = enableSpeedChange ? parseFloat(document.querySelector('input[name="speedRate"]:checked').value) : 1.0;
        
        if (enableNoiseReduction) {
            Logger.info('✓ 已启用降噪处理');
        }
        if (enableSpeedChange) {
            Logger.info(`✓ 已启用变速处理 (${speedRate}x)`);
        }
        
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const statusEl = document.getElementById(`status-${i}`);
            statusEl.textContent = '检测时长...';
            
            // 检测视频文件并提取音频
            let processFile = file;
            if (file.type.startsWith('video/')) {
                try {
                    statusEl.textContent = '提取音频...';
                    const audioBlob = await extractAudioFromVideo(file);
                    const audioFileName = file.name.replace(/\.[^.]+$/, '.wav');
                    processFile = new File([audioBlob], audioFileName, { type: 'audio/wav' });
                    Logger.success(`${file.name}: 已转换为音频文件`);
                } catch (error) {
                    Logger.error(`${file.name}: 音频提取失败 - ${error.message}`);
                    statusEl.textContent = '提取失败';
                    continue;
                }
            }
            
            // 音频预处理（降噪和变速）
            if (enableNoiseReduction || enableSpeedChange) {
                try {
                    statusEl.textContent = '音频处理中...';
                    
                    // 读取音频数据
                    const arrayBuffer = await processFile.arrayBuffer();
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    let audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    // 应用降噪
                    if (enableNoiseReduction) {
                        audioBuffer = await applyNoiseReduction(audioBuffer);
                    }
                    
                    // 应用变速
                    if (enableSpeedChange) {
                        audioBuffer = await applySpeedChange(audioBuffer, speedRate);
                    }
                    
                    // 转换回 WAV 文件
                    const processedBlob = audioBufferToWav(audioBuffer);
                    const processedFileName = processFile.name.replace(/\.[^.]+$/, '_processed.wav');
                    processFile = new File([processedBlob], processedFileName, { type: 'audio/wav' });
                    
                    await audioContext.close();
                    Logger.success(`${file.name}: 音频处理完成`);
                } catch (error) {
                    Logger.error(`${file.name}: 音频处理失败 - ${error.message}`);
                    statusEl.textContent = '处理失败';
                    continue;
                }
            }
            
            let duration = 0;
            try {
                duration = await getAudioDuration(processFile);
                Logger.debug(`${processFile.name}: ${Math.round(duration)}秒`);
            } catch (error) {
                Logger.warning(`${processFile.name}: 无法检测时长，直接上传`);
            }

            const MAX_DURATION = 300 * 60; // 5 hours in seconds (18000 seconds)
            
            Logger.debug(`${processFile.name}: 时长=${duration}秒, 阈值=${MAX_DURATION}秒, 需要切分=${duration > MAX_DURATION}`);
            
            if (duration === 0 || duration <= MAX_DURATION) {
                allTasks.push({
                    fileIndex: i,
                    file: processFile,
                    isChunk: false
                });
                fileTaskMap[i] = [allTasks.length - 1];
            } else {
                const numChunks = Math.ceil(duration / MAX_DURATION);
                Logger.info(`${processFile.name}: 需要切分成 ${numChunks} 段`);
                statusEl.textContent = `切分成${numChunks}段...`;
                
                const chunks = await splitAudioFile(processFile, numChunks);
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
                    const result = await uploadSingleFileWithRetry(apiKeys, task.file);
                    const taskEndTime = Date.now();
                    const taskDuration = ((taskEndTime - taskStartTime) / 1000).toFixed(2);
                    
                    completedTasks++;
                    updateProgress(completedTasks, totalTasks);
                    
                    if (task.isChunk) {
                        Logger.success(`${fileName} - 分段 ${task.chunkIndex}/${task.totalChunks}: 完成 (${taskDuration}秒)`);
                    } else {
                        Logger.success(`${fileName}: 完成 (${taskDuration}秒)`);
                    }
                    
                    return { taskIndex: allTasks.indexOf(task), text: result.text, words: result.words, success: true, duration: taskDuration };
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
                    text: texts.join('\n\n'),
                    words: taskResults.flatMap(r => r.words || [])
                };
                
                statusEl.textContent = '完成';
                statusEl.className = 'file-item-status completed';
                Logger.success(`${fileName}: 所有分段已合并`);
            } else {
                const errors = taskResults.filter(r => !r.success).map(r => r.error).join('; ');
                transcriptionResults[i] = {
                    fileName: fileName.replace(/\.[^/.]+$/, ''),
                    text: `错误: ${errors}`,
                    words: []
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

// 获取音频时长（支持视频文件）
function getAudioDuration(file) {
    return new Promise((resolve, reject) => {
        const isVideo = file.type.startsWith('video/');
        const element = document.createElement(isVideo ? 'video' : 'audio');
        element.preload = 'metadata';
        
        element.onloadedmetadata = () => {
            URL.revokeObjectURL(element.src);
            resolve(element.duration);
        };
        
        element.onerror = () => {
            URL.revokeObjectURL(element.src);
            reject(new Error(`无法读取${isVideo ? '视频' : '音频'}`));
        };
        
        element.src = URL.createObjectURL(file);
    });
}

// 从视频文件提取音频（快速方法）
async function extractAudioFromVideo(videoFile) {
    Logger.info(`${videoFile.name}: 检测到视频文件，正在提取音频...`);
    
    try {
        // 直接读取视频文件的音频轨道
        const arrayBuffer = await videoFile.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 解码音频数据（从视频中提取）
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // 转换为 WAV 格式
        const wavBlob = audioBufferToWav(audioBuffer);
        
        await audioContext.close();
        Logger.success(`${videoFile.name}: 音频提取完成 (${Math.round(audioBuffer.duration)}秒)`);
        
        return wavBlob;
    } catch (error) {
        Logger.error(`${videoFile.name}: 音频提取失败 - ${error.message}`);
        throw new Error('视频文件不包含音频轨道或格式不支持');
    }
}

// 降噪处理
async function applyNoiseReduction(audioBuffer) {
    Logger.info('应用降噪处理...');
    
    try {
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );
        
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // 高通滤波器（去除低频噪音 < 80Hz）
        const highpass = offlineContext.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 80;
        
        // 低通滤波器（去除高频噪音 > 3000Hz）
        const lowpass = offlineContext.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 3000;
        
        // 动态压缩器（平衡音量）
        const compressor = offlineContext.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;
        
        // 连接节点
        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(compressor);
        compressor.connect(offlineContext.destination);
        
        source.start();
        const processedBuffer = await offlineContext.startRendering();
        
        Logger.success('降噪处理完成');
        return processedBuffer;
    } catch (error) {
        Logger.error(`降噪处理失败: ${error.message}`);
        throw error;
    }
}

// 变速处理
async function applySpeedChange(audioBuffer, speed) {
    Logger.info(`应用变速处理 (${speed}x)...`);
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const newLength = Math.floor(audioBuffer.length / speed);
        
        const newBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            newLength,
            audioBuffer.sampleRate
        );
        
        // 重采样（线性插值）
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const oldData = audioBuffer.getChannelData(channel);
            const newData = newBuffer.getChannelData(channel);
            
            for (let i = 0; i < newLength; i++) {
                const oldIndex = i * speed;
                const index1 = Math.floor(oldIndex);
                const index2 = Math.min(index1 + 1, oldData.length - 1);
                const fraction = oldIndex - index1;
                
                // 线性插值
                newData[i] = oldData[index1] * (1 - fraction) + oldData[index2] * fraction;
            }
        }
        
        await audioContext.close();
        Logger.success(`变速处理完成 (${speed}x)`);
        return newBuffer;
    } catch (error) {
        Logger.error(`变速处理失败: ${error.message}`);
        throw error;
    }
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
    const model = modelSelect ? modelSelect.value : 'stt-async-v4';

    // 获取语言提示（复选框）
    const languageHints = Array.from(document.querySelectorAll('.rest-lang-hint:checked')).map(cb => cb.value);

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

    // 添加 Context（如果有配置）
    const context = buildContextObject();
    if (context) {
        transcriptionConfig.context = context;
        Logger.info('✓ 已应用 Context 配置');
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
            let words = [];

            if (textData.tokens && Array.isArray(textData.tokens)) {
                let currentSpeaker = null;
                textData.tokens.forEach(token => {
                    if (token.speaker && token.speaker !== currentSpeaker) {
                        currentSpeaker = token.speaker;
                        text += `\n说话人 ${token.speaker}: `;
                    }
                    text += token.text || '';
                    
                    // 收集时间戳用于字幕导出
                    if (token.start_ms !== undefined && token.end_ms !== undefined) {
                        words.push({
                            text: token.text || '',
                            start_time: token.start_ms / 1000,
                            end_time: token.end_ms / 1000
                        });
                    }
                });
            } else if (typeof textData === 'string') {
                text = textData;
            } else if (textData.text) {
                text = textData.text;
            }

            return { text: text.trim(), words };
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
        document.getElementById('downloadOptions').style.display = 'block';
    }
}

function showResult(index) {
    const uploadTranscript = document.getElementById('uploadTranscript');
    const result = transcriptionResults[index];
    
    uploadTranscript.textContent = result.text;
    currentResultIndex = index;
    
    document.querySelectorAll('.result-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.result-tab')[Object.keys(transcriptionResults).indexOf(index.toString())].classList.add('active');
}

// 格式化时间为 SRT 格式 (00:00:00,000)
function formatSrtTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

// 格式化时间为 VTT 格式 (00:00:00.000)
function formatVttTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

// 将文本和时间戳转换为 SRT 格式
function convertToSrt(text, words) {
    if (!words || words.length === 0) {
        // 没有时间戳，按行分割
        const lines = text.split('\n').filter(l => l.trim());
        return lines.map((line, i) => `${i + 1}\n00:00:00,000 --> 00:00:00,000\n${line}\n`).join('\n');
    }
    
    // 按句子分组（每 10 个词或遇到标点）
    const subtitles = [];
    let currentWords = [];
    let startTime = 0;
    
    words.forEach((word, i) => {
        if (currentWords.length === 0) {
            startTime = word.start_time;
        }
        currentWords.push(word.text);
        
        const isPunctuation = /[。！？.!?]$/.test(word.text);
        const isLast = i === words.length - 1;
        
        if (currentWords.length >= 10 || isPunctuation || isLast) {
            subtitles.push({
                start: startTime,
                end: word.end_time,
                text: currentWords.join('')
            });
            currentWords = [];
        }
    });
    
    return subtitles.map((sub, i) => 
        `${i + 1}\n${formatSrtTime(sub.start)} --> ${formatSrtTime(sub.end)}\n${sub.text}\n`
    ).join('\n');
}

// 将文本和时间戳转换为 VTT 格式
function convertToVtt(text, words) {
    const srtContent = convertToSrt(text, words);
    // VTT 格式：添加头部，时间格式用点号
    const vttContent = srtContent
        .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
        .replace(/^\d+\n/gm, ''); // 移除序号
    return `WEBVTT\n\n${vttContent}`;
}

function downloadCurrentTranscript() {
    const result = transcriptionResults[currentResultIndex];
    if (!result) {
        alert('没有可下载的结果');
        return;
    }

    const format = document.getElementById('exportFormat').value;
    let content, ext, mimeType;
    
    switch (format) {
        case 'srt':
            content = convertToSrt(result.text, result.words);
            ext = 'srt';
            mimeType = 'text/plain;charset=utf-8';
            break;
        case 'vtt':
            content = convertToVtt(result.text, result.words);
            ext = 'vtt';
            mimeType = 'text/vtt;charset=utf-8';
            break;
        default:
            content = result.text;
            ext = 'txt';
            mimeType = 'text/plain;charset=utf-8';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.fileName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Logger.info(`下载: ${result.fileName}.${ext}`);
}

function downloadAllTranscripts() {
    const format = document.getElementById('exportFormat').value;
    
    Object.keys(transcriptionResults).forEach((index) => {
        const result = transcriptionResults[index];
        let content, ext, mimeType;
        
        switch (format) {
            case 'srt':
                content = convertToSrt(result.text, result.words);
                ext = 'srt';
                mimeType = 'text/plain;charset=utf-8';
                break;
            case 'vtt':
                content = convertToVtt(result.text, result.words);
                ext = 'vtt';
                mimeType = 'text/vtt;charset=utf-8';
                break;
            default:
                content = result.text;
                ext = 'txt';
                mimeType = 'text/plain;charset=utf-8';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.fileName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    Logger.info(`批量下载: ${Object.keys(transcriptionResults).length} 个 ${format.toUpperCase()} 文件`);
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
        return;
    }
    
    isProcessing = true;
    const audioSource = document.querySelector('input[name="audioSource"]:checked');
    
    // 如果没有选中任何选项，默认使用麦克风
    const sourceValue = audioSource ? audioSource.value : 'microphone';
    
    try {
        if (sourceValue === 'microphone') {
            await startMicrophoneRecording();
        } else {
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
        document.getElementById('wsFinalizeBtn').style.display = 'inline-block';
        // 不清空历史消息，保留所有内容
        
        await connectWebSocket(apiKey, audioStream);
        
    } catch (error) {
        wsLog(`❌ 麦克风错误: ${error.message}`, 'error');
        alert('无法访问麦克风，请检查浏览器权限');
    }
}

async function startFileTranscription() {
    const fileInput = document.getElementById('wsFile');
    const file = fileInput ? fileInput.files[0] : null;
    
    if (!file) {
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

// WebSocket 重连配置
let wsReconnectAttempts = 0;
const WS_MAX_RECONNECT = 3;
const WS_RECONNECT_DELAY = 2000;
let currentWs = null;
let wsConfig = null;
let wsFinalTokens = [];
let wsAllSessionTokens = []; // 累积当前会话的所有 tokens
let wsUserStopped = false;

async function connectWebSocket(apiKey, stream, file) {
    const enableDiarization = document.getElementById('wsDiarization').checked;
    const enableLanguageId = document.getElementById('wsLanguageId').checked;
    const translationType = document.querySelector('input[name="translationType"]:checked').value;
    
    wsLog(`🔑 Key: ${apiKey.substring(0, 10)}...`);
    
    // 保存配置用于重连
    wsConfig = { apiKey, stream, file, enableDiarization, enableLanguageId, translationType };
    wsReconnectAttempts = 0;
    wsFinalTokens = [];
    wsAllSessionTokens = [];
    wsUserStopped = false;
    
    document.getElementById('wsStartBtn').disabled = true;
    // 不清空历史消息，保留所有内容
    
    await doConnect();
}

async function doConnect() {
    if (wsUserStopped) return;
    
    const { apiKey, stream, file, enableDiarization, enableLanguageId, translationType } = wsConfig;
    
    try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/transcribe`;
        const ws = new WebSocket(wsUrl);
        currentWs = ws;
        currentWebSocket = ws; // 保存引用用于 Manual Finalization
        
        ws.onopen = async () => {
            wsLog('✅ WebSocket 连接成功');
            wsReconnectAttempts = 0; // 连接成功，重置重连计数
            
            // 构建配置
            const config = {
                api_key: apiKey,
                model: 'stt-rt-v4',
                audio_format: 'auto',
                enable_speaker_diarization: enableDiarization,
                enable_language_identification: enableLanguageId,
                enable_endpoint_detection: true
            };
            
            // 添加 max_endpoint_delay_ms（v4 新参数）
            const endpointDelayInput = document.getElementById('maxEndpointDelay');
            if (endpointDelayInput) {
                const delayVal = parseInt(endpointDelayInput.value);
                if (delayVal >= 500 && delayVal <= 3000) {
                    config.max_endpoint_delay_ms = delayVal;
                }
            }
            
            // 添加 Language Hints
            const languageHints = Array.from(document.querySelectorAll('.ws-lang-hint:checked')).map(cb => cb.value);
            if (languageHints.length > 0) {
                config.language_hints = languageHints;
                
                // 添加 language_hints_strict
                const strictCheckbox = document.getElementById('wsLanguageStrict');
                if (strictCheckbox && strictCheckbox.checked) {
                    config.language_hints_strict = true;
                }
                
                wsLog(`🌍 语言提示: ${languageHints.join(', ')}${strictCheckbox && strictCheckbox.checked ? ' (严格模式)' : ''}`);
            } else {
                wsLog(`🌍 语言提示: 自动检测所有语言`);
            }
            
            // 添加 Context
            const context = buildContextObject();
            if (context) {
                config.context = context;
                const parts = [];
                if (context.general) parts.push(`General(${context.general.length}项)`);
                if (context.text) parts.push(`Text(${context.text.length}字)`);
                if (context.terms) parts.push(`Terms(${context.terms.length}个)`);
                if (context.translation_terms) parts.push(`TransTerms(${context.translation_terms.length}个)`);
                wsLog(`📝 Context: ${parts.join(', ')}`);
            }
            
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
        
        ws.onmessage = (event) => {
            const response = JSON.parse(event.data);
            
            if (response.error || response.error_code) {
                const errorMsg = response.error || response.error_message || '未知错误';
                
                if (response.error_code === 408) {
                    wsLog(`⚠️ 警告: ${errorMsg}（翻译处理较慢，继续等待...）`, 'warning');
                    return;
                }
                
                wsLog(`❌ 错误: ${errorMsg}`, 'error');
                ws.close();
                return;
            }
            
            if (response.tokens && response.tokens.length > 0) {
                
                const finalTokens = [];
                const nonFinalTokens = [];
                
                response.tokens.forEach(token => {
                    if (token.is_final) {
                        finalTokens.push(token);
                    } else {
                        nonFinalTokens.push(token);
                    }
                });
                
                // 累积保存所有 final tokens
                finalTokens.forEach(token => {
                    // 检查是否已存在（避免重复）
                    const exists = wsAllSessionTokens.some(t => 
                        t.start_ms === token.start_ms && t.end_ms === token.end_ms && t.text === token.text
                    );
                    if (!exists) {
                        wsAllSessionTokens.push(token);
                    }
                });
                
                wsFinalTokens = finalTokens;
                
                // 初始化会话时间戳
                if (!window.currentSessionTimestamp) {
                    window.currentSessionTimestamp = new Date().toLocaleString('zh-CN', { 
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
                    }).replace(/\//g, '-').replace(/,/g, '').replace(/ /g, '_');
                }
                
                // 紧凑渲染：使用累积的所有 tokens + 当前 non-final
                const resultDiv = document.getElementById('wsResult');
                const segments = [];
                let currentSeg = { speaker: null, lang: null, tokens: [] };
                
                // 显示累积的所有 tokens + 当前 non-final
                const allTokens = [...wsAllSessionTokens, ...nonFinalTokens];
                allTokens.forEach(token => {
                    if (token.text?.trim() === '<end>') return;
                    
                    // 说话人切换或语言切换时分段
                    const speakerChanged = token.speaker !== undefined && token.speaker !== currentSeg.speaker;
                    const langChanged = token.language && token.language !== currentSeg.lang;
                    
                    if ((speakerChanged || langChanged) && currentSeg.tokens.length > 0) {
                        segments.push({...currentSeg});
                        currentSeg = { speaker: token.speaker, lang: token.language, tokens: [] };
                    }
                    
                    // 初始化第一个 segment
                    if (currentSeg.speaker === null) {
                        currentSeg.speaker = token.speaker;
                        currentSeg.lang = token.language;
                    }
                    
                    currentSeg.tokens.push(token);
                    currentSeg.lang = token.language || currentSeg.lang;
                });
                if (currentSeg.tokens.length > 0) segments.push(currentSeg);
                
                const finalHtml = segments.map(seg => {
                    // 说话人颜色（10种清晰颜色）
                    const speakerColors = ['#667eea', '#059669', '#dc2626', '#f59e0b', '#7c3aed', '#0891b2', '#db2777', '#ea580c', '#65a30d', '#8b5cf6'];
                    const speakerColor = seg.speaker !== null ? speakerColors[seg.speaker % 10] : '#333';
                    const speaker = seg.speaker !== null ? `<strong style="color: ${speakerColor};">说话人${seg.speaker}:</strong> ` : '';
                    
                    // 动态分配颜色（最多5种清晰颜色）
                    const colorPalette = ['#2563eb', '#059669', '#dc2626', '#f59e0b', '#7c3aed']; // 蓝、绿、红、橙、紫
                    if (!window.langColorMap) window.langColorMap = {};
                    if (seg.lang && !window.langColorMap[seg.lang]) {
                        const usedColors = Object.values(window.langColorMap);
                        const availableColor = colorPalette.find(c => !usedColors.includes(c)) || colorPalette[0];
                        window.langColorMap[seg.lang] = availableColor;
                    }
                    const langColor = seg.lang ? window.langColorMap[seg.lang] : '#6b7280';
                    const lang = seg.lang ? `<span style="background: ${langColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;">[${seg.lang.toUpperCase()}]</span> ` : '';
                    const text = seg.tokens.map(t => {
                        const conf = t.confidence !== undefined ? t.confidence : 1.0;
                        const textContent = escapeHtml(t.text || '');
                        
                        // 非 final 用灰色斜体
                        if (!t.is_final) {
                            return `<span style="color: #999; font-style: italic;">${textContent}</span>`;
                        }
                        
                        // 低置信度高亮
                        if (conf < 0.7) {
                            return `<span style="background: #fff3cd; padding: 1px 3px;" title="置信度: ${(conf*100).toFixed(1)}%">${textContent}</span>`;
                        }
                        
                        return textContent;
                    }).join('');
                    return `<div style="margin: 2px 0; color: #333;">${speaker}${lang}${text}</div>`;
                }).join('');
                
                resultDiv.innerHTML = finalHtml;
                
                // 显示非 final tokens（临时，灰色斜体）
                const tempText = nonFinalTokens.map(t => t.text || '').join('');
                if (tempText) {
                    const tempDiv = document.createElement('div');
                    tempDiv.style.cssText = 'color: #999; font-style: italic; margin-top: 8px; border-top: 1px dashed #ddd; padding-top: 8px;';
                    tempDiv.textContent = '...' + tempText;
                    resultDiv.appendChild(tempDiv);
                }
            }
            
            
            if (response.finished) {
                wsLog('✅ 转录完成！', 'success');
                
                // 显示下载按钮
                if (wsAllSessionTokens.length > 0) {
                    document.getElementById('wsDownloadBtn').style.display = 'inline-block';
                    wsLog('💾 可以下载转录结果了');
                }
                
                wsUserStopped = true;
                ws.close();
            }
        };
        
        ws.onerror = (error) => {
            wsLog(`❌ WebSocket 错误`, 'error');
        };
        
        ws.onclose = (event) => {
            wsLog('🔌 连接已关闭');
            
            // 判断是否需要重连（非用户主动停止、非正常完成、还有重连次数）
            if (!wsUserStopped && wsReconnectAttempts < WS_MAX_RECONNECT && wsConfig.stream) {
                wsReconnectAttempts++;
                wsLog(`🔄 网络中断，${WS_RECONNECT_DELAY/1000}秒后自动重连 (${wsReconnectAttempts}/${WS_MAX_RECONNECT})...`, 'warning');
                setTimeout(() => doConnect(), WS_RECONNECT_DELAY);
            } else {
                stopRecording();
            }
        };
        
    } catch (error) {
        wsLog(`❌ 错误: ${error.message}`, 'error');
        
        // 连接失败也尝试重连
        if (!wsUserStopped && wsReconnectAttempts < WS_MAX_RECONNECT && wsConfig.stream) {
            wsReconnectAttempts++;
            wsLog(`🔄 连接失败，${WS_RECONNECT_DELAY/1000}秒后重试 (${wsReconnectAttempts}/${WS_MAX_RECONNECT})...`, 'warning');
            setTimeout(() => doConnect(), WS_RECONNECT_DELAY);
        } else {
            stopRecording();
        }
    }
}

function stopRecording() {
    wsUserStopped = true; // 标记用户主动停止，防止重连
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
        currentWs.close();
    }
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
    document.getElementById('wsFinalizeBtn').style.display = 'none';
    currentWebSocket = null;
    wsLog('⏹️ 录音已停止');
}

// 渲染 tokens 为可读 HTML - 原文和翻译分行显示 + 置信度
function renderTokens(finalTokens, nonFinalTokens) {
    const allTokens = [...finalTokens, ...nonFinalTokens];
    
    // 语言颜色映射
    const languageColors = {
        'zh': '#2563eb', 'en': '#059669', 'es': '#dc2626', 'fr': '#7c3aed',
        'de': '#ea580c', 'ja': '#db2777', 'ko': '#0891b2', 'ar': '#65a30d',
        'ru': '#be123c', 'pt': '#0284c7', 'default': '#1f2937'
    };
    
    // 先分离原文和翻译 tokens
    const originalTokens = allTokens.filter(t => t.translation_status !== 'translation');
    const translationTokens = allTokens.filter(t => t.translation_status === 'translation');
    
    // 渲染带置信度的文本
    function renderTokensWithConfidence(tokens) {
        return tokens.map(token => {
            const text = token.text || '';
            if (text.trim() === '<end>') return '';
            
            const confidence = token.confidence !== undefined ? token.confidence : 1.0;
            const isLowConfidence = confidence < 0.7;
            
            // 低置信度高亮显示
            if (isLowConfidence && token.is_final) {
                return `<span style="background: rgba(255, 152, 0, 0.3); padding: 2px 4px; border-radius: 3px; border-bottom: 2px dotted #FF9800;" title="置信度: ${(confidence * 100).toFixed(1)}%">${escapeHtml(text)}</span>`;
            }
            
            return escapeHtml(text);
        }).join('');
    }
    
    // 按时间间隔分句（间隔 > 800ms 认为是新句子）
    const GAP_THRESHOLD = 800;
    
    function splitIntoSentences(tokens) {
        const sentences = [];
        let current = { speaker: null, lang: null, tokens: [], startMs: 0 };
        
        for (const token of tokens) {
            const text = token.text || '';
            if (text.trim() === '<end>') continue;
            
            const gap = current.startMs > 0 ? (token.start_ms - current.startMs) : 0;
            const speakerChanged = token.speaker !== undefined && token.speaker !== current.speaker;
            
            // 新句子条件：说话人变化 或 时间间隔大
            if (speakerChanged || (gap > GAP_THRESHOLD && current.tokens.length > 0)) {
                if (current.tokens.length > 0) {
                    sentences.push({...current});
                }
                current = { speaker: token.speaker || current.speaker, lang: token.language, tokens: [], startMs: token.start_ms };
            }
            
            current.tokens.push(token);
            current.lang = token.language || current.lang;
            current.speaker = token.speaker !== undefined ? token.speaker : current.speaker;
            if (token.end_ms) current.startMs = token.end_ms;
        }
        
        if (current.tokens.length > 0) {
            sentences.push(current);
        }
        return sentences;
    }
    
    const origSentences = splitIntoSentences(originalTokens);
    const transSentences = splitIntoSentences(translationTokens);
    
    // 渲染HTML - 原文和翻译配对显示
    const htmlParts = [];
    let lastSpeaker = null;
    const maxLen = Math.max(origSentences.length, transSentences.length);
    
    for (let i = 0; i < maxLen; i++) {
        const orig = origSentences[i];
        const trans = transSentences[i];
        
        // 说话人标签
        const speaker = orig?.speaker || trans?.speaker;
        if (speaker !== null && speaker !== lastSpeaker) {
            lastSpeaker = speaker;
            htmlParts.push(`<div style="font-weight: bold; color: #1f2937; margin: 16px 0 10px 0; font-size: 15px;">👤 说话人 ${speaker}:</div>`);
        }
        
        // 原文行（带置信度）
        if (orig && orig.tokens.length > 0) {
            const lang = orig.lang || 'zh';
            const color = languageColors[lang] || languageColors['default'];
            const textHtml = renderTokensWithConfidence(orig.tokens);
            htmlParts.push(`<div style="margin: 8px 0 4px 0; line-height: 1.8;">
                <span style="color: white; background: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${lang.toUpperCase()}</span>
                <span style="color: ${color}; margin-left: 8px;">${textHtml}</span>
            </div>`);
        }
        
        // 翻译行
        if (trans && trans.tokens.length > 0) {
            const lang = trans.lang || 'en';
            const color = languageColors[lang] || languageColors['default'];
            const textHtml = renderTokensWithConfidence(trans.tokens);
            htmlParts.push(`<div style="margin: 4px 0 16px 28px; line-height: 1.8; padding-left: 12px; border-left: 3px solid ${color}40;">
                <span style="color: white; background: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">🌐 ${lang.toUpperCase()}</span>
                <span style="color: ${color}; margin-left: 8px;">${textHtml}</span>
            </div>`);
        }
    }
    
    return htmlParts.join('');
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== Context 编辑器功能 ====================

// Context 数据存储
let contextData = {
    general: [],
    text: '',
    terms: [],
    translation_terms: []
};

// General 部分
document.getElementById('addContextGeneral').addEventListener('click', () => {
    const key = document.getElementById('contextGeneralKey').value.trim();
    const value = document.getElementById('contextGeneralValue').value.trim();
    
    if (!key || !value) {
        alert('请输入 Key 和 Value');
        return;
    }
    
    contextData.general.push({ key, value });
    document.getElementById('contextGeneralKey').value = '';
    document.getElementById('contextGeneralValue').value = '';
    renderContextGeneral();
});

function renderContextGeneral() {
    const list = document.getElementById('contextGeneralList');
    list.innerHTML = contextData.general.map((item, index) => `
        <div style="display: flex; gap: 10px; align-items: center; padding: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; margin-bottom: 8px;">
            <span style="color: #4CAF50; font-weight: 600;">${item.key}:</span>
            <span style="color: #fff; flex: 1;">${item.value}</span>
            <button onclick="removeContextGeneral(${index})" class="btn-small" style="background: #f44336; color: white;">删除</button>
        </div>
    `).join('');
}

window.removeContextGeneral = function(index) {
    contextData.general.splice(index, 1);
    renderContextGeneral();
};

// Text 部分
document.getElementById('contextText').addEventListener('input', (e) => {
    contextData.text = e.target.value.trim();
});

// Terms 部分
document.getElementById('addContextTerm').addEventListener('click', () => {
    const term = document.getElementById('contextTermInput').value.trim();
    if (!term) return;
    
    if (!contextData.terms.includes(term)) {
        contextData.terms.push(term);
        document.getElementById('contextTermInput').value = '';
        renderContextTerms();
    }
});

document.getElementById('contextTermInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('addContextTerm').click();
    }
});

function renderContextTerms() {
    const list = document.getElementById('contextTermsList');
    list.innerHTML = contextData.terms.map((term, index) => `
        <span style="display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; background: rgba(76, 175, 80, 0.3); border: 1px solid #4CAF50; border-radius: 16px; color: #fff;">
            ${term}
            <button onclick="removeContextTerm(${index})" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 18px; padding: 0; line-height: 1; font-weight: bold;">×</button>
        </span>
    `).join('');
}

window.removeContextTerm = function(index) {
    contextData.terms.splice(index, 1);
    renderContextTerms();
};

// Translation Terms 部分
document.getElementById('addContextTranslation').addEventListener('click', () => {
    const source = document.getElementById('contextTransSource').value.trim();
    const target = document.getElementById('contextTransTarget').value.trim();
    
    if (!source || !target) {
        alert('请输入原文和译文');
        return;
    }
    
    contextData.translation_terms.push({ source, target });
    document.getElementById('contextTransSource').value = '';
    document.getElementById('contextTransTarget').value = '';
    renderContextTranslations();
});

function renderContextTranslations() {
    const list = document.getElementById('contextTranslationList');
    list.innerHTML = contextData.translation_terms.map((item, index) => `
        <div style="display: flex; gap: 10px; align-items: center; padding: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; margin-bottom: 8px;">
            <span style="color: #2196F3; font-weight: 600;">${item.source}</span>
            <span style="color: #fff;">→</span>
            <span style="color: #FF9800; font-weight: 600;">${item.target}</span>
            <button onclick="removeContextTranslation(${index})" class="btn-small" style="background: #f44336; color: white; margin-left: auto;">删除</button>
        </div>
    `).join('');
}

window.removeContextTranslation = function(index) {
    contextData.translation_terms.splice(index, 1);
    renderContextTranslations();
};

// Context 模板管理
const CONTEXT_TEMPLATES_KEY = 'soniox_context_templates';

document.getElementById('saveContextTemplate').addEventListener('click', () => {
    const name = prompt('请输入模板名称：');
    if (!name) return;
    
    const templates = JSON.parse(localStorage.getItem(CONTEXT_TEMPLATES_KEY) || '{}');
    templates[name] = JSON.parse(JSON.stringify(contextData));
    localStorage.setItem(CONTEXT_TEMPLATES_KEY, JSON.stringify(templates));
    
    alert(`模板 "${name}" 已保存`);
    wsLog(`💾 Context 模板已保存: ${name}`);
});

document.getElementById('loadContextTemplate').addEventListener('click', () => {
    const templates = JSON.parse(localStorage.getItem(CONTEXT_TEMPLATES_KEY) || '{}');
    const names = Object.keys(templates);
    
    if (names.length === 0) {
        alert('没有保存的模板');
        return;
    }
    
    const name = prompt(`请选择模板：\n${names.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n\n输入模板名称或序号：`);
    if (!name) return;
    
    const selectedName = isNaN(name) ? name : names[parseInt(name) - 1];
    
    if (templates[selectedName]) {
        contextData = JSON.parse(JSON.stringify(templates[selectedName]));
        document.getElementById('contextText').value = contextData.text;
        renderContextGeneral();
        renderContextTerms();
        renderContextTranslations();
        alert(`模板 "${selectedName}" 已加载`);
        wsLog(`📂 Context 模板已加载: ${selectedName}`);
    } else {
        alert('模板不存在');
    }
});

// 构建 Context 对象
function buildContextObject() {
    const context = {};
    
    if (contextData.general.length > 0) {
        context.general = contextData.general;
    }
    
    if (contextData.text) {
        context.text = contextData.text;
    }
    
    if (contextData.terms.length > 0) {
        context.terms = contextData.terms;
    }
    
    if (contextData.translation_terms.length > 0) {
        context.translation_terms = contextData.translation_terms;
    }
    
    return Object.keys(context).length > 0 ? context : null;
}

// ==================== Manual Finalization ====================

let currentWebSocket = null;

document.getElementById('wsFinalizeBtn').addEventListener('click', () => {
    if (currentWebSocket && currentWebSocket.readyState === WebSocket.OPEN) {
        currentWebSocket.send(JSON.stringify({ type: 'finalize' }));
        wsLog('⚡ 已发送立即终结指令', 'info');
    }
});

// ==================== WebSocket 转录下载功能 ====================





// WebSocket 结果下载和清空
document.getElementById('wsDownloadBtn').addEventListener('click', () => {
    const timestamp = new Date().toLocaleString('zh-CN', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
    }).replace(/\//g, '-').replace(/,/g, '').replace(/ /g, '_');
    
    const text = wsAllSessionTokens.map(t => {
        const speaker = t.speaker !== null ? `[说话人 ${t.speaker}] ` : '';
        const lang = t.language ? `[${t.language.toUpperCase()}] ` : '';
        return speaker + lang + (t.text || '');
    }).join('');
    
    if (!text) {
        alert('没有可下载的内容');
        return;
    }
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `转录_${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    wsLog(`💾 已下载: 转录_${timestamp}.txt`);
});

// 复制转录结果到剪贴板
function copyWsResult() {
    const el = document.getElementById('wsResult');
    const text = el.innerText.trim();
    if (!text) {
        alert('没有可复制的内容');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('wsCopyBtn');
        const orig = btn.textContent;
        btn.textContent = '✅ 已复制';
        setTimeout(() => btn.textContent = orig, 2000);
    }).catch(() => {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        const btn = document.getElementById('wsCopyBtn');
        const orig = btn.textContent;
        btn.textContent = '✅ 已复制';
        setTimeout(() => btn.textContent = orig, 2000);
    });
}

document.getElementById('wsClearResult').addEventListener('click', () => {
    if (confirm('确定要清空所有转录内容吗？')) {
        document.getElementById('wsResult').innerHTML = '';
        wsAllSessionTokens = [];
        wsFinalTokens = [];
        document.getElementById('wsDownloadBtn').style.display = 'none';
        wsLog('🗑️ 转录内容已清空');
    }
});
