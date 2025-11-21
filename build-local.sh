#!/bin/bash
# Block Flow 本地构建脚本
# 功能：在宿主机上执行 Maven 打包，包含前端构建，生成 Docker 构建所需的产物

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  Block Flow - 本地构建脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Java 环境
echo "🔍 检查 Java 环境..."
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ 错误：未找到 Java 命令${NC}"
    echo "请安装 JDK 17 或更高版本"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
echo "Java 版本: $JAVA_VERSION"

if [ "$JAVA_VERSION" -lt 17 ]; then
    echo -e "${RED}❌ 错误：需要 Java 17 或更高版本${NC}"
    echo "当前版本: $JAVA_VERSION"
    exit 1
fi

# 检查 Maven 环境
echo ""
echo "🔍 检查 Maven 环境..."
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}❌ 错误：未找到 Maven 命令${NC}"
    echo "请安装 Maven 3.6 或更高版本"
    exit 1
fi

MVN_VERSION=$(mvn -version | grep "Apache Maven" | awk '{print $3}')
echo "Maven 版本: $MVN_VERSION"

# 进入 api 目录
echo ""
echo "📂 进入 api 目录..."
cd api

# 执行 Maven 打包（会自动构建前端）
echo ""
echo "🔨 开始 Maven 打包（包含前端构建）..."
echo -e "${YELLOW}执行命令: mvn clean package -DskipTests${NC}"
echo ""
echo "提示：Maven 会自动执行以下步骤："
echo "  1. 安装 Node.js 和 npm"
echo "  2. 安装前端依赖 (npm install)"
echo "  3. 构建前端项目 (npm run build:merged)"
echo "  4. 编译 Java 代码"
echo "  5. 打包 JAR 文件"
echo "  6. 打包完整的可执行 JAR（包含所有依赖）"
echo ""

mvn clean package -DskipTests

# 检查构建结果
echo ""
echo "🔍 检查构建产物..."

if [ ! -f "target/block-flow-0.0.1-SNAPSHOT.jar" ]; then
    echo -e "${RED}❌ 构建失败：未找到 JAR 文件${NC}"
    exit 1
fi

# 返回项目根目录
cd ..

echo ""
echo -e "${GREEN}✅ 本地构建完成！${NC}"
echo ""
echo "📦 构建产物位置："
echo "   - api/target/block-flow-0.0.1-SNAPSHOT.jar (完整的可执行 JAR)"
echo ""
echo "📊 构建产物统计："
echo "   - JAR 文件大小: $(ls -lh api/target/block-flow-0.0.1-SNAPSHOT.jar | awk '{print $5}')"
echo ""
echo "💡 下一步："
echo "   方式1：直接运行 JAR："
echo "          cd api/target && java -jar block-flow-0.0.1-SNAPSHOT.jar"
echo ""
echo "   方式2：构建 Docker 镜像："
echo "          ./docker-build.sh"
echo ""
echo "=========================================="

exit 0
