from fastapi import FastAPI, File, UploadFile, HTTPException, Form, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import httpx
import asyncio
import json
import websockets
from loguru import logger
import sys

# 配置 loguru
logger.remove()
logger.add(sys.stdout, format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}", level="DEBUG")

# 版本信息
API_VERSION = "4.0.0"
BUILD_DATE = "2026-01-03"

# Soniox API 基础 URL
SONIOX_API_BASE = "https://api.soniox.com/v1"

# Pydantic 响应模型
class HealthResponse(BaseModel):
    status: str
    message: str

class VersionResponse(BaseModel):
    version: str
    build_date: str
    api_title: str

class FileInfo(BaseModel):
    id: str
    filename: str
    size: int
    created_at: str

class FilesListResponse(BaseModel):
    files: List[FileInfo]
    next_page_cursor: Optional[str] = None

class FileUrlResponse(BaseModel):
    url: str
    expires_at: Optional[str] = None
    
    class Config:
        extra = "allow"

class TranscriptionInfo(BaseModel):
    id: str
    status: str
    file_id: str
    model: str
    created_at: str
    audio_duration_ms: Optional[int] = None

class TranscriptionsListResponse(BaseModel):
    transcriptions: List[TranscriptionInfo]
    next_page_cursor: Optional[str] = None

class ModelInfo(BaseModel):
    name: str
    type: Optional[str] = None
    description: Optional[str] = None
    
    class Config:
        extra = "allow"  # 允许额外字段

class ModelsListResponse(BaseModel):
    models: List[dict]  # 使用 dict 避免严格验证

class WordTimestamp(BaseModel):
    text: str
    start_time: float
    end_time: float

class ChunkDuration(BaseModel):
    chunk: int
    duration: float

class ProcessingTime(BaseModel):
    total: float
    chunks: List[ChunkDuration]

class TranscribeResponse(BaseModel):
    success: bool
    text: str
    words: List[WordTimestamp]
    audio_duration: float
    total_chunks: int
    processing_time: ProcessingTime

class RootResponse(BaseModel):
    message: str
    docs: str
    redoc: str

app = FastAPI(
    title="Soniox ASR API",
    version=API_VERSION,
    description="""
## Soniox 语音识别 API

基于 Soniox 的语音转文字服务，支持：

- **文件转录**：上传音频/视频文件，返回转录文本
- **实时转录**：WebSocket 实时语音识别
- **说话人分离**：自动识别不同说话人
- **多语言支持**：60+ 种语言

### 使用说明

1. 获取 [Soniox API Key](https://soniox.com)
2. 调用 `/transcribe` 接口上传文件
3. 或使用 WebSocket `/ws/transcribe` 进行实时转录
    """,
    contact={"name": "Neo Sun", "email": "neosun808@gmail.com"},
    license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"},
    redoc_url="/redoc",
    docs_url="/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["系统"], summary="服务状态", response_model=RootResponse)
async def root():
    """检查 API 服务是否正常运行"""
    return {"message": "Soniox ASR API 服务运行中", "docs": "/docs", "redoc": "/redoc"}

@app.get("/health", tags=["系统"], summary="健康检查", response_model=HealthResponse)
async def health_check():
    """用于 Docker/K8s 健康检查"""
    return {"status": "healthy", "message": "服务正常运行"}

@app.get("/version", tags=["系统"], summary="版本信息", response_model=VersionResponse)
async def version_info():
    """返回 API 版本信息"""
    return {"version": API_VERSION, "build_date": BUILD_DATE, "api_title": "Soniox ASR API"}

@app.post("/transcribe", tags=["转录"], summary="文件转录", response_model=TranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(..., description="音频/视频文件（支持 mp3, wav, m4a, mp4 等）"),
    api_keys: str = Form(..., description="Soniox API Keys，多个用逗号分隔"),
    enable_diarization: bool = Form(False, description="是否启用说话人分离（最多15人）")
):
    """
    上传音频/视频文件进行语音转文字
    
    - **file**: 音频或视频文件
    - **api_keys**: Soniox API Key，支持多个（负载均衡）
    - **enable_diarization**: 启用后自动识别不同说话人
    """
    try:
        logger.info(f"转录请求 | 文件: {file.filename} | 人声分离: {enable_diarization}")
        
        keys_list = [k.strip() for k in api_keys.split(",") if k.strip()]
        if not keys_list:
            raise HTTPException(status_code=400, detail="请提供至少一个 API Key")
        
        import random
        api_key = random.choice(keys_list)
        logger.debug(f"使用 Key: {api_key[:10]}... (共 {len(keys_list)} 个)")
        
        audio_data = await file.read()
        logger.debug(f"文件大小: {len(audio_data)} 字节")
        
        headers = {"Authorization": f"Bearer {api_key}"}
        
        logger.info("步骤 1/4: 上传文件...")
        async with httpx.AsyncClient(timeout=300.0) as client:
            files = {"file": (file.filename, audio_data, "audio/wav")}
            upload_resp = await client.post("https://api.soniox.com/v1/files", files=files, headers=headers)
            
            if upload_resp.status_code != 201:
                logger.error(f"上传失败: {upload_resp.status_code} - {upload_resp.text}")
                raise HTTPException(status_code=upload_resp.status_code, detail=f"上传失败: {upload_resp.text}")
            
            file_id = upload_resp.json()["id"]
            logger.info(f"步骤 1/4: 文件 ID: {file_id}")
            
            logger.info("步骤 2/4: 创建转录任务...")
            config = {
                "file_id": file_id,
                "model": "stt-async-v3",
                "enable_speaker_diarization": enable_diarization,
                "enable_language_identification": True
            }
            
            transcribe_resp = await client.post("https://api.soniox.com/v1/transcriptions", json=config, headers=headers)
            
            if transcribe_resp.status_code != 201:
                logger.error(f"创建转录失败: {transcribe_resp.status_code} - {transcribe_resp.text}")
                raise HTTPException(status_code=transcribe_resp.status_code, detail=f"创建转录失败: {transcribe_resp.text}")
            
            transcription_id = transcribe_resp.json()["id"]
            logger.info(f"步骤 2/4: 转录 ID: {transcription_id}")
            
            logger.info("步骤 3/4: 等待转录完成...")
            attempt = 0
            while True:
                await asyncio.sleep(1)
                attempt += 1
                
                status_resp = await client.get(f"https://api.soniox.com/v1/transcriptions/{transcription_id}", headers=headers)
                
                if status_resp.status_code != 200:
                    logger.error(f"获取状态失败: {status_resp.status_code}")
                    raise HTTPException(status_code=status_resp.status_code, detail="获取状态失败")
                
                data = status_resp.json()
                status = data["status"]
                
                if attempt % 10 == 0:
                    logger.debug(f"检查 {attempt} 次: {status} (已等待 {attempt}秒)")
                
                if status == "completed":
                    logger.success(f"步骤 3/4: 转录完成！(共等待 {attempt}秒)")
                    break
                elif status == "error":
                    error_msg = data.get("error_message", "未知错误")
                    logger.error(f"转录失败: {error_msg}")
                    raise HTTPException(status_code=500, detail=f"转录失败: {error_msg}")
            
            logger.info("步骤 4/4: 获取转录文本...")
            text_resp = await client.get(f"https://api.soniox.com/v1/transcriptions/{transcription_id}/transcript", headers=headers)
            
            if text_resp.status_code != 200:
                logger.error(f"获取文本失败: {text_resp.status_code}")
                raise HTTPException(status_code=text_resp.status_code, detail="获取文本失败")
            
            text_data = text_resp.json()
            
            text = ""
            words = []
            current_speaker = None
            
            for token in text_data.get("tokens", []):
                if enable_diarization and "speaker" in token:
                    if token["speaker"] != current_speaker:
                        current_speaker = token["speaker"]
                        text += f"\n\n说话人 {current_speaker}: "
                
                text += token.get("text", "")
                
                if "start_ms" in token and "end_ms" in token:
                    words.append({
                        "text": token.get("text", ""),
                        "start_time": token["start_ms"] / 1000.0,
                        "end_time": token["end_ms"] / 1000.0
                    })
            
            logger.success(f"完成 | 转录文本长度: {len(text)} 字符")
            
            try:
                await client.delete(f"https://api.soniox.com/v1/transcriptions/{transcription_id}", headers=headers)
                await client.delete(f"https://api.soniox.com/v1/files/{file_id}", headers=headers)
                logger.debug("已清理转录和文件")
            except:
                pass
            
            return {
                "success": True,
                "text": text.strip(),
                "words": words,
                "audio_duration": data.get("audio_duration_ms", 0) / 1000.0,
                "total_chunks": 1,
                "processing_time": {"total": attempt, "chunks": [{"chunk": 1, "duration": attempt}]}
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"异常: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """WebSocket 实时转录端点"""
    await websocket.accept()
    logger.info("WebSocket 客户端已连接")
    
    soniox_ws = None
    
    try:
        logger.debug("等待配置消息...")
        config_data = await websocket.receive_text()
        config = json.loads(config_data)
        logger.info(f"收到配置: model={config.get('model', 'unknown')}")
        
        api_key = config.get("api_key")
        if not api_key:
            logger.warning("缺少 api_key")
            await websocket.send_json({"error": "缺少 api_key"})
            await websocket.close()
            return
        
        soniox_config = {
            "api_key": api_key,
            "model": config.get("model", "stt-rt-preview"),
            "audio_format": config.get("audio_format", "auto"),
            "enable_speaker_diarization": config.get("enable_speaker_diarization", False),
            "enable_language_identification": config.get("enable_language_identification", False),
            "enable_endpoint_detection": config.get("enable_endpoint_detection", False)
        }
        
        for key in ["language_hints", "translation", "context", "sample_rate", "num_channels"]:
            if key in config:
                soniox_config[key] = config[key]
        
        logger.info("连接到 Soniox...")
        soniox_ws = await websockets.connect(
            "wss://stt-rt.soniox.com/transcribe-websocket",
            ping_interval=None,
            close_timeout=10
        )
        logger.success("Soniox 连接成功")
        
        await soniox_ws.send(json.dumps(soniox_config))
        logger.debug("配置已发送到 Soniox")
        
        async def forward_audio():
            try:
                chunk_count = 0
                while True:
                    data = await websocket.receive_bytes()
                    if len(data) == 0:
                        logger.info("收到结束信号")
                        await soniox_ws.send(b"")
                        break
                    chunk_count += 1
                    if chunk_count % 100 == 0:
                        logger.debug(f"已转发 {chunk_count} 个音频块")
                    await soniox_ws.send(data)
            except WebSocketDisconnect:
                logger.info("客户端断开连接")
                await soniox_ws.send(b"")
            except Exception as e:
                logger.error(f"forward_audio 错误: {e}")
        
        async def forward_responses():
            try:
                response_count = 0
                async for message in soniox_ws:
                    response_count += 1
                    if response_count <= 3:
                        logger.debug(f"响应 {response_count}: {message[:200]}...")
                    elif response_count % 10 == 0:
                        logger.debug(f"已转发 {response_count} 个响应")
                    await websocket.send_text(message)
                    
                    response = json.loads(message)
                    if response.get("finished"):
                        logger.success("转录完成")
                        break
            except Exception as e:
                logger.error(f"forward_responses 错误: {e}")
                await websocket.send_json({"error": str(e)})
        
        logger.info("开始转发数据...")
        await asyncio.gather(forward_audio(), forward_responses())
        logger.info("数据转发完成")
        
    except WebSocketDisconnect:
        logger.info("客户端断开")
    except Exception as e:
        logger.exception(f"主处理错误: {e}")
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

# ==================== Files API ====================

@app.get("/api/files", tags=["Files API"], summary="列出文件", response_model=FilesListResponse)
async def list_files(
    api_key: str = Query(..., description="Soniox API Key"),
    limit: int = Query(100, ge=1, le=1000, description="返回文件数量"),
    cursor: Optional[str] = Query(None, description="分页游标")
):
    """列出所有已上传的文件"""
    try:
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{SONIOX_API_BASE}/files",
                headers={"Authorization": f"Bearer {api_key}"},
                params=params
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return response.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"列出文件失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/{file_id}", tags=["Files API"], summary="文件详情", response_model=FileInfo)
async def get_file(
    file_id: str,
    api_key: str = Query(..., description="Soniox API Key")
):
    """获取文件详细信息"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{SONIOX_API_BASE}/files/{file_id}",
                headers={"Authorization": f"Bearer {api_key}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return response.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"获取文件详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/{file_id}/url", tags=["Files API"], summary="文件下载链接", response_model=FileUrlResponse)
async def get_file_url(
    file_id: str,
    api_key: str = Query(..., description="Soniox API Key")
):
    """获取文件下载链接"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{SONIOX_API_BASE}/files/{file_id}/url",
                headers={"Authorization": f"Bearer {api_key}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return response.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"获取文件链接失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/files/{file_id}", tags=["Files API"], summary="删除文件")
async def delete_file(
    file_id: str,
    api_key: str = Query(..., description="Soniox API Key")
):
    """删除已上传的文件"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.delete(
                f"{SONIOX_API_BASE}/files/{file_id}",
                headers={"Authorization": f"Bearer {api_key}"}
            )
            
            if response.status_code != 204:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return {"success": True, "message": "文件已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"删除文件失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Transcriptions API ====================

@app.get("/api/transcriptions", tags=["Transcriptions API"], summary="列出转录", response_model=TranscriptionsListResponse)
async def list_transcriptions(
    api_key: str = Query(..., description="Soniox API Key"),
    limit: int = Query(100, ge=1, le=1000, description="返回转录数量"),
    cursor: Optional[str] = Query(None, description="分页游标")
):
    """列出所有转录任务"""
    try:
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{SONIOX_API_BASE}/transcriptions",
                headers={"Authorization": f"Bearer {api_key}"},
                params=params
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return response.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"列出转录失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/transcriptions/{transcription_id}", tags=["Transcriptions API"], summary="转录详情", response_model=TranscriptionInfo)
async def get_transcription(
    transcription_id: str,
    api_key: str = Query(..., description="Soniox API Key")
):
    """获取转录任务详情"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{SONIOX_API_BASE}/transcriptions/{transcription_id}",
                headers={"Authorization": f"Bearer {api_key}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return response.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"获取转录详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/transcriptions/{transcription_id}", tags=["Transcriptions API"], summary="删除转录")
async def delete_transcription(
    transcription_id: str,
    api_key: str = Query(..., description="Soniox API Key")
):
    """删除转录任务"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.delete(
                f"{SONIOX_API_BASE}/transcriptions/{transcription_id}",
                headers={"Authorization": f"Bearer {api_key}"}
            )
            
            if response.status_code != 204:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return {"success": True, "message": "转录已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"删除转录失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Models API ====================

@app.get("/api/models", tags=["Models API"], summary="列出模型", response_model=ModelsListResponse)
async def list_models(
    api_key: str = Query(..., description="Soniox API Key")
):
    """列出所有可用模型"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{SONIOX_API_BASE}/models",
                headers={"Authorization": f"Bearer {api_key}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return response.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"列出模型失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info(f"启动 Soniox ASR API v{API_VERSION}")
    uvicorn.run(app, host="0.0.0.0", port=8001)
