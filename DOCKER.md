# Block Flow Docker 部署指南

## 📋 目录

- [构建流程说明](#构建流程说明)
- [快速开始](#快速开始)
- [构建方式](#构建方式)
- [运行容器](#运行容器)
- [环境变量配置](#环境变量配置)
- [访问应用](#访问应用)
- [常见问题](#常见问题)
- [高级配置](#高级配置)
- [维护和监控](#维护和监控)

---

## 🏗️ 构建流程说明

### 新的构建架构（推荐）

本项目采用**分离式构建流程**，将 Maven 后端打包与 Docker 镜像构建分离，具有以下优势：

1. **构建速度更快**：避免在 Docker 内部下载 Maven 依赖
2. **灵活性更高**：可以单独执行后端或前端构建
3. **调试更方便**：本地打包失败时更容易排查问题
4. **体积更小**：Docker 镜像不包含 Maven 和 JDK，只包含运行时 JRE

### 构建流程图

```
┌─────────────────────────────────────────────────────────────┐
│  步骤 1: 本地 Maven 打包 (在宿主机执行)                      │
│  ────────────────────────────────────────────────────        │
│  命令: ./build-local.sh (Linux/Mac)                         │
│       build-local.bat (Windows)                             │
│                                                              │
│  执行: cd api && mvn clean package -DskipTests              │
│                                                              │
│  产物: api/target/block-flow-0.0.1-SNAPSHOT.jar             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  步骤 2: Docker 镜像构建 (两阶段构建)                        │
│  ────────────────────────────────────────────────────        │
│  命令: ./docker-build.sh (Linux/Mac)                        │
│       docker-build.bat (Windows)                            │
│                                                              │
│  阶段 1: 前端构建 (Node 20 Alpine)                           │
│    - 复制 web/ 源码                                          │
│    - 执行 npm install && npm run build                      │
│    - 生成前端静态文件                                         │
│                                                              │
│  阶段 2: 运行时镜像 (JRE 17 Alpine)                          │
│    - 从阶段 1 复制前端静态文件                               │
│    - 从本地复制后端构建产物                                   │
│    - 配置运行环境和入口点                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  最终镜像: tannnn/block-flow:latest                          │
│  ────────────────────────────────────────────────────        │
│  基础镜像: eclipse-temurin:17-jre-alpine (~180MB)            │
│  包含内容:                                                   │
│    ✓ Java 17 JRE 运行时                                      │
│    ✓ 后端 Spring Boot 应用                                   │
│    ✓ 前端 React 静态文件                                     │
│    ✓ Python 脚本执行环境支持                                  │
│    ✗ 不包含 Maven、JDK、node_modules                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 方式一：一键构建脚本（推荐）

**Linux / Mac:**
```bash
chmod +x docker-build.sh
./docker-build.sh
```

**Windows:**
```cmd
docker-build.bat
```

脚本会自动完成：
1. ✅ 清理环境（node_modules、dist、target）
2. ✅ 执行 Maven 本地打包
3. ✅ 验证构建产物
4. ✅ 构建 Docker 镜像
5. ✅ 显示构建结果和下一步提示

### 方式二：使用 Docker Compose（推荐用于生产环境）

```bash
# 1. 先执行本地构建
./build-local.sh          # Linux/Mac
# 或
build-local.bat           # Windows

# 2. 使用 Docker Compose 构建并启动
docker-compose up -d --build

# 3. 查看日志
docker-compose logs -f block-flow

# 4. 停止服务
docker-compose down
```

---

## 🛠️ 构建方式

### 1. 分步构建（手动控制）

#### 步骤 1：本地 Maven 打包

**前提条件：**
- 已安装 JDK 17+
- 已安装 Maven 3.6+

**执行命令：**

Linux / Mac:
```bash
./build-local.sh
```

Windows:
```cmd
build-local.bat
```

或手动执行：
```bash
cd api
mvn clean package -DskipTests
cd ..
```

**验证构建产物：**
```bash
ls -lh api/target/
# 应包含：
# - block-flow-0.0.1-SNAPSHOT.jar
```

#### 步骤 2：Docker 镜像构建

**前提条件：**
- 已完成步骤 1 的 Maven 打包
- 已安装 Docker

**执行命令：**
```bash
# 从项目根目录执行
docker build -t tannnn/block-flow:latest -f api/Dockerfile .
```

### 2. 只构建本地包（不构建镜像）

适用于只需要本地开发或测试后端的场景：

```bash
./build-local.sh    # Linux/Mac
build-local.bat     # Windows
```

然后可以直接运行 JAR：
```bash
cd api/target
java -jar block-flow-0.0.1-SNAPSHOT.jar
```

---

## 🐳 运行容器

### 使用 Docker 命令

```bash
# 运行容器（基础版）
docker run -d \
  --name block-flow \
  -p 8777:8777 \
  tannnn/block-flow:latest

# 运行容器（完整配置）
docker run -d \
  --name block-flow \
  -p 8777:8777 \
  -e CONFIG_ENV=prod \
  -e FILE_MAX_SIZE=2GB \
  -e JAVA_OPTS="-Xms512m -Xmx1024m" \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/python-envs:/app/python-envs \
  --restart unless-stopped \
  tannnn/block-flow:latest

# 查看日志
docker logs -f block-flow

# 进入容器
docker exec -it block-flow sh

# 停止容器
docker stop block-flow

# 删除容器
docker rm block-flow
```

### 使用 Docker Compose（推荐）

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f block-flow

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

---

## ⚙️ 环境变量配置

### 配置文件方式

创建或编辑 `.env` 文件：

```bash
cp .env.example .env
vim .env
```

### 环境变量列表

| 环境变量 | 说明         | 默认值     | 示例         |
|---------|------------|---------|------------|
| `CONFIG_ENV` | 运行环境配置   | `prod`   | `dev`/`prod` |
| `HOST_PORT` | 宿主机映射端口  | `8777`   | `8080`    |
| `FILE_MAX_SIZE` | 单个文件上传大小限制 | `2GB` | `5GB`    |
| `FILE_MAX_REQUEST` | 请求总大小限制    | `2GB` | `5GB`    |
| `PYTHON_ENV_ROOT_PATH` | Python环境根目录 | `/app/python-envs` | `/data/python-envs` |
| `JAVA_OPTS` | JVM 参数      | `-Xms256m -Xmx512m`  | `-Xms512m -Xmx1024m`    |
| `CPU_LIMIT` | CPU 核心数限制  | `2`   | `4`    |
| `MEMORY_LIMIT` | 内存限制      | `2G`  | `4G`    |

### 运行时覆盖环境变量

**Docker 命令方式：**
```bash
docker run -d -p 8777:8777 \
  -e CONFIG_ENV=dev \
  -e FILE_MAX_SIZE=5GB \
  tannnn/block-flow:latest
```

**Docker Compose 方式：**
```yaml
services:
  block-flow-api:
    environment:
      CONFIG_ENV: dev
      FILE_MAX_SIZE: 5GB
```

---

## 🌐 访问应用

启动成功后，通过以下地址访问：

| 服务 | 地址 | 说明 |
|-----|------|------|
| **应用首页** | http://localhost:8777 | Block Flow 主页面 |
| **API 文档** | http://localhost:8777/doc.html | Knife4j API 文档 |
| **健康检查** | http://localhost:8777/actuator/health | 应用健康状态 |

---

## ❓ 常见问题

### 1. Maven 打包失败

**问题：** 执行 `build-local.sh` 时 Maven 报错

**解决方案：**
```bash
# 检查 Java 版本（需要 JDK 17+）
java -version

# 检查 Maven 版本（需要 3.6+）
mvn -version

# 清理 Maven 缓存
rm -rf ~/.m2/repository/cn/tannn/cat

# 重新打包
cd api
mvn clean package -DskipTests -U
```

### 2. Docker 构建失败：找不到构建产物

**错误信息：**
```
ERROR: failed to compute cache key: failed to calculate checksum of ref
"/api/target/block-flow-0.0.1-SNAPSHOT.jar": not found
```

**原因：** 未执行本地 Maven 打包

**解决方案：**
```bash
# 必须先执行本地打包
./build-local.sh

# 然后再构建镜像
docker build -t tannnn/block-flow:latest -f api/Dockerfile .
```

### 3. 前端静态文件 404

**问题：** 访问首页时出现 404 或白屏

**解决方案：**
```bash
# 进入容器检查静态文件
docker exec -it block-flow ls -la /app/static

# 如果文件不存在，重新构建
./docker-build.sh
```

### 4. 端口冲突

**错误信息：** `Bind for 0.0.0.0:8777 failed: port is already allocated`

**解决方案：**

方式 1：修改端口映射
```bash
docker run -d -p 8080:8777 --name block-flow tannnn/block-flow:latest
# 访问地址变为: http://localhost:8080
```

方式 2：停止占用端口的进程
```bash
# Linux/Mac
lsof -i :8777
kill -9 <PID>

# Windows
netstat -ano | findstr :8777
taskkill /PID <PID> /F
```

### 5. Python 环境无法使用

**问题：** 执行 Python 脚本时报错找不到 Python

**解决方案：**
```bash
# 检查 Python 环境目录挂载
docker exec -it block-flow ls -la /app/python-envs

# 确保宿主机目录存在并有正确权限
mkdir -p python-envs
chmod -R 755 python-envs

# 重新创建容器
docker-compose down
docker-compose up -d
```

### 6. 构建上下文过大

**问题：** Docker 构建非常慢，传输大量文件

**解决方案：**
```bash
# 清理 node_modules
rm -rf web/node_modules

# 清理前端构建产物
rm -rf web/dist

# 清理 Maven 构建产物
rm -rf api/target

# 检查 .dockerignore 是否正确配置
cat .dockerignore

# 使用构建脚本（自动清理）
./docker-build.sh
```

---

## 🔧 高级配置

### 1. 自定义 JVM 参数

修改 `docker-compose.yml`:
```yaml
services:
  block-flow-api:
    environment:
      JAVA_OPTS: "-Xms512m -Xmx1024m -XX:+UseG1GC"
```

或修改 `api/Dockerfile`:
```dockerfile
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC"
```

### 2. 使用外部 MySQL 数据库

在 `docker-compose.yml` 中添加 MySQL 服务：
```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: block_flow
    volumes:
      - mysql-data:/var/lib/mysql
      - ./api/doc/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
      - ./api/doc/init_block.sql:/docker-entrypoint-initdb.d/02-init_block.sql:ro
      - ./api/doc/init_context.sql:/docker-entrypoint-initdb.d/03-init_context.sql:ro
      - ./api/doc/init_workflows.sql:/docker-entrypoint-initdb.d/04-init_workflows.sql:ro
    ports:
      - "3306:3306"

  block-flow-api:
    depends_on:
      - mysql
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/block_flow?useSSL=false&serverTimezone=UTC
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: root123

volumes:
  mysql-data:
```

### 3. 配置健康检查

已在 Dockerfile 中配置，可以在 `docker-compose.yml` 中自定义：
```yaml
services:
  block-flow-api:
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8777/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

### 4. 资源限制

在 `docker-compose.yml` 中添加资源限制：
```yaml
services:
  block-flow-api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 5. 多环境部署

创建不同的环境配置文件：

`.env.dev`:
```env
CONFIG_ENV=dev
HOST_PORT=8777
FILE_MAX_SIZE=2GB
JAVA_OPTS=-Xms256m -Xmx512m
```

`.env.prod`:
```env
CONFIG_ENV=prod
HOST_PORT=8777
FILE_MAX_SIZE=5GB
JAVA_OPTS=-Xms512m -Xmx1024m
```

启动时指定环境：
```bash
docker-compose --env-file .env.prod up -d
```

---

## 📊 维护和监控

### 日志管理

```bash
# 实时查看日志
docker-compose logs -f block-flow

# 查看最近 100 行日志
docker-compose logs --tail=100 block-flow

# 导出日志到文件
docker logs block-flow > block-flow.log 2>&1
```

### 数据备份

```bash
# 备份数据目录
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz data/ logs/ python-envs/

# 恢复数据
docker-compose down
tar -xzf backup_20241121_120000.tar.gz
docker-compose up -d
```

### 清理和维护

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的卷
docker volume prune

# 查看磁盘使用
docker system df

# 完全清理（谨慎使用）
docker system prune -a --volumes
```

### 性能监控

```bash
# 查看容器资源使用
docker stats block-flow

# 查看容器详细信息
docker inspect block-flow

# 查看容器进程
docker top block-flow
```

---

## 📝 构建流程详细说明

### Dockerfile 阶段说明

#### 阶段 1：前端构建 (frontend-builder)
- **基础镜像**: `node:20-alpine`
- **功能**: 编译 React 前端项目
- **输出**: 静态文件到 `/build/dist`

#### 阶段 2：运行时镜像
- **基础镜像**: `eclipse-temurin:17-jre-alpine`
- **功能**: 最终运行环境
- **内容**:
  - Java 17 JRE
  - 应用 JAR 包
  - 前端静态文件
  - Python 脚本执行支持

### 本地构建脚本说明

#### build-local.sh / build-local.bat
- 检查 Maven 和 Java 环境
- 执行 `mvn clean package -DskipTests`
- 生成构建产物到 `api/target/`

#### docker-build.sh / docker-build.bat
- 清理环境（node_modules、dist、target）
- 调用本地 Maven 打包
- 验证构建产物
- 执行 Docker 镜像构建
- 显示构建结果


