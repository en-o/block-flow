# Blockly 自定义块说明文档

## 📦 新增功能总览

本次更新新增了以下功能:

### 1. ✅ XML 导出/导入功能
- **导出XML**: 将当前可视化工作区导出为XML文件，便于保存和分享
- **导入XML**: 从XML文件导入可视化块结构，快速恢复之前的编辑状态
- **位置**: 可视化模式顶部预览提示栏中的"导出XML"和"导入XML"按钮

### 2. ✅ 变量赋值与接收功能
新增支持变量赋值的块，类似 `res = a * 2` 这样的操作

### 3. ✅ 计算与变量操作块
新增一整套计算和变量操作块，包括:
- 变量赋值块
- 数学运算块
- 比较运算块
- 逻辑运算块
- 增量操作块

---

## 📚 新增块详细说明

### 计算与变量分类 (python_calculation)

#### 1. 变量赋值块 (variable_assign)
**功能**: 将表达式的结果赋值给变量

**示例**:
```python
result = a * 2
total = count + 10
name = 'Python'
```

**使用方法**:
1. 从"计算与变量"分类中拖出"变量赋值"块
2. 点击变量名下拉框选择或创建变量
3. 连接右侧输入值 (可以是数字、计算表达式、函数返回值等)

#### 2. 获取变量值块 (variable_get_value)
**功能**: 读取已定义变量的值

**示例**:
```python
result
count
name
```

**使用方法**:
1. 从"计算与变量"分类中拖出"获取变量"块
2. 选择要读取的变量名
3. 可将此块连接到其他块的输入端口

#### 3. 数学二元运算块 (math_binary_operation)
**功能**: 执行两个数值之间的数学运算

**支持的运算**:
- `+` 加法
- `-` 减法
- `×` 乘法
- `÷` 除法
- `^` 幂运算
- `%` 取余
- `//` 整除

**示例**:
```python
a + b
count * 2
price / 100
2 ** 8  # 2的8次方
10 % 3  # 余数: 1
10 // 3  # 整除: 3
```

**使用方法**:
1. 拖出"数学运算"块
2. 从下拉菜单选择运算符
3. 分别连接左右两个操作数

#### 4. 数学一元运算块 (math_unary_operation)
**功能**: 对单个数值进行数学操作

**支持的操作**:
- `-` 负号 (取反)
- `abs` 绝对值
- `round` 四舍五入
- `int` 转整数
- `float` 转浮点数

**示例**:
```python
-num         # 取反
abs(-5)      # 结果: 5
round(3.7)   # 结果: 4
int(3.9)     # 结果: 3
float(5)     # 结果: 5.0
```

#### 5. 比较运算块 (comparison_operation)
**功能**: 比较两个值，返回布尔值 (True/False)

**支持的比较**:
- `=` 等于
- `≠` 不等于
- `<` 小于
- `≤` 小于等于
- `>` 大于
- `≥` 大于等于

**示例**:
```python
age >= 18       # 检查是否成年
count == 0      # 检查是否为0
price < 100     # 价格是否低于100
```

#### 6. 逻辑运算块 (logic_operation)
**功能**: 对两个布尔值进行逻辑运算

**支持的运算**:
- `and` 逻辑与 (两个都为True时返回True)
- `or` 逻辑或 (至少一个为True时返回True)

**示例**:
```python
age >= 18 and age <= 65  # 18到65岁之间
is_member or is_admin    # 是会员或管理员
```

#### 7. 逻辑非运算块 (logic_not)
**功能**: 对布尔值取反

**示例**:
```python
not is_active    # 如果is_active是False，结果为True
not (age < 18)   # 等同于 age >= 18
```

#### 8. 数字常量块 (number_constant)
**功能**: 创建一个数字常量值

**示例**:
```python
42
3.14
-10
0.001
```

**使用方法**:
1. 拖出"数字常量"块
2. 点击数字输入框直接输入数值

#### 9. 增量操作块 (increment_operation)
**功能**: 对变量执行增减乘除操作并更新变量值

**支持的操作**:
- `+=` 增加
- `-=` 减少
- `*=` 乘以
- `/=` 除以

**示例**:
```python
counter += 1      # counter = counter + 1
total -= 5        # total = total - 5
amount *= 2       # amount = amount * 2
price /= 100      # price = price / 100
```

**使用方法**:
1. 拖出"增量操作"块
2. 选择要操作的变量
3. 选择运算符 (+=, -=, *=, /=)
4. 连接增量值

---

## 💡 使用示例

### 示例 1: 计算两个数的和并输出
```
1. 拖出两个"获取输入"块，分别获取参数 'a' 和 'b' (使用 safe_int 转换)
2. 拖出"数学运算"块，选择 '+' 运算符
3. 将两个输入块连接到运算块的左右两侧
4. 拖出"变量赋值"块，创建变量 'result'
5. 将运算块连接到赋值块的右侧
6. 拖出"设置输出 outputs"块
7. 在其中添加"输出键值对"，键名为 'result'，值为变量 'result'
```

生成的Python代码:
```python
a = safe_int(inputs.get('a'), 0)
b = safe_int(inputs.get('b'), 0)
result = a + b
outputs = {
  "result": result,
}
```

### 示例 2: 判断数字是否在范围内
```
1. 拖出"获取输入"块，获取参数 'age'
2. 拖出两个"比较运算"块
   - 第一个: age >= 18
   - 第二个: age <= 65
3. 拖出"逻辑运算"块，选择 'and'
4. 将两个比较块连接到逻辑运算块
5. 拖出"变量赋值"块，赋值给 'is_valid_age'
6. 输出结果
```

生成的Python代码:
```python
age = safe_int(inputs.get('age'), 0)
is_valid_age = age >= 18 and age <= 65
outputs = {
  "is_valid_age": is_valid_age,
}
```

### 示例 3: 使用增量操作计数
```
1. 拖出"变量赋值"块，创建变量 'counter'，初始值为 0
2. 拖出"增量操作"块，选择 'counter += 1'
3. 重复多次增量操作
4. 输出最终的 counter 值
```

生成的Python代码:
```python
counter = 0
counter += 1
counter += 1
counter += 1
outputs = {
  "counter": counter,
}
```

---

## 🎯 提示与最佳实践

### 1. 变量命名规范
- 使用有意义的变量名 (如 `total_price` 而不是 `x`)
- 遵循Python命名规范 (小写字母+下划线)
- 避免使用Python关键字 (如 `for`, `if`, `class` 等)

### 2. 类型转换
- 从 `inputs.get()` 获取的值建议使用 `safe_int`/`safe_float`/`safe_bool` 转换
- 确保数学运算的操作数类型正确

### 3. 表达式组合
- 可以将多个运算块嵌套使用，构建复杂的表达式
- 例如: `(a + b) * (c - d)` 可以通过嵌套运算块实现

### 4. 调试技巧
- 使用"print"块输出中间结果，便于调试
- 在"测试运行"模式下查看控制台输出

---

## 📝 文件结构

新增的计算块定义文件:
```
/src/blockly/blocks/CalculationBlocks.ts
```

包含以下块类:
- VariableAssignBlock - 变量赋值
- VariableGetBlock - 获取变量值
- MathBinaryOpBlock - 数学二元运算
- MathUnaryOpBlock - 数学一元运算
- ComparisonBlock - 比较运算
- LogicOperationBlock - 逻辑运算
- LogicNotBlock - 逻辑非
- NumberConstantBlock - 数字常量
- IncrementBlock - 增量操作

---

## 🔧 技术说明

### 块注册流程
1. 在 `CalculationBlocks.ts` 中定义块类 (继承 `BlockDefinition`)
2. 在 `blocks/index.ts` 中导出块类
3. 在 `blockly/index.ts` 中导入并注册块
4. 在 `ToolboxManager.ts` 中配置分类 (已自动完成)

### 代码生成
所有块都实现了 `generator` 方法，负责生成对应的Python代码:
- 使用 `BlockHelper` 工具类获取输入值和字段值
- 返回 `[code, order]` 元组 (对于表达式块) 或 `code` 字符串 (对于语句块)
- 遵循 Python 语法和缩进规范

---

## ❓ 常见问题

**Q: 为什么变量赋值块不生成代码?**
A: 检查是否正确连接了右侧的输入值。赋值块需要有值输入才能生成代码。

**Q: 如何创建新变量?**
A: 点击变量下拉框，选择"创建新变量"，输入变量名即可。

**Q: 数学运算块支持复杂表达式吗?**
A: 支持!可以将运算块嵌套连接，构建任意复杂度的数学表达式。

**Q: 如何在代码模式和可视化模式之间切换?**
A: 使用编辑器顶部的"代码模式"/"可视化模式"切换按钮。注意可视化模式仅用于预览，不会保存。

---

## 📞 需要帮助?

如果遇到问题或需要新增其他块，请:
1. 查看现有块的实现代码作为参考
2. 参考 Blockly 官方文档: https://developers.google.com/blockly
3. 检查浏览器控制台的错误信息

---

**最后更新**: 2025-01-26
**版本**: v2.0.0
