from fastapi import FastAPI, File, UploadFile, HTTPException, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import asyncio
import time
import random
from typing import List, Optional
import io
import json
import websockets

app = FastAPI(title="Soniox ASR API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_DURATION = 300 * 60  # 300 minutes (5 hours) in seconds

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    api_keys: str = Form(..., description="逗号分隔的 API Keys"),
    enable_diarization: bool = Form(False, description="是否启用人声分离")
):
    """
    上传音频文件进行转录（使用官方 API 流程）
    """
    try:
        print(f"\n[转录请求] 文件: {file.filename}, 人声分离: {enable_diarization}")
        
        # 解析 API Keys
        keys_list = [k.strip() for k in api_keys.split(",") if k.strip()]
        if not keys_list:
            raise HTTPException(status_code=400, detail="请提供至少一个 API Key")
        
        # 随机选择一个 Key
        import random
        api_key = random.choice(keys_list)
        print(f"[转录请求] 使用 Key: {api_key[:10]}... (共 {len(keys_list)} 个)")
        
        # 读取文件
        audio_data = await file.read()
        print(f"[转录请求] 文件大小: {len(audio_data)} 字节")
        
        headers = {"Authorization": f"Bearer {api_key}"}
        
        # Step 1: 上传文件
        print("[步骤 1/4] 上传文件...")
        async with httpx.AsyncClient(timeout=300.0) as client:
            files = {"file": (file.filename, audio_data, "audio/wav")}
            upload_resp = await client.post(
                "https://api.soniox.com/v1/files",
                files=files,
                headers=headers
            )
            
            if upload_resp.status_code != 201:
                print(f"[错误] 上传失败: {upload_resp.status_code} - {upload_resp.text}")
                raise HTTPException(status_code=upload_resp.status_code, detail=f"上传失败: {upload_resp.text}")
            
            file_id = upload_resp.json()["id"]
            print(f"[步骤 1/4] 文件 ID: {file_id}")
            
            # Step 2: 创建转录任务
            print("[步骤 2/4] 创建转录任务...")
            config = {
                "file_id": file_id,
                "model": "stt-async-v3",
                "enable_speaker_diarization": enable_diarization,
                "enable_language_identification": True
            }
            
            transcribe_resp = await client.post(
                "https://api.soniox.com/v1/transcriptions",
                json=config,
                headers=headers
            )
            
            if transcribe_resp.status_code != 201:
                print(f"[错误] 创建转录失败: {transcribe_resp.status_code} - {transcribe_resp.text}")
                raise HTTPException(status_code=transcribe_resp.status_code, detail=f"创建转录失败: {transcribe_resp.text}")
            
            transcription_id = transcribe_resp.json()["id"]
            print(f"[步骤 2/4] 转录 ID: {transcription_id}")
            
            # Step 3: 轮询直到完成（无限等待，每秒检查一次）
            print("[步骤 3/4] 等待转录完成...")
            attempt = 0
            while True:
                await asyncio.sleep(1)  # 每秒检查一次
                attempt += 1
                
                status_resp = await client.get(
                    f"https://api.soniox.com/v1/transcriptions/{transcription_id}",
                    headers=headers
                )
                
                if status_resp.status_code != 200:
                    print(f"[错误] 获取状态失败: {status_resp.status_code}")
                    raise HTTPException(status_code=status_resp.status_code, detail="获取状态失败")
                
                data = status_resp.json()
                status = data["status"]
                
                # 每 10 次打印一次进度
                if attempt % 10 == 0:
                    print(f"[步骤 3/4] 检查 {attempt} 次: {status} (已等待 {attempt}秒)")
                
                if status == "completed":
                    print(f"[步骤 3/4] 转录完成！(共等待 {attempt}秒)")
                    break
                elif status == "error":
                    error_msg = data.get("error_message", "未知错误")
                    print(f"[错误] 转录失败: {error_msg}")
                    raise HTTPException(status_code=500, detail=f"转录失败: {error_msg}")
                # 继续等待 queued 或 processing 状态
            
            # Step 4: 获取转录结果
            print("[步骤 4/4] 获取转录文本...")
            text_resp = await client.get(
                f"https://api.soniox.com/v1/transcriptions/{transcription_id}/transcript",
                headers=headers
            )
            
            if text_resp.status_code != 200:
                print(f"[错误] 获取文本失败: {text_resp.status_code}")
                raise HTTPException(status_code=text_resp.status_code, detail="获取文本失败")
            
            text_data = text_resp.json()
            
            # 解析 tokens
            text = ""
            words = []
            current_speaker = None
            
            for token in text_data.get("tokens", []):
                # 处理说话人变化
                if enable_diarization and "speaker" in token:
                    if token["speaker"] != current_speaker:
                        current_speaker = token["speaker"]
                        text += f"\n\n说话人 {current_speaker}: "
                
                # 添加文本
                text += token.get("text", "")
                
                # 收集词级时间戳
                if "start_ms" in token and "end_ms" in token:
                    words.append({
                        "text": token.get("text", ""),
                        "start_time": token["start_ms"] / 1000.0,
                        "end_time": token["end_ms"] / 1000.0
                    })
            
            print(f"[完成] 转录文本长度: {len(text)} 字符")
            
            # 清理：删除转录和文件
            try:
                await client.delete(f"https://api.soniox.com/v1/transcriptions/{transcription_id}", headers=headers)
                await client.delete(f"https://api.soniox.com/v1/files/{file_id}", headers=headers)
                print("[清理] 已删除转录和文件")
            except:
                pass
            
            return {
                "success": True,
                "text": text.strip(),
                "words": words,
                "audio_duration": data.get("audio_duration_ms", 0) / 1000.0,
                "total_chunks": 1,
                "processing_time": {
                    "total": attempt,
                    "chunks": [{"chunk": 1, "duration": attempt}]
                }
            }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[异常] {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Soniox ASR API 服务运行中", "docs": "/docs"}

@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """
    WebSocket 实时转录端点
    
    客户端需要先发送配置消息，然后发送音频数据
    """
    await websocket.accept()
    print("[WebSocket] 客户端已连接")
    
    soniox_ws = None
    
    try:
        # 接收配置消息
        print("[WebSocket] 等待配置消息...")
        config_data = await websocket.receive_text()
        config = json.loads(config_data)
        print(f"[WebSocket] 收到配置: {config.get('model', 'unknown')}")
        
        api_key = config.get("api_key")
        if not api_key:
            print("[WebSocket] 错误: 缺少 api_key")
            await websocket.send_json({"error": "缺少 api_key"})
            await websocket.close()
            return
        
        # 构建 Soniox WebSocket 配置
        soniox_config = {
            "api_key": api_key,
            "model": config.get("model", "stt-rt-preview"),
            "audio_format": config.get("audio_format", "auto"),
            "enable_speaker_diarization": config.get("enable_speaker_diarization", False),
            "enable_language_identification": config.get("enable_language_identification", False),
            "enable_endpoint_detection": config.get("enable_endpoint_detection", False)
        }
        
        # 添加可选参数
        if "language_hints" in config:
            soniox_config["language_hints"] = config["language_hints"]
        if "translation" in config:
            soniox_config["translation"] = config["translation"]
        if "context" in config:
            soniox_config["context"] = config["context"]
        if "sample_rate" in config:
            soniox_config["sample_rate"] = config["sample_rate"]
        if "num_channels" in config:
            soniox_config["num_channels"] = config["num_channels"]
        
        # 连接到 Soniox WebSocket（禁用 ping 超时）
        print("[WebSocket] 连接到 Soniox...")
        soniox_ws = await websockets.connect(
            "wss://stt-rt.soniox.com/transcribe-websocket",
            ping_interval=None,  # 禁用自动 ping
            close_timeout=10
        )
        print("[WebSocket] Soniox 连接成功")
        
        # 发送配置
        await soniox_ws.send(json.dumps(soniox_config))
        print("[WebSocket] 配置已发送到 Soniox")
        
        # 创建两个任务：接收客户端音频 + 接收 Soniox 响应
        async def forward_audio():
            """转发客户端音频到 Soniox"""
            try:
                chunk_count = 0
                while True:
                    data = await websocket.receive_bytes()
                    if len(data) == 0:
                        # 空帧表示结束
                        print("[WebSocket] 收到结束信号")
                        await soniox_ws.send(b"")
                        break
                    chunk_count += 1
                    if chunk_count % 100 == 0:
                        print(f"[WebSocket] 已转发 {chunk_count} 个音频块")
                    await soniox_ws.send(data)
            except WebSocketDisconnect:
                print("[WebSocket] 客户端断开连接")
                await soniox_ws.send(b"")
            except Exception as e:
                print(f"[WebSocket] forward_audio 错误: {e}")
                import traceback
                traceback.print_exc()
        
        async def forward_responses():
            """转发 Soniox 响应到客户端"""
            try:
                response_count = 0
                async for message in soniox_ws:
                    response_count += 1
                    if response_count % 10 == 0:
                        print(f"[WebSocket] 已转发 {response_count} 个响应")
                    await websocket.send_text(message)
                    
                    # 检查是否是结束消息
                    response = json.loads(message)
                    if response.get("finished"):
                        print("[WebSocket] 转录完成")
                        break
            except Exception as e:
                print(f"[WebSocket] forward_responses 错误: {e}")
                import traceback
                traceback.print_exc()
                await websocket.send_json({"error": str(e)})
        
        # 并行运行两个任务
        print("[WebSocket] 开始转发数据...")
        await asyncio.gather(forward_audio(), forward_responses())
        print("[WebSocket] 数据转发完成")
        
    except WebSocketDisconnect:
        print("[WebSocket] 客户端断开")
    except Exception as e:
        print(f"[WebSocket] 主处理错误: {e}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.send_json({"error": str(e)})
        except:
            pass
    finally:
        if soniox_ws:
            await soniox_ws.close()
        try:
            await websocket.close()
        except:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
