# Block Flow
Block Flow 是一个基于 Blockly 的可视化工作流编排系统，允许用户通过拖拽代码块的方式构建和执行自动化工作流。系统内置 Python 脚本执行引擎，支持自定义代码块、环境变量管理、多环境配置等功能。

# 待办


# run
初始化数据 [doc](doc), 默认库名：db_block_flow

## 源码运行
1. 运行api项目 ，注意数据库地址和账户密码，库会自己创建不用管
2. 运行web前端 `npm install && npm run dev`

## docker运行
    
**📚 Dockerfile详细说明：** [查看Dockerfile使用指南](api/DOCKERFILE-GUIDE.md)
> 不建议映射`-v $(pwd)/python-envs:/app/python-envs \` 会导致很多问题
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
```


# 第一次使用

## 1. 初始化数据
执行 [api/doc](doc) 目录下的SQL脚本，默认库名：`db_block_flow`

## 2. 创建Python环境并上传运行时

### 方案一：预编译Python运行时（强烈推荐）⭐

**下载地址：** https://github.com/astral-sh/python-build-standalone/releases

**选择文件：**
- **Windows**: `cpython-3.11.9+...-x86_64-pc-windows-msvc-shared-install_only.tar.gz`
- **Linux x86_64**: `cpython-3.11.9+...-x86_64-unknown-linux-gnu-install_only.tar.gz`
- **Linux ARM64**: `cpython-3.11.9+...-aarch64-unknown-linux-gnu-install_only.tar.gz`
- **macOS**: `cpython-3.11.9+...-x86_64-apple-darwin-install_only.tar.gz`

**优点：**
- ✅ 上传即用，1分钟内完成配置
- ✅ 包含完整的Python和pip
- ✅ 无需编译，不需要系统依赖
- ✅ 支持所有Docker镜像版本

---

### 方案二：Python源代码编译（不推荐）

**仅在使用Debian镜像时支持！Alpine镜像不支持源码编译！**

**下载地址：** https://www.python.org/ftp/python/

**选择文件：**
- `Python-3.11.9.tgz` 或 `Python-3.12.5.tgz`

**注意事项：**
- ⏱️ 编译耗时10-30分钟
- 💾 需要足够的磁盘空间和内存
- ⚠️ 可能因缺少系统依赖而失败
- ❌ Alpine镜像无法编译源代码
- ⚠️ **编译时不会安装pip**（避免ensurepip失败）
  - 编译完成后需要手动上传 `pip.whl` 文件
  - pip下载地址: https://pypi.org/project/pip/#files

---

### 方案三：Windows Embed版本（仅Windows宿主机）

**下载地址：** https://www.python.org/ftp/python/3.12.5/

**选择文件：**
- `python-3.12.5-embed-amd64.zip`

**限制：**
- 仅适用于Windows宿主机
- 不包含pip，需要手动上传pip包
- 功能受限

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

在"代码块管理"中创建可复用的Python代码块。

---

## 6. 编排和测试工作流

在"流程编排"界面拖拽代码块，构建工作流并测试执行。

# 注意
1. 数据初始化 [doc](doc)
