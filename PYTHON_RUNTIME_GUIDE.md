# Python运行时环境上传使用指南

## 功能概述

BlockFlow系统现已支持**完整Python运行时环境上传**功能，您可以通过以下三种方式配置Python环境：

1. **手动配置路径** - 直接填写系统已安装的Python路径
2. **上传Python运行时** - 上传完整的Python环境压缩包（推荐）
3. **自动检测** - 系统自动扫描并检测Python安装

---

## 方式1：手动配置Python解释器路径

### 步骤

1. 创建Python环境
```bash
POST /python-envs
{
  "name": "生产环境",
  "pythonVersion": "3.11",
  "pythonExecutable": "/usr/bin/python3",  # 手动指定路径
  "description": "生产环境Python3.11"
}
```

2. 初始化环境目录
```bash
POST /python-envs/{id}/initialize
```

### 适用场景
- 系统已安装Python
- 明确知道Python可执行文件路径
- 快速配置测试环境

---

## 方式2：上传完整Python运行时（推荐）

### 准备Python运行时压缩包

#### Linux/Unix环境

**选项A：使用Python Standalone Builds（推荐）**
```bash
# 下载Python独立构建版本
wget https://github.com/indygreg/python-build-standalone/releases/download/20240107/cpython-3.11.7+20240107-x86_64-unknown-linux-gnu-install_only.tar.gz

# 或使用国内镜像
wget https://mirrors.tuna.tsinghua.edu.cn/python-build-standalone/cpython-3.11.7+20240107-x86_64-unknown-linux-gnu-install_only.tar.gz
```

**选项B：使用系统Python创建便携版**
```bash
# 安装virtualenv
pip install virtualenv

# 创建虚拟环境
virtualenv --always-copy --relocatable python3.11-env

# 打包
tar -czf python3.11-runtime.tar.gz python3.11-env/
```

#### Windows环境

**选项A：使用Python Embeddable Package**
```powershell
# 下载Python嵌入式版本
# 访问 https://www.python.org/downloads/windows/
# 下载 "Windows embeddable package (64-bit)"

# 解压后打包为zip
Compress-Archive -Path python-3.11.7-embed-amd64 -DestinationPath python3.11-runtime.zip
```

**选项B：使用WinPython**
```powershell
# 下载WinPython：https://winpython.github.io/
# 解压后打包python目录
Compress-Archive -Path WinPython\python-3.11.7.amd64 -DestinationPath python3.11-runtime.zip
```

### 上传步骤

#### 步骤1：创建Python环境
```bash
POST /python-envs
{
  "name": "离线Python3.11",
  "pythonVersion": "3.11",
  "description": "上传的完整Python运行时"
}
```

#### 步骤2：初始化环境
```bash
POST /python-envs/{id}/initialize
```

#### 步骤3：上传Python运行时
```bash
POST /python-envs/{id}/runtime/upload
Content-Type: multipart/form-data

file: python3.11-runtime.zip  # 或 .tar.gz
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "fileName": "python3.11-runtime.zip",
    "fileSize": 45678901,
    "uploadTime": "2025-01-19T10:30:45",
    "extractPath": "/opt/app/python-envs/1/runtime/python",
    "pythonExecutable": "/opt/app/python-envs/1/runtime/python/bin/python3",
    "pythonVersion": "3.11.7",
    "sitePackagesPath": "/opt/app/python-envs/1/runtime/python/lib/python3.11/site-packages"
  }
}
```

#### 步骤4：验证环境
```bash
GET /python-envs/{id}
```

### 系统自动处理流程

上传后，系统会自动：

1. **保存压缩包** 到 `{env-root}/runtime/` 目录
2. **解压文件** 到 `{env-root}/runtime/python/` 目录
3. **检测Python可执行文件**
   - 扫描常见路径：`bin/`, `Scripts/`, 根目录
   - 递归搜索（深度限制3层）
   - 支持文件名：`python3`, `python`, `python.exe`, `python3.exe`
4. **检测Python版本** - 执行 `python --version`
5. **检测site-packages路径**
   - 扫描常见路径：`lib/site-packages`, `Lib/site-packages`
   - 递归搜索（深度限制5层）
6. **更新环境配置** - 自动填充 `pythonExecutable`, `pythonVersion`, `sitePackagesPath`
7. **设置可执行权限** - 为bin/Scripts目录下的文件设置执行权限

### 支持的压缩格式
- `.zip` - 使用Java内置ZipInputStream解压
- `.tar.gz` - 使用系统tar命令解压
- `.tgz` - 同tar.gz

### 文件大小限制
- 最大上传大小：**2GB**
- 配置位置：`application.yaml` 中的 `spring.servlet.multipart.max-file-size`

---

## 方式3：自动检测Python路径

### 使用场景
- 已通过其他方式上传Python文件到服务器
- 手动拷贝Python环境到指定目录
- 需要重新检测Python路径

### 操作步骤

1. 确保Python文件已放置在环境目录中
```bash
# 目录结构示例
/opt/app/python-envs/1/
├── bin/
│   └── python3
├── lib/
│   └── python3.11/
│       └── site-packages/
└── ...
```

2. 调用自动检测API
```bash
POST /python-envs/{id}/detect-python
```

3. 系统返回检测结果
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "测试环境",
    "pythonExecutable": "/opt/app/python-envs/1/bin/python3",
    "pythonVersion": "3.11.7",
    "sitePackagesPath": "/opt/app/python-envs/1/lib/python3.11/site-packages"
  }
}
```

---

## 目录结构说明

### 环境目录结构
```
${python.env.root-path}/              # 配置的根目录（默认：./python-envs）
├── 1/                                # 环境ID=1
│   ├── runtime/                      # Python运行时目录
│   │   ├── python3.11-runtime.zip    # 上传的压缩包
│   │   └── python/                   # 解压后的Python环境
│   │       ├── bin/                  # 可执行文件目录
│   │       │   ├── python3           # Python解释器
│   │       │   └── pip3              # pip工具
│   │       └── lib/                  # 库文件目录
│   │           └── python3.11/
│   │               └── site-packages/
│   ├── lib/                          # 用户依赖包目录
│   │   └── site-packages/            # pip --target安装目标
│   └── packages/                     # 离线.whl包存储
│       ├── requests-2.28.0.whl
│       └── numpy-1.24.0.whl
├── 2/                                # 环境ID=2
│   └── ...
└── 3/                                # 环境ID=3
    └── ...
```

### PYTHONPATH设置

执行脚本时，系统自动设置：
```bash
PYTHONPATH={sitePackagesPath}:{PYTHONPATH}
```

优先级：
1. `{env-root}/lib/site-packages` - 用户安装的包
2. `{runtime}/python/lib/pythonX.X/site-packages` - 运行时自带的包

---

## 完整使用流程示例

### 场景：在离线环境部署Python环境

#### 1. 在有网络的环境准备Python运行时

```bash
# 下载Python独立构建
wget https://github.com/indygreg/python-build-standalone/releases/download/20240107/cpython-3.11.7+20240107-x86_64-unknown-linux-gnu-install_only.tar.gz

# 重命名
mv cpython-3.11.7+20240107-x86_64-unknown-linux-gnu-install_only.tar.gz python3.11-runtime.tar.gz

# 下载常用依赖包
pip download requests numpy pandas -d packages/
```

#### 2. 在BlockFlow系统创建环境

```bash
# 创建环境
curl -X POST http://localhost:8777/python-envs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "离线生产环境",
    "pythonVersion": "3.11",
    "description": "完全离线的Python环境"
  }'

# 假设返回环境ID=1
```

#### 3. 初始化并上传运行时

```bash
# 初始化环境目录
curl -X POST http://localhost:8777/python-envs/1/initialize

# 上传Python运行时
curl -X POST http://localhost:8777/python-envs/1/runtime/upload \
  -F "file=@python3.11-runtime.tar.gz"

# 系统自动检测并配置Python路径
```

#### 4. 上传并安装离线依赖包

```bash
# 上传requests包
curl -X POST http://localhost:8777/python-envs/1/packages/upload \
  -F "file=@packages/requests-2.28.0-py3-none-any.whl"

# 安装requests包
curl -X POST http://localhost:8777/python-envs/1/packages/install/requests-2.28.0-py3-none-any.whl

# 重复以上步骤安装其他包
```

#### 5. 验证环境

```bash
# 获取环境详情
curl http://localhost:8777/python-envs/1

# 查看已安装包
curl http://localhost:8777/python-envs/1/packages/files
```

#### 6. 在Block中使用该环境

```bash
# 创建使用该环境的Block
curl -X POST http://localhost:8777/blocks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "数据处理块",
    "typeCode": "data_process",
    "pythonEnvId": 1,
    "script": "import requests\nimport numpy as np\ndef execute(context, inputs):\n    return {\"result\": \"success\"}"
  }'
```

---

## API文档总览

### Python运行时管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/python-envs` | 创建Python环境 |
| POST | `/python-envs/{id}/initialize` | 初始化环境目录 |
| POST | `/python-envs/{id}/runtime/upload` | 上传Python运行时 |
| POST | `/python-envs/{id}/detect-python` | 自动检测Python路径 |
| GET | `/python-envs/{id}` | 获取环境详情 |
| PUT | `/python-envs` | 更新环境配置 |

### 离线包管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/python-envs/{id}/packages/upload` | 上传离线包 |
| POST | `/python-envs/{id}/packages/install/{fileName}` | 安装离线包 |
| GET | `/python-envs/{id}/packages/files` | 列出已上传包 |
| DELETE | `/python-envs/{id}/packages/files/{fileName}` | 删除包文件 |

---

## 常见问题

### Q1: 上传失败，提示文件过大
**A:** 检查配置文件 `application.yaml`：
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 2GB
      max-request-size: 2GB
```

### Q2: 检测不到Python可执行文件
**A:**
1. 确保压缩包结构正确，Python可执行文件在 `bin/` 或 `Scripts/` 目录
2. 手动指定 `pythonExecutable` 路径
3. 检查文件权限，确保可执行

### Q3: 运行脚本时找不到模块
**A:**
1. 确认包已通过 `/packages/install/` 接口安装
2. 检查 `sitePackagesPath` 是否正确配置
3. 查看环境详情确认包已记录在 `packages` 字段中

### Q4: Windows环境tar.gz解压失败
**A:**
- Windows下建议使用.zip格式
- 或安装Git Bash/Cygwin提供tar命令
- 或使用手动解压+自动检测的方式

### Q5: Python版本检测不正确
**A:**
1. 确保Python可执行文件有执行权限
2. 手动更新 `pythonVersion` 字段
3. 重新调用 `/detect-python` 接口

---

## 配置参数说明

### application.yaml配置

```yaml
# Python环境配置
python:
  env:
    # 环境根目录（支持环境变量覆盖）
    root-path: ${PYTHON_ENV_ROOT_PATH:${user.dir}/python-envs}

# 文件上传配置
spring:
  servlet:
    multipart:
      max-file-size: 2GB        # 单个文件最大2GB
      max-request-size: 2GB     # 请求总大小最大2GB
```

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PYTHON_ENV_ROOT_PATH | `${user.dir}/python-envs` | Python环境根目录 |
| FILE_MAX_SIZE | 2GB | 单个文件大小限制 |
| FILE_MAX_REQUEST | 2GB | 请求总大小限制 |

---

## 安全建议

1. **限制上传文件大小** - 根据实际需求调整配置
2. **验证压缩包内容** - 系统会验证是否包含Python可执行文件
3. **隔离环境目录** - 每个环境独立目录，避免冲突
4. **定期清理** - 删除不用的环境和压缩包
5. **备份重要环境** - 导出requirements.txt保存依赖

---

## 技术实现说明

### 自动检测逻辑

1. **Python可执行文件检测**
   - 优先搜索常见路径：`bin/`, `Scripts/`
   - 支持文件名：`python3`, `python`, `python.exe`, `python3.exe`
   - 递归搜索（深度限制3层）
   - 检查文件可执行权限

2. **版本检测**
   - 执行：`{pythonExecutable} --version`
   - 解析输出：`Python X.X.X`
   - 提取版本号更新到数据库

3. **site-packages检测**
   - 优先搜索常见路径：`lib/site-packages`, `Lib/site-packages`
   - 递归搜索（深度限制5层）
   - 匹配目录名：`site-packages`

### 压缩包解压

- **ZIP格式**：使用Java `ZipInputStream`
- **TAR.GZ格式**：使用系统 `tar -xzf` 命令
- **权限处理**：自动为bin/Scripts目录设置可执行权限

---

## 更新日志

### v1.0.0 (2025-01-19)
- 支持完整Python运行时上传
- 支持.zip和.tar.gz压缩格式
- 自动检测Python可执行文件路径
- 自动检测Python版本
- 自动检测site-packages路径
- 支持手动配置、上传、自动检测三种方式

---

## 联系支持

如有问题，请联系技术支持或查看系统日志：
```bash
tail -f logs/application.log | grep Python
```
