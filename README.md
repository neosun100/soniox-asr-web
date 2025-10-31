# Soniox ASR Web UI

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.7+-green.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)

基于 Soniox API 的完整语音识别 Web 应用，支持文件转录、实时语音识别和多语言翻译。

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [使用说明](#-使用说明) • [API 文档](#-api-文档) • [部署指南](#-部署指南)

</div>

---

## 📸 界面预览

![Soniox ASR 主界面](screenshot-20251031.png)

**三大核心功能**：
- **文件转录**：批量上传音频文件，自动切分长音频，并行处理
- **实时语音**：WebSocket 实时转录，支持麦克风录音和人声分离
- **多语言翻译**：60+ 语言支持，单向/双向实时翻译

---

## ✨ 功能特性

### 📁 文件转录（REST API）

- ✅ **多格式支持**：mp3, wav, m4a, flac, ogg 等 60+ 音频格式
- ✅ **智能切分**：自动处理超过 5 小时的长音频文件
- ✅ **批量处理**：最多 100 个文件同时上传，可配置并发数
- ✅ **人声分离**：自动识别不同说话人（最多 15 人）
- ✅ **实时进度**：进度条、百分比、处理时长实时显示
- ✅ **智能重试**：API Key 失效自动切换，最多重试 3 次
- ✅ **结果下载**：单个或批量下载 TXT 格式转录结果

### 🎤 实时语音识别（WebSocket）

- ✅ **麦克风录音**：浏览器直接录音，实时转录
- ✅ **流式处理**：边说边转，低延迟响应
- ✅ **人声分离**：实时识别不同说话人
- ✅ **语言识别**：自动检测语言并标注
- ✅ **端点检测**：自动识别说话结束（`<end>` token）
- ✅ **彩色显示**：不同语言用不同颜色标注

### 🌍 多语言翻译

- ✅ **60+ 语言**：支持中文、英语、日语、韩语、法语、德语等
- ✅ **单向翻译**：所有语言翻译成目标语言
- ✅ **双向翻译**：两种语言互译（如中英互译）
- ✅ **实时翻译**：边说边译，无需等待
- ✅ **颜色标注**：原文和译文用不同颜色区分

### 🔌 RESTful API 服务

- ✅ **独立后端**：FastAPI 高性能异步服务
- ✅ **自动切分**：后端自动处理超长音频
- ✅ **Swagger 文档**：交互式 API 文档
- ✅ **CORS 支持**：跨域请求支持

---

## 🚀 快速开始

### 前置要求

- Python 3.7+
- FFmpeg（音频处理）
- Soniox API Key（[获取地址](https://soniox.com)）

### 一键启动

```bash
# 克隆项目
git clone https://github.com/neosun100/soniox-asr-web.git
cd soniox-asr-web

# 安装依赖
pip3 install -r requirements.txt

# 安装 FFmpeg
# macOS
brew install ffmpeg
# Ubuntu/Debian
sudo apt-get install ffmpeg

# 一键启动
chmod +x start.sh
./start.sh
```

启动后自动打开：
- 前端服务：http://localhost:8000
- 后端 API：http://localhost:8001
- API 文档：http://localhost:8001/docs

---

## 📱 使用说明

### 1. 配置 API Key

首次使用需要配置 Soniox API Key：

1. 访问 [Soniox Console](https://soniox.com) 获取 API Key
2. 在界面顶部输入 API Key（支持多个 Key，逗号分隔）
3. API Key 自动保存到浏览器 localStorage

**多 Key 负载均衡**：
```
KEY1,KEY2,KEY3
```
系统会自动在多个 Key 之间轮换，避免单点限流。

### 2. 文件转录

#### 基础使用

1. 切换到"文件转录"标签页
2. 选择是否启用人声分离
3. 设置并发任务数（默认 5）
4. 拖拽或选择音频文件（最多 100 个）
5. 点击"开始转录"
6. 查看实时进度和日志
7. 下载转录结果

#### 智能处理

- **短音频**（≤ 5 小时）：直接处理
- **长音频**（> 5 小时）：自动切分成多段，并行处理后合并

#### 批量下载

- 单个文件：点击"下载"按钮
- 批量下载：点击"批量下载所有结果"

### 3. 实时语音识别

#### 基础使用

1. 切换到"实时语音"标签页
2. 配置识别参数：
   - 模型：`stt-rt-preview`（实时模型）
   - 音频格式：`auto`（自动检测）
   - 人声分离：开启/关闭
   - 端点检测：开启/关闭
   - 语言提示：选择可能的语言
3. 点击"开始录音"
4. 对着麦克风说话
5. 实时查看转录结果
6. 点击"停止录音"结束

#### 高级功能

**语言识别**：
- 自动检测说话语言
- 不同语言用不同颜色标注
- 支持多语言混合识别

**端点检测**：
- 自动识别说话结束
- 显示 `<end>` 标记
- 自动换行分段

### 4. 多语言翻译

#### 单向翻译

将所有语言翻译成目标语言：

1. 选择"单向翻译"
2. 选择目标语言（如"中文"）
3. 开始录音
4. 系统自动将所有语言翻译成中文

**适用场景**：国际会议、多语言客服

#### 双向翻译

两种语言互译：

1. 选择"双向翻译"
2. 选择语言 A（如"英语"）
3. 选择语言 B（如"中文"）
4. 开始录音
5. 英语自动译成中文，中文自动译成英语

**适用场景**：双语对话、实时口译

#### 颜色标注

不同语言用不同颜色显示：
- 🔵 中文 (zh)
- 🟢 英语 (en)
- 🔴 西班牙语 (es)
- 🟣 法语 (fr)
- 🟠 德语 (de)
- 🩷 日语 (ja)
- 🔷 韩语 (ko)
- 🟡 阿拉伯语 (ar)
- 🔺 俄语 (ru)
- 🔹 葡萄牙语 (pt)

---

## 📚 API 文档

### 文件转录 API

**端点**：`POST /transcribe`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | ✅ | 音频文件 |
| api_keys | String | ✅ | 逗号分隔的 API Keys |
| enable_diarization | Boolean | ❌ | 是否启用人声分离（默认 false）|

**cURL 示例**：

```bash
curl -X POST "http://localhost:8001/transcribe" \
  -F "file=@audio.mp3" \
  -F "api_keys=YOUR_KEY1,YOUR_KEY2" \
  -F "enable_diarization=false"
```

**Python 示例**：

```python
import requests

url = "http://localhost:8001/transcribe"
files = {'file': open('audio.mp3', 'rb')}
data = {
    'api_keys': 'YOUR_KEY1,YOUR_KEY2',
    'enable_diarization': 'false'
}

response = requests.post(url, files=files, data=data)
result = response.json()

if result['success']:
    print(f"转录文本: {result['text']}")
    print(f"处理时长: {result['processing_time']['total']}秒")
```

**响应格式**：

```json
{
  "success": true,
  "text": "转录的完整文本内容...",
  "words": [
    {
      "text": "你好",
      "start_time": 0.5,
      "end_time": 0.8
    }
  ],
  "audio_duration": 3600.5,
  "total_chunks": 2,
  "processing_time": {
    "total": 45.23,
    "chunks": [
      {"chunk": 1, "duration": 22.5},
      {"chunk": 2, "duration": 21.8}
    ]
  }
}
```

### WebSocket 实时转录

**端点**：`ws://localhost:8001/ws/transcribe`

**连接流程**：

1. 建立 WebSocket 连接
2. 发送配置消息（JSON）
3. 发送音频数据（二进制）
4. 接收实时转录结果（JSON）
5. 发送空帧结束

**配置参数**：

```json
{
  "api_key": "YOUR_API_KEY",
  "model": "stt-rt-preview",
  "audio_format": "auto",
  "enable_speaker_diarization": false,
  "enable_endpoint_detection": false,
  "enable_language_identification": true,
  "language_hints": ["en", "zh"],
  "translation": {
    "type": "one_way",
    "target_language": "zh"
  }
}
```

**JavaScript 示例**：

```javascript
const ws = new WebSocket('ws://localhost:8001/ws/transcribe');

ws.onopen = async () => {
    // 1. 发送配置
    ws.send(JSON.stringify({
        api_key: 'YOUR_API_KEY',
        model: 'stt-rt-preview',
        audio_format: 'auto',
        enable_speaker_diarization: true
    }));
    
    // 2. 获取麦克风并发送音频
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            event.data.arrayBuffer().then(buffer => {
                ws.send(buffer);
            });
        }
    };
    
    mediaRecorder.start(100); // 每 100ms 发送一次
};

ws.onmessage = (event) => {
    const result = JSON.parse(event.data);
    
    // 3. 处理转录结果
    if (result.tokens) {
        result.tokens.forEach(token => {
            if (token.is_final) {
                console.log(token.text);
            }
        });
    }
};
```

**响应格式**：

```json
{
  "tokens": [
    {
      "text": "Hello",
      "start_ms": 600,
      "end_ms": 760,
      "confidence": 0.97,
      "is_final": true,
      "speaker": "1",
      "language": "en"
    }
  ],
  "final_audio_proc_ms": 760,
  "total_audio_proc_ms": 880
}
```

---

## 🚀 部署指南

### 本地开发

```bash
# 启动后端
python3 server.py

# 启动前端（新终端）
python3 -m http.server 8000
```

### 生产部署（Nginx + Systemd）

#### 1. 创建 Systemd 服务

**API 服务**（`/etc/systemd/system/soniox-api.service`）：

```ini
[Unit]
Description=Soniox ASR API Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/soniox-asr-web
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/python3 /root/soniox-asr-web/server.py
Restart=always
RestartSec=10
StandardOutput=append:/root/soniox-asr-web/logs/api.log
StandardError=append:/root/soniox-asr-web/logs/api-error.log

[Install]
WantedBy=multi-user.target
```

**Web 服务**（`/etc/systemd/system/soniox-web.service`）：

```ini
[Unit]
Description=Soniox ASR Web Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/soniox-asr-web
ExecStart=/usr/bin/python3 -m http.server 8000
Restart=always
RestartSec=10
StandardOutput=append:/root/soniox-asr-web/logs/web.log
StandardError=append:/root/soniox-asr-web/logs/web-error.log

[Install]
WantedBy=multi-user.target
```

#### 2. 配置 Nginx

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # WebSocket 支持
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # API 支持
    location /transcribe {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
    }

    # 前端静态文件
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. 启动服务

```bash
# 创建日志目录
mkdir -p /root/soniox-asr-web/logs

# 启动服务
systemctl daemon-reload
systemctl enable soniox-api.service soniox-web.service
systemctl start soniox-api.service soniox-web.service

# 检查状态
systemctl status soniox-api.service soniox-web.service

# 重启 Nginx
nginx -t
systemctl reload nginx
```

---

## 🛠️ 技术架构

### 前端技术栈

- HTML5 + CSS3 + Vanilla JavaScript
- Web Audio API（音频处理）
- MediaRecorder API（麦克风录音）
- WebSocket API（实时通信）
- Fetch API（文件上传）
- localStorage（数据持久化）

### 后端技术栈

- FastAPI（Web 框架）
- Uvicorn（ASGI 服务器）
- HTTPX（异步 HTTP 客户端）
- Pydub（音频处理）
- WebSockets（实时通信）
- python-multipart（文件上传）

### 支持的音频格式

mp3, wav, m4a, flac, ogg, aac, webm, mp4, aiff, amr, asf, wma, opus

### 支持的语言（60+）

中文、英语、日语、韩语、法语、德语、西班牙语、葡萄牙语、俄语、阿拉伯语、意大利语、荷兰语、波兰语、土耳其语、瑞典语、丹麦语、挪威语、芬兰语、希腊语、捷克语、匈牙利语、罗马尼亚语、泰语、越南语、印尼语、马来语、菲律宾语、印地语、孟加拉语、乌尔都语、波斯语、希伯来语等

---

## ⚠️ 限制说明

| 限制项 | 值 | 说明 |
|--------|-----|------|
| 单文件时长 | 5 小时 | 超过自动切分 |
| 批量上传 | 100 个文件 | 可配置并发数 |
| WebSocket 超时 | 24 小时 | Nginx 配置 |
| 人声分离 | 15 人 | Soniox API 限制 |

---

## 🔒 安全建议

### 开发环境
- ✅ 使用 localhost 测试
- ✅ API Key 保存在 localStorage
- ✅ 不要提交 API Key 到代码仓库

### 生产环境
- ⚠️ 使用 HTTPS/WSS
- ⚠️ 配置 Nginx 反向代理
- ⚠️ 使用环境变量管理 API Key
- ⚠️ 定期轮换 API Key
- ⚠️ 设置请求频率限制
- ⚠️ 启用基本认证（可选）

---

## 🐛 故障排除

### WebSocket 连接失败

**问题**：`WebSocket connection failed`

**解决方案**：
1. 检查 Nginx 是否配置 WebSocket 支持
2. 确认使用 `wss://`（HTTPS）或 `ws://`（HTTP）
3. 检查防火墙是否开放端口
4. 查看浏览器控制台错误信息

### 转录失败

**问题**：`所有 API Key 都已失效`

**解决方案**：
1. 验证 API Key 是否正确
2. 检查 API Key 是否过期
3. 确认 Soniox 账户余额充足
4. 尝试使用多个 API Key

### 音频处理失败

**问题**：`FFmpeg not found`

**解决方案**：
```bash
# 安装 FFmpeg
brew install ffmpeg  # macOS
sudo apt-get install ffmpeg  # Ubuntu
```

---

## 📦 依赖项

```txt
fastapi==0.104.1
uvicorn==0.24.0
httpx==0.25.1
pydub==0.25.1
python-multipart==0.0.6
websockets==12.0
```

---

## 🔄 更新日志

### v3.0.0 (2025-10-31)
- ✨ 新增 WebSocket 实时语音识别
- ✨ 新增多语言翻译功能（60+ 语言）
- ✨ 新增麦克风录音支持
- ✨ 新增语言识别和颜色标注
- ✨ 新增端点检测功能
- ✨ 优化 Nginx 配置支持 WebSocket
- 🐛 修复长音频切分逻辑（5 小时）
- 🐛 修复并发控制问题
- 📝 完善部署文档

### v2.1.0 (2025-01-11)
- ✨ 新增 API Key 持久化存储
- 🔒 清除所有默认 API Key
- 📝 完善文档和使用说明

### v2.0.0 (2025-01-11)
- ✨ 新增 RESTful API 服务
- ✨ 新增 API Key 失效自动重试
- ✨ 新增详细时长统计
- ✨ 新增 Swagger 文档

### v1.0.0 (2025-01-10)
- ✨ 基础文件上传转文字功能
- ✨ 多文件批量处理
- ✨ 智能音频切分

---

## 📄 许可证

MIT License

---

## 🔗 相关链接

- [Soniox 官网](https://soniox.com)
- [Soniox API 文档](https://soniox.com/docs)
- [FastAPI 文档](https://fastapi.tiangolo.com)
- [GitHub 仓库](https://github.com/neosun100/soniox-asr-web)

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📧 联系方式

- GitHub Issues: [提交问题](https://github.com/neosun100/soniox-asr-web/issues)
- Email: neosun808@gmail.com

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！⭐**

Made with ❤️ by Neo Sun

</div>
