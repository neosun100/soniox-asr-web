# Docker 部署指南

## 🐳 架构说明

本项目使用 Docker Compose 部署，包含两个服务：

```
┌─────────────────────────────────────┐
│     Docker Compose                  │
│  ┌──────────────┐  ┌──────────────┐│
│  │   Frontend   │  │   Backend    ││
│  │   (Nginx)    │  │  (FastAPI)   ││
│  │   Port 8000  │  │  Port 8001   ││
│  └──────────────┘  └──────────────┘│
└─────────────────────────────────────┘
```

### 服务说明

- **Backend (soniox-backend)**
  - 基于 Python 3.9
  - 包含 FFmpeg 音频处理
  - FastAPI 后端服务
  - 端口：8001

- **Frontend (soniox-frontend)**
  - 基于 Nginx Alpine
  - 静态文件服务
  - 反向代理到后端
  - 端口：8000

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+

### 安装 Docker

**macOS**:
```bash
brew install docker docker-compose
```

**Ubuntu/Debian**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin
```

## 🚀 快速开始

### 方法一：一键启动（推荐）

```bash
# 克隆项目
git clone https://github.com/neosun100/soniox-asr-web.git
cd soniox-asr-web

# 一键启动
./docker-start.sh
```

### 方法二：手动启动

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 📱 访问服务

启动成功后，访问：

- **前端界面**: http://localhost:8000
- **API 文档**: http://localhost:8001/docs
- **健康检查**: http://localhost:8001/docs

## 🛠️ 常用命令

### 查看服务状态

```bash
docker-compose ps
```

### 查看日志

```bash
# 查看所有日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart backend
docker-compose restart frontend
```

### 停止服务

```bash
# 停止服务（保留容器）
docker-compose stop

# 停止并删除容器
docker-compose down

# 停止并删除容器、镜像、卷
docker-compose down --rmi all -v
```

### 更新服务

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 🔧 配置说明

### 端口配置

修改 `docker-compose.yml` 中的端口映射：

```yaml
services:
  backend:
    ports:
      - "8001:8001"  # 修改为其他端口，如 "9001:8001"
  
  frontend:
    ports:
      - "8000:8000"  # 修改为其他端口，如 "9000:8000"
```

### 环境变量

在 `docker-compose.yml` 中添加环境变量：

```yaml
services:
  backend:
    environment:
      - PYTHONUNBUFFERED=1
      - LOG_LEVEL=INFO
```

### 资源限制

限制容器资源使用：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## 🌐 生产部署

### 使用 Nginx 反向代理

创建 Nginx 配置 `/etc/nginx/sites-available/soniox`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 支持
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 7200s;
    }
}
```

### 使用 HTTPS

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 开机自启动

```bash
# 创建 systemd 服务
sudo nano /etc/systemd/system/soniox-docker.service
```

内容：

```ini
[Unit]
Description=Soniox ASR Web Docker Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/soniox-asr-web
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl enable soniox-docker.service
sudo systemctl start soniox-docker.service
```

## 🐛 故障排除

### 端口被占用

```bash
# 查看端口占用
lsof -i :8000
lsof -i :8001

# 修改 docker-compose.yml 中的端口
```

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend

# 检查镜像是否构建成功
docker images | grep soniox
```

### 健康检查失败

```bash
# 进入容器检查
docker exec -it soniox-backend bash
docker exec -it soniox-frontend sh

# 手动测试服务
curl http://localhost:8001/docs
curl http://localhost:8000
```

### 清理 Docker 资源

```bash
# 清理未使用的容器
docker container prune

# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a --volumes
```

## 📊 监控

### 查看资源使用

```bash
# 实时监控
docker stats

# 查看特定容器
docker stats soniox-backend soniox-frontend
```

### 日志管理

限制日志大小，修改 `docker-compose.yml`：

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🔐 安全建议

1. **不要暴露后端端口**
   - 只暴露前端端口 8000
   - 后端通过内部网络通信

2. **使用环境变量**
   - 不要在代码中硬编码敏感信息
   - 使用 `.env` 文件管理配置

3. **定期更新镜像**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

4. **限制资源使用**
   - 设置 CPU 和内存限制
   - 防止容器占用过多资源

## 📝 文件说明

- `Dockerfile.backend` - 后端服务 Dockerfile
- `Dockerfile.frontend` - 前端服务 Dockerfile
- `docker-compose.yml` - Docker Compose 配置
- `nginx.conf` - Nginx 配置文件
- `.dockerignore` - Docker 忽略文件
- `docker-start.sh` - 一键启动脚本

## 🔗 相关链接

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [项目 GitHub](https://github.com/neosun100/soniox-asr-web)

---

Made with ❤️ by [Neo Sun](https://github.com/neosun100)
