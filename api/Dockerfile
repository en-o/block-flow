# ============================================
# Block Flow Docker 镜像构建文件
# ============================================
# 构建方式：本地打包 + Docker 单阶段构建
#
# 【重要】构建前提条件:
# 1. 必须先在本地执行 Maven 打包
#    Linux/Mac: ./build-local.sh
#    Windows:   build-local.bat
# 2. 确保 api/target/output/ 目录包含以下文件：
#    - block-flow-*.jar（使用通配符匹配版本号）
#    - lib/（所有依赖 jar）
#    - resources/（所有资源文件，包含前端静态文件）
#
# 构建命令（从项目根目录执行）:
#   docker build -t tannnn/block-flow:latest -f api/Dockerfile .
#
# 或使用构建脚本（推荐）:
#   Linux/Mac: ./docker-build.sh
#   Windows:   docker-build.bat
# ============================================

# ============================================
# 运行时镜像
# ============================================
FROM eclipse-temurin:17-jre-alpine

# 添加维护者信息
LABEL maintainer="tannnn"
LABEL author="tannnn"
LABEL description="Block Flow - Python脚本编排平台"
LABEL build.method="local-maven-build"

# 设置工作目录
WORKDIR /app

# 从本地构建产物复制文件（使用通配符匹配版本号）
COPY api/target/output/block-flow-*.jar /app/block-flow.jar
COPY api/target/output/lib /app/lib
COPY api/target/output/resources /app/resources

# 创建必要的目录
RUN mkdir -p /app/data \
             /app/logs \
             /app/python-envs && \
    addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

# 暴露端口
EXPOSE 1250

# 设置环境变量（默认值）
ENV JAVA_OPTS="-Xms256m -Xmx512m"
ENV CONFIG_ENV="prod"
ENV SPRING_PROFILES_ACTIVE="prod"

# 切换到非 root 用户
USER appuser

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/block-flow.jar"]

