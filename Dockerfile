# Soniox ASR Web - All-in-One Docker Image
# 包含前端（Nginx）和后端（FastAPI）

FROM python:3.9-slim

# 安装 Nginx 和 FFmpeg
RUN apt-get update && \
    apt-get install -y nginx ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制并安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY server.py .

# 复制前端文件到 Nginx 目录
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY clear-storage.html /usr/share/nginx/html/
COPY screenshot-rest-api.png /usr/share/nginx/html/
COPY screenshot-websocket.png /usr/share/nginx/html/

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建启动脚本
RUN echo '#!/bin/bash\n\
nginx\n\
python /app/server.py\n\
' > /start.sh && chmod +x /start.sh

# 暴露端口
EXPOSE 8000 8001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# 启动命令
CMD ["/start.sh"]
