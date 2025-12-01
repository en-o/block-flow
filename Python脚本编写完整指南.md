# Python 脚本编写完整指南

## 📋 目录

1. [概述](#概述)
2. [核心概念](#核心概念)
3. [脚本编写规范](#脚本编写规范)
4. [类型转换详解](#类型转换详解)
5. [上下文变量](#上下文变量)
6. [输入输出处理](#输入输出处理)
7. [错误处理](#错误处理)
8. [完整示例](#完整示例)
9. [测试与调试](#测试与调试)
10. [最佳实践](#最佳实践)
11. [常见问题](#常见问题)
12. [技术实现](#技术实现)

---

## 概述

BlockFlow 的 Python 脚本执行引擎支持在隔离的 Python 环境中执行自定义脚本，提供完整的输入输出处理、错误捕获和超时控制功能。

### 核心特性

- ✅ **参数传递**：通过 JSON 自动传递输入参数
- ✅ **上下文注入**：自动注入系统配置的上下文变量
- ✅ **类型安全**：提供安全的类型转换函数
- ✅ **编码保证**：自动处理 UTF-8 编码，支持中文和特殊字符
- ✅ **错误处理**：完整的异常捕获和堆栈跟踪
- ✅ **超时控制**：防止脚本无限执行
- ✅ **环境隔离**：独立的 Python 环境，互不干扰

---

## 核心概念

### 1. 脚本执行流程

```
┌─────────────────────────────────────────────────┐
│  1. 准备阶段                                     │
│     • 读取用户脚本                               │
│     • 收集输入参数                               │
│     • 合并上下文变量                             │
│     • 生成临时输入文件（JSON）                   │
├─────────────────────────────────────────────────┤
│  2. 包装脚本                                     │
│     • 添加 UTF-8 编码配置                       │
│     • 注入参数读取逻辑                           │
│     • 嵌入用户脚本                               │
│     • 添加输出格式化逻辑                         │
├─────────────────────────────────────────────────┤
│  3. 执行脚本                                     │
│     • 启动独立 Python 进程                      │
│     • 设置环境变量（PYTHONPATH）                │
│     • 传入输入文件路径                           │
│     • 超时控制（默认 60 秒）                     │
├─────────────────────────────────────────────────┤
│  4. 结果处理                                     │
│     • 捕获标准输出（stdout）                     │
│     • 捕获错误输出（stderr）                     │
│     • 解析 JSON 输出                            │
│     • 记录执行时间                               │
│     • 清理临时文件                               │
└─────────────────────────────────────────────────┘
```

### 2. 输入参数来源

```python
inputs = {
    # 1. 用户输入参数（测试或流程传入）
    "name": "Alice",
    "age": 25,
    "count": 10,

    # 2. 上下文变量（系统自动注入）
    "ctx.DB_HOST": "localhost",
    "ctx.DB_PORT": "3306",
    "ctx.API_KEY": "abc123",
    "ctx.USER_NAME": "管理员"
}
```

### 3. 输出格式

```python
# 脚本必须设置 outputs 变量（字典类型）
outputs = {
    "success": True,
    "data": {...},
    "message": "操作成功"
}

# 系统自动转换为 JSON 并返回
```

---

## 脚本编写规范

### 基本结构

```python
# -*- coding: utf-8 -*-

# ========== 1. 导入模块 ==========
import json
import sys

# ========== 2. 安全转换函数（可选） ==========

def safe_int(value, default=0):
    """安全地转换为整数"""
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    """安全地转换为浮点数"""
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_bool(value, default=False):
    """安全地转换为布尔值"""
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    return bool(value)

# ========== 3. 获取输入参数 ==========

# 字符串参数（无需转换）
name = inputs.get('name', 'Unknown')

# 数字参数（使用安全转换）
age = safe_int(inputs.get('age'), 0)
price = safe_float(inputs.get('price'), 0.0)

# 布尔参数（使用安全转换）
enabled = safe_bool(inputs.get('enabled'), False)

# 上下文变量（自动注入）
db_host = inputs.get('ctx.DB_HOST', 'localhost')
db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)

# ========== 4. 执行业务逻辑 ==========

result = f"处理 {name} 的数据，年龄 {age}"

# ========== 5. 设置输出结果（必需） ==========

outputs = {
    "success": True,
    "result": result,
    "data": {
        "name": name,
        "age": age
    }
}
```

### 编码声明

```python
# 文件首行添加编码声明（推荐）
# -*- coding: utf-8 -*-

# 系统会自动设置输出编码为 UTF-8，无需手动配置
# 可以放心使用中文和特殊字符
```

### 输出要求

```python
# ✅ 正确：outputs 是字典
outputs = {
    "success": True,
    "data": [1, 2, 3]
}

# ❌ 错误：outputs 不是字典
outputs = "some string"  # 会被自动包装为 {"result": "some string"}

# ❌ 错误：没有设置 outputs
# （会返回默认值 {"success": True}）
```

---

## 类型转换详解

### 为什么需要类型转换？

**核心问题**：JSON 传输时，所有参数都可能是字符串类型。

```python
# 前端传入
{
  "age": 25,      # 数字
  "count": 10     # 数字
}

# 后端序列化后，Python 接收时可能是
{
  "age": "25",    # 字符串！
  "count": "10"   # 字符串！
}
```

### 错误的写法

```python
# ❌ 错误1：依赖默认值的类型
a = inputs.get('a', 0)  # 如果 inputs['a'] = "10"，a 是字符串 "10"
b = inputs.get('b', 0)  # 默认值 0 不会被使用
product = a * b         # 错误：can't multiply sequence by non-int

# ❌ 错误2：直接转换可能导致异常
a = int(inputs.get('a', 2))  # 如果 a = ""，会报错
# 原因：inputs.get('a', 2) 返回 ""（空字符串存在）
# int("") 抛出 ValueError
```

### 正确的写法

#### 方法1：安全转换函数（推荐）

```python
def safe_int(value, default=0):
    """安全地转换为整数，处理空字符串、None和无效值"""
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

# 使用
a = safe_int(inputs.get('a'), 2)      # ✅ 安全转换
b = safe_int(inputs.get('b'), 0)      # ✅ 空字符串返回默认值
product = a * b                        # ✅ 正确：两个整数相乘
```

#### 方法2：手动 try-except

```python
try:
    a = int(inputs.get('a', 0))
    b = int(inputs.get('b', 0))
except (ValueError, TypeError):
    a = 0
    b = 0
```

### 各类型转换函数

#### 整数转换

```python
def safe_int(value, default=0):
    """安全地转换为整数"""
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

# 使用示例
count = safe_int(inputs.get('count'), 0)
port = safe_int(inputs.get('port'), 3306)
age = safe_int(inputs.get('age'), 18)
```

#### 浮点数转换

```python
def safe_float(value, default=0.0):
    """安全地转换为浮点数"""
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

# 使用示例
price = safe_float(inputs.get('price'), 0.0)
rate = safe_float(inputs.get('rate'), 1.5)
temperature = safe_float(inputs.get('temp'), 25.0)
```

#### 布尔值转换

```python
def safe_bool(value, default=False):
    """安全地转换为布尔值"""
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    return bool(value)

# 使用示例
enabled = safe_bool(inputs.get('enabled'), False)
is_active = safe_bool(inputs.get('is_active'), True)
debug_mode = safe_bool(inputs.get('debug'), False)
```

#### JSON 对象转换

```python
import json

def safe_json_parse(value, default):
    """安全地解析JSON"""
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return default
    return value if value is not None else default

# 使用示例
items = safe_json_parse(inputs.get('items'), [])
config = safe_json_parse(inputs.get('config'), {})
tags = safe_json_parse(inputs.get('tags'), [])
```

### 类型转换快速参考表

| 类型 | 安全转换函数 | 直接转换（不安全） | 说明 |
|------|------------|------------------|------|
| 整数 | `safe_int(value, 0)` | `int(value)` | 处理空字符串和无效值 |
| 浮点 | `safe_float(value, 0.0)` | `float(value)` | 处理空字符串和无效值 |
| 布尔 | `safe_bool(value, False)` | `bool(value)` | 字符串 "false" 也是 True |
| JSON | `safe_json_parse(value, {})` | `json.loads(value)` | 可能不是字符串 |

---

## 上下文变量

### 什么是上下文变量？

上下文变量是在"上下文变量管理"页面配置的全局变量，系统会自动将它们注入到所有脚本的 `inputs` 中。

### 自动注入机制

```python
# 系统自动注入格式: ctx.变量名

# 配置页面设置的变量:
DB_HOST = "192.168.1.100"
DB_PORT = 3306
API_KEY = "abc123xyz"
USER_NAME = "管理员"

# 脚本中自动可用:
inputs = {
    "ctx.DB_HOST": "192.168.1.100",
    "ctx.DB_PORT": "3306",          # 注意：可能是字符串
    "ctx.API_KEY": "abc123xyz",
    "ctx.USER_NAME": "管理员"
}
```

### 使用上下文变量

```python
# 1. 字符串类型的上下文变量
db_host = inputs.get('ctx.DB_HOST', 'localhost')
api_key = inputs.get('ctx.API_KEY', '')
user_name = inputs.get('ctx.USER_NAME', '默认用户')

# 2. 数字类型的上下文变量（需要转换）
db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)
timeout = safe_int(inputs.get('ctx.TIMEOUT'), 30)

# 3. 布尔类型的上下文变量（需要转换）
debug_mode = safe_bool(inputs.get('ctx.DEBUG'), False)
```

### 上下文变量 vs 输入参数

```python
# 上下文变量（全局配置，所有脚本可用）
db_host = inputs.get('ctx.DB_HOST', 'localhost')
api_key = inputs.get('ctx.API_KEY', '')

# 输入参数（测试或流程传入，特定于当前执行）
username = inputs.get('username', '')
user_id = safe_int(inputs.get('user_id'), 0)

# 两者可以同时使用
connection = connect(
    host=db_host,        # 来自上下文
    user=username,       # 来自输入
    password=api_key     # 来自上下文
)
```

### 注意事项

```
✅ 上下文变量在"上下文变量管理"页面配置
✅ 配置后立即生效，无需重启
✅ 测试和流程执行时都会自动注入
✅ 使用 ctx. 前缀，不会与输入参数冲突
⚠️ 数字类型的上下文变量也需要类型转换
⚠️ 修改上下文变量会影响所有使用它的脚本
```

### 变量引用和字符串插值

获取变量后,可以通过多种方式在字符串中使用变量值。

#### 方法1: f-string(推荐)

```python
# 获取变量
teamcity_port = inputs.get('ctx.TEAMCITY_PORT', '8111')
username = inputs.get('name', 'admin')

# 在字符串中引用变量
url = f"http://localhost:{teamcity_port}/api"
message = f"用户 {username} 的端口是 {teamcity_port}"

# 输出示例:
# url = "http://localhost:8111/api"
# message = "用户 admin 的端口是 8111"
```

#### 方法2: format()方法

```python
# 获取变量
teamcity_port = inputs.get('ctx.TEAMCITY_PORT', '8111')

# 使用 format() 方法
url = "http://localhost:{}/api".format(teamcity_port)
message = "端口: {port}, 状态: {status}".format(
    port=teamcity_port,
    status="running"
)

# 输出示例:
# url = "http://localhost:8111/api"
# message = "端口: 8111, 状态: running"
```

#### 方法3: 字符串拼接

```python
# 获取变量
teamcity_port = inputs.get('ctx.TEAMCITY_PORT', '8111')

# 使用 + 拼接
url = "http://localhost:" + teamcity_port + "/api"
message = "端口是 " + str(teamcity_port)  # 注意:非字符串需要转换

# 输出示例:
# url = "http://localhost:8111/api"
# message = "端口是 8111"
```

#### 方法4: 模板字符串(Template)

```python
from string import Template

# 获取变量
teamcity_port = inputs.get('ctx.TEAMCITY_PORT', '8111')

# 使用 Template
template = Template("http://localhost:$port/api")
url = template.substitute(port=teamcity_port)

# 输出示例:
# url = "http://localhost:8111/api"
```

#### 完整示例: 组合使用

```python
# -*- coding: utf-8 -*-

# ========== 安全转换函数 ==========
def safe_int(value, default=0):
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

# ========== 获取上下文变量 ==========
teamcity_host = inputs.get('ctx.TEAMCITY_HOST', 'localhost')
teamcity_port = inputs.get('ctx.TEAMCITY_PORT', '8111')
teamcity_user = inputs.get('ctx.TEAMCITY_USER', 'admin')

# ========== 字符串中使用变量 ==========
# 方式1: f-string(最推荐)
base_url = f"http://{teamcity_host}:{teamcity_port}"
api_url = f"{base_url}/app/rest/builds"
login_info = f"用户 {teamcity_user} 连接到 {teamcity_host}:{teamcity_port}"

# 方式2: 多行字符串中使用变量
config_text = f"""
TeamCity 配置:
  主机: {teamcity_host}
  端口: {teamcity_port}
  用户: {teamcity_user}
  API: {api_url}
"""

# 方式3: 在字典/JSON中使用
outputs = {
    "success": True,
    "config": {
        "url": f"http://{teamcity_host}:{teamcity_port}",
        "user": teamcity_user,
        "message": f"连接到 {teamcity_host}:{teamcity_port} 成功"
    }
}
```

#### 常见场景示例

**场景1: 构建 URL**

```python
# 获取变量
api_host = inputs.get('ctx.API_HOST', 'api.example.com')
api_version = inputs.get('ctx.API_VERSION', 'v1')
resource = inputs.get('resource', 'users')
resource_id = inputs.get('id', '123')

# 构建完整 URL
url = f"https://{api_host}/{api_version}/{resource}/{resource_id}"
# 结果: https://api.example.com/v1/users/123
```

**场景2: 构建命令字符串**

```python
# 获取变量
docker_image = inputs.get('ctx.DOCKER_IMAGE', 'nginx')
docker_tag = inputs.get('ctx.DOCKER_TAG', 'latest')
container_name = inputs.get('name', 'my-app')
port = safe_int(inputs.get('ctx.PORT'), 8080)

# 构建 Docker 命令
docker_cmd = f"docker run -d --name {container_name} -p {port}:80 {docker_image}:{docker_tag}"
# 结果: docker run -d --name my-app -p 8080:80 nginx:latest
```

**场景3: 构建数据库连接字符串**

```python
# 获取变量
db_host = inputs.get('ctx.DB_HOST', 'localhost')
db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)
db_name = inputs.get('ctx.DB_NAME', 'mydb')
db_user = inputs.get('ctx.DB_USER', 'root')
db_password = inputs.get('ctx.DB_PASSWORD', '')

# 构建连接字符串
connection_string = f"mysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
# 结果: mysql://root:password@localhost:3306/mydb
```

**场景4: 生成日志消息**

```python
# 获取变量
username = inputs.get('username', 'Unknown')
action = inputs.get('action', 'login')
timestamp = inputs.get('timestamp', '2025-01-21 10:00:00')

# 生成日志
log_message = f"[{timestamp}] 用户 {username} 执行了 {action} 操作"
print(log_message)
# 输出: [2025-01-21 10:00:00] 用户 Unknown 执行了 login 操作
```

#### 注意事项

```
✅ f-string 是最推荐的方式,代码简洁易读(Python 3.6+)
✅ 可以在 f-string 中进行简单的表达式计算: f"{count * 2}"
✅ 多行字符串也可以使用 f-string
⚠️ 非字符串类型在拼接时需要转换: str(port)
⚠️ f-string 中的大括号需要转义: f"{{key}}: {value}"  # 输出 {key}: xxx
❌ 不要在字符串中直接写变量名期望自动替换: "端口: teamcity_port"  # 错误!
```

---

## 输入输出处理

### 输入参数获取

#### 基本类型

```python
# 字符串（无需转换）
name = inputs.get('name', 'Unknown')
host = inputs.get('host', 'localhost')
message = inputs.get('message', '')

# 整数（需要转换）
count = safe_int(inputs.get('count'), 0)
port = safe_int(inputs.get('port'), 3306)
age = safe_int(inputs.get('age'), 18)

# 浮点数（需要转换）
price = safe_float(inputs.get('price'), 0.0)
rate = safe_float(inputs.get('rate'), 1.0)
discount = safe_float(inputs.get('discount'), 0.1)

# 布尔值（需要转换）
enabled = safe_bool(inputs.get('enabled'), False)
debug = safe_bool(inputs.get('debug'), False)
is_active = safe_bool(inputs.get('is_active'), True)
```

#### 复杂类型

```python
import json

# 列表
tags_input = inputs.get('tags', '[]')
if isinstance(tags_input, str):
    tags = json.loads(tags_input)
else:
    tags = tags_input if tags_input else []

# 或使用安全函数
tags = safe_json_parse(inputs.get('tags'), [])

# 字典/对象
config_input = inputs.get('config', '{}')
if isinstance(config_input, str):
    config = json.loads(config_input)
else:
    config = config_input if config_input else {}

# 或使用安全函数
config = safe_json_parse(inputs.get('config'), {})
```

#### 嵌套参数

```python
# 获取嵌套对象中的值
config = safe_json_parse(inputs.get('config'), {})

# 安全获取嵌套值
timeout = safe_int(config.get('timeout'), 30)
max_retries = safe_int(config.get('maxRetries'), 3)
enabled = safe_bool(config.get('enabled'), True)

# 深层嵌套
server_config = config.get('server', {})
host = server_config.get('host', 'localhost')
port = safe_int(server_config.get('port'), 8080)
```

### 输出结果设置

#### 成功输出

```python
# 基本输出
outputs = {
    "success": True,
    "message": "操作成功"
}

# 带数据的输出
outputs = {
    "success": True,
    "data": {
        "id": 123,
        "name": "test",
        "created_at": "2025-01-21 10:00:00"
    },
    "message": "创建成功"
}

# 列表数据
outputs = {
    "success": True,
    "items": [
        {"id": 1, "name": "Item 1"},
        {"id": 2, "name": "Item 2"}
    ],
    "total": 2
}
```

#### 错误输出

```python
# 业务错误
if not valid:
    outputs = {
        "success": False,
        "error": "验证失败",
        "message": "用户名不能为空"
    }
else:
    # 正常处理
    outputs = {
        "success": True,
        "data": result
    }

# 带错误码的输出
outputs = {
    "success": False,
    "errorCode": "INVALID_INPUT",
    "error": "参数错误",
    "details": {
        "field": "age",
        "value": -1,
        "message": "年龄必须大于0"
    }
}
```

#### 多值输出

```python
# 计算结果
outputs = {
    "sum": sum_result,
    "product": product_result,
    "average": average_result,
    "max": max_value,
    "min": min_value
}

# 统计信息
outputs = {
    "total": 100,
    "processed": 95,
    "failed": 5,
    "success_rate": 0.95,
    "elapsed_time": 1.23
}
```

### 输出限制

```python
# ✅ 支持的类型
outputs = {
    "string": "text",
    "number": 123,
    "float": 1.23,
    "boolean": True,
    "list": [1, 2, 3],
    "dict": {"key": "value"},
    "none": None
}

# ❌ 不支持的类型
outputs = {
    "function": lambda x: x,      # 函数
    "class": MyClass(),           # 类实例
    "file": open('file.txt'),     # 文件对象
    "set": {1, 2, 3},            # 集合（会转换为列表）
    "bytes": b"data"              # 字节（需要编码）
}
```

---

## 错误处理

### 自动异常捕获

系统会自动捕获所有未处理的异常：

```python
# 脚本中抛出异常
if critical_error:
    raise Exception("严重错误：数据库连接失败")

# 系统自动捕获并返回
{
  "success": false,
  "errorMessage": "脚本执行失败",
  "stderr": "Traceback (most recent call last):\n  ...\nException: 严重错误：数据库连接失败",
  "exitCode": 1
}
```

### 手动错误处理

#### 方式1：返回错误标志

```python
# 推荐：通过 success 标志表示错误
try:
    result = risky_operation()
    outputs = {
        "success": True,
        "data": result
    }
except Exception as e:
    outputs = {
        "success": False,
        "error": str(e),
        "message": "操作失败"
    }
```

#### 方式2：输入验证

```python
# 参数验证
username = inputs.get('username', '')
password = inputs.get('password', '')

if not username:
    outputs = {
        "success": False,
        "error": "MISSING_USERNAME",
        "message": "用户名不能为空"
    }
elif not password:
    outputs = {
        "success": False,
        "error": "MISSING_PASSWORD",
        "message": "密码不能为空"
    }
else:
    # 正常处理
    outputs = {
        "success": True,
        "message": "登录成功"
    }
```

#### 方式3：分步骤验证

```python
# 分步骤验证并提供详细错误
errors = []

# 验证必填字段
if not inputs.get('name'):
    errors.append({"field": "name", "message": "名称不能为空"})

age = safe_int(inputs.get('age'), 0)
if age <= 0:
    errors.append({"field": "age", "message": "年龄必须大于0"})

email = inputs.get('email', '')
if not email or '@' not in email:
    errors.append({"field": "email", "message": "邮箱格式错误"})

# 如果有错误，返回所有错误
if errors:
    outputs = {
        "success": False,
        "errors": errors,
        "message": "输入验证失败"
    }
else:
    # 验证通过，执行业务逻辑
    outputs = {
        "success": True,
        "message": "验证通过"
    }
```

### 常见错误类型

#### TypeError

```python
# 错误示例
a = inputs.get('a', 0)  # a 可能是字符串 "10"
b = inputs.get('b', 0)
product = a * b  # TypeError: can't multiply sequence by non-int

# 解决方法
a = safe_int(inputs.get('a'), 0)
b = safe_int(inputs.get('b'), 0)
product = a * b  # ✅ 正确
```

#### ValueError

```python
# 错误示例
age = int(inputs.get('age', 0))  # age = "" 时报错

# 解决方法
age = safe_int(inputs.get('age'), 0)  # ✅ 安全转换
```

#### KeyError

```python
# 错误示例
name = inputs['name']  # 如果 name 不存在，KeyError

# 解决方法
name = inputs.get('name', 'Unknown')  # ✅ 提供默认值
```

#### AttributeError

```python
# 错误示例
config = inputs.get('config', '{}')  # config 是字符串
timeout = config.get('timeout', 30)  # AttributeError: 'str' object has no attribute 'get'

# 解决方法
config = safe_json_parse(inputs.get('config'), {})  # ✅ 解析 JSON
timeout = safe_int(config.get('timeout'), 30)
```

---

## 完整示例

### 示例1：基本计算（带安全转换）

```python
# -*- coding: utf-8 -*-

# 安全转换函数
def safe_int(value, default=0):
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

# 获取输入参数（安全转换）
a = safe_int(inputs.get('a'), 0)
b = safe_int(inputs.get('b'), 0)

# 获取上下文变量
user_name = inputs.get('ctx.USER_NAME', '默认用户')

# 执行计算
sum_result = a + b
product = a * b
difference = a - b
quotient = a / b if b != 0 else 0

# 打印调试信息（可选）
print(f"用户: {user_name}")
print(f"计算: {a} 和 {b}")

# 设置输出
outputs = {
    "success": True,
    "sum": sum_result,
    "product": product,
    "difference": difference,
    "quotient": quotient,
    "user": user_name,
    "message": f"{a} + {b} = {sum_result}, {a} × {b} = {product}"
}
```

**测试请求：**
```json
{
  "inputs": {
    "a": 10,
    "b": 5
  }
}
```

**预期返回：**
```json
{
  "success": true,
  "executionTime": 50,
  "output": {
    "success": true,
    "sum": 15,
    "product": 50,
    "difference": 5,
    "quotient": 2.0,
    "user": "管理员",
    "message": "10 + 5 = 15, 10 × 5 = 50",
    "_console_output": "用户: 管理员\n计算: 10 和 5\n"
  }
}
```

### 示例2：字符串处理

```python
# -*- coding: utf-8 -*-

# 获取输入参数（字符串无需转换）
text = inputs.get('text', '')
operation = inputs.get('operation', 'upper')

# 根据操作类型处理
if operation == 'upper':
    result = text.upper()
elif operation == 'lower':
    result = text.lower()
elif operation == 'reverse':
    result = text[::-1]
elif operation == 'title':
    result = text.title()
else:
    result = text

# 返回结果
outputs = {
    "success": True,
    "original": text,
    "operation": operation,
    "result": result,
    "length": len(result)
}
```

### 示例3：混合类型处理

```python
# -*- coding: utf-8 -*-

# 安全转换函数
def safe_int(value, default=0):
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_bool(value, default=False):
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    return bool(value)

# 字符串参数
name = inputs.get('name', 'Unknown')

# 整数参数
age = safe_int(inputs.get('age'), 0)
count = safe_int(inputs.get('count'), 1)

# 浮点数参数
price = safe_float(inputs.get('price'), 0.0)
discount = safe_float(inputs.get('discount'), 0.0)

# 布尔参数
is_member = safe_bool(inputs.get('is_member'), False)

# 计算
total = price * count
final_price = total * (1 - discount) if is_member else total

# 输出结果
outputs = {
    "success": True,
    "name": name,
    "age": age,
    "total": total,
    "final_price": final_price,
    "is_member": is_member,
    "message": f"{name}（{age}岁）购买了{count}件商品，总价{final_price}元"
}
```

**测试请求：**
```json
{
  "inputs": {
    "name": "张三",
    "age": 25,
    "count": 3,
    "price": 100.5,
    "discount": 0.1,
    "is_member": "true"
  }
}
```

### 示例4：JSON 对象处理

```python
# -*- coding: utf-8 -*-
import json

# 安全转换函数
def safe_int(value, default=0):
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_json_parse(value, default):
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return default
    return value if value is not None else default

# 获取并解析 JSON 参数
items = safe_json_parse(inputs.get('items'), [])
config = safe_json_parse(inputs.get('config'), {})

# 从配置中获取参数（需要转换）
max_count = safe_int(config.get('maxCount'), 10)
enabled = config.get('enabled', False)

# 处理列表
processed = []
for item in items[:max_count]:
    if isinstance(item, str):
        processed.append(item.upper())
    elif isinstance(item, (int, float)):
        processed.append(item * 2)
    else:
        processed.append(str(item))

# 输出结果
outputs = {
    "success": True,
    "original_count": len(items),
    "processed_count": len(processed),
    "processed_items": processed,
    "config": config,
    "enabled": enabled
}
```

**测试请求：**
```json
{
  "inputs": {
    "items": ["apple", "banana", "cherry", "date"],
    "config": {
      "maxCount": 3,
      "enabled": true
    }
  }
}
```

### 示例5：完整的业务逻辑（带验证和错误处理）

```python
# -*- coding: utf-8 -*-
import json

# ========== 安全转换函数 ==========

def safe_int(value, default=0):
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_bool(value, default=False):
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    return bool(value)

# ========== 获取输入参数 ==========

username = inputs.get('username', '')
age = safe_int(inputs.get('age'), 0)
email = inputs.get('email', '')
is_active = safe_bool(inputs.get('is_active'), True)

# 获取上下文变量
max_age = safe_int(inputs.get('ctx.MAX_AGE'), 150)
min_age = safe_int(inputs.get('ctx.MIN_AGE'), 0)

# ========== 输入验证 ==========

errors = []

if not username:
    errors.append({
        "field": "username",
        "message": "用户名不能为空"
    })
elif len(username) < 3:
    errors.append({
        "field": "username",
        "message": "用户名至少3个字符"
    })

if age <= min_age or age > max_age:
    errors.append({
        "field": "age",
        "message": f"年龄必须在 {min_age} 到 {max_age} 之间"
    })

if not email:
    errors.append({
        "field": "email",
        "message": "邮箱不能为空"
    })
elif '@' not in email or '.' not in email:
    errors.append({
        "field": "email",
        "message": "邮箱格式错误"
    })

# 如果有验证错误，返回错误信息
if errors:
    outputs = {
        "success": False,
        "errors": errors,
        "message": "输入验证失败"
    }
else:
    # ========== 执行业务逻辑 ==========

    # 处理用户数据
    user_data = {
        "username": username,
        "age": age,
        "email": email,
        "is_active": is_active,
        "created_at": "2025-01-21 10:00:00"
    }

    # 打印调试信息
    print(f"创建用户: {username}")
    print(f"年龄: {age}, 邮箱: {email}")

    # ========== 返回成功结果 ==========

    outputs = {
        "success": True,
        "data": user_data,
        "message": f"用户 {username} 创建成功"
    }
```

---

## 测试与调试

### 打印调试信息

```python
# 打印输入参数类型
print("=== 输入参数 ===")
for key, value in inputs.items():
    print(f"{key}: {value} (type: {type(value).__name__})")

# 打印中间结果
print(f"计算结果: {result}")
print(f"处理进度: {processed}/{total}")

# 打印对象内容
import json
print(f"配置: {json.dumps(config, ensure_ascii=False, indent=2)}")
```

**控制台输出会单独显示：**
```json
{
  "success": true,
  "output": {
    "result": "success",
    "_console_output": "=== 输入参数 ===\na: 10 (type: int)\nb: 5 (type: int)\n计算结果: 15\n"
  }
}
```

### 验证输出

```python
# 检查输出是否可序列化
import json

try:
    json.dumps(outputs)
    print("✓ 输出验证通过")
except TypeError as e:
    print(f"✗ 输出包含不可序列化的对象: {e}")
    # 修复输出
    outputs = {"error": "输出格式错误"}
```

### 测试边界情况

```python
# 测试空值
test_cases = [
    {},                          # 空输入
    {"a": ""},                  # 空字符串
    {"a": None},                # None 值
    {"a": "abc"},               # 无效数字
    {"a": 0},                   # 零值
    {"a": -1},                  # 负数
    {"a": 999999999999999},     # 极大值
]

for test_input in test_cases:
    a = safe_int(test_input.get('a'), 0)
    print(f"输入: {test_input.get('a')} → 转换: {a}")
```

### 常用调试模板

```python
# -*- coding: utf-8 -*-
import json

# 调试模式开关
DEBUG = True

def debug_print(*args):
    """调试打印函数"""
    if DEBUG:
        print("[DEBUG]", *args)

# 打印所有输入
debug_print("输入参数:")
for key, value in inputs.items():
    debug_print(f"  {key}: {value} ({type(value).__name__})")

# 获取参数
a = safe_int(inputs.get('a'), 0)
b = safe_int(inputs.get('b'), 0)

debug_print(f"转换后: a={a}, b={b}")

# 执行计算
result = a + b
debug_print(f"计算结果: {result}")

# 输出
outputs = {
    "result": result
}

debug_print(f"输出: {json.dumps(outputs, ensure_ascii=False)}")
```

---

## 最佳实践

### 1. 总是进行类型转换

```python
# ❌ 错误：依赖默认值类型
count = inputs.get('count', 0)

# ✅ 正确：显式转换
count = safe_int(inputs.get('count'), 0)
```

### 2. 提供合理的默认值

```python
# ✅ 好的默认值
port = safe_int(inputs.get('port'), 3306)     # 数据库端口
timeout = safe_int(inputs.get('timeout'), 30)  # 超时时间（秒）
enabled = safe_bool(inputs.get('enabled'), True)  # 默认启用

# ❌ 不好的默认值
port = safe_int(inputs.get('port'), 0)  # 端口0通常无效
count = safe_int(inputs.get('count'), -1)  # 负数计数无意义
```

### 3. 验证关键参数

```python
# 验证必填参数
username = inputs.get('username', '')
if not username:
    outputs = {
        "success": False,
        "error": "用户名不能为空"
    }
    # 提前返回或抛出异常

# 验证数值范围
age = safe_int(inputs.get('age'), 0)
if age < 0 or age > 150:
    outputs = {
        "success": False,
        "error": "年龄必须在0-150之间"
    }
```

### 4. 使用 try-except 处理可能的错误

```python
try:
    # 可能失败的操作
    result = risky_operation()
    outputs = {
        "success": True,
        "data": result
    }
except ValueError as e:
    outputs = {
        "success": False,
        "error": "VALUE_ERROR",
        "message": str(e)
    }
except Exception as e:
    outputs = {
        "success": False,
        "error": "UNKNOWN_ERROR",
        "message": str(e)
    }
```

### 5. 记录调试信息

```python
# 打印关键步骤
print(f"开始处理用户: {username}")
print(f"参数验证通过")
print(f"执行业务逻辑...")
print(f"处理完成，结果: {result}")

# 输出会显示在 _console_output 中
```

### 6. 测试边界情况

```python
# 测试以下情况：
# - 空值: "", None
# - 零值: 0, 0.0
# - 负数: -1, -100
# - 极大值: 999999999
# - 无效值: "abc", {}, []
# - 特殊字符: "中文", "©®™"
```

### 7. 放心使用中文和特殊字符

```python
# ✅ 系统已自动处理 UTF-8 编码，可以直接使用
outputs = {
    "message": "用户 张三 注册成功",
    "symbol": "温度: 25℃, 结果: √",
    "currency": "价格: ¥100 或 $15",
    "math": "计算: 10 × 5 ÷ 2 = 25"
}
```

### 8. 使用推荐的脚本模板

```python
# -*- coding: utf-8 -*-
import json

# ========== 安全转换函数 ==========

def safe_int(value, default=0):
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_bool(value, default=False):
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    return bool(value)

def safe_json_parse(value, default):
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return default
    return value if value is not None else default

# ========== 获取输入参数 ==========

# 字符串参数
name = inputs.get('name', '')

# 数字参数
count = safe_int(inputs.get('count'), 0)
price = safe_float(inputs.get('price'), 0.0)

# 布尔参数
enabled = safe_bool(inputs.get('enabled'), False)

# JSON 参数
config = safe_json_parse(inputs.get('config'), {})

# 上下文变量
db_host = inputs.get('ctx.DB_HOST', 'localhost')
db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)

# ========== 输入验证 ==========

errors = []

if not name:
    errors.append({"field": "name", "message": "名称不能为空"})

if count < 0:
    errors.append({"field": "count", "message": "数量不能为负数"})

if errors:
    outputs = {
        "success": False,
        "errors": errors
    }
else:
    # ========== 执行业务逻辑 ==========

    result = f"处理 {count} 条数据"

    print(f"开始处理: {name}")
    print(f"结果: {result}")

    # ========== 返回结果 ==========

    outputs = {
        "success": True,
        "result": result,
        "data": {
            "name": name,
            "count": count
        }
    }
```

---

## 常见问题

### Q1: TypeError: can't multiply sequence by non-int

**原因：** 参数是字符串，未转换为数字

```python
# ❌ 错误
a = inputs.get('a', 0)  # a 可能是 "10"
b = inputs.get('b', 0)
product = a * b  # TypeError

# ✅ 正确
a = safe_int(inputs.get('a'), 0)
b = safe_int(inputs.get('b'), 0)
product = a * b
```

### Q2: ValueError: invalid literal for int()

**原因：** 字符串无法转换为整数，或为空字符串

```python
# ❌ 错误
age = int(inputs.get('age', 0))  # age = "" 时报错

# ✅ 正确
age = safe_int(inputs.get('age'), 0)
```

### Q3: AttributeError: 'str' object has no attribute 'get'

**原因：** JSON 字符串未解析

```python
# ❌ 错误
config = inputs.get('config', '{}')
timeout = config.get('timeout', 30)  # config 是字符串

# ✅ 正确
config = safe_json_parse(inputs.get('config'), {})
timeout = safe_int(config.get('timeout'), 30)
```

### Q4: 输出中文或特殊字符显示为 ��

**问题表现：**
```json
{"message": "计算: 10 �� 5 = 50"}
```

**原因：** Windows 系统 Python 标准输出默认编码不是 UTF-8

**解决：** 系统已自动修复，无需手动处理
- 引擎自动设置输出编码为 UTF-8
- 可以放心使用中文和特殊字符
- 示例：`outputs = {"message": "温度: 25℃, 结果: √"}`

### Q5: 脚本执行超时

**原因：**
- 死循环
- 耗时操作（如网络请求）
- 算法复杂度过高

**解决：**
```python
# 1. 检查循环条件
while condition:  # 确保 condition 会变为 False
    process()

# 2. 设置网络请求超时
import requests
response = requests.get(url, timeout=10)

# 3. 优化算法
# 使用更高效的数据结构和算法
```

### Q6: ImportError: No module named 'xxx'

**原因：** Python 环境未安装所需依赖

**解决：**
1. 进入"Python 环境管理"
2. 点击"管理包"或"配置/离线包"
3. 安装缺失的包

### Q7: 如何获取上下文变量？

```python
# 上下文变量使用 ctx. 前缀
db_host = inputs.get('ctx.DB_HOST', 'localhost')
db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)
api_key = inputs.get('ctx.API_KEY', '')

# 注意：数字类型的上下文变量也需要转换
```

### Q8: 输出变量未定义

**原因：** 没有设置 `outputs` 变量

```python
# ❌ 错误：没有 outputs
result = calculate()
# 脚本结束，返回默认值 {"success": True}

# ✅ 正确：设置 outputs
result = calculate()
outputs = {
    "success": True,
    "result": result
}
```

### Q9: 如何调试脚本？

```python
# 1. 使用 print() 打印调试信息
print(f"参数 a: {a}, 类型: {type(a)}")
print(f"计算结果: {result}")

# 2. 打印所有输入
for key, value in inputs.items():
    print(f"{key}: {value} ({type(value).__name__})")

# 3. 验证输出格式
import json
print(f"输出: {json.dumps(outputs, ensure_ascii=False)}")

# 输出会显示在测试结果的 _console_output 中
```

### Q10: 如何处理文件操作？

```python
# 读取文件
with open('data.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# 写入文件
with open('output.txt', 'w', encoding='utf-8') as f:
    f.write(result)

# 注意：
# 1. 文件路径使用绝对路径
# 2. 确保文件存在
# 3. 使用 with 语句自动关闭文件
```

---

## 技术实现

### 脚本包装机制

系统会自动包装用户脚本，添加以下功能：

#### 1. UTF-8 编码配置

```python
# 系统自动添加（用户无需编写）
import sys
import io

# 设置标准输出和错误输出为 UTF-8 编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
```

#### 2. 参数读取逻辑

```python
# 系统自动添加（用户无需编写）
import sys
import json

# 从临时文件读取输入参数
if len(sys.argv) > 1:
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        inputs = json.load(f)
else:
    inputs = {}

# 合并上下文变量（系统自动注入）
# inputs 中会包含 ctx.* 格式的上下文变量
```

#### 3. 用户脚本执行

```python
# 系统自动包装（用户脚本会被插入这里）
try:
    # ========== 用户脚本开始 ==========

    # 用户的脚本内容（保持原始缩进）
    name = inputs.get('name', 'World')
    outputs = {"message": f"Hello {name}"}

    # ========== 用户脚本结束 ==========

except Exception as e:
    # 异常处理（系统自动添加）
    import traceback
    outputs = {
        "success": False,
        "error": str(e),
        "traceback": traceback.format_exc()
    }
```

#### 4. 输出格式化

```python
# 系统自动添加（用户无需编写）
import json
import sys

# 捕获 print() 输出
console_output = []

# 重定向 print
original_print = print
def custom_print(*args, **kwargs):
    console_output.append(' '.join(map(str, args)))
    original_print(*args, **kwargs)

# 格式化输出
if 'outputs' in locals() or 'outputs' in globals():
    if isinstance(outputs, dict):
        # 如果有控制台输出，添加到 outputs
        if console_output:
            outputs['_console_output'] = '\n'.join(console_output)
        print(json.dumps(outputs, ensure_ascii=False))
    else:
        # 如果 outputs 不是字典，自动包装
        result = {
            'result': outputs
        }
        if console_output:
            result['_console_output'] = '\n'.join(console_output)
        print(json.dumps(result, ensure_ascii=False))
else:
    # 如果没有 outputs，返回默认值
    result = {'success': True}
    if console_output:
        result['_console_output'] = '\n'.join(console_output)
    print(json.dumps(result, ensure_ascii=False))
```

### 环境隔离

```
┌─────────────────────────────────────────────────┐
│  执行环境隔离                                    │
├─────────────────────────────────────────────────┤
│  • 独立的 Python 进程                           │
│  • 独立的 site-packages 目录                    │
│  • 独立的 PYTHONPATH 环境变量                   │
│  • 独立的工作目录                               │
│  • 独立的临时文件                               │
└─────────────────────────────────────────────────┘
```

**Java 实现示例：**

```java
// PythonScriptExecutor.java
public Map<String, Object> executeScript(
    String script,
    Map<String, Object> inputs,
    PythonEnvironment environment
) {
    // 1. 获取环境的 Python 解释器路径
    String pythonExecutable = environment.getPythonExecutable();

    // 2. 创建临时目录
    String tempDir = createTempDirectory();

    // 3. 写入输入参数到临时 JSON 文件
    File inputFile = new File(tempDir, "inputs.json");
    writeJson(inputFile, inputs);

    // 4. 包装脚本（添加参数读取、编码配置、输出格式化）
    String wrappedScript = wrapScript(script);

    // 5. 写入脚本文件
    File scriptFile = new File(tempDir, "script.py");
    writeFile(scriptFile, wrappedScript);

    // 6. 构建执行命令
    ProcessBuilder pb = new ProcessBuilder(
        pythonExecutable,
        scriptFile.getAbsolutePath(),
        inputFile.getAbsolutePath()
    );

    // 7. 设置环境变量
    Map<String, String> env = pb.environment();
    env.put("PYTHONPATH", environment.getSitePackagesPath());
    env.put("PYTHONIOENCODING", "utf-8");

    // 8. 启动进程并等待完成（超时 60 秒）
    Process process = pb.start();
    boolean finished = process.waitFor(60, TimeUnit.SECONDS);

    // 9. 读取输出
    String stdout = readStream(process.getInputStream());
    String stderr = readStream(process.getErrorStream());

    // 10. 解析 JSON 输出
    Map<String, Object> result = parseJsonOutput(stdout);

    // 11. 清理临时文件
    cleanupTempDirectory(tempDir);

    return result;
}
```

### 超时控制

```java
// 设置超时时间
boolean finished = process.waitFor(60, TimeUnit.SECONDS);

if (!finished) {
    // 超时，强制终止进程
    process.destroyForcibly();
    throw new RuntimeException("脚本执行超时（60秒）");
}
```

### 性能优化

```
1. 进程复用
   • 缓存 ProcessBuilder
   • 重用临时目录结构

2. 输入输出优化
   • 使用缓冲读写
   • 异步读取输出流

3. 环境变量缓存
   • 缓存环境配置
   • 避免重复查询数据库
```

---

## 附录

### A. 安全转换函数完整版

```python
# -*- coding: utf-8 -*-

def safe_int(value, default=0):
    """
    安全地转换为整数

    参数:
        value: 要转换的值
        default: 默认值（当转换失败时返回）

    返回:
        int: 转换后的整数或默认值
    """
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    """
    安全地转换为浮点数

    参数:
        value: 要转换的值
        default: 默认值（当转换失败时返回）

    返回:
        float: 转换后的浮点数或默认值
    """
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_bool(value, default=False):
    """
    安全地转换为布尔值

    参数:
        value: 要转换的值
        default: 默认值（当值为 None 或空字符串时返回）

    返回:
        bool: 转换后的布尔值或默认值
    """
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    return bool(value)

def safe_json_parse(value, default):
    """
    安全地解析 JSON

    参数:
        value: 要解析的值（可能是字符串或已解析的对象）
        default: 默认值（当解析失败时返回）

    返回:
        解析后的对象或默认值
    """
    import json

    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return default
    return value if value is not None else default

def safe_str(value, default=''):
    """
    安全地转换为字符串

    参数:
        value: 要转换的值
        default: 默认值（当值为 None 时返回）

    返回:
        str: 转换后的字符串或默认值
    """
    if value is None:
        return default
    return str(value)
```

### B. 常用代码片段

#### 参数验证

```python
# 验证必填字段
def validate_required(inputs, *fields):
    """验证必填字段"""
    errors = []
    for field in fields:
        if not inputs.get(field):
            errors.append({
                "field": field,
                "message": f"{field} 不能为空"
            })
    return errors

# 使用
errors = validate_required(inputs, 'username', 'email', 'password')
if errors:
    outputs = {
        "success": False,
        "errors": errors
    }
```

#### 范围验证

```python
# 验证数值范围
def validate_range(value, min_val, max_val, field_name):
    """验证数值范围"""
    if value < min_val or value > max_val:
        return {
            "field": field_name,
            "message": f"{field_name} 必须在 {min_val} 到 {max_val} 之间"
        }
    return None

# 使用
age = safe_int(inputs.get('age'), 0)
error = validate_range(age, 0, 150, "age")
if error:
    outputs = {
        "success": False,
        "error": error
    }
```

#### 邮箱验证

```python
# 简单的邮箱验证
def validate_email(email):
    """验证邮箱格式"""
    if not email:
        return False
    if '@' not in email or '.' not in email:
        return False
    parts = email.split('@')
    if len(parts) != 2:
        return False
    if '.' not in parts[1]:
        return False
    return True

# 使用
email = inputs.get('email', '')
if not validate_email(email):
    outputs = {
        "success": False,
        "error": "邮箱格式错误"
    }
```

### C. 测试用例模板

```json
{
  "test_cases": [
    {
      "name": "正常输入",
      "inputs": {
        "a": 10,
        "b": 5
      },
      "expected": {
        "success": true,
        "sum": 15
      }
    },
    {
      "name": "空输入",
      "inputs": {},
      "expected": {
        "success": true,
        "sum": 0
      }
    },
    {
      "name": "字符串输入",
      "inputs": {
        "a": "10",
        "b": "5"
      },
      "expected": {
        "success": true,
        "sum": 15
      }
    },
    {
      "name": "无效输入",
      "inputs": {
        "a": "abc",
        "b": "xyz"
      },
      "expected": {
        "success": true,
        "sum": 0
      }
    },
    {
      "name": "空字符串",
      "inputs": {
        "a": "",
        "b": ""
      },
      "expected": {
        "success": true,
        "sum": 0
      }
    }
  ]
}
```

---

## 总结

### 关键要点

```
✅ 类型转换
   • 所有参数都可能是字符串
   • 使用 safe_int/safe_float/safe_bool 函数
   • 不要依赖默认值的类型

✅ 上下文变量
   • 使用 ctx. 前缀获取
   • 自动注入，无需配置
   • 数字类型也需要转换

✅ 输入验证
   • 验证必填字段
   • 检查数值范围
   • 提供友好的错误消息

✅ 输出格式
   • outputs 必须是字典
   • 包含 success 标志
   • 可序列化为 JSON

✅ 错误处理
   • 使用 try-except
   • 返回详细的错误信息
   • 提供解决建议

✅ 编码支持
   • 系统自动处理 UTF-8
   • 可以使用中文和特殊字符
   • print() 输出在 _console_output

✅ 调试方法
   • 使用 print() 打印信息
   • 验证输出格式
   • 测试边界情况
```

### 推荐流程

```
1. 编写脚本
   → 使用安全转换函数
   → 添加输入验证
   → 设置 outputs

2. 本地测试
   → 测试正常输入
   → 测试边界情况
   → 检查输出格式

3. 在线测试
   → 使用测试功能
   → 查看执行结果
   → 调整脚本

4. 部署使用
   → 在流程中使用
   → 监控执行情况
   → 优化性能
```

---

**BlockFlow Python 脚本编写完整指南 - 让脚本开发更简单** 🚀
