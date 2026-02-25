#!/bin/bash

# AI Service Platform - 生产环境部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 AI Service Platform 部署脚本"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 已安装${NC}"

# 创建必要的目录
echo ""
echo "📁 创建必要的目录..."
mkdir -p data uploads logs
chmod -R 755 data uploads logs

echo -e "${GREEN}✅ 目录创建完成${NC}"

# 拉取镜像
echo ""
echo "📦 拉取最新镜像..."
docker-compose -f docker-compose.prod.yml pull

# 停止旧容器
echo ""
echo "🛑 停止旧容器..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 启动服务
echo ""
echo "🚀 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

# 查看状态
echo ""
sleep 3
echo "📊 服务状态："
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "================================"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "🌐 访问地址："
echo "   前端: http://localhost"
echo "   API:  http://localhost:3001"
