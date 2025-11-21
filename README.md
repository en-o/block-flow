# Block Flow
Block Flow 是一个基于 Blockly 的可视化工作流编排系统，允许用户通过拖拽代码块的方式构建和执行自动化工作流。系统内置 Python 脚本执行引擎，支持自定义代码块、环境变量管理、多环境配置等功能。

# 待办

# 注意
1. 不建议使用h2数据库，体验可以，其他问题不敢保证也不会去修复




## docker build
> - 版本根据[pom.xml](api/pom.xml)，每次发行版本之后都要用新的版本进行开发
> - 当前最新：0.0.3.1
###  一键构建
./docker-build.sh [版本号]        # Linux/Mac
docker-build.bat  [版本号]        # Windows

### 分步构建
1. 本地打包 `./build-local.sh`

2. Docker 镜像构建 `docker build -t tannnn/oasis:latest -f api/Dockerfile .`




### 配置文件方式

创建或编辑 `.env` 文件：

```bash
cp .env.example .env
vim .env
```

#### 项目环境变量列表
| 环境变量 | 说明          | 默认值     | 示例         |
|---------|-------------|---------|------------|
| `CONFIG_ENV` | 运行环境配置      | `prod`   | `dev`/`prod` |
| `FILE_MAX_SIZE` | 单个文件上传大小限制  | `2GB` | `5GB`    |
| `FILE_MAX_REQUEST` | 请求总大小限制     | `2GB` | `5GB`    |
| `PYTHON_ENV_ROOT_PATH` | Python环境根目录 | `/app/python-envs` | `/data/python-envs` |
| `DOC_USERNAME` | swagger认证账户 | `tan` | `tan` |
| `DOC_PASSWORD` | swagger认证密码 | `tan` | `tan` |
| `MYSQL_PWD` | mysql密码     | `root` | `root` |
| `MYSQL_UNM` | mysql账户     | `root` | `root` |
| `MYSQL_URL` | mysql地址     | `localhost:3306` | `localhost:3306` |
| `MYSQL_DB` | mysql数据库    | `db_block_flow` | `db_block_flow` |

#### docker 环境变量列表
| 环境变量 | 说明         | 默认值     | 示例         |
|---------|------------|---------|------------|
| `JAVA_OPTS` | JVM 参数      | `-Xms256m -Xmx512m`  | `-Xms512m -Xmx1024m`    |
| `CPU_LIMIT` | CPU 核心数限制  | `2`   | `4`    |
| `MEMORY_LIMIT` | 内存限制      | `2G`  | `4G`    |

### 目录
> chmod -R 755 python-envs 设置权限

| 环境变量        | 说明                                        | 
|-------------|-------------------------------------------|
| 备用目录        | /app/data                                 |
| 日志持久目录      | /app/logs                                 |
| Python环境根目录 | /app/python-envs（看PYTHON_ENV_ROOT_PATH设置） | 


### 运行
> dockerhub:  https://hub.docker.com/r/tannnn/block-flow

docker run
```yaml
docker run -d -p 1250:1250 --name block-flow tannnn/block-flow:latest
```
