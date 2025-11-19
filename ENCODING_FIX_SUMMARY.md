# Python 输出编码问题修复总结

## 问题描述

**症状：**
```json
{"message": "计算: 10 �� 5 = 50"}
```
中文和特殊字符（×、√、℃ 等）在输出中显示为乱码 `��`

## 根本原因

Windows 系统上 Python 的标准输出（stdout）默认编码**不是 UTF-8**，而是系统默认编码（如 CP936/GBK）。

当 Python 脚本输出包含 Unicode 字符（如乘号 × U+00D7）时：
1. `json.dumps(outputs, ensure_ascii=False)` 生成 UTF-8 编码的 JSON 字符串
2. Python 的 stdout 使用系统默认编码（如 GBK）输出
3. Java 使用 UTF-8 读取输出
4. 编码不匹配导致乱码

## 解决方案

### 系统级修复（已完成）

在 `PythonScriptExecutor.java` 的 `wrapScript()` 方法中，自动在每个脚本开头添加：

```python
import sys
import io

# 强制标准输出使用 UTF-8 编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
```

### 技术原理

- `sys.stdout.buffer`: 获取底层的字节流（不带编码）
- `io.TextIOWrapper(..., encoding='utf-8')`: 用 UTF-8 编码包装字节流
- 重新赋值给 `sys.stdout`，替换默认的文本包装器

### 效果

✅ **修复后：** 所有输出强制使用 UTF-8 编码
- Python 输出：UTF-8
- Java 读取：UTF-8
- 编码匹配，正确显示

## 用户使用指南

### ✅ 可以放心使用的字符

用户在编写 Python 脚本时，可以直接在输出中使用：

| 类型 | 示例字符 | 说明 |
|------|----------|------|
| 中文 | 中文汉字 | 所有中文字符 |
| 数学符号 | × ÷ ± ≠ ≤ ≥ ∞ √ | 数学运算和比较符号 |
| 货币符号 | ¥ € $ £ ₹ | 各国货币符号 |
| 度量单位 | ℃ ℉ ㎡ ㎏ | 温度、面积、重量等单位 |
| 特殊标记 | ✓ ✗ ★ ☆ ❤ | 对勾、星号、心形等 |
| 箭头符号 | → ← ↑ ↓ ⇒ ⇐ | 各种方向箭头 |
| 表情符号 | 😀 😊 ✨ 🎉 | Emoji 表情（需 Python 3.3+）|

### 示例代码

```python
# 示例1: 数学计算输出
a = int(inputs.get('a', 0))
b = int(inputs.get('b', 0))
outputs = {
    "message": f"{a} × {b} = {a * b}",
    "formula": "面积 = 长 × 宽"
}

# 示例2: 温度转换
celsius = float(inputs.get('celsius', 0))
fahrenheit = celsius * 9/5 + 32
outputs = {
    "result": f"{celsius}℃ = {fahrenheit}℉",
    "status": "✓ 转换成功"
}

# 示例3: 金融计算
price = float(inputs.get('price', 0))
discount = float(inputs.get('discount', 0))
final_price = price * (1 - discount)
outputs = {
    "message": f"原价: ¥{price}, 折扣后: ¥{final_price}",
    "saved": f"节省: ¥{price - final_price}"
}

# 示例4: 状态标记
success = inputs.get('success', 'false').lower() == 'true'
outputs = {
    "status": "✓ 成功" if success else "✗ 失败",
    "icon": "🎉" if success else "⚠️"
}
```

## 修改的文件

### 1. PythonScriptExecutor.java
**位置：** `/mnt/c/work/组件/运维部署/block-flow/api/src/main/java/cn/tannn/cat/block/service/PythonScriptExecutor.java`

**修改内容：**
- 在 `wrapScript()` 方法开头添加 UTF-8 编码设置
- 行 230-236：添加 `import io` 和强制 UTF-8 编码的代码

### 2. PYTHON_EXECUTOR_GUIDE.md
**位置：** `/mnt/c/work/组件/运维部署/block-flow/PYTHON_EXECUTOR_GUIDE.md`

**修改内容：**
- 在"输出处理"部分添加 UTF-8 编码保证说明
- 在"常见问题"第4条扩展编码问题说明，包含：
  - 问题表现
  - 根本原因
  - 系统自动处理说明
  - 技术细节
  - 用户注意事项

### 3. BLOCK_TEST_EXAMPLE.md
**位置：** `/mnt/c/work/组件/运维部署/block-flow/BLOCK_TEST_EXAMPLE.md`

**修改内容：**
- 在"常见错误和解决方案"添加错误4：编码错误
- 在"最佳实践"添加第7条：放心使用中文和特殊字符

## 验证测试

### 测试用例

**测试脚本：**
```python
a = int(inputs.get('a', 0))
b = int(inputs.get('b', 0))

outputs = {
    "sum": a + b,
    "product": a * b,
    "message": f"{a} + {b} = {a + b}, {a} × {b} = {a * b}"
}
```

**测试输入：**
```json
{
  "inputs": {
    "a": 10,
    "b": 5
  }
}
```

**预期输出（修复前）：**
```json
{
  "sum": 15,
  "product": 50,
  "message": "10 + 5 = 15, 10 �� 5 = 50"
}
```

**实际输出（修复后）：**
```json
{
  "sum": 15,
  "product": 50,
  "message": "10 + 5 = 15, 10 × 5 = 50"
}
```

## 注意事项

1. **无需用户手动处理** - 系统已自动在每个脚本开头添加编码设置
2. **向后兼容** - 修改不影响现有脚本，所有脚本都会自动受益
3. **跨平台统一** - 在 Windows、Linux、macOS 上都使用统一的 UTF-8 编码
4. **性能影响** - 编码设置开销极小，对执行性能无明显影响

## 相关资源

- Python 官方文档：[sys.stdout](https://docs.python.org/3/library/sys.html#sys.stdout)
- Python 官方文档：[io.TextIOWrapper](https://docs.python.org/3/library/io.html#io.TextIOWrapper)
- UTF-8 编码标准：[RFC 3629](https://tools.ietf.org/html/rfc3629)

## 修复日期

2025-01-19

---

**总结：** 通过在脚本执行前自动设置 Python 标准输出的编码为 UTF-8，彻底解决了中文和特殊字符在 Windows 系统上的乱码问题。用户现在可以放心在脚本输出中使用任何 Unicode 字符。
