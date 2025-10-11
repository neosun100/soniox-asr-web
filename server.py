from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import asyncio
import time
import random
from typing import List, Optional
import io
from pydub import AudioSegment

app = FastAPI(title="Soniox ASR API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_DURATION = 60 * 60  # 60 minutes in seconds

async def get_audio_duration(audio_data: bytes) -> float:
    """获取音频时长（秒）"""
    try:
        audio = AudioSegment.from_file(io.BytesIO(audio_data))
        return len(audio) / 1000.0
    except:
        return 0

async def split_audio(audio_data: bytes, duration: float) -> List[bytes]:
    """切分音频为多个小于60分钟的片段"""
    audio = AudioSegment.from_file(io.BytesIO(audio_data))
    num_chunks = int(duration / MAX_DURATION) + 1
    chunk_duration = len(audio) / num_chunks
    
    chunks = []
    for i in range(num_chunks):
        start = int(i * chunk_duration)
        end = int((i + 1) * chunk_duration)
        chunk = audio[start:end]
        
        buffer = io.BytesIO()
        chunk.export(buffer, format="wav")
        chunks.append(buffer.getvalue())
    
    return chunks

async def transcribe_with_retry(audio_data: bytes, api_keys: List[str], enable_diarization: bool, max_retries: int = 3) -> dict:
    """使用重试机制转录音频"""
    available_keys = api_keys.copy()
    random.shuffle(available_keys)
    
    for attempt in range(max_retries):
        if not available_keys:
            raise HTTPException(status_code=500, detail="所有 API Key 都已失效")
        
        api_key = available_keys.pop(0)
        
        try:
            start_time = time.time()
            
            # Step 1: Upload file
            async with httpx.AsyncClient(timeout=300.0) as client:
                files = {"file": ("audio.wav", audio_data, "audio/wav")}
                headers = {"Authorization": f"Bearer {api_key}"}
                
                print(f"[尝试 {attempt + 1}] 上传文件...")
                upload_resp = await client.post(
                    "https://api.soniox.com/v1/files",
                    files=files,
                    headers=headers
                )
                
                print(f"[尝试 {attempt + 1}] 上传响应: {upload_resp.status_code}")
                if upload_resp.status_code != 200:
                    print(f"[尝试 {attempt + 1}] 上传失败: {upload_resp.text}")
                    continue
                
                file_id = upload_resp.json()["id"]
                
                # Step 2: Create transcription
                transcribe_data = {
                    "file_id": file_id,
                    "model": "stt-async-preview",
                    "enable_speaker_diarization": enable_diarization
                }
                
                transcribe_resp = await client.post(
                    "https://api.soniox.com/v1/transcriptions",
                    json=transcribe_data,
                    headers=headers
                )
                
                if transcribe_resp.status_code != 200:
                    continue
                
                transcription_id = transcribe_resp.json()["id"]
                
                # Step 3: Poll for result
                while True:
                    status_resp = await client.get(
                        f"https://api.soniox.com/v1/transcriptions/{transcription_id}",
                        headers=headers
                    )
                    
                    if status_resp.status_code != 200:
                        break
                    
                    result = status_resp.json()
                    
                    if result["status"] == "completed":
                        # Get transcript text
                        text_resp = await client.get(
                            f"https://api.soniox.com/v1/transcriptions/{transcription_id}/transcript",
                            headers=headers
                        )
                        
                        if text_resp.status_code != 200:
                            break
                        
                        text_data = text_resp.json()
                        
                        # Parse text from tokens
                        text = ""
                        if "tokens" in text_data and isinstance(text_data["tokens"], list):
                            current_speaker = None
                            for token in text_data["tokens"]:
                                if "speaker" in token and token["speaker"] != current_speaker:
                                    current_speaker = token["speaker"]
                                    text += f"\n说话人 {token['speaker']}: "
                                text += token.get("text", "")
                        elif isinstance(text_data, str):
                            text = text_data
                        elif "text" in text_data:
                            text = text_data["text"]
                        
                        duration = time.time() - start_time
                        return {
                            "success": True,
                            "text": text.strip(),
                            "words": text_data.get("words", []),
                            "duration": duration,
                            "api_key_used": api_key[:10] + "..."
                        }
                    elif result["status"] == "failed":
                        break
                    
                    await asyncio.sleep(1)
        
        except Exception as e:
            print(f"[尝试 {attempt + 1}] 异常: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            continue
    
    raise HTTPException(status_code=500, detail=f"转录失败，已重试 {max_retries} 次")

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    api_keys: str = Form(..., description="逗号分隔的 API Keys"),
    enable_diarization: bool = Form(False, description="是否启用人声分离")
):
    """
    上传音频文件进行转录
    
    - **file**: 音频文件（支持 mp3, wav, m4a, flac, ogg 等）
    - **api_keys**: 逗号分隔的 Soniox API Keys
    - **enable_diarization**: 是否启用人声分离
    """
    try:
        total_start_time = time.time()
        
        # 读取文件
        audio_data = await file.read()
        keys_list = [k.strip() for k in api_keys.split(",") if k.strip()]
        
        if not keys_list:
            raise HTTPException(status_code=400, detail="请提供至少一个 API Key")
        
        # 获取音频时长
        duration = await get_audio_duration(audio_data)
        
        if duration == 0:
            raise HTTPException(status_code=400, detail="无法读取音频文件")
        
        # 如果超过60分钟，切分音频
        if duration > MAX_DURATION:
            chunks = await split_audio(audio_data, duration)
            
            # 并行处理所有片段
            tasks = [
                transcribe_with_retry(chunk, keys_list, enable_diarization)
                for chunk in chunks
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 合并结果
            full_text = []
            all_words = []
            chunk_durations = []
            
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    raise HTTPException(status_code=500, detail=f"片段 {i+1} 转录失败: {str(result)}")
                
                full_text.append(result["text"])
                all_words.extend(result.get("words", []))
                chunk_durations.append({
                    "chunk": i + 1,
                    "duration": result["duration"]
                })
            
            total_duration = time.time() - total_start_time
            
            return {
                "success": True,
                "text": " ".join(full_text),
                "words": all_words,
                "audio_duration": duration,
                "total_chunks": len(chunks),
                "processing_time": {
                    "total": total_duration,
                    "chunks": chunk_durations
                }
            }
        else:
            # 单个文件直接处理
            result = await transcribe_with_retry(audio_data, keys_list, enable_diarization)
            total_duration = time.time() - total_start_time
            
            return {
                "success": True,
                "text": result["text"],
                "words": result.get("words", []),
                "audio_duration": duration,
                "total_chunks": 1,
                "processing_time": {
                    "total": total_duration,
                    "chunks": [{"chunk": 1, "duration": result["duration"]}]
                }
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Soniox ASR API 服务运行中", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
