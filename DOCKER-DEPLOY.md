# Soniox ASR Web - Docker 部署指南

## 快速启动（All-in-One 镜像）

### 拉取镜像

**ARM64 架构（Mac M1/M2/M3）：**
```bash
docker pull neosun/soniox-asr-web:v4.0.0
# 或
docker pull neosun/soniox-asr-web:latest
```

**AMD64/x86_64 架构（Linux 服务器）：**
```bash
docker pull neosun/soniox-asr-web:v4.0.0-amd64
# 或
docker pull neosun/soniox-asr-web:latest-amd64
```

### 运行容器

**ARM64：**
```bash
docker run -d \
  --name soniox-asr \
  -p 8000:8000 \
  -p 8001:8001 \
  --restart always \
  neosun/soniox-asr-web:v4.0.0
```

**AMD64：**
```bash
docker run -d \
  --name soniox-asr \
  -p 8000:8000 \
  -p 8001:8001 \
  --restart always \
  neosun/soniox-asr-web:v4.0.0-amd64
```

### 访问服务

- 前端界面：http://localhost:8000
- API 文档：http://localhost:8000/docs
- ReDoc 文档：http://localhost:8000/redoc
- 健康检查：http://localhost:8001/health

## 版本说明

### v1.1.0 (2026-01-02) - 全面功能增强

**新增功能：**
- ✨ Context 编辑器（General/Text/Terms/Translation Terms）
- ✨ Context 模板管理
- ✨ Language Hints 复选框多选
- ✨ Confidence Scores 置信度可视化
- ✨ Manual Finalization 立即终结
- ✨ 语言标注彩色标签（5色动态）
- ✨ SRT/VTT 字幕导出
- ✨ WebSocket 累积显示所有对话
- ✨ 实时下载转录结果
- ✨ 说话人颜色区分（10种颜色）

**后端改进：**
- 🔧 loguru 日志系统
- 🔧 /health 健康检查
- 🔧 /version 版本信息
- 🔧 Pydantic 响应模型
- 🔧 Swagger/ReDoc 完善

**Docker 优化：**
- 🐳 All-in-one 单镜像部署
- 🐳 Nginx 反向代理
- 🐳 健康检查配置

## 镜像标签

**ARM64 架构（Mac M1/M2/M3）：**
- `neosun/soniox-asr-web:latest` - 最新稳定版
- `neosun/soniox-asr-web:v4.0.0` - v4.0.0 版本

**AMD64/x86_64 架构（Linux 服务器）：**
- `neosun/soniox-asr-web:latest-amd64` - 最新稳定版
- `neosun/soniox-asr-web:v4.0.0-amd64` - v4.0.0 版本

## 环境变量

无需配置环境变量，API Key 在前端界面输入。

## 数据持久化

API Key 存储在浏览器 localStorage，无需挂载卷。

## 健康检查

容器内置健康检查，自动监控服务状态：

```bash
docker ps  # 查看 STATUS 列的 (healthy) 标识
```

## 日志查看

```bash
# 查看容器日志
docker logs -f soniox-asr

# 查看后端日志
docker exec soniox-asr tail -f /app/logs/api.log
```

## 停止和删除

```bash
# 停止容器
docker stop soniox-asr

# 删除容器
docker rm soniox-asr

# 删除镜像
docker rmi neosun/soniox-asr-web:latest
```
