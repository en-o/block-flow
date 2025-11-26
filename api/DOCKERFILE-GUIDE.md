# Block Flow Docker 镜像构建指南

## 目录
1. [镜像版本说明](#镜像版本说明)
2. [构建前准备](#构建前准备)
3. [本地构建](#本地构建)
4. [Docker 镜像构建](#docker-镜像构建)
5. [运行容器](#运行容器)
6. [配置说明](#配置说明)
7. [常见问题](#常见问题)

---

## 镜像版本说明

Block Flow 提供两种 Docker 镜像版本：

| 版本 | Dockerfile | 基础镜像 | 特点 | 推荐场景 |
|------|-----------|----------|------|---------|
| **Debian** | `api/Dockerfile` | `eclipse-temurin:17-jre-jammy` | 兼容性好，依赖完整 | **生产环境（推荐）** |
| **Alpine** | `api/Dockerfile.alpine` | `eclipse-temurin:17-jre-alpine` | 体积小，轻量级 | 资源受限环境 |

### 镜像特性对比

- **Debian 版本**
  - ✅ Python 编译兼容性更好
  - ✅ 完整的系统依赖库
  - ✅ 更少的兼容性问题
  - ⚠️ 镜像体积较大（~500MB）

- **Alpine 版本**
  - ✅ 镜像体积小（~300MB）
  - ✅ 启动速度快
  - ⚠️ Python 源码编译可能遇到问题
  - ⚠️ 某些依赖库可能不兼容

---

## 构建前准备

### 1. 系统要求

- **Java**: JDK 17 或更高版本
- **Maven**: 3.6.0 或更高版本
- **Node.js**: 20.19+ 或 22.12+（自动安装）
- **Docker**: 20.10 或更高版本

### 2. 检查环境

```bash
# 检查 Java 版本
java -version

# 检查 Maven 版本
mvn -version

# 检查 Docker 版本
docker --version
```

---

## 本地构建

在构建 Docker 镜像之前，**必须先执行本地 Maven 打包**。

### Linux / Mac

```bash
# 进入项目根目录
cd /path/to/block-flow

# 执行构建脚本
./build-local.sh
```

### Windows

```cmd
REM 进入项目根目录
cd C:\path\to\block-flow

REM 执行构建脚本
build-local.bat
```

### 构建流程说明

本地构建会自动执行以下步骤：

1. ✅ 安装 Node.js 和 npm（Maven 自动下载）
2. ✅ 安装前端依赖（`npm install`）
3. ✅ 构建前端项目（`npm run build:merged`）
4. ✅ 编译 Java 代码
5. ✅ 打包可执行 JAR（包含前端静态资源）

### 构建产物

成功后会在 `api/target/` 目录生成：

```
api/target/
└── block-flow-0.0.1-SNAPSHOT.jar  # 完整的可执行 JAR（含前端）
```

---

## Docker 镜像构建

### 方式一：使用构建脚本（推荐）

#### Linux / Mac

```bash
# 默认版本号为 latest
./docker-build.sh

# 指定版本号
./docker-build.sh 1.0.0

# 使用 Alpine 版本
./docker-build.sh 1.0.0 alpine
```

#### Windows

```cmd
REM 默认版本号为 latest
docker-build.bat

REM 指定版本号
docker-build.bat 1.0.0

REM 使用 Alpine 版本
docker-build.bat 1.0.0 alpine
```

### 方式二：手动构建

#### Debian 版本（推荐）

```bash
# 从项目根目录执行
docker build -t tannnn/block-flow:latest -f api/Dockerfile .

# 或指定版本号
docker build -t tannnn/block-flow:1.0.0 -f api/Dockerfile .
```

#### Alpine 版本

```bash
# 从项目根目录执行
docker build -t tannnn/block-flow:latest-alpine -f api/Dockerfile.alpine .
```

### 构建参数说明

| 参数 | 说明 |
|------|------|
| `-t` | 镜像名称和标签 |
| `-f` | 指定 Dockerfile 路径 |
| `.` | 构建上下文（项目根目录） |

---

## 运行容器

### 方式一：使用 Docker Compose（推荐）

#### 1. 配置环境变量

创建 `.env` 文件（可选，使用默认值则跳过）：

```env
# 端口配置
HOST_PORT=1250

# 运行环境
CONFIG_ENV=prod

# 数据库配置
MYSQL_URL=localhost:3306
MYSQL_DB=db_block_flow
MYSQL_UNM=root
MYSQL_PWD=root

# JVM 配置
JAVA_OPTS=-Xms256m -Xmx512m

# 资源限制
CPU_LIMIT=2
MEMORY_LIMIT=2G
```

#### 2. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f block-flow-api

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

### 方式二：直接运行容器

```bash
docker run -d \
  --name block-flow \
  -p 1250:1250 \
  -e TZ=Asia/Shanghai \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e MYSQL_URL=localhost:3306 \
  -e MYSQL_DB=db_block_flow \
  -e MYSQL_UNM=root \
  -e MYSQL_PWD=root \
  -e JAVA_OPTS="-Xms256m -Xmx512m" \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  tannnn/block-flow:latest
```

### 访问应用

- **前端界面**: http://localhost:1250
- **API 文档**: http://localhost:1250/doc.html
- **健康检查**: http://localhost:1250/actuator/health

---

## 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `TZ` | `Asia/Shanghai` | 时区设置（中国时区） |
| `CONFIG_ENV` | `prod` | 运行环境（dev/prod） |
| `SPRING_PROFILES_ACTIVE` | `prod` | Spring 配置文件 |
| `MYSQL_URL` | `localhost:3306` | MySQL 地址和端口 |
| `MYSQL_DB` | `db_block_flow` | 数据库名称 |
| `MYSQL_UNM` | `root` | 数据库用户名 |
| `MYSQL_PWD` | `root` | 数据库密码 |
| `JAVA_OPTS` | `-Xms256m -Xmx512m` | JVM 参数 |
| `FILE_MAX_SIZE` | `2GB` | 文件上传大小限制 |
| `FILE_MAX_REQUEST` | `2GB` | 请求大小限制 |
| `PYTHON_ENV_ROOT_PATH` | `/app/python-envs` | Python 环境根路径 |
| `DOC_USERNAME` | `tan` | API 文档用户名 |
| `DOC_PASSWORD` | `tan` | API 文档密码 |

### 数据卷挂载

| 容器路径 | 宿主路径 | 说明 |
|----------|----------|------|
| `/app/data` | `./data` | 应用数据（H2 数据库） |
| `/app/logs` | `./logs` | 应用日志 |
| `/app/python-envs` | `./python-envs` | Python 环境（可选） |

**注意**：
- Python 环境默认**不持久化**
- 如需迁移，建议重新上传运行时并修改块的环境配置

---

## 常见问题

### 1. Maven 构建失败

**问题**：Node.js 下载慢或失败

**解决**：已配置淘宝镜像源（npmmirror.com），确保网络正常。

**问题**：Vite 构建失败 `crypto.hash is not a function`

**解决**：Node.js 版本已升级到 20.19.2，请清理缓存重新构建：

```bash
# 清理 Maven 缓存
rm -rf web/node web/node_modules

# 重新构建
./build-local.sh
```

### 2. Docker 镜像构建失败

**问题**：找不到 JAR 文件

**解决**：确保先执行本地 Maven 打包：

```bash
# Linux/Mac
./build-local.sh

# Windows
build-local.bat
```

**问题**：构建超时

**解决**：Dockerfile 已配置国内镜像源（阿里云），取消注释即可。

### 3. 容器启动失败

**问题**：端口冲突

**解决**：修改 `.env` 文件中的 `HOST_PORT`：

```env
HOST_PORT=8080  # 使用其他端口
```

**问题**：数据库连接失败

**解决**：
- 检查 MySQL 是否启动
- 确认 `MYSQL_URL` 配置正确
- 容器内使用主机数据库，URL 改为 `host.docker.internal:3306`

### 4. Python 环境问题

**问题**：Python 脚本执行失败

**解决**：
1. 确保上传了正确的 Python 运行时
2. 检查环境配置是否正确
3. 查看 `/app/logs` 日志排查详细错误

### 5. 资源限制

**问题**：容器内存不足

**解决**：调整 `.env` 文件的资源配置：

```env
# JVM 内存
JAVA_OPTS=-Xms512m -Xmx1G

# Docker 容器限制
MEMORY_LIMIT=2G
```

---

## 镜像优化建议

### 1. 生产环境优化

```dockerfile
# 如果只使用预编译 Python 运行时，可删除编译依赖
# 注释掉 Dockerfile 中的 build-essential、gcc、g++ 等依赖
# 可减少约 300MB 镜像大小
```

### 2. 多阶段构建（未来版本）

当前采用**本地打包 + 单阶段构建**，未来可改为完全的 Docker 多阶段构建。

### 3. 镜像瘦身

```bash
# 使用 Alpine 版本
docker build -t tannnn/block-flow:latest-alpine -f api/Dockerfile.alpine .

# 压缩镜像
docker save tannnn/block-flow:latest | gzip > block-flow.tar.gz
```

---

## 快速命令参考

```bash
# 完整构建流程（Linux/Mac）
./build-local.sh && ./docker-build.sh 1.0.0

# 完整构建流程（Windows）
build-local.bat && docker-build.bat 1.0.0

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f block-flow-api

# 进入容器
docker exec -it block-flow bash

# 停止并删除
docker-compose down -v

# 查看容器资源使用
docker stats block-flow
```

---

## 技术支持

- **项目地址**: [GitHub Repository]
- **问题反馈**: [Issues]
- **文档更新**: 2025-11-26
