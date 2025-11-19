# Python执行引擎使用指南

## 概述

已完成Python执行引擎的实现和Block测试功能的集成。该引擎支持在隔离的Python环境中执行脚本，并提供完整的输入输出处理。

## 功能特性

### 1. PythonScriptExecutor 增强功能

#### 输入参数支持
- 通过JSON文件传递输入参数给Python脚本
- 自动包装用户脚本，注入参数读取逻辑
- 脚本中可通过 `inputs` 变量访问输入参数

#### 输出处理
- 自动解析JSON格式的输出
- 支持非JSON格式的文本输出
- 分离标准输出(stdout)和错误输出(stderr)

#### 超时控制
- 默认超时时间：60秒
- 可自定义超时时间
- 超时自动终止进程

#### 错误处理
- 捕获Python脚本异常
- 完整的堆栈跟踪信息
- 友好的错误消息

### 2. Block测试功能

- 集成Python执行引擎
- 支持测试时传入输入参数
- 返回详细的执行结果（包括输出、错误、执行时间等）

## Python脚本编写规范

### 基本结构

```python
# 1. 访问输入参数
name = inputs.get('name', 'World')
age = inputs.get('age', 0)

# 2. 执行业务逻辑
result = f"Hello {name}, you are {age} years old"

# 3. 设置输出（必须是字典类型）
outputs = {
    "message": result,
    "status": "success"
}
```

### 输入参数

脚本执行时，系统会自动注入 `inputs` 字典变量，包含所有传入的参数。

**示例：**
```python
# 获取单个参数
username = inputs.get('username')

# 获取参数并提供默认值
count = inputs.get('count', 10)

# 获取嵌套对象
config = inputs.get('config', {})
timeout = config.get('timeout', 30)
```

### 输出结果

脚本必须设置 `outputs` 变量（字典类型），系统会自动将其转换为JSON并返回。

**成功输出示例：**
```python
outputs = {
    "success": True,
    "data": {
        "id": 123,
        "name": "test"
    },
    "message": "操作成功"
}
```

**错误处理示例：**
```python
# 业务错误
if not valid:
    outputs = {
        "success": False,
        "error": "验证失败",
        "details": "用户名不能为空"
    }
else:
    # 正常处理
    outputs = {"success": True, "data": result}
```

### 异常处理

系统会自动捕获异常，无需手动try-catch。异常信息会被包含在返回结果中。

```python
# 如果需要主动抛出异常
if critical_error:
    raise Exception("严重错误：无法继续执行")
```

## 测试示例

### 示例1：简单计算

**Python脚本：**
```python
# 从输入获取两个数字
a = inputs.get('a', 0)
b = inputs.get('b', 0)

# 执行计算
sum_result = a + b
product = a * b

# 返回结果
outputs = {
    "sum": sum_result,
    "product": product,
    "operation": "arithmetic"
}
```

**测试请求：**
```json
{
  "blockId": 1,
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
  "executionTime": 156,
  "output": {
    "sum": 15,
    "product": 50,
    "operation": "arithmetic"
  }
}
```

### 示例2：字符串处理

**Python脚本：**
```python
# 获取输入文本
text = inputs.get('text', '')
operation = inputs.get('operation', 'upper')

# 根据操作类型处理
if operation == 'upper':
    result = text.upper()
elif operation == 'lower':
    result = text.lower()
elif operation == 'reverse':
    result = text[::-1]
else:
    result = text

# 返回结果
outputs = {
    "original": text,
    "operation": operation,
    "result": result,
    "length": len(result)
}
```

**测试请求：**
```json
{
  "blockId": 2,
  "inputs": {
    "text": "Hello World",
    "operation": "reverse"
  }
}
```

**预期返回：**
```json
{
  "success": true,
  "executionTime": 123,
  "output": {
    "original": "Hello World",
    "operation": "reverse",
    "result": "dlroW olleH",
    "length": 11
  }
}
```

### 示例3：使用第三方库

**Python脚本：**
```python
import json
import datetime

# 获取输入
name = inputs.get('name', 'Guest')
timestamp = inputs.get('timestamp')

# 处理时间戳
if timestamp:
    dt = datetime.datetime.fromtimestamp(timestamp)
    formatted_time = dt.strftime('%Y-%m-%d %H:%M:%S')
else:
    formatted_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

# 返回结果
outputs = {
    "greeting": f"Hello, {name}!",
    "server_time": formatted_time,
    "timestamp": int(datetime.datetime.now().timestamp())
}
```

**测试请求：**
```json
{
  "blockId": 3,
  "inputs": {
    "name": "Alice",
    "timestamp": 1700000000
  }
}
```

### 示例4：错误处理

**Python脚本：**
```python
# 获取除数
divisor = inputs.get('divisor')
dividend = inputs.get('dividend', 100)

# 验证输入
if divisor is None:
    outputs = {
        "success": False,
        "error": "参数错误",
        "message": "divisor参数不能为空"
    }
elif divisor == 0:
    outputs = {
        "success": False,
        "error": "除数不能为0",
        "message": "请提供非零的除数"
    }
else:
    # 执行除法
    result = dividend / divisor
    outputs = {
        "success": True,
        "dividend": dividend,
        "divisor": divisor,
        "result": result
    }
```

## API接口

### 测试Block

**端点：** `POST /blocks/{id}/test`

**请求体：**
```json
{
  "blockId": 1,
  "inputs": {
    "param1": "value1",
    "param2": 123,
    "param3": {
      "nested": "object"
    }
  }
}
```

**成功响应：**
```json
{
  "code": 200,
  "data": {
    "success": true,
    "executionTime": 245,
    "output": {
      "result": "processed data",
      "status": "completed"
    }
  }
}
```

**失败响应：**
```json
{
  "code": 200,
  "data": {
    "success": false,
    "executionTime": 189,
    "errorMessage": "脚本执行失败，退出代码: 1",
    "stderr": "Traceback (most recent call last):\n  ...",
    "exitCode": 1
  }
}
```

## 性能优化建议

1. **避免耗时操作**
   - 网络请求应设置合理的超时
   - 大文件处理应考虑分片
   - 避免无限循环

2. **资源管理**
   - 及时关闭文件句柄
   - 释放大对象占用的内存
   - 使用with语句管理资源

3. **输出大小**
   - 避免返回过大的数据
   - 对于大量数据，考虑返回摘要
   - 使用分页或流式处理

## 故障排查

### 常见问题

1. **脚本执行超时**
   - 检查脚本是否有死循环
   - 优化算法复杂度
   - 考虑增加超时时间

2. **ImportError: No module named 'xxx'**
   - 确认Python环境已安装所需依赖
   - 检查环境的site-packages路径配置
   - 使用离线包上传安装依赖

3. **编码问题**
   - 确保脚本使用UTF-8编码
   - 处理中文时使用ensure_ascii=False

4. **输出解析失败**
   - 确保outputs是字典类型
   - 检查JSON序列化是否成功
   - 避免输出不可序列化的对象（如函数、类实例等）

## 安全注意事项

1. **输入验证**
   - 始终验证和清理输入参数
   - 防止注入攻击
   - 限制输入大小

2. **资源限制**
   - 遵守超时设置
   - 避免占用过多内存
   - 不要执行系统命令（os.system, subprocess等）

3. **权限控制**
   - 不要访问敏感文件
   - 不要修改系统配置
   - 限制网络访问

## 技术实现细节

### 脚本包装机制

系统会自动包装用户脚本，添加以下功能：

1. **参数读取逻辑**
```python
import sys
import json

if len(sys.argv) > 1:
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        inputs = json.load(f)
else:
    inputs = {}
```

2. **用户脚本执行**
```python
try:
    # 用户的脚本内容（自动缩进）
    ...
except Exception as e:
    # 异常处理
    ...
```

3. **输出格式化**
```python
if 'outputs' in locals() or 'outputs' in globals():
    if isinstance(outputs, dict):
        print(json.dumps(outputs, ensure_ascii=False))
    else:
        print(json.dumps({'result': outputs}, ensure_ascii=False))
else:
    print(json.dumps({'success': True}, ensure_ascii=False))
```

### 环境隔离

- 通过PYTHONPATH环境变量实现依赖隔离
- 每个环境使用独立的site-packages目录
- 进程级别的隔离，互不干扰

## 更新日志

### v1.0 (当前版本)

- ✅ 实现PythonScriptExecutor执行引擎
- ✅ 支持输入参数传递
- ✅ 支持JSON输出解析
- ✅ 添加超时控制
- ✅ 完善错误处理
- ✅ 实现Block测试功能
- ✅ 集成执行引擎到BlockService

### 未来计划

- [ ] 支持异步执行
- [ ] 添加执行历史记录
- [ ] 支持流式输出
- [ ] 增加资源监控（CPU、内存使用）
- [ ] 支持脚本调试模式
