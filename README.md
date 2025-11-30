# Block Flow
Block Flow 是一个基于 Blockly 的可视化工作流编排系统，允许用户通过拖拽代码块的方式构建和执行自动化工作流。系统内置 Python 脚本执行引擎，支持自定义代码块、环境变量管理、多环境配置等功能。

# 环境
- java 17
- node 20.19.2+


# 待办


# run
初始化数据 [doc](doc), 默认库名：db_block_flow

## 源码运行
1. 运行api项目 ，注意数据库地址和账户密码，库会自己创建不用管
2. 运行web前端 `npm install && npm run dev`

## docker运行
    
**📚 Dockerfile详细说明：** [查看Dockerfile使用指南](api/DOCKERFILE-GUIDE.md)
> 不建议映射`-v $(pwd)/python-envs:/app/python-envs \` 会导致很多问题

Docker参数说明：[README-build.md](README-build.md)
当前docker python环境使用：cpython-3.10.19+20251010-x86_64-unknown-linux-gnu-install_only.tar.gz
```shell
# 运行容器
docker run -d -p 1250:1250 \
  --name block-flow \
  -e MYSQL_URL=192.168.0.162:3306 \
  -e MYSQL_DB=db_block_flow \
  -e PYTHON_ENV_ROOT_PATH=/app/python-envs \ 
#  -v $(pwd)/python-envs:/app/python-envs \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/data:/app/data \
  tannnn/block-flow:latest
  
# windows
#  -v $(pwd)/python-envs:/app/python-envs
docker run -d -p 1250:1250  --name block-flow  -e MYSQL_URL=192.168.0.162:3306   -e MYSQL_DB=db_block_flow   tannnn/block-flow:0.0.1

```


# 第一次使用

## 1. 初始化数据
执行 [api/doc](doc) 目录下的SQL脚本，默认库名：`db_block_flow`

## 2. 创建Python环境并上传运行时

### 推荐方案：预编译Python运行时（python-build-standalone）⭐

**下载地址：** https://github.com/astral-sh/python-build-standalone/releases

**选择文件：**
- **Linux x86_64**: `cpython-3.11.9+...-x86_64-unknown-linux-gnu-install_only.tar.gz`
- **Linux ARM64**: `cpython-3.11.9+...-aarch64-unknown-linux-gnu-install_only.tar.gz`
- **Windows**: `cpython-3.11.9+...-x86_64-pc-windows-msvc-shared-install_only.tar.gz`
- **macOS**: `cpython-3.11.9+...-x86_64-apple-darwin-install_only.tar.gz`

**优点：**
- ✅ 上传即用，1分钟内完成配置
- ✅ 包含完整的Python和pip
- ✅ 无需编译，不需要系统依赖
- ✅ 跨平台支持，适用于所有环境

**Docker环境用户：**
- 系统已预装Python 3.12，路径：`/usr/bin/python3.12` 或 `/usr/bin/python3`
- 可直接使用系统Python，或上传python-build-standalone以获得更好的隔离性

---

## 3. 安装pip（如果Python不包含pip）

**下载地址：**
- PyPI官方: https://pypi.org/project/pip/#files
- 清华镜像: https://pypi.tuna.tsinghua.edu.cn/simple/pip/

**选择文件：**
- `pip-24.0-py3-none-any.whl` （适用于所有Python 3.x）

**在Web界面操作：**
1. 进入"Python环境管理"
2. 点击"配置/离线包"
3. 上传pip的whl文件
4. 系统会自动安装并配置

---

## 4. 创建上下文变量（可选）

在"上下文变量管理"中创建全局变量，供工作流使用。

---

## 5. 创建自定义代码块
> 如果是用我的一些测试，那就要修改一下环境在运行

在"代码块管理"中创建可复用的Python代码块。

---

## 6. 编排和测试工作流

在"流程编排"界面拖拽代码块，构建工作流并测试执行。

# 注意
1. 数据初始化 [doc](doc)
