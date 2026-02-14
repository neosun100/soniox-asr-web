#!/usr/bin/env python3
"""
Soniox ASR MCP Server
提供语音识别功能的 MCP 工具
"""

import asyncio
import json
import sys
from typing import Any, Optional
import httpx

# MCP 协议消息
def send_message(msg: dict):
    """发送 MCP 消息到 stdout"""
    print(json.dumps(msg), flush=True)

def log(message: str):
    """发送日志到 stderr"""
    print(f"[MCP] {message}", file=sys.stderr, flush=True)

# 工具定义
TOOLS = [
    {
        "name": "transcribe_file",
        "description": "转录音频/视频文件为文字",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "音频/视频文件路径"},
                "api_key": {"type": "string", "description": "Soniox API Key"},
                "enable_diarization": {"type": "boolean", "description": "是否启用说话人分离", "default": False},
                "language_hints": {"type": "array", "items": {"type": "string"}, "description": "语言提示列表"}
            },
            "required": ["file_path", "api_key"]
        }
    },
    {
        "name": "list_files",
        "description": "列出已上传的文件",
        "inputSchema": {
            "type": "object",
            "properties": {
                "api_key": {"type": "string", "description": "Soniox API Key"},
                "limit": {"type": "integer", "description": "返回数量", "default": 10}
            },
            "required": ["api_key"]
        }
    },
    {
        "name": "list_transcriptions",
        "description": "列出转录任务",
        "inputSchema": {
            "type": "object",
            "properties": {
                "api_key": {"type": "string", "description": "Soniox API Key"},
                "limit": {"type": "integer", "description": "返回数量", "default": 10}
            },
            "required": ["api_key"]
        }
    },
    {
        "name": "list_models",
        "description": "列出可用模型",
        "inputSchema": {
            "type": "object",
            "properties": {
                "api_key": {"type": "string", "description": "Soniox API Key"}
            },
            "required": ["api_key"]
        }
    },
    {
        "name": "delete_file",
        "description": "删除已上传的文件",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_id": {"type": "string", "description": "文件 ID"},
                "api_key": {"type": "string", "description": "Soniox API Key"}
            },
            "required": ["file_id", "api_key"]
        }
    },
    {
        "name": "delete_transcription",
        "description": "删除转录任务",
        "inputSchema": {
            "type": "object",
            "properties": {
                "transcription_id": {"type": "string", "description": "转录 ID"},
                "api_key": {"type": "string", "description": "Soniox API Key"}
            },
            "required": ["transcription_id", "api_key"]
        }
    }
]

async def handle_request(request: dict) -> dict:
    """处理 MCP 请求"""
    method = request.get("method")
    
    if method == "initialize":
        return {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {
                "name": "soniox-asr-mcp",
                "version": "5.0.0"
            }
        }
    
    elif method == "tools/list":
        return {"tools": TOOLS}
    
    elif method == "tools/call":
        tool_name = request["params"]["name"]
        arguments = request["params"].get("arguments", {})
        
        try:
            result = await call_tool(tool_name, arguments)
            return {"content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False, indent=2)}]}
        except Exception as e:
            log(f"工具调用失败: {e}")
            return {"content": [{"type": "text", "text": f"错误: {str(e)}"}], "isError": True}
    
    return {}

async def call_tool(name: str, args: dict) -> Any:
    """调用具体工具"""
    api_key = args.get("api_key")
    base_url = "http://localhost:8001"
    
    if name == "transcribe_file":
        file_path = args["file_path"]
        async with httpx.AsyncClient(timeout=300.0) as client:
            with open(file_path, "rb") as f:
                files = {"file": f}
                data = {
                    "api_keys": api_key,
                    "enable_diarization": args.get("enable_diarization", False)
                }
                response = await client.post(f"{base_url}/transcribe", files=files, data=data)
                return response.json()
    
    elif name == "list_files":
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/files", params={"api_key": api_key, "limit": args.get("limit", 10)})
            return response.json()
    
    elif name == "list_transcriptions":
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/transcriptions", params={"api_key": api_key, "limit": args.get("limit", 10)})
            return response.json()
    
    elif name == "list_models":
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/models", params={"api_key": api_key})
            return response.json()
    
    elif name == "delete_file":
        async with httpx.AsyncClient() as client:
            response = await client.delete(f"{base_url}/api/files/{args['file_id']}", params={"api_key": api_key})
            return {"success": True, "message": "文件已删除"}
    
    elif name == "delete_transcription":
        async with httpx.AsyncClient() as client:
            response = await client.delete(f"{base_url}/api/transcriptions/{args['transcription_id']}", params={"api_key": api_key})
            return {"success": True, "message": "转录已删除"}
    
    raise ValueError(f"未知工具: {name}")

async def main():
    """MCP 服务器主循环"""
    log("Soniox ASR MCP Server 启动")
    
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            request = json.loads(line)
            log(f"收到请求: {request.get('method')}")
            
            response = await handle_request(request)
            
            send_message({
                "jsonrpc": "2.0",
                "id": request.get("id"),
                "result": response
            })
            
        except json.JSONDecodeError:
            log("JSON 解析错误")
        except Exception as e:
            log(f"处理错误: {e}")
            send_message({
                "jsonrpc": "2.0",
                "id": request.get("id") if 'request' in locals() else None,
                "error": {"code": -32603, "message": str(e)}
            })

if __name__ == "__main__":
    asyncio.run(main())
