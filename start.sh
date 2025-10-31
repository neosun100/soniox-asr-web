#!/bin/bash

echo "🚀 启动 Soniox ASR 服务..."
echo ""

# 检查依赖
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 python3，请先安装 Python 3"
    exit 1
fi

# 安装 Python 依赖
echo "📦 检查 Python 依赖..."
pip3 install -q -r requirements.txt

# 启动后端 API 服务
echo "🔧 启动后端 API 服务 (端口 8001)..."
python3 server.py &
BACKEND_PID=$!

# 等待后端启动
sleep 2

# 启动前端服务
echo "🌐 启动前端服务 (端口 8000)..."
python3 -m http.server 8000 &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动成功！"
echo ""
echo "📱 前端界面: http://localhost:8000"
echo "📱 API 测试: http://localhost:8000/api-test.html"
echo "📖 API 文档: http://localhost:8001/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

wait
