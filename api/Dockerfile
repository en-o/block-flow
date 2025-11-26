# ============================================
# Block Flow Docker 镜像构建文件
# ============================================
# 构建方式：本地打包 + Docker 单阶段构建
#
# 【重要】构建前提条件:
# 1. 必须先在本地执行 Maven 打包
#    Linux/Mac: ./build-local.sh
#    Windows:   build-local.bat
# 2. 确保 api/target/ 目录包含完整的 Spring Boot JAR：
#    - block-flow-*.jar（完整的可执行 JAR，包含所有依赖和前端静态资源）
#
# 构建命令（从项目根目录执行）:
#   docker build -t tannnn/block-flow:latest -f api/Dockerfile .
#
# 或使用构建脚本（推荐）:
#   Linux/Mac: ./docker-build.sh
#   Windows:   docker-build.bat
#
# 【镜像选择】
# - Alpine版本（轻量）: eclipse-temurin:17-jre-alpine
# - Debian版本（兼容）: eclipse-temurin:17-jre-jammy
# ============================================

# ============================================
# 运行时镜像 - Debian版本（推荐，兼容性更好）
# ============================================
FROM eclipse-temurin:17-jre-jammy

# 添加维护者信息
LABEL maintainer="tannnn"
LABEL author="tannnn"
LABEL description="Block Flow - Python脚本编排平台"
LABEL build.method="local-maven-build"

# 设置工作目录
WORKDIR /app

# 设置时区为中国（Asia/Shanghai）
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 从本地构建产物复制完整 JAR（使用通配符匹配版本号）
COPY api/target/block-flow-*.jar /app/block-flow.jar

# 【可选】配置国内镜像源加速（中国区用户取消注释）
# 阿里云镜像源
 RUN sed -i 's@http://.*archive.ubuntu.com@http://mirrors.aliyun.com@g' /etc/apt/sources.list && \
     sed -i 's@http://.*security.ubuntu.com@http://mirrors.aliyun.com@g' /etc/apt/sources.list
# 或使用腾讯云镜像源
# RUN sed -i 's@http://.*archive.ubuntu.com@http://mirrors.tencent.com@g' /etc/apt/sources.list && \
#     sed -i 's@http://.*security.ubuntu.com@http://mirrors.tencent.com@g' /etc/apt/sources.list
# 或使用中科大镜像源
# RUN sed -i 's@http://.*archive.ubuntu.com@http://mirrors.ustc.edu.cn@g' /etc/apt/sources.list && \
#     sed -i 's@http://.*security.ubuntu.com@http://mirrors.ustc.edu.cn@g' /etc/apt/sources.list

# 安装 Python 源代码编译所需的依赖（完整版）
# 注意：
# 1. 如果只使用预编译Python运行时（python-build-standalone），可以注释掉这些依赖
# 2. 如果需要从源代码编译Python，必须保留这些依赖
# 3. 这些依赖会增加约300MB的镜像大小
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    # 基础编译工具
    build-essential \
    gcc \
    g++ \
    make \
    # Python编译必需的库
    libssl-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    libffi-dev \
    liblzma-dev \
    # 可选但推荐的库
    libncurses5-dev \
    libgdbm-dev \
    libgdbm-compat-dev \
    tk-dev \
    uuid-dev \
    # 工具
    wget \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 创建必要的目录
RUN mkdir -p /app/data \
             /app/logs \
             /app/python-envs && \
    useradd -m -u 1000 -s /bin/bash appuser && \
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

