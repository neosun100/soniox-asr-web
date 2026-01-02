# Soniox ASR MCP Server

## 简介

Soniox ASR MCP Server 是一个 Model Context Protocol (MCP) 服务器，让 AI 助手（如 Claude Desktop、Cline）能够直接调用 Soniox 语音识别功能。

## 功能

MCP 服务器提供以下工具：

| 工具 | 说明 |
|------|------|
| `transcribe_file` | 转录音频/视频文件 |
| `list_files` | 列出已上传文件 |
| `list_transcriptions` | 列出转录任务 |
| `list_models` | 列出可用模型 |
| `delete_file` | 删除文件 |
| `delete_transcription` | 删除转录 |

## 配置

### 1. Claude Desktop

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "soniox-asr": {
      "command": "python3",
      "args": ["/path/to/soniox-asr-web/mcp_server.py"],
      "env": {
        "SONIOX_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 2. Cline (VS Code)

在 VS Code 设置中添加 MCP 服务器配置。

## 使用示例

### 转录文件

```
User: 帮我转录这个音频文件 /path/to/audio.mp3
AI: 使用 transcribe_file 工具...
```

### 列出文件

```
User: 我上传了哪些文件？
AI: 使用 list_files 工具...
```

### 列出模型

```
User: Soniox 有哪些可用模型？
AI: 使用 list_models 工具...
```

## 测试

### 命令行测试

```bash
# 1. 初始化测试
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | python3 mcp_server.py

# 2. 列出工具
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | python3 mcp_server.py

# 3. 测试转录（需要先启动本地 API 服务）
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_models","arguments":{"api_key":"YOUR_API_KEY"}}}' | python3 mcp_server.py
```

### Claude Desktop 测试

配置完成后，在 Claude Desktop 中：

```
User: 帮我列出 Soniox 的所有可用模型
Claude: [调用 list_models 工具]
返回: stt-rt-v3, stt-async-v3, ...

User: 帮我转录这个文件 /path/to/audio.mp3
Claude: [调用 transcribe_file 工具]
返回: 转录文本...
```

### Python 客户端示例

```python
import json
import subprocess

def call_mcp_tool(tool_name, arguments):
    """调用 MCP 工具"""
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    
    result = subprocess.run(
        ["python3", "mcp_server.py"],
        input=json.dumps(request),
        capture_output=True,
        text=True
    )
    
    return json.loads(result.stdout)

# 示例：列出模型
response = call_mcp_tool("list_models", {
    "api_key": "YOUR_API_KEY"
})
print(response)

# 示例：转录文件
response = call_mcp_tool("transcribe_file", {
    "file_path": "/path/to/audio.mp3",
    "api_key": "YOUR_API_KEY",
    "enable_diarization": True
})
print(response)
```

## 依赖

- Python 3.7+
- httpx
- 本地运行的 Soniox ASR API 服务（http://localhost:8001）

## 注意事项

- MCP 服务器需要本地 API 服务运行
- API Key 可以通过环境变量或参数传递
- 支持所有 Soniox API 功能
