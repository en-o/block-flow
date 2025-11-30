# Python 环境管理 - 设计与使用说明

## 📋 目录

1. [系统概述](#系统概述)
2. [核心功能](#核心功能)
3. [架构设计](#架构设计)
4. [使用场景](#使用场景)
5. [快速开始](#快速开始)
6. [详细功能说明](#详细功能说明)
7. [最佳实践](#最佳实践)
8. [常见问题](#常见问题)

---

## 系统概述

Python 环境管理系统是 BlockFlow 的核心组件，用于管理多个独立的 Python 运行环境，支持在线/离线包管理，为块（Block）的执行提供隔离的依赖环境。

### 核心特性

- ✅ **多环境管理**：支持创建和管理多个独立的 Python 环境
- ✅ **在线安装**：支持通过 pip 在线安装 Python 包
- ✅ **离线安装**：支持上传 `.whl` 和 `.tar.gz` 格式的离线包
- ✅ **运行时管理**：支持上传完整的 Python 运行时（适用于离线环境）
- ✅ **自动检测**：自动检测 Python 解释器路径和版本
- ✅ **依赖追踪**：记录包的安装方式、版本和来源
- ✅ **智能提示**：块测试失败时自动提示缺失依赖并快速跳转

---

## 核心功能

### 1. 环境管理

```
┌─────────────────────────────────────────┐
│  Python 环境列表                         │
├─────────────────────────────────────────┤
│  • 创建新环境                            │
│  • 编辑环境配置                          │
│  • 删除环境                              │
│  • 设置默认环境                          │
│  • 导出 requirements.txt                │
└─────────────────────────────────────────┘
```

### 2. 运行时配置

```
┌─────────────────────────────────────────┐
│  Python 运行时配置方式                   │
├─────────────────────────────────────────┤
│  方式1: 手动配置路径                     │
│         └─ 指定系统已安装的 Python      │
│                                          │
│  方式2: 上传运行时包                     │
│         └─ 上传 .zip/.tar.gz 压缩包     │
│         └─ 自动解压和检测               │
│                                          │
│  方式3: 稍后配置                         │
│         └─ 创建后再配置                 │
└─────────────────────────────────────────┘
```

### 3. 包管理

```
┌─────────────────────────────────────────┐
│  包安装方式                              │
├─────────────────────────────────────────┤
│  在线安装（需要 pip）                    │
│  ├─ 从 PyPI 安装                        │
│  ├─ 指定版本                            │
│  └─ 自动解析依赖                        │
│                                          │
│  离线安装（无需 pip）                    │
│  ├─ 上传 .whl 文件                      │
│  ├─ 上传 .tar.gz 文件                   │
│  └─ 直接解压到 site-packages           │
└─────────────────────────────────────────┘
```

---

## 架构设计

### 1. 数据模型

```java
PythonEnvironment {
    Long id;                           // 环境ID
    String name;                       // 环境名称
    String pythonVersion;              // Python版本（如：3.9.7）
    String description;                // 描述
    String pythonExecutable;           // Python解释器路径
    String sitePackagesPath;           // site-packages路径
    String envRootPath;                // 环境根目录
    Boolean isDefault;                 // 是否为默认环境
    Map<String, Object> packages;      // 已安装的包
    Date createTime;                   // 创建时间
}
```

### 2. 包信息结构

```json
{
  "packages": {
    "requests": {
      "version": "2.28.0",
      "installMethod": "pip",              // pip | offline
      "installedAt": "2025-01-21T10:30:00",
      "installedFrom": null
    },
    "numpy": {
      "version": "1.24.0",
      "installMethod": "offline",
      "installedAt": "2025-01-21T11:00:00",
      "installedFrom": "numpy-1.24.0-cp39-win_amd64.whl"
    }
  }
}
```

### 3. 目录结构

```
block-flow/
├── python-envs/              # Python 环境根目录
│   ├── env-1/               # 环境1
│   │   ├── python/          # Python 运行时
│   │   │   ├── python.exe   # Python 解释器
│   │   │   ├── Lib/
│   │   │   │   └── site-packages/  # 已安装的包
│   │   │   └── Scripts/
│   │   │       └── pip.exe  # pip 工具
│   │   └── uploaded/        # 上传的离线包
│   │       ├── requests-2.28.0.whl
│   │       └── numpy-1.24.0.whl
│   ├── env-2/               # 环境2
│   └── env-3/               # 环境3
└── blocks/                   # 块脚本目录
```

---

## 使用场景

### 场景1：在线环境 - 使用系统 Python

**适用情况**：服务器已安装 Python 且可以访问互联网

```
步骤：
1. 创建环境 → 选择"手动配置路径"
2. 输入 Python 路径：/usr/bin/python3
3. 保存环境
4. 进入"管理包" → 在线安装依赖
```

**优点**：
- ✅ 配置简单
- ✅ 可以使用 pip 在线安装
- ✅ 自动解析依赖

**缺点**：
- ❌ 需要网络连接
- ❌ 依赖系统 Python

### 场景2：离线环境 - 上传 Python 运行时（推荐）

**适用情况**：服务器无法访问互联网，需要完全离线部署

**推荐使用预编译Python运行时（python-build-standalone）**

```
步骤：
1. 下载预编译Python运行时
   - 地址: https://github.com/astral-sh/python-build-standalone/releases
   - 推荐: cpython-3.11.9+...-install_only.tar.gz
2. 创建环境 → 选择"上传运行时"
3. 上传下载的压缩包
4. 系统自动解压、检测 Python 路径和pip
5. 如缺少pip，上传 pip 的 whl 包（pip-24.0-py3-none-any.whl）
6. 上传其他依赖的 whl 包
```

**优点**：
- ✅ 完全离线可用
- ✅ 环境独立隔离
- ✅ 可迁移性强
- ✅ 无需编译，即装即用

**缺点**：
- ❌ 需要手动下载所有依赖
- ❌ 初始配置需要一定学习

### 场景3：混合模式 - 在线 + 离线

**适用情况**：部分包可以在线安装，部分需要离线安装

```
步骤：
1. 创建环境 → 配置 Python 路径
2. 常用包通过 pip 在线安装
3. 特殊包（如 binary 包）通过离线上传
```

**优点**：
- ✅ 灵活性高
- ✅ 充分利用网络和离线资源

---

## 快速开始

### 第一步：创建 Python 环境

#### 方式 A：使用系统 Python（推荐在线环境）

1. 进入 **管理后台** → **Python 环境**
2. 点击 **新建 Python 环境**
3. 填写基本信息：
   ```
   环境名称：python39-prod
   Python 版本：3.9.7
   描述：生产环境 Python 3.9
   ```
4. 选择配置方式：**手动配置路径**
5. 输入 Python 解释器路径：
   - Windows: `C:\Python39\python.exe`
   - Linux: `/usr/bin/python3`
6. 点击 **保存**

#### 方式 B：上传 Python 运行时（推荐离线环境）

1. **下载预编译Python运行时（python-build-standalone）**：
   - 下载地址: https://github.com/astral-sh/python-build-standalone/releases
   - **Linux x86_64**: `cpython-3.11.9+20240726-x86_64-unknown-linux-gnu-install_only.tar.gz`
   - **Linux ARM64**: `cpython-3.11.9+20240726-aarch64-unknown-linux-gnu-install_only.tar.gz`
   - **Windows**: `cpython-3.11.9+...-x86_64-pc-windows-msvc-shared-install_only.tar.gz`
2. 创建环境时选择：**上传运行时**
3. 选择下载的压缩包上传
4. 系统自动解压、检测并配置

### 第二步：安装依赖包

#### 在线安装（需要 pip）

1. 点击环境的 **管理包** 按钮
2. 在"安装新包"区域输入：
   ```
   包名：requests
   版本：2.28.0（可选，留空安装最新版）
   ```
3. 点击 **安装**
4. 查看安装日志，等待完成

#### 离线安装（无需 pip）

1. 下载所需的 whl 包：
   - PyPI: https://pypi.org/project/requests/#files
   - 清华镜像: https://pypi.tuna.tsinghua.edu.cn/simple/requests/
2. 点击环境的 **配置/离线包** 按钮
3. 点击 **选择文件上传并安装**
4. 选择下载的 `.whl` 或 `.tar.gz` 文件
5. 等待上传和安装完成

### 第三步：在块中使用环境

1. 创建或编辑块
2. 在块配置中选择 **Python 环境**：
   ```
   Python 环境: python39-prod
   ```
3. 在脚本中引入已安装的包：
   ```python
   import requests

   url = inputs.get('url', 'https://api.example.com')
   response = requests.get(url)

   outputs = {
       "status_code": response.status_code,
       "data": response.json()
   }
   ```

---

## 详细功能说明

### 1. 环境列表管理

#### 功能按钮说明

| 按钮 | 图标 | 功能 | 说明 |
|------|------|------|------|
| 设为默认 | ⭐ | 设置默认环境 | 新建块时自动选择此环境 |
| 管理包 | ⚡ | 在线包管理 | 打开在线安装/卸载包的弹窗 |
| 配置/离线包 | 📤 | 运行时和离线包管理 | 上传 Python 运行时和离线包 |
| 导出 | 📥 | 导出 requirements.txt | 导出已安装包列表 |
| 编辑 | ✏️ | 编辑环境 | 修改环境名称、描述等 |
| 删除 | 🗑️ | 删除环境 | 删除环境（默认环境不可删除） |

#### 环境状态标识

```
┌──────────────────────────────────────┐
│ python39-prod  [默认] [3个包]        │
│ Python版本: 3.9.7                    │
│ 描述: 生产环境                        │
├──────────────────────────────────────┤
│ 状态指示:                             │
│ • 🟢 已配置运行时 + 有 pip           │
│ • 🟡 已配置运行时 + 无 pip           │
│ • 🔴 未配置运行时（必须配置）         │
└──────────────────────────────────────┘
```

### 2. 运行时配置详解

#### 上传 Python 运行时

**支持的文件格式**：
- `.zip` - ZIP 压缩包
- `.tar.gz` - GZip 压缩的 TAR 归档
- `.tgz` - GZip 压缩的 TAR 归档

**文件大小限制**：最大 2GB

**自动检测项目**：
1. ✅ Python 解释器路径
2. ✅ Python 版本
3. ✅ site-packages 路径
4. ✅ pip 是否可用

**检测结果示例**：
```
✓ Python运行时配置成功

Python路径: C:\...\python-envs\env-1\python\python.exe
Python版本: 3.9.7
site-packages: C:\...\python-envs\env-1\python\Lib\site-packages
pip状态: ✓ 已安装
```

#### 手动配置路径

适用于使用系统已安装的 Python：

```
Windows 常见路径：
  C:\Python39\python.exe
  C:\Users\<用户名>\AppData\Local\Programs\Python\Python39\python.exe

Linux 常见路径：
  /usr/bin/python3
  /usr/local/bin/python3
  ~/anaconda3/bin/python

macOS 常见路径：
  /usr/bin/python3
  /usr/local/bin/python3
  /Library/Frameworks/Python.framework/Versions/3.9/bin/python3
```

#### 自动检测

系统会尝试在已上传的运行时目录中自动查找：
- `python.exe`（Windows）
- `python`、`python3`（Linux/macOS）

### 3. 包管理详解

#### 在线安装流程

```mermaid
graph LR
    A[输入包名] --> B[可选:指定版本]
    B --> C[点击安装]
    C --> D{环境检查}
    D -->|有pip| E[执行pip install]
    D -->|无pip| F[提示上传pip包]
    E --> G[更新包列表]
    G --> H[显示安装日志]
```

**安装命令**：
```bash
python -m pip install <package>==<version>
```

**日志示例**：
```
开始在线安装 requests==2.28.0...
执行命令: python -m pip install requests==2.28.0
Collecting requests...
正在解析依赖关系...
正在下载包...
正在安装...
✓ Successfully installed requests
✓ 包 requests 安装成功！
```

#### 离线安装流程

```mermaid
graph LR
    A[选择.whl/.tar.gz] --> B[上传文件]
    B --> C[解压到site-packages]
    C --> D[更新包列表]
    D --> E{是pip包?}
    E -->|是| F[配置._pth文件]
    E -->|否| G[完成]
    F --> G
```

**支持的包格式**：
1. **Wheel 包（.whl）**：推荐格式，即装即用
   ```
   示例: requests-2.28.0-py3-none-any.whl
   ```

2. **源代码包（.tar.gz）**：需要解压
   ```
   示例: requests-2.28.0.tar.gz
   ```

**命名规则识别**：
```
requests-2.28.0-py3-none-any.whl
  ↓         ↓      ↓    ↓    ↓
包名     版本  Python版本 系统 架构

numpy-1.24.0-cp39-cp39-win_amd64.whl
  ↓      ↓      ↓    ↓      ↓
包名  版本  CPython3.9  Windows AMD64
```

#### 包冲突检测

系统会自动检测包是否已安装：

```
情况1: 包已存在（在线安装）
  → 弹出确认对话框
  → 显示当前版本 vs 请求版本
  → 允许用户选择是否继续

情况2: 包已存在（离线上传）
  → 阻止上传
  → 提示先卸载现有包
  → 然后再上传新版本
```

#### 卸载包

```
在线安装的包:
  • 卸载包
  • 不删除离线包文件

离线安装的包:
  • 卸载包
  • 同时删除离线包文件
```

### 4. 特殊功能：pip 包管理

#### 为什么需要 pip？

```
有 pip:
  ✓ 可以在线安装任何包
  ✓ 自动解析依赖
  ✓ 下载最新版本

无 pip:
  ✗ 只能离线上传
  ✗ 手动管理依赖
  ✗ 需要预先下载
```

#### 如何添加 pip？

1. **下载 pip 的 whl 包**：
   - PyPI: https://pypi.org/project/pip/#files
   - 推荐: `pip-24.0-py3-none-any.whl`（通用版本）

2. **上传 pip 包**：
   - 进入 **配置/离线包** → 上传 pip 的 whl 文件
   - 系统会自动识别这是 pip 包
   - 自动配置 Python 模块搜索路径

3. **验证**：
   - 上传成功后，环境状态变为 "✓ 已安装 pip"
   - 可以使用在线安装功能

#### pip 配置原理（Windows embeddable）

系统会自动修改 `python39._pth` 文件：

```python
# 原始内容
python39.zip
.

# 修改后（添加 site-packages 路径）
python39.zip
.
Lib/site-packages
```

---

## 最佳实践

### 1. 环境命名规范

```
推荐命名格式: <python版本>-<用途>

示例:
  python39-prod    # Python 3.9 生产环境
  python38-dev     # Python 3.8 开发环境
  python311-ml     # Python 3.11 机器学习环境
  python39-web     # Python 3.9 Web 爬虫环境
```

### 2. 包版本管理

#### 固定版本（推荐）

```python
# requirements.txt
requests==2.28.0
numpy==1.24.0
pandas==1.5.3
```

**优点**：
- ✅ 环境可复现
- ✅ 避免版本冲突
- ✅ 便于调试

#### 最新版本（不推荐生产环境）

```python
# requirements.txt
requests
numpy
pandas
```

**缺点**：
- ❌ 版本不确定
- ❌ 可能引入 breaking changes
- ❌ 难以复现问题

### 3. 环境隔离策略

```
方案1: 按业务类型隔离
  ├── web-scraping-env    # Web 爬虫相关
  ├── data-analysis-env   # 数据分析相关
  ├── ml-env              # 机器学习相关
  └── api-env             # API 调用相关

方案2: 按 Python 版本隔离
  ├── python38-env        # Python 3.8
  ├── python39-env        # Python 3.9
  └── python311-env       # Python 3.11

方案3: 按环境类型隔离
  ├── dev-env             # 开发环境
  ├── test-env            # 测试环境
  └── prod-env            # 生产环境
```

### 4. 离线包准备清单

```bash
# 1. 下载预编译 Python 运行时（python-build-standalone，推荐）
# https://github.com/astral-sh/python-build-standalone/releases
cpython-3.11.9+20240726-x86_64-unknown-linux-gnu-install_only.tar.gz  # Linux x86_64
cpython-3.11.9+20240726-aarch64-unknown-linux-gnu-install_only.tar.gz # Linux ARM64
cpython-3.11.9+...-x86_64-pc-windows-msvc-shared-install_only.tar.gz  # Windows

# 2. 下载 pip
pip-24.0-py3-none-any.whl

# 3. 下载常用基础包
setuptools-65.5.0-py3-none-any.whl
wheel-0.38.4-py3-none-any.whl

# 4. 下载项目依赖（示例）
requests-2.28.0-py3-none-any.whl
certifi-2022.12.7-py3-none-any.whl
charset-normalizer-2.1.1-py3-none-any.whl
idna-3.4-py3-none-any.whl
urllib3-1.26.13-py2.py3-none-any.whl
```

### 5. 常用下载源

#### 国内镜像（推荐）

```
清华大学镜像:
  https://pypi.tuna.tsinghua.edu.cn/simple/

阿里云镜像:
  https://mirrors.aliyun.com/pypi/simple/

淘宝镜像（Python 运行时）:
  https://registry.npmmirror.com/binary.html?path=python/
```

#### 官方源

```
PyPI:
  https://pypi.org/

Python 官方 FTP:
  https://www.python.org/ftp/python/
```

---

## 常见问题

### Q1: 上传 Python 运行时后无法检测到 pip？

**原因**：
- Python embeddable 版本默认不包含 pip
- 需要手动上传 pip 的 whl 包

**解决方案**：
```
1. 下载 pip-24.0-py3-none-any.whl
2. 进入"配置/离线包" → 上传 pip 包
3. 系统会自动配置 site-packages 路径
4. 刷新页面，pip 状态变为"已安装"
```

### Q2: 离线上传包后，import 时找不到模块？

**可能原因**：
1. 包的 Python 版本不匹配
2. 包的平台不匹配（Windows/Linux）
3. 包依赖其他包

**解决方案**：
```
1. 检查包的命名：
   numpy-1.24.0-cp39-cp39-win_amd64.whl
   ↑ 必须匹配：cp39 = Python 3.9
   ↑ 必须匹配：win_amd64 = Windows 64位

2. 查看包依赖：
   pip show <package>  # 在本地执行

3. 上传所有依赖包
```

### Q3: 在线安装时提示"该环境未配置Python解释器路径"？

**原因**：
- 环境的 `pythonExecutable` 字段为空
- 需要先配置 Python 运行时

**解决方案**：
```
1. 点击"配置/离线包"按钮
2. 选择以下方式之一：
   • 上传 Python 运行时
   • 自动检测 Python 路径
3. 配置完成后，即可使用在线安装
```

### Q4: 为什么"管理包"和"配置/离线包"是两个不同的弹窗？

**设计理由**：
```
管理包（在线安装）:
  • 轻量级操作
  • 快速安装/卸载
  • 需要 pip 和网络

配置/离线包（运行时配置）:
  • 重量级操作
  • 配置 Python 运行时
  • 上传大文件
  • 完全离线
```

### Q5: 如何批量导入依赖？

**使用 requirements.txt**：

```
1. 准备 requirements.txt:
   requests==2.28.0
   numpy==1.24.0
   pandas==1.5.3

2. 进入"管理包" → 点击"导入 requirements.txt"

3. 粘贴内容 → 点击确认

4. 系统会逐个安装所有包
```

### Q6: 默认环境有什么用？

**作用**：
```
• 新建块时自动选择默认环境
• 简化操作流程
• 推荐设置：生产环境的稳定版本
```

**注意**：
```
• 默认环境不能删除
• 可以更换默认环境（设置其他环境为默认）
```

### Q7: 块测试时提示"ModuleNotFoundError"怎么办？

**自动跳转功能**：

```
1. 测试失败时，错误信息会显示：
   "ModuleNotFoundError: No module named 'requests'"

2. 自动提示：
   "💡 解决建议：该包未安装在Python环境中"
   "1. 在线安装: pip install requests"
   "2. 离线安装: 下载 requests 的 whl 包并上传"

3. 点击"前往Python环境管理"按钮
   → 自动打开对应环境的"管理包"弹窗
   → 可以立即在线安装缺失的包
```

### Q8: 如何选择 Python 版本？

**推荐版本**：
```
生产环境推荐:
  Python 3.9.x  # 稳定、广泛支持

开发环境可选:
  Python 3.10.x # 新特性
  Python 3.11.x # 性能提升
  Python 3.12.x # 最新版本

不推荐:
  Python 2.7.x  # 已停止维护
  Python 3.7.x  # 即将停止维护
```

### Q9: 离线环境如何准备所有依赖？

**完整流程**：

```bash
# 在有网络的机器上执行

# 1. 创建虚拟环境
python -m venv test_env
source test_env/bin/activate  # Linux/Mac
# 或
test_env\Scripts\activate  # Windows

# 2. 安装项目依赖
pip install -r requirements.txt

# 3. 下载所有包（包括依赖）
pip download -r requirements.txt -d packages/

# 4. 打包
tar -czf python-packages.tar.gz packages/

# 5. 传输到离线服务器

# 6. 在 BlockFlow 中逐个上传 whl 文件
```

### Q10: 如何迁移环境？

**方案1：导出 requirements.txt**

```
1. 在源环境：点击"导出"按钮
   → 下载 requirements.txt

2. 在目标环境：
   • 创建新环境
   • 导入 requirements.txt
   • 在线安装所有包
```

**方案2：离线包迁移**

```
1. 进入源环境的"配置/离线包"
   → 下载所有已上传的包文件

2. 在目标环境：
   • 创建新环境
   • 上传所有包文件
```

---

## 环境隔离实现原理

### 1. 隔离机制概述

BlockFlow 的 Python 环境隔离通过以下三个层次实现：

```
┌─────────────────────────────────────────────────┐
│  层次1: 目录隔离                                 │
│  • 每个环境有独立的根目录                       │
│  • 独立的 site-packages                         │
│  • 独立的包文件存储                             │
├─────────────────────────────────────────────────┤
│  层次2: 进程隔离                                 │
│  • 每次执行使用独立的 Python 进程               │
│  • 指定环境专属的解释器路径                     │
│  • 独立的环境变量                               │
├─────────────────────────────────────────────────┤
│  层次3: 数据隔离                                 │
│  • 环境元数据独立存储                           │
│  • 包列表按环境分组                             │
│  • 块与环境的关联关系                           │
└─────────────────────────────────────────────────┘
```

### 2. 目录隔离详解

#### 2.1 目录结构设计

```
block-flow/
├── python-envs/                     # 环境根目录
│   ├── env-{id}/                   # 环境目录（按ID隔离）
│   │   ├── python/                 # Python 运行时
│   │   │   ├── python.exe          # Python 解释器
│   │   │   ├── python39.dll        # 核心库
│   │   │   ├── python39._pth       # 模块搜索路径配置
│   │   │   ├── python39.zip        # 标准库
│   │   │   ├── Lib/                # 库目录
│   │   │   │   └── site-packages/  # 第三方包
│   │   │   │       ├── requests/   # 已安装的包
│   │   │   │       ├── numpy/
│   │   │   │       └── ...
│   │   │   └── Scripts/            # 可执行脚本
│   │   │       ├── pip.exe
│   │   │       └── ...
│   │   └── uploaded/               # 离线包存储
│   │       ├── requests-2.28.0.whl
│   │       └── numpy-1.24.0.whl
│   │
│   ├── env-{id+1}/                 # 另一个环境
│   │   ├── python/
│   │   └── uploaded/
│   │
│   └── env-{id+2}/                 # 第三个环境
│       ├── python/
│       └── uploaded/
│
└── temp/                            # 临时执行目录
    └── block-{id}-{timestamp}/     # 块执行的临时目录
        ├── script.py               # 执行脚本
        └── output.json             # 执行结果
```

#### 2.2 环境初始化流程

```java
// PythonEnvironmentServiceImpl.java

@Override
public void initializeEnvironment(Long envId) {
    PythonEnvironment env = repository.findById(envId)
        .orElseThrow(() -> new RuntimeException("环境不存在"));

    // 1. 创建环境根目录
    String envRoot = pythonEnvRootPath + "/env-" + envId;
    Path envPath = Paths.get(envRoot);
    Files.createDirectories(envPath);

    // 2. 创建子目录
    Path pythonPath = envPath.resolve("python");
    Path uploadedPath = envPath.resolve("uploaded");
    Files.createDirectories(pythonPath);
    Files.createDirectories(uploadedPath);

    // 3. 更新环境配置
    env.setEnvRootPath(envRoot);
    repository.save(env);
}
```

#### 2.3 site-packages 隔离

每个环境的 `site-packages` 目录完全独立：

```
环境1 (env-1):
  site-packages/
    ├── requests/         # 版本 2.28.0
    └── numpy/            # 版本 1.24.0

环境2 (env-2):
  site-packages/
    ├── requests/         # 版本 2.31.0 (不同版本)
    └── pandas/           # 不同的包

环境3 (env-3):
  site-packages/
    ├── tensorflow/       # 机器学习包
    └── scikit-learn/
```

**隔离效果**：
- ✅ 同一个包的不同版本可以共存
- ✅ 不同环境的包互不影响
- ✅ 每个环境都是干净的独立空间

### 3. 进程隔离详解

#### 3.1 执行脚本的隔离机制

```java
// PythonScriptExecutor.java

public Map<String, Object> executeScript(
    String script,
    Map<String, Object> inputs,
    PythonEnvironment environment
) {
    // 1. 获取环境专属的 Python 解释器
    String pythonExecutable = environment.getPythonExecutable();

    // 2. 创建临时执行目录（每次执行都是新的）
    String tempDir = createTempDirectory();
    File scriptFile = new File(tempDir, "script.py");

    // 3. 写入脚本
    Files.writeString(scriptFile.toPath(), script, StandardCharsets.UTF_8);

    // 4. 构建进程命令
    ProcessBuilder pb = new ProcessBuilder(
        pythonExecutable,      // 使用指定环境的 Python
        scriptFile.getAbsolutePath()
    );

    // 5. 设置工作目录（隔离）
    pb.directory(new File(tempDir));

    // 6. 设置环境变量（隔离）
    Map<String, String> env = pb.environment();
    env.put("PYTHONPATH", environment.getSitePackagesPath());
    env.put("PYTHONIOENCODING", "utf-8");

    // 7. 启动独立进程
    Process process = pb.start();

    // 8. 执行完成后清理
    cleanupTempDirectory(tempDir);
}
```

#### 3.2 进程级别的隔离保障

```
块A执行（环境1）:
  ├─ 进程ID: 12345
  ├─ Python: /path/to/env-1/python/python.exe
  ├─ site-packages: /path/to/env-1/python/Lib/site-packages
  ├─ 工作目录: /temp/block-1-20250121-120000
  └─ 环境变量:
      • PYTHONPATH=/path/to/env-1/python/Lib/site-packages
      • PYTHONIOENCODING=utf-8

块B执行（环境2）:
  ├─ 进程ID: 12346 (不同的进程)
  ├─ Python: /path/to/env-2/python/python.exe (不同的解释器)
  ├─ site-packages: /path/to/env-2/python/Lib/site-packages
  ├─ 工作目录: /temp/block-2-20250121-120001 (不同的目录)
  └─ 环境变量:
      • PYTHONPATH=/path/to/env-2/python/Lib/site-packages
      • PYTHONIOENCODING=utf-8
```

**隔离效果**：
- ✅ 不同块的执行互不干扰
- ✅ 即使同时执行，也是独立的进程
- ✅ 进程崩溃不会影响其他块
- ✅ 内存、CPU 资源独立计算

### 4. 数据隔离详解

#### 4.1 数据库层面的隔离

```sql
-- 环境表（每个环境独立一行）
CREATE TABLE python_environment (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    python_executable VARCHAR(500),     -- 环境专属的解释器路径
    site_packages_path VARCHAR(500),    -- 环境专属的 site-packages
    env_root_path VARCHAR(500),         -- 环境根目录
    packages JSON,                      -- 环境的包列表（JSON字段）
    is_default BOOLEAN,
    create_time DATETIME
);

-- 块表（关联到环境）
CREATE TABLE block (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    script TEXT,
    python_env_id BIGINT,               -- 关联到具体环境
    FOREIGN KEY (python_env_id) REFERENCES python_environment(id)
);
```

#### 4.2 包列表的隔离存储

```json
// 环境1的包列表
{
  "id": 1,
  "name": "python39-prod",
  "packages": {
    "requests": {
      "version": "2.28.0",
      "installMethod": "pip",
      "installedAt": "2025-01-21T10:00:00"
    },
    "numpy": {
      "version": "1.24.0",
      "installMethod": "offline",
      "installedFrom": "numpy-1.24.0.whl"
    }
  }
}

// 环境2的包列表（完全独立）
{
  "id": 2,
  "name": "python39-dev",
  "packages": {
    "requests": {
      "version": "2.31.0",      // 不同版本
      "installMethod": "pip"
    },
    "pandas": {                 // 不同的包
      "version": "1.5.3",
      "installMethod": "pip"
    }
  }
}
```

**隔离效果**：
- ✅ 每个环境的包列表独立存储
- ✅ 包的元数据互不影响
- ✅ 可以精确追踪每个环境的依赖

### 5. 隔离级别对比

#### 5.1 与其他隔离方案对比

| 特性 | BlockFlow 环境隔离 | Python venv | Docker 容器 | Conda 环境 |
|------|-------------------|-------------|-------------|-----------|
| 目录隔离 | ✅ 完全隔离 | ✅ 完全隔离 | ✅ 完全隔离 | ✅ 完全隔离 |
| 进程隔离 | ✅ 独立进程 | ✅ 独立进程 | ✅ 独立容器 | ✅ 独立进程 |
| Python 版本隔离 | ✅ 支持 | ❌ 需要手动 | ✅ 支持 | ✅ 支持 |
| 离线部署 | ✅ 支持 | ⚠️ 部分支持 | ✅ 支持 | ⚠️ 部分支持 |
| GUI 管理 | ✅ Web 界面 | ❌ 命令行 | ⚠️ 部分支持 | ❌ 命令行 |
| 轻量级 | ✅ 轻量 | ✅ 轻量 | ❌ 重量级 | ⚠️ 中等 |
| 跨平台 | ✅ 支持 | ✅ 支持 | ✅ 支持 | ✅ 支持 |

#### 5.2 BlockFlow 隔离的优势

```
优势1: 零学习成本
  • 用户无需了解 venv、virtualenv、conda
  • 通过 Web 界面可视化管理
  • 一键创建、一键切换

优势2: 完全可控
  • 明确的目录结构
  • 清晰的依赖追踪
  • 可视化的包管理

优势3: 离线友好
  • 支持完全离线部署
  • 可上传完整的 Python 运行时
  • 离线包管理

优势4: 细粒度控制
  • 块级别的环境关联
  • 可以为不同块选择不同环境
  • 环境切换零成本
```

### 6. 隔离的实现细节

#### 6.1 包安装的隔离

**在线安装（使用 pip）**：

```java
// PythonEnvironmentServiceImpl.java

public void installPackage(Long envId, String packageName, String version) {
    PythonEnvironment env = getById(envId);

    // 1. 构建 pip 命令，指定目标环境的 Python
    String pythonExe = env.getPythonExecutable();
    String command = String.format(
        "%s -m pip install %s%s --target %s",
        pythonExe,
        packageName,
        version != null ? "==" + version : "",
        env.getSitePackagesPath()  // 安装到环境专属目录
    );

    // 2. 执行安装
    Process process = Runtime.getRuntime().exec(command);

    // 3. 更新环境的包列表
    updatePackageList(env, packageName, version);
}
```

**离线安装（直接解压）**：

```java
public void uploadAndInstallPackage(Long envId, MultipartFile file) {
    PythonEnvironment env = getById(envId);

    // 1. 保存到环境专属的 uploaded 目录
    String uploadedPath = env.getEnvRootPath() + "/uploaded/" + file.getOriginalFilename();
    file.transferTo(new File(uploadedPath));

    // 2. 解压到环境专属的 site-packages
    String sitePackages = env.getSitePackagesPath();
    if (file.getOriginalFilename().endsWith(".whl")) {
        // Wheel 包解压
        unzipWheelPackage(uploadedPath, sitePackages);
    } else {
        // tar.gz 包解压
        extractTarGz(uploadedPath, sitePackages);
    }

    // 3. 更新环境的包列表
    updatePackageList(env, packageName, version);
}
```

#### 6.2 Python 路径的隔离配置

**Windows embeddable 版本的路径配置**：

```python
# python39._pth 文件内容
python39.zip
.

# 系统会在上传 pip 包后自动修改为：
python39.zip
.
Lib/site-packages           # 添加 site-packages 路径

# 这样 Python 就能找到该环境的包
```

**环境变量配置**：

```java
// 执行脚本时设置环境变量
Map<String, String> env = processBuilder.environment();

// 1. 设置 PYTHONPATH（指向环境的 site-packages）
env.put("PYTHONPATH", environment.getSitePackagesPath());

// 2. 设置编码
env.put("PYTHONIOENCODING", "utf-8");

// 3. 清除可能干扰的系统变量
env.remove("PYTHONHOME");  // 避免使用系统 Python
```

#### 6.3 执行时的临时目录隔离

```java
// 每次执行都创建临时目录
private String createTempDirectory() {
    String timestamp = LocalDateTime.now()
        .format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss-SSS"));

    String tempDir = tempBasePath + "/block-" + blockId + "-" + timestamp;
    Files.createDirectories(Paths.get(tempDir));

    return tempDir;
}

// 执行完成后清理
private void cleanupTempDirectory(String tempDir) {
    try {
        FileUtils.deleteDirectory(new File(tempDir));
    } catch (IOException e) {
        log.warn("清理临时目录失败: {}", tempDir);
    }
}
```

**临时目录的作用**：
```
作用1: 避免文件冲突
  • 多个块同时执行不会覆盖文件
  • 每次执行都有干净的工作目录

作用2: 安全隔离
  • 块无法访问其他块的文件
  • 执行完成后自动清理

作用3: 日志隔离
  • 每次执行的输出文件独立
  • 便于追踪和调试
```

### 7. 隔离的安全性保障

#### 7.1 文件系统隔离

```
权限控制:
  ✓ 每个环境目录独立
  ✓ 临时目录随机生成
  ✓ 执行完成后立即清理
  ✓ 块脚本无法访问其他环境

路径校验:
  ✓ 所有文件操作都进行路径验证
  ✓ 防止路径穿越攻击
  ✓ 限制在环境根目录内
```

#### 7.2 资源隔离

```java
// 设置进程超时
Process process = processBuilder.start();
boolean finished = process.waitFor(60, TimeUnit.SECONDS);

if (!finished) {
    // 超时强制终止
    process.destroyForcibly();
    throw new RuntimeException("脚本执行超时");
}

// 资源限制
- 执行时间：60秒
- 输出大小：限制日志大小
- 临时文件：执行后自动清理
```

### 8. 隔离的性能优化

#### 8.1 缓存机制

```java
// 环境信息缓存（避免重复查询）
@Cacheable(value = "python-env", key = "#envId")
public PythonEnvironment getById(Long envId) {
    return repository.findById(envId).orElse(null);
}

// 包列表缓存
@Cacheable(value = "env-packages", key = "#envId")
public Map<String, Object> getPackages(Long envId) {
    PythonEnvironment env = getById(envId);
    return env.getPackages();
}
```

#### 8.2 进程复用

```java
// 对于同一环境的多次执行，可以优化进程启动
private ProcessBuilder getCachedProcessBuilder(Long envId) {
    return processBuilderCache.computeIfAbsent(envId, id -> {
        PythonEnvironment env = getById(id);
        return new ProcessBuilder(env.getPythonExecutable());
    });
}
```

### 9. 隔离的监控与调试

#### 9.1 环境状态监控

```json
{
  "envId": 1,
  "name": "python39-prod",
  "status": "active",
  "stats": {
    "totalPackages": 15,
    "diskUsage": "245MB",
    "lastUsed": "2025-01-21T15:30:00",
    "executionCount": 1523
  }
}
```

#### 9.2 执行日志追踪

```
执行记录:
  • 块ID: 123
  • 环境ID: 1
  • 环境名称: python39-prod
  • Python版本: 3.9.7
  • 执行时间: 2025-01-21 15:30:00
  • 耗时: 1.23秒
  • 状态: 成功
  • 输出: {...}
```

### 10. 隔离机制总结

```
┌─────────────────────────────────────────────────────┐
│  BlockFlow Python 环境隔离全景图                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  数据库层                                            │
│  ├─ 环境表：每个环境独立记录                         │
│  ├─ 块表：关联到具体环境                            │
│  └─ 包列表：JSON 字段存储环境包                     │
│                                                      │
│  文件系统层                                          │
│  ├─ 环境根目录：/python-envs/env-{id}/              │
│  ├─ Python 运行时：独立的解释器                     │
│  ├─ site-packages：独立的包目录                     │
│  └─ 临时目录：每次执行独立                          │
│                                                      │
│  进程层                                              │
│  ├─ 独立进程：每次执行启动新进程                    │
│  ├─ 环境变量：PYTHONPATH 指向环境                   │
│  └─ 工作目录：临时目录隔离                          │
│                                                      │
│  应用层                                              │
│  ├─ 块-环境关联：每个块选择环境                     │
│  ├─ 执行器：根据环境调用对应 Python                 │
│  └─ 结果隔离：每次执行独立输出                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**核心优势**：
- ✅ **完全隔离**：目录、进程、数据三层隔离
- ✅ **灵活配置**：块级别的环境选择
- ✅ **易于管理**：Web 界面可视化管理
- ✅ **安全可靠**：权限控制、资源限制
- ✅ **性能优化**：缓存、进程复用
- ✅ **便于调试**：完整的日志追踪

---

## Python._pth 文件详解

### 什么是 ._pth 文件？

`._pth` 文件是 **Python 嵌入式版本（Embeddable Package）** 专用的路径配置文件,用于控制 Python 解释器的模块搜索路径。

### 文件命名规则

```
文件名格式: python<版本号>._pth

示例:
  python39._pth      # Python 3.9.x
  python311._pth     # Python 3.11.x
  python312._pth     # Python 3.12.x
```

### 核心作用

```
┌─────────────────────────────────────────────────┐
│  ._pth 文件的三大核心作用                        │
├─────────────────────────────────────────────────┤
│  1. 定义模块搜索路径（import 搜索顺序）          │
│     • 控制 Python 从哪些目录查找模块            │
│     • 按行顺序依次搜索                          │
│                                                  │
│  2. 隔离系统 Python 环境                         │
│     • 禁用系统级的 site-packages                │
│     • 避免与系统 Python 冲突                    │
│                                                  │
│  3. 启用/禁用 site 模块                          │
│     • 控制是否导入 site.py                      │
│     • 影响 pip 等工具的可用性                   │
└─────────────────────────────────────────────────┘
```

### 文件格式与语法

#### 基本语法规则

```python
# ._pth 文件的语法规则

# 1. 每行一个路径
#    - 可以是相对路径（相对于 Python 解释器所在目录）
#    - 也可以是绝对路径

# 2. 以 # 开头的行是注释
#    - 会被完全忽略

# 3. 空行会被忽略

# 4. import site
#    - 特殊指令，表示导入 site 模块
#    - 没有这行，site.py 不会被执行
#    - 没有 site 模块，pip 等工具无法使用
```

### Python 嵌入式版本的默认 ._pth

#### Windows embeddable 默认配置

```python
# python39._pth（初始内容）

python39.zip
.

# import site  # 默认被注释掉
```

**解释**：
```
第1行: python39.zip
  → Python 标准库压缩包
  → 包含 os, sys, json, re 等内置模块
  → 解释器启动时会从这里加载标准库

第2行: .
  → 当前目录（Python 解释器所在目录）
  → 用于查找当前目录下的 .py 文件

第3行: # import site
  → 被注释掉，意味着不导入 site 模块
  → 结果：无法使用 pip
  → 结果：无法使用 site-packages
```

### BlockFlow 系统的 ._pth 配置流程

#### 初始状态（上传 Python 运行时后）

```python
# python39._pth（系统解压后的初始状态）

python39.zip
.
# import site  ← 没有 site，无法使用 pip
```

**此时状态**：
- ✅ Python 解释器可以运行
- ✅ 可以使用标准库（os, sys, json...）
- ❌ **无法使用 pip**（site 模块未启用）
- ❌ **无法 import 第三方包**（site-packages 不在搜索路径）

#### 上传 pip 包后（系统自动修改）

当用户上传 `pip-24.0-py3-none-any.whl` 后，BlockFlow 系统会：

**步骤1**: 解压 pip 包到 `Lib/site-packages/`

**步骤2**: **自动修改 ._pth 文件**，添加 site-packages 路径

```python
# python39._pth（系统自动修改后）

python39.zip
.
Lib/site-packages  ← 新增：第三方包搜索路径

# import site 仍然注释，但不影响使用
```

**此时状态**：
- ✅ Python 解释器可以运行
- ✅ 可以使用标准库
- ✅ **可以使用 pip**（pip 已在 site-packages 中）
- ✅ **可以 import 第三方包**（site-packages 已在搜索路径）

### ._pth 文件的工作原理

#### 模块搜索顺序

当执行 `import requests` 时，Python 按以下顺序搜索：

```python
# 基于 ._pth 配置：
# python39.zip
# .
# Lib/site-packages

搜索顺序:
  1. 检查内建模块（built-in modules）
     → sys, os 等 C 语言实现的模块

  2. 搜索 python39.zip
     → 查找 requests.py 或 requests/__init__.py
     → 没找到，继续

  3. 搜索当前目录 (.)
     → 查找当前目录下的 requests.py
     → 没找到，继续

  4. 搜索 Lib/site-packages
     → 查找 site-packages/requests/
     → ✓ 找到！导入成功

如果所有路径都没找到:
  → 抛出 ModuleNotFoundError
```

#### 与标准 Python 的区别

```
标准 Python 安装版:
  • 使用环境变量 PYTHONPATH
  • 自动启用 site 模块
  • 自动包含多个系统路径
  • site-packages 自动在搜索路径中

Python 嵌入式版本 + ._pth:
  • 忽略环境变量 PYTHONPATH
  • 只使用 ._pth 文件定义的路径
  • 完全隔离，不受系统影响
  • site-packages 需要手动添加到 ._pth
```

### BlockFlow 系统中的实现

#### 后端代码：修改 ._pth 文件

```java
// PythonEnvironmentServiceImpl.java

private void configurePthFile(PythonEnvironment env) {
    // 1. 定位 ._pth 文件
    String pythonDir = new File(env.getPythonExecutable()).getParent();
    File[] pthFiles = new File(pythonDir).listFiles((dir, name) ->
        name.endsWith("._pth"));

    if (pthFiles == null || pthFiles.length == 0) {
        log.warn("未找到 ._pth 文件");
        return;
    }

    File pthFile = pthFiles[0];

    // 2. 读取现有内容
    List<String> lines = Files.readAllLines(pthFile.toPath());

    // 3. 检查是否已包含 site-packages
    String sitePackagesEntry = "Lib/site-packages";
    boolean hasEntry = lines.stream()
        .anyMatch(line -> line.trim().equals(sitePackagesEntry));

    // 4. 如果没有，添加 site-packages 路径
    if (!hasEntry) {
        lines.add(sitePackagesEntry);
        Files.write(pthFile.toPath(), lines);
        log.info("已配置 ._pth 文件，添加 site-packages 路径");
    }
}
```

#### 触发时机

```
系统在以下情况下会修改 ._pth 文件:

情况1: 上传 pip 包时
  → 检测到文件名包含 "pip"
  → 自动调用 configurePthFile()
  → 添加 Lib/site-packages 到 ._pth

情况2: 上传 Python 运行时后检测到 pip
  → 解压运行时时发现已有 pip
  → 自动配置 ._pth

情况3: 用户手动触发检测
  → 点击"自动检测Python路径"
  → 检测过程中配置 ._pth
```

### ._pth 文件的高级用法

#### 添加多个搜索路径

```python
# python39._pth（高级配置示例）

python39.zip
.
Lib/site-packages
../shared-libs           # 共享库目录
C:/MyProject/modules     # 绝对路径
```

#### 使用相对路径

```python
# python39._pth

python39.zip
.
Lib/site-packages
../../common-packages    # 上两级目录的 common-packages
./extensions            # 当前目录下的 extensions
```

### 常见问题排查

#### Q1: 上传包后仍然无法 import？

**诊断步骤**：

```python
# 1. 检查 ._pth 文件内容
# 位置: <env-root>/python/python39._pth

cat python39._pth

# 预期内容:
# python39.zip
# .
# Lib/site-packages  ← 必须有这一行

# 2. 检查包是否在正确位置
ls Lib/site-packages/

# 预期: 应该看到 requests/ 等目录

# 3. 测试模块搜索路径
python -c "import sys; print('\n'.join(sys.path))"

# 预期输出应包含:
# <env-root>/python/Lib/site-packages
```

#### Q2: ._pth 文件被意外修改？

**恢复方法**：

```python
# 最小可用配置
python39.zip
.
Lib/site-packages
```

#### Q3: import site 要不要取消注释？

**答案**：

```
在 BlockFlow 系统中，不需要取消注释 import site

原因:
  1. 我们通过直接添加 Lib/site-packages 到 ._pth 来实现路径配置
  2. 不依赖 site 模块的自动路径发现
  3. pip 可以直接从 site-packages 中使用（作为模块）
  4. 保持简单，避免引入不必要的依赖

如果取消注释会怎样:
  • site 模块会被导入
  • 可能引入额外的系统路径
  • 可能导致环境隔离被破坏
  • 不推荐
```

### ._pth 文件与环境隔离

#### 为什么使用 ._pth 文件？

```
优势1: 路径完全可控
  • 只加载 ._pth 中定义的路径
  • 不受系统环境变量影响
  • 确保环境完全隔离

优势2: 轻量级配置
  • 一个文本文件即可配置
  • 无需复杂的环境变量设置
  • 易于备份和迁移

优势3: 适合嵌入式部署
  • Python 嵌入式版本的标准配置方式
  • 与 BlockFlow 的离线部署理念一致
  • 无需安装，解压即用
```

#### 与虚拟环境的对比

```
Python venv（虚拟环境）:
  • 使用 pyvenv.cfg 配置
  • 依赖 site 模块
  • 需要激活脚本
  • 相对复杂

._pth 文件（嵌入式）:
  • 配置简单直接
  • 不需要 site 模块
  • 无需激活
  • 更轻量
```

### 最佳实践

#### 推荐的 ._pth 配置

```python
# python39._pth（BlockFlow 推荐配置）

# 标准库（必需）
python39.zip

# 当前目录（可选，用于开发调试）
.

# 第三方包目录（必需）
Lib/site-packages

# 不要添加:
# - 系统路径
# - 其他环境的路径
# - import site（保持注释状态）
```

#### 检查清单

```
✅ 验证 ._pth 文件存在
   → 位置: <python-dir>/python<version>._pth

✅ 验证包含必要的路径
   → python39.zip
   → Lib/site-packages

✅ 验证路径格式正确
   → 相对路径使用 / 或 \（取决于平台）
   → 无多余空格

✅ 验证 site-packages 目录存在
   → <python-dir>/Lib/site-packages/

✅ 测试包导入
   → python -c "import <package>"
```

### 调试技巧

#### 查看实际搜索路径

```python
# 方法1: 使用 sys.path
python -c "import sys; print('\n'.join(sys.path))"

# 方法2: 导入后检查模块位置
python -c "import requests; print(requests.__file__)"
# 预期输出: <env-root>/python/Lib/site-packages/requests/__init__.py
```

#### 检测 ._pth 是否生效

```python
# 检测是否启用了 site 模块
python -c "import sys; print('site' in sys.modules)"
# 输出 False → ._pth 正在控制路径，未导入 site（正常）
# 输出 True → 可能 import site 被取消注释（需检查）
```

### 总结

```
┌─────────────────────────────────────────────────────┐
│  ._pth 文件在 BlockFlow 中的关键作用                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. 路径隔离                                         │
│     • 只加载 ._pth 定义的路径                       │
│     • 忽略系统 PYTHONPATH                           │
│     • 确保环境完全独立                              │
│                                                      │
│  2. 启用 pip                                         │
│     • 上传 pip 包后自动配置                         │
│     • 添加 Lib/site-packages 到搜索路径             │
│     • 使 pip 模块可被 import                        │
│                                                      │
│  3. 第三方包支持                                     │
│     • 将 site-packages 加入搜索路径                 │
│     • 使离线上传的包可以被导入                      │
│     • 支持 requests, numpy 等第三方库               │
│                                                      │
│  4. 简化部署                                         │
│     • 一个文本文件完成配置                          │
│     • 无需环境变量                                  │
│     • 解压即用，符合离线部署需求                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**关键要点**：
- ._pth 文件是 Python 嵌入式版本的核心配置文件
- BlockFlow 通过自动修改 ._pth 来启用 pip 和第三方包
- 不需要取消注释 `import site`，直接添加路径即可
- 确保环境隔离的关键机制之一

---

## 附录

### A. Python 运行时下载地址

#### 推荐：python-build-standalone（预编译Python，跨平台）

```
下载地址:
  https://github.com/astral-sh/python-build-standalone/releases

Linux x86_64:
  cpython-3.11.9+20240726-x86_64-unknown-linux-gnu-install_only.tar.gz
  cpython-3.12.5+20240726-x86_64-unknown-linux-gnu-install_only.tar.gz

Linux ARM64:
  cpython-3.11.9+20240726-aarch64-unknown-linux-gnu-install_only.tar.gz

Windows:
  cpython-3.11.9+...-x86_64-pc-windows-msvc-shared-install_only.tar.gz

macOS:
  cpython-3.11.9+...-x86_64-apple-darwin-install_only.tar.gz

优点:
  ✅ 无需编译，解压即用
  ✅ 包含完整Python和pip
  ✅ 跨平台支持
  ✅ 无需系统依赖
```

### B. pip 下载地址

```
PyPI 官方:
  https://pypi.org/project/pip/#files
  → 下载 pip-24.0-py3-none-any.whl

清华镜像:
  https://pypi.tuna.tsinghua.edu.cn/simple/pip/
```

### C. 常用包下载地址

| 包名 | PyPI 官方 | 清华镜像 |
|------|-----------|----------|
| requests | https://pypi.org/project/requests/#files | https://pypi.tuna.tsinghua.edu.cn/simple/requests/ |
| numpy | https://pypi.org/project/numpy/#files | https://pypi.tuna.tsinghua.edu.cn/simple/numpy/ |
| pandas | https://pypi.org/project/pandas/#files | https://pypi.tuna.tsinghua.edu.cn/simple/pandas/ |
| openpyxl | https://pypi.org/project/openpyxl/#files | https://pypi.tuna.tsinghua.edu.cn/simple/openpyxl/ |

### D. 快捷键和操作技巧

```
环境列表页面:
  • 双击环境名称 → 快速编辑
  • Ctrl + F → 搜索环境

包管理弹窗:
  • Enter → 确认安装
  • Esc → 关闭弹窗

批量操作:
  • 批量上传包：可以连续选择多个 whl 文件
  • 批量安装：使用 requirements.txt
```

### E. API 端点参考

```
环境管理:
  GET    /api/python-env/page           # 分页查询
  GET    /api/python-env/{id}           # 获取详情
  POST   /api/python-env                # 创建环境
  PUT    /api/python-env                # 更新环境
  DELETE /api/python-env/{id}           # 删除环境
  POST   /api/python-env/{id}/default   # 设为默认

包管理:
  POST   /api/python-env/{id}/install   # 在线安装包
  POST   /api/python-env/{id}/uninstall # 卸载包
  POST   /api/python-env/{id}/upload    # 上传离线包
  GET    /api/python-env/{id}/packages  # 查看已安装包

运行时管理:
  POST   /api/python-env/{id}/init      # 初始化目录
  POST   /api/python-env/{id}/runtime   # 上传运行时
  POST   /api/python-env/{id}/detect    # 检测Python路径
```

---

## 更新日志

### v1.0.0 (2025-01-21)

**初始版本功能**：
- ✅ 多环境管理
- ✅ 在线/离线包安装
- ✅ Python 运行时上传
- ✅ 自动检测 Python 路径
- ✅ requirements.txt 导入导出
- ✅ 依赖缺失智能提示
- ✅ 包冲突检测
- ✅ 安装日志实时显示

---

## 支持与反馈

如有问题或建议，请联系：

- 📧 Email: support@blockflow.com
- 📝 Issue: https://github.com/blockflow/issues
- 📖 文档: https://docs.blockflow.com

---

**BlockFlow Python 环境管理系统 - 让依赖管理更简单** 🚀
