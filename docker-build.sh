#!/bin/bash
# Block Flow Docker 镜像构建脚本
# 功能：自动化完成清理环境、Maven 打包、Docker 镜像构建的全流程
# 用法: ./docker-build.sh [版本号]
# 示例: ./docker-build.sh 1.0.0
#       ./docker-build.sh        (默认使用 latest)

set -e  # 遇到错误立即退出

# 获取版本号参数，默认为 latest
VERSION=${1:-latest}

echo "=========================================="
echo "  Block Flow - Docker 镜像构建脚本"
echo "=========================================="
echo "构建版本: $VERSION"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
IMAGE_NAME="tannnn/block-flow"
IMAGE_TAG="$VERSION"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${BLUE}🐳 Docker 镜像信息：${NC}"
echo "   镜像名称: ${FULL_IMAGE_NAME}"
echo ""

# 步骤 1: 清理环境
echo -e "${YELLOW}📦 步骤 1/4: 清理环境${NC}"
echo "清理 node_modules、dist、target 目录..."

rm -rf web/node_modules
rm -rf web/dist
rm -rf api/target

echo -e "${GREEN}✅ 清理完成${NC}"
echo ""

# 步骤 2: 执行本地 Maven 打包
echo -e "${YELLOW}🔨 步骤 2/4: 执行本地 Maven 打包${NC}"
echo ""

if [ ! -f "./build-local.sh" ]; then
    echo -e "${RED}❌ 错误：未找到 build-local.sh 脚本${NC}"
    exit 1
fi

./build-local.sh

echo ""

# 步骤 3: 验证构建产物
echo -e "${YELLOW}🔍 步骤 3/4: 验证构建产物${NC}"

if [ ! -f "api/target/block-flow-0.0.1-SNAPSHOT.jar" ]; then
    echo -e "${RED}❌ 错误：未找到 JAR 文件${NC}"
    echo "   期望位置: api/target/block-flow-0.0.1-SNAPSHOT.jar"
    exit 1
fi

echo -e "${GREEN}✅ 构建产物验证通过${NC}"
echo ""

# 步骤 4: 构建 Docker 镜像
echo -e "${YELLOW}🐳 步骤 4/4: 构建 Docker 镜像${NC}"
echo "执行命令: docker build -t ${FULL_IMAGE_NAME} -f api/Dockerfile ."
echo ""

docker build -t "${FULL_IMAGE_NAME}" -f api/Dockerfile .

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Docker 镜像构建失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================="
echo "  ✅ Docker 镜像构建成功！"
echo "==========================================${NC}"
echo ""
echo "📦 镜像信息："
echo "   名称: ${FULL_IMAGE_NAME}"
echo "   大小: $(docker images ${IMAGE_NAME} --format "{{.Size}}" | head -n 1)"
echo ""
echo "💡 下一步操作："
echo ""
echo "   1️⃣  直接运行容器（快速启动）："
echo "      docker run -d -p 1250:1250 --name block-flow ${FULL_IMAGE_NAME}"
echo ""
echo "   2️⃣  使用 Docker Compose（推荐）："
echo "      docker-compose up -d"
echo ""
echo "   3️⃣  查看日志："
echo "      docker logs -f block-flow"
echo ""
echo "   4️⃣  访问应用："
echo "      应用首页: http://localhost:1250"
echo "      API文档:  http://localhost:1250/doc.html"
echo ""
echo "=========================================="
