#!/bin/bash

echo "🐳 Soniox ASR Web - Docker 部署脚本"
echo "=================================="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 停止并删除旧容器
echo ""
echo "🛑 停止旧容器..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null

# 构建镜像
echo ""
echo "🔨 构建 Docker 镜像..."
docker-compose build || docker compose build

if [ $? -ne 0 ]; then
    echo "❌ 镜像构建失败"
    exit 1
fi

# 启动容器
echo ""
echo "🚀 启动容器..."
docker-compose up -d || docker compose up -d

if [ $? -ne 0 ]; then
    echo "❌ 容器启动失败"
    exit 1
fi

# 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 检查容器状态
echo ""
echo "📊 容器状态："
docker-compose ps || docker compose ps

# 检查服务健康状态
echo ""
echo "🏥 健康检查："
echo "后端服务: http://localhost:8001/docs"
echo "前端服务: http://localhost:8000"

echo ""
echo "✅ 部署完成！"
echo ""
echo "访问地址："
echo "  - 前端界面: http://localhost:8000"
echo "  - API 文档: http://localhost:8001/docs"
echo ""
echo "常用命令："
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
