# Block测试示例 - 正确的类型转换

## 问题说明

JSON传输时，所有参数都可能是字符串类型。即使前端传入数字，后端序列化后Python读取时也可能是字符串。

**错误的写法：**
```python
a = inputs.get('a', 0)  # ❌ 如果inputs['a']存在且是字符串，a就是字符串
b = inputs.get('b', 0)  # ❌ 默认值0不会被使用
product = a * b         # ❌ 错误：can't multiply sequence by non-int
```

**正确的写法：**
```python
a = int(inputs.get('a', 0))  # ✅ 强制转换为整数
b = int(inputs.get('b', 0))  # ✅ 无论输入是什么类型，都转换
product = a * b              # ✅ 正确：两个整数相乘
```

## 完整的测试示例

### 示例1：基本计算（带类型转换）

**正确的Python脚本：**
```python
# -*- coding: utf-8 -*-
# 获取输入参数（强制类型转换）
a = int(inputs.get('a', 0))
b = int(inputs.get('b', 0))

# 执行计算
sum_result = a + b
product = a * b
difference = a - b
quotient = a / b if b != 0 else 0

# 获取上下文变量
user_name = inputs.get('ctx.USER_NAME', '默认用户')

print(f"用户名: {user_name}")
print(f"计算: {a} 和 {b}")

# 设置输出
outputs = {
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
    "sum": 15,
    "product": 50,
    "difference": 5,
    "quotient": 2.0,
    "user": "默认用户",
    "message": "10 + 5 = 15, 10 × 5 = 50"
  }
}
```

### 示例2：字符串处理（无需转换）

**Python脚本：**
```python
# -*- coding: utf-8 -*-
# 字符串参数不需要转换
name = inputs.get('name', 'World')
greeting = inputs.get('greeting', 'Hello')

# 字符串操作
message = f"{greeting}, {name}!"
upper_message = message.upper()
length = len(message)

outputs = {
    "message": message,
    "upper": upper_message,
    "length": length
}
```

**测试请求：**
```json
{
  "inputs": {
    "name": "Alice",
    "greeting": "Hi"
  }
}
```

### 示例3：混合类型处理

**Python脚本：**
```python
# -*- coding: utf-8 -*-
# 字符串
name = inputs.get('name', 'Unknown')

# 整数（转换）
age = int(inputs.get('age', 0))
count = int(inputs.get('count', 1))

# 浮点数（转换）
price = float(inputs.get('price', 0.0))
discount = float(inputs.get('discount', 0.0))

# 布尔值（转换）
is_member = inputs.get('is_member', 'false').lower() == 'true'

# 计算
total = price * count
final_price = total * (1 - discount) if is_member else total

outputs = {
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

### 示例4：列表和对象处理

**Python脚本：**
```python
# -*- coding: utf-8 -*-
import json

# 处理列表（可能是JSON字符串或列表对象）
items_input = inputs.get('items', '[]')
if isinstance(items_input, str):
    items = json.loads(items_input)
else:
    items = items_input

# 处理对象（可能是JSON字符串或字典对象）
config_input = inputs.get('config', '{}')
if isinstance(config_input, str):
    config = json.loads(config_input)
else:
    config = config_input

# 从配置中获取参数（需要转换）
max_count = int(config.get('maxCount', 10))
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

outputs = {
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

## 类型转换快速参考

### 整数转换
```python
# 基本转换
num = int(inputs.get('num', 0))

# 带错误处理
try:
    num = int(inputs.get('num', 0))
except ValueError:
    num = 0
```

### 浮点数转换
```python
# 基本转换
price = float(inputs.get('price', 0.0))

# 带错误处理
try:
    price = float(inputs.get('price', 0.0))
except ValueError:
    price = 0.0
```

### 布尔值转换
```python
# 方式1：字符串比较（推荐）
enabled = inputs.get('enabled', 'false').lower() == 'true'

# 方式2：JSON解析
import json
enabled = json.loads(inputs.get('enabled', 'false'))

# 方式3：多值判断
enabled_str = inputs.get('enabled', 'false').lower()
enabled = enabled_str in ['true', '1', 'yes', 'on']
```

### 列表/对象转换
```python
import json

# 安全的JSON解析
def safe_json_parse(value, default):
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return default
    return value if value is not None else default

# 使用
items = safe_json_parse(inputs.get('items'), [])
config = safe_json_parse(inputs.get('config'), {})
```

## 常见错误和解决方案

### 错误1：类型错误
```
TypeError: can't multiply sequence by non-int of type 'str'
```
**原因：** 参数是字符串，未转换
**解决：** `num = int(inputs.get('num', 0))`

### 错误2：值错误
```
ValueError: invalid literal for int() with base 10: 'abc'
```
**原因：** 字符串无法转换为整数
**解决：** 添加try-except处理

### 错误3：属性错误
```
AttributeError: 'str' object has no attribute 'get'
```
**原因：** JSON字符串未解析
**解决：** `config = json.loads(inputs.get('config', '{}'))`

### 错误4：编码错误（输出乱码）
```
输出中显示: {"message": "计算: 10 �� 5 = 50"}
```
**问题表现：** 中文或特殊字符（×、√、℃ 等）显示为 `��`
**原因：** Windows 系统 Python 标准输出默认编码不是 UTF-8
**解决：** 系统已自动修复，无需手动处理
- 引擎会自动设置输出编码为 UTF-8
- 用户可以放心在输出中使用中文和特殊字符
- 示例：`outputs = {"message": "温度: 25℃, 结果: √"}`

## 调试技巧

### 1. 打印输入类型
```python
for key, value in inputs.items():
    print(f"{key}: {value} (type: {type(value).__name__})")
```

### 2. 安全的类型转换
```python
def safe_int(value, default=0):
    try:
        if isinstance(value, str):
            return int(value)
        return int(value) if value is not None else default
    except (ValueError, TypeError):
        return default

a = safe_int(inputs.get('a'), 0)
```

### 3. 验证输出
```python
# 检查所有输出值是否可序列化
import json
try:
    json.dumps(outputs)
    print("输出验证通过")
except TypeError as e:
    print(f"输出包含不可序列化的对象: {e}")
```

## 最佳实践

1. **总是进行类型转换** - 不要依赖默认值的类型
2. **提供合理的默认值** - 确保默认值的类型正确
3. **添加类型检查** - 对关键参数验证类型
4. **使用try-except** - 处理可能的转换错误
5. **记录输入类型** - 调试时打印参数类型
6. **测试边界情况** - 测试空值、零值、特殊字符等
7. **放心使用中文和特殊字符** - 系统已自动处理 UTF-8 编码，可以直接使用中文、数学符号（×÷±）、货币符号（¥€$）、度量单位（℃℉）等

## 推荐的脚本模板

```python
# -*- coding: utf-8 -*-
import json

# ========== 输入参数处理 ==========

# 字符串参数（无需转换）
name = inputs.get('name', '')

# 整数参数（必须转换）
try:
    count = int(inputs.get('count', 0))
    port = int(inputs.get('port', 3306))
except ValueError:
    outputs = {"error": "参数类型错误"}
    raise

# 浮点数参数（必须转换）
try:
    price = float(inputs.get('price', 0.0))
except ValueError:
    outputs = {"error": "价格必须是数字"}
    raise

# 布尔参数（转换）
enabled = inputs.get('enabled', 'false').lower() == 'true'

# JSON对象参数（解析）
config_str = inputs.get('config', '{}')
config = json.loads(config_str) if isinstance(config_str, str) else config_str

# 上下文变量
db_host = inputs.get('ctx.DB_HOST', 'localhost')

# ========== 业务逻辑 ==========

result = f"处理{count}条数据"

# ========== 输出结果 ==========

outputs = {
    "success": True,
    "result": result,
    "config": config
}

print(json.dumps(outputs, ensure_ascii=False))
```
