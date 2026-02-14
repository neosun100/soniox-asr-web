# Soniox ASR Web UI

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/neosun100/soniox-asr-web?style=social)](https://github.com/neosun100/soniox-asr-web/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/neosun100/soniox-asr-web?style=social)](https://github.com/neosun100/soniox-asr-web/network/members)
[![GitHub issues](https://img.shields.io/github/issues/neosun100/soniox-asr-web)](https://github.com/neosun100/soniox-asr-web/issues)
[![GitHub license](https://img.shields.io/github/license/neosun100/soniox-asr-web)](https://github.com/neosun100/soniox-asr-web/blob/main/LICENSE)
[![Python](https://img.shields.io/badge/python-3.7+-green.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)](https://fastapi.tiangolo.com/)

[简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [English](README.md) | [日本語](README.ja.md)

</div>

---

A complete speech recognition web application based on Soniox API, supporting file transcription, real-time speech recognition, and multilingual translation.

## 📸 Interface Preview

### REST API Batch Upload

<div align="center">

![REST API Batch Upload Interface](screenshot-rest-api.png?v=5.0.0)

*File transcription interface with audio processing options: noise reduction, speed change, and batch upload support*

</div>

### WebSocket Real-time Transcription

<div align="center">

![WebSocket Real-time Interface](screenshot-websocket.png?v=5.0.0)

*Real-time speech recognition with multilingual translation and speaker diarization*

</div>

**Three Core Features**:
- **File Transcription**: Batch upload audio files, automatic long audio splitting, parallel processing
- **Real-time Speech**: WebSocket real-time transcription with microphone recording and speaker diarization
- **Multilingual Translation**: 60+ language support with one-way and two-way real-time translation

---

## ✨ Features

### 📁 File Transcription (REST API)

- ✅ **Multi-format Support**: mp3, wav, m4a, flac, ogg, and 60+ audio formats
- ✅ **Video Support**: Automatically extract audio from video files (mp4, webm, mov, avi, etc.)
- ✅ **Audio Processing**: Noise reduction and speed change (1.25x-2.0x) options
- ✅ **Smart Splitting**: Automatically handles audio files exceeding 5 hours
- ✅ **Batch Processing**: Upload up to 100 files simultaneously with configurable concurrency
- ✅ **Speaker Diarization**: Automatically identifies different speakers (up to 15 people)
- ✅ **Real-time Progress**: Progress bar, percentage, and processing time display
- ✅ **Smart Retry**: Automatic API key switching on failure, up to 3 retries
- ✅ **Result Download**: Download individual or batch TXT format transcription results
- ✅ **Privacy First**: All audio/video processing done in browser, never uploaded to server

### 🎤 Real-time Speech Recognition (WebSocket)

- ✅ **Microphone Recording**: Direct browser recording with real-time transcription
- ✅ **Streaming Processing**: Transcribe while speaking with low latency
- ✅ **Speaker Diarization**: Real-time identification of different speakers
- ✅ **Language Identification**: Automatic language detection and labeling
- ✅ **Endpoint Detection**: Automatic speech end detection (`<end>` token)
- ✅ **Color Display**: Different languages marked with different colors

### 🌍 Multilingual Translation

- ✅ **60+ Languages**: Support for Chinese, English, Japanese, Korean, French, German, etc.
- ✅ **One-way Translation**: Translate all languages to target language
- ✅ **Two-way Translation**: Bidirectional translation between two languages (e.g., Chinese-English)
- ✅ **Real-time Translation**: Translate while speaking, no waiting required
- ✅ **Color Coding**: Original and translated text distinguished by different colors

### 🔌 RESTful API Service

- ✅ **Independent Backend**: FastAPI high-performance async service
- ✅ **Complete API Coverage**: Files, Transcriptions, Models API
- ✅ **Swagger Documentation**: Interactive API documentation at `/docs`
- ✅ **ReDoc Documentation**: Beautiful API docs at `/redoc`
- ✅ **CORS Support**: Cross-origin request support
- ✅ **Health Check**: `/health` endpoint for monitoring
- ✅ **Version Info**: `/version` endpoint

## 🤖 MCP Server Support

- ✅ **Model Context Protocol**: AI assistants can call Soniox API
- ✅ **6 MCP Tools**: transcribe, list files/transcriptions/models, delete
- ✅ **Claude Desktop**: Direct integration
- ✅ **Easy Configuration**: Simple JSON config file

---

## 🚀 Quick Start

### Prerequisites

- Python 3.7+
- Soniox API Key ([Get it here](https://soniox.com))

### One-click Startup

```bash
# Clone project
git clone https://github.com/neosun100/soniox-asr-web.git
cd soniox-asr-web

# Install dependencies
pip3 install -r requirements.txt

# One-click startup
chmod +x start.sh
./start.sh
```

After startup, automatically opens:
- Frontend Service: http://localhost:8000
- Backend API: http://localhost:8001
- API Documentation: http://localhost:8001/docs

---

## 📱 Usage Guide

### 1. Configure API Key

First-time use requires Soniox API Key configuration:

1. Visit [Soniox Console](https://soniox.com) to get API Key
2. Enter API Key at the top of the interface (supports multiple keys, comma-separated)
3. API Key automatically saves to browser localStorage

**🔒 Privacy Note**: Your Soniox API keys are stored **only in your browser's localStorage** and are **never transmitted to or stored on our servers**. This ensures maximum privacy and security for your credentials. Keys persist indefinitely unless you clear browser data.

**Multi-Key Load Balancing**:
```
KEY1,KEY2,KEY3
```
System automatically rotates between multiple keys to avoid single-point rate limiting.

### 2. File Transcription

#### Basic Usage

1. Switch to "File Transcription" tab
2. Choose whether to enable speaker diarization
3. Set concurrent task count (default 5)
4. Drag or select audio files (up to 100)
5. Click "Start Transcription"
6. View real-time progress and logs
7. Download transcription results

#### Smart Processing

- **Short Audio** (≤ 5 hours): Direct processing
- **Long Audio** (> 5 hours): Automatically split into segments, parallel processing then merge

#### Batch Download

- Single file: Click "Download" button
- Batch download: Click "Batch Download All Results"

### 3. Real-time Speech Recognition

#### Basic Usage

1. Switch to "Real-time Speech" tab
2. Configure recognition parameters:
   - Model: `stt-rt-v4` (real-time model)
   - Audio Format: `auto` (auto-detect)
   - Speaker Diarization: On/Off
   - Endpoint Detection: On/Off
   - Language Hints: Select possible languages
3. Click "Start Recording"
4. Speak into microphone
5. View real-time transcription results
6. Click "Stop Recording" to end

#### Advanced Features

**Language Identification**:
- Automatic language detection
- Different languages marked with different colors
- Support for mixed-language recognition

**Endpoint Detection**:
- Automatic speech end identification
- Display `<end>` marker
- Automatic line break segmentation

### 4. Multilingual Translation

#### One-way Translation

Translate all languages to target language:

1. Select "One-way Translation"
2. Choose target language (e.g., "Chinese")
3. Start recording
4. System automatically translates all languages to Chinese

**Use Cases**: International conferences, multilingual customer service

#### Two-way Translation

Bidirectional translation between two languages:

1. Select "Two-way Translation"
2. Choose Language A (e.g., "English")
3. Choose Language B (e.g., "Chinese")
4. Start recording
5. English automatically translates to Chinese, Chinese to English

**Use Cases**: Bilingual dialogue, real-time interpretation

#### Color Coding

Different languages displayed in different colors:
- 🔵 Chinese (zh)
- 🟢 English (en)
- 🔴 Spanish (es)
- 🟣 French (fr)
- 🟠 German (de)
- 🩷 Japanese (ja)
- 🔷 Korean (ko)
- 🟡 Arabic (ar)
- 🔺 Russian (ru)
- 🔹 Portuguese (pt)

---

## 📚 API Documentation

### File Transcription API

**Endpoint**: `POST /transcribe`

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | ✅ | Audio file |
| api_keys | String | ✅ | Comma-separated API Keys |
| model | String | ❌ | Model name (default: `stt-async-v4`) |
| enable_diarization | Boolean | ❌ | Enable speaker diarization (default false) |

**cURL Example**:

```bash
curl -X POST "http://localhost:8001/transcribe" \
  -F "file=@audio.mp3" \
  -F "api_keys=YOUR_KEY1,YOUR_KEY2" \
  -F "model=stt-async-v4" \
  -F "enable_diarization=false"
```

**Python Example**:

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
    print(f"Transcription: {result['text']}")
    print(f"Processing time: {result['processing_time']['total']}s")
```

**Response Format**:

```json
{
  "success": true,
  "text": "Complete transcription text...",
  "words": [
    {
      "text": "Hello",
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

### WebSocket Real-time Transcription

**Endpoint**: `ws://localhost:8001/ws/transcribe` or `wss://your-domain.com/ws/transcribe`

**Connection Flow**:

1. Establish WebSocket connection
2. Send configuration message (JSON)
3. Send audio data (binary)
4. Receive real-time transcription results (JSON)
5. Send empty frame to end

**Configuration Parameters**:

```json
{
  "api_key": "YOUR_API_KEY",
  "model": "stt-rt-v4",
  "audio_format": "auto",
  "enable_speaker_diarization": false,
  "enable_endpoint_detection": true,
  "enable_language_identification": true,
  "max_endpoint_delay_ms": 1000,
  "language_hints": ["en", "zh"],
  "language_hints_strict": false,
  "client_reference_id": "optional-tracking-id",
  "translation": {
    "type": "one_way",
    "target_language": "zh"
  }
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| api_key | String | — | Soniox API Key (required) |
| model | String | `stt-rt-v4` | Real-time model |
| audio_format | String | `auto` | Audio format |
| enable_endpoint_detection | Boolean | `true` | Detect end of speech |
| max_endpoint_delay_ms | Integer | `1000` | End-of-speech delay (500-3000ms, v4 only) |
| language_hints_strict | Boolean | `false` | Strict language mode (v4 only) |
| client_reference_id | String | — | Client tracking ID (v4 only) |

**JavaScript Example**:

```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}/ws/transcribe`);

ws.onopen = async () => {
    // 1. Send configuration
    ws.send(JSON.stringify({
        api_key: 'YOUR_API_KEY',
        model: 'stt-rt-v4',
        audio_format: 'auto',
        enable_speaker_diarization: true
    }));
    
    // 2. Get microphone and send audio
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            event.data.arrayBuffer().then(buffer => {
                ws.send(buffer);
            });
        }
    };
    
    mediaRecorder.start(100); // Send every 100ms
};

ws.onmessage = (event) => {
    const result = JSON.parse(event.data);
    
    // 3. Process transcription results
    if (result.tokens) {
        result.tokens.forEach(token => {
            if (token.is_final) {
                console.log(token.text);
            }
        });
    }
};
```

**Response Format**:

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

## 🚀 Deployment Guide

### Local Development

```bash
# Start backend
python3 server.py

# Start frontend (new terminal)
python3 -m http.server 8000
```

### Production Deployment (Nginx + Systemd)

#### 1. Create Systemd Services

**API Service** (`/etc/systemd/system/soniox-api.service`):

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

**Web Service** (`/etc/systemd/system/soniox-web.service`):

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

#### 2. Configure Nginx

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # WebSocket support
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

    # API support
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

    # Frontend static files
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. Start Services

```bash
# Create logs directory
mkdir -p /root/soniox-asr-web/logs

# Start services
systemctl daemon-reload
systemctl enable soniox-api.service soniox-web.service
systemctl start soniox-asr-web.service soniox-web.service

# Check status
systemctl status soniox-api.service soniox-web.service

# Reload Nginx
nginx -t
systemctl reload nginx
```

---

## 🛠️ Technology Stack

### Frontend

- HTML5 + CSS3 + Vanilla JavaScript
- Web Audio API (audio processing)
- MediaRecorder API (microphone recording)
- WebSocket API (real-time communication)
- Fetch API (file upload)
- localStorage (data persistence)

### Backend

- FastAPI (web framework)
- Uvicorn (ASGI server)
- HTTPX (async HTTP client)
- WebSockets (real-time communication)
- python-multipart (file upload)

### Supported Audio Formats

mp3, wav, m4a, flac, ogg, aac, webm, mp4, aiff, amr, asf, wma, opus

### Supported Languages (60+)

Chinese, English, Japanese, Korean, French, German, Spanish, Portuguese, Russian, Arabic, Italian, Dutch, Polish, Turkish, Swedish, Danish, Norwegian, Finnish, Greek, Czech, Hungarian, Romanian, Thai, Vietnamese, Indonesian, Malay, Filipino, Hindi, Bengali, Urdu, Persian, Hebrew, etc.

---

## ⚠️ Limitations

| Item | Value | Description |
|------|-------|-------------|
| Single File Duration | 5 hours | Auto-split if exceeded |
| Batch Upload | 100 files | Configurable concurrency |
| WebSocket Timeout | 24 hours | Nginx configuration |
| Speaker Diarization | 15 people | Soniox API limit |

---

## 🔒 Security Recommendations

### Development Environment
- ✅ Use localhost for testing
- ✅ API Keys saved in localStorage
- ✅ Don't commit API Keys to code repository

### Production Environment
- ⚠️ Use HTTPS/WSS
- ⚠️ Configure Nginx reverse proxy
- ⚠️ Use environment variables for API Keys
- ⚠️ Regularly rotate API Keys
- ⚠️ Set request rate limits
- ⚠️ Enable basic authentication (optional)

---

## 🐛 Troubleshooting

### WebSocket Connection Failed

**Issue**: `WebSocket connection failed`

**Solutions**:
1. Check if Nginx has WebSocket support configured
2. Confirm using `wss://` (HTTPS) or `ws://` (HTTP)
3. Check if firewall has opened ports
4. View browser console error messages

### Transcription Failed

**Issue**: `All API Keys have failed`

**Solutions**:
1. Verify API Key is correct
2. Check if API Key has expired
3. Confirm Soniox account has sufficient balance
4. Try using multiple API Keys

---

## 📦 Dependencies

```txt
fastapi==0.104.1
uvicorn==0.24.0
httpx==0.25.1
python-multipart==0.0.6
```

---

## 🔄 Changelog

### v5.0.0 (2026-02-14)

**🎯 Major Update: All Models Upgraded to v4**

**🔄 Model Migration**
- `stt-async-v3` → `stt-async-v4` (async batch transcription)
- `stt-rt-v3` → `stt-rt-v4` (real-time WebSocket)
- Removed `stt-rt-preview` as default

**✨ New v4 Parameters**
- `max_endpoint_delay_ms` (500-3000ms) - controls end-of-speech detection delay
- `language_hints_strict` - strict language mode
- `client_reference_id` - client tracking support

**🔧 Backend Improvements**
- Timeout architecture refactored: split upload (600s) and poll (30s) HTTP clients
- WebSocket `close_timeout` increased from 10s to 30s
- All v4 parameters forwarded to Soniox API

**🎨 Frontend Cleanup**
- New UI controls for endpoint delay and strict language mode
- Removed ~60 lines of duplicate inline WebSocket code
- Cleaned all debug `console.log`/`trace`/`warn` statements

**🐳 Docker & Deployment**
- Added `curl` to Dockerfile for healthcheck
- Nginx config updated: added `/redoc`, `/health`, `/version`, `/api/` proxy routes
- `/transcribe` route: 7200s timeout + 500M upload limit

**🧪 Testing**
- Added 29-test E2E test suite (system, API, transcription, Soniox direct, timeout, code quality)

### v4.0.0 (2026-01-03)

**🎯 重大更新：完整 API 覆盖 + MCP 支持**

**✨ Context 功能（最强大的新功能）**
- Context 编辑器（General/Text/Terms/Translation Terms 四个部分）
- Context 模板管理（保存/加载/删除）
- REST API 和 WebSocket 都支持 Context

**✨ 前端增强**
- Language Hints 复选框多选（默认中英文）
- Confidence Scores 置信度可视化（低置信度高亮）
- Manual Finalization 立即终结按钮
- 语言标注彩色标签（5色动态分配）
- 说话人颜色区分（10种颜色）
- SRT/VTT 字幕导出功能
- WebSocket 累积显示所有对话历史
- 实时下载转录结果

**🔌 完整 REST API（12个端点）**
- Files API: 列表、详情、下载链接、删除（5个端点）
- Transcriptions API: 列表、详情、删除（3个端点）
- Models API: 列出所有可用模型（1个端点）
- 系统 API: 健康检查、版本信息（3个端点）

**🤖 MCP 服务器**
- 6个 MCP 工具（transcribe, list, delete）
- 支持 Claude Desktop、Cline 等 AI 助手
- 完整配置和使用文档

**🔧 后端改进**
- 使用 loguru 日志系统
- Pydantic 响应模型
- 完善 Swagger/ReDoc 文档
- 健康检查和版本端点

**🐳 Docker 优化**
- All-in-one 单镜像部署
- 移除废弃 version 属性
- nginx 添加 /redoc 代理
- 更新截图

**🐛 Bug 修复**
- 修复 WebSocket Tab 文件上传 disabled bug
- 修复颜色对比度问题（白色背景白色文字）
- 修复 WebSocket 历史消息保留问题

### v3.0.0 (2025-10-31)
- ✨ Added WebSocket real-time speech recognition
- ✨ Added multilingual translation (60+ languages)
- ✨ Added microphone recording support
- ✨ Added language identification and color coding
- ✨ Added endpoint detection
- ✨ Optimized Nginx configuration for WebSocket support
- 🐛 Fixed long audio splitting logic (5 hours)
- 🐛 Fixed concurrency control issues
- 📝 Improved deployment documentation

### v2.1.0 (2025-01-11)
- ✨ Added API Key persistent storage
- 🔒 Removed all default API Keys
- 📝 Improved documentation and usage instructions

### v2.0.0 (2025-01-11)
- ✨ Added RESTful API service
- ✨ Added automatic API Key retry on failure
- ✨ Added detailed duration statistics
- ✨ Added Swagger documentation

### v1.0.0 (2025-01-10)
- ✨ Basic file upload to text functionality
- ✨ Multi-file batch processing
- ✨ Smart audio splitting

---

## 📄 License

MIT License

---

## 🔗 Related Links

- [Soniox Official Website](https://soniox.com)
- [Soniox API Documentation](https://soniox.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [GitHub Repository](https://github.com/neosun100/soniox-asr-web)

---

## 🤝 Contributing

Contributions, issue reports, and suggestions are welcome!

1. Fork this project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📧 Contact

- GitHub Issues: [Submit Issue](https://github.com/neosun100/soniox-asr-web/issues)
- Email: neosun808@gmail.com

---

<div align="center">

### ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=neosun100/soniox-asr-web&type=Date)](https://star-history.com/#neosun100/soniox-asr-web&Date)

</div>

---

<div align="center">

## 🌟 Give Us a Star! 🌟

**If this project helps you, please give it a ⭐ Star on GitHub!**

Your support is the greatest motivation for us to keep improving! 🚀

[![GitHub stars](https://img.shields.io/github/stars/neosun100/soniox-asr-web?style=social)](https://github.com/neosun100/soniox-asr-web/stargazers)

[⭐ Star this repo](https://github.com/neosun100/soniox-asr-web) | [🐛 Report Bug](https://github.com/neosun100/soniox-asr-web/issues) | [✨ Request Feature](https://github.com/neosun100/soniox-asr-web/issues)

---

Made with ❤️ by [Neo Sun](https://github.com/neosun100)

</div>
