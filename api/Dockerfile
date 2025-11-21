# ==============================================
# Block Flow Docker 镜像构建文件
#
# 构建方式：分离式构建（本地打包 + Docker 两阶段构建）
#
# 阶段1: 前端构建 (Node.js)
# 阶段2: 运行时镜像 (JRE 17)
#
# 使用方法：
#   运行: ./docker-build.sh
# ==============================================

# ==================== 阶段 1: 前端构建 ====================
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# 复制前端源码
COPY web/package*.json ./
COPY web/ ./

# 安装依赖并构建
RUN npm install && \
    npm run build

# ==================== 阶段 2: 运行时镜像 ====================
FROM eclipse-temurin:17-jre-alpine

# 元数据
LABEL maintainer="tannnn"
LABEL description="Block Flow - Python脚本编排平台"
LABEL version="0.0.1-SNAPSHOT"

# 设置工作目录
WORKDIR /app

# 创建必要的目录
RUN mkdir -p /app/data \
             /app/logs \
             /app/python-envs && \
    addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

# 安装运行时依赖（wget 用于健康检查）
RUN apk add --no-cache wget

# 从本地复制后端构建产物
COPY --chown=appuser:appuser api/target/block-flow-0.0.1-SNAPSHOT.jar /app/block-flow.jar

# 从阶段1复制前端构建产物到 static 目录
COPY --from=frontend-builder --chown=appuser:appuser /build/dist /app/static

# 暴露端口
EXPOSE 8777

# 设置环境变量
ENV JAVA_OPTS="-Xms256m -Xmx512m" \
    CONFIG_ENV="prod" \
    SPRING_PROFILES_ACTIVE="prod"

# 切换到非 root 用户
USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
    CMD wget --quiet --tries=1 --spider http://localhost:8777/actuator/health || exit 1

# 启动命令
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/block-flow.jar"]
