# Monaco Editor 智能代码提示功能说明

## 概述

已为BlockFlow的块编辑器(BlockEditor)的Monaco Editor添加了智能代码提示(IntelliSense)功能,为Python脚本编写提供更好的开发体验。

## 实现位置

文件: `/web/src/pages/BlockEditor/index.tsx`

## 功能详情

### 1. 输入参数智能提示

**触发条件**: 输入 `inputs.get(`

**功能**:
- 自动列出所有已配置的输入参数
- 显示参数类型(string/number/boolean/object)
- 显示参数描述
- 自动填充参数名和类型对应的默认值

**示例**:
```python
# 输入 inputs.get( 后触发提示
# 提示列表会显示:
# - 'username' (输入参数 - string) - 用户名
# - 'age' (输入参数 - number) - 用户年龄
# - 'enabled' (输入参数 - boolean) - 是否启用

# 选择后自动填充:
username = inputs.get('username', '')
age = inputs.get('age', 0)
enabled = inputs.get('enabled', False)
```

### 2. 输出参数智能提示

**触发条件**:
- 输入 `outputs = {`
- 输入 `output` 后按 Ctrl+Space

**功能**:
- 输入 `outputs = {` 后自动提示所有已配置的输出参数
- 输入 `output` 后可快速生成完整的outputs字典骨架
- 根据配置的输出参数自动生成字典结构

**示例**:
```python
# 方式1: 输入 outputs = { 后逐个添加
outputs = {
    "success": True,  # 提示会显示已配置的输出参数
    "result": data,
    "message": "处理完成"
}

# 方式2: 输入 output 后按 Ctrl+Space, 选择 "outputs (完整)"
# 自动生成包含所有配置参数的完整字典:
outputs = {
    "success": value,
    "result": value,
    "data": value
}
```

### 3. 上下文变量智能提示

**触发条件**: 输入 `inputs.get('ctx.`

**功能**:
- 提示可用的上下文变量(ctx.DB_HOST, ctx.DB_PORT等)
- 显示变量类型和描述
- 自动填充变量名和合适的默认值

**示例**:
```python
# 输入 inputs.get('ctx. 后触发提示
# 提示列表会显示:
# - ctx.DB_HOST (上下文变量 - string) - 数据库主机
# - ctx.DB_PORT (上下文变量 - number) - 数据库端口
# - ctx.API_KEY (上下文变量 - string) - API密钥

# 选择后自动填充:
db_host = inputs.get('ctx.DB_HOST', '')
db_port = inputs.get('ctx.DB_PORT', 0)
```

### 4. 安全转换函数智能提示

**触发条件**: 输入 `safe_`

**功能**:
- 提示 safe_int, safe_float, safe_bool 函数
- 自动生成函数调用模板
- 使用代码片段(Snippet)支持Tab键跳转参数
- **🎉 这些函数已内置到系统中,无需手动定义**

**示例**:
```python
# 输入 safe_ 后触发提示, 选择 safe_int
# 自动生成模板:
safe_int(inputs.get('param_name'), 0)
#                    ^光标在这里, 可以Tab跳转到下一个参数

# 提供的函数 (已内置,无需手动编写):
# - safe_int(inputs.get('param_name'), 0)
# - safe_float(inputs.get('param_name'), 0.0)
# - safe_bool(inputs.get('param_name'), False)
```

### 5. inputs. 方法提示

**触发条件**: 输入 `inputs.`

**功能**:
- 提示 get 方法
- 自动生成方法调用模板

**示例**:
```python
# 输入 inputs. 后触发提示
# 选择 get 后自动生成:
inputs.get('param_name', '')
```

## Monaco Editor 配置

### 启用的编辑器选项

```typescript
{
  minimap: { enabled: true },                    // 显示小地图
  fontSize: 14,                                  // 字体大小
  wordWrap: 'on',                               // 自动换行
  automaticLayout: true,                        // 自动布局
  suggestOnTriggerCharacters: true,             // 触发字符时显示建议
  quickSuggestions: {                           // 快速建议配置
    other: true,                                // 其他位置启用
    comments: false,                            // 注释中禁用
    strings: true,                              // 字符串中启用
  },
  parameterHints: {                             // 参数提示
    enabled: true,
  },
  suggest: {                                    // 建议配置
    showWords: false,                           // 不显示单词建议
    showSnippets: true,                         // 显示代码片段
  },
}
```

## 快捷键

- **Ctrl + Space** - 手动触发代码提示
- **Tab** 或 **Enter** - 选择提示项
- **Esc** - 关闭提示面板
- **Tab** - 在代码片段中跳转到下一个占位符

## 技术实现

### 核心代码

```typescript
// 注册代码补全提供器
monaco.languages.registerCompletionItemProvider('python', {
  provideCompletionItems: (model, position) => {
    // 1. 获取当前行文本和光标位置
    const line = model.getLineContent(position.lineNumber);
    const textBeforeCursor = line.substring(0, position.column - 1);

    // 2. 根据不同的上下文提供不同的建议
    const suggestions = [];

    // 检测 inputs.get( - 提供输入参数建议
    if (textBeforeCursor.endsWith('inputs.get(')) {
      inputParams.forEach(param => {
        suggestions.push({
          label: `'${param.name}'`,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `'${param.name}', ${defaultValue}`,
          detail: `输入参数 (${param.type})`,
          documentation: param.description,
        });
      });
    }

    // ... 其他提示逻辑

    return { suggestions };
  },
});
```

### CompletionItemKind 类型说明

- **Property** - 属性(用于输入/输出参数)
- **Variable** - 变量(用于上下文变量)
- **Function** - 函数(用于安全转换函数)
- **Method** - 方法(用于inputs.get)
- **Snippet** - 代码片段(用于完整的outputs模板)

## 用户体验优化

### 1. 参数类型匹配

根据参数配置的类型自动提供合适的默认值:
- `string` → `''`
- `number` → `0`
- `boolean` → `False`
- `object` → `{}`

### 2. 描述信息

所有提示项都包含:
- **label** - 显示名称
- **detail** - 类型信息
- **documentation** - 详细描述

### 3. 代码片段支持

使用Monaco的Snippet语法支持参数占位符:
```typescript
insertText: 'safe_int(inputs.get(\'${1:param_name}\'), ${2:0})'
//                                 ^占位符1        ^占位符2
```

用户可以通过Tab键在占位符之间跳转。

## 扩展建议

### 未来可以添加的功能

1. **从后端获取上下文变量列表**
   - 当前上下文变量是硬编码的示例
   - 可以通过API实时获取用户配置的上下文变量

2. **Python库函数提示**
   - 根据选择的Python环境提供已安装库的函数提示
   - 例如: `import requests` 后提示 `requests.get`, `requests.post` 等

3. **语法错误实时检测**
   - 使用Pylint或类似工具实时检查Python语法错误
   - 在编辑器中显示错误提示和波浪线

4. **代码格式化**
   - 集成Black或autopep8进行代码格式化
   - 提供格式化快捷键

5. **智能导入建议**
   - 检测使用但未导入的模块
   - 自动添加import语句

## 注意事项

1. **性能考虑**: 代码提示逻辑在每次输入时都会执行,确保逻辑简单高效
2. **参数更新**: 当用户修改输入输出参数配置后,提示内容会实时更新(通过React的依赖更新)
3. **浏览器兼容**: Monaco Editor依赖现代浏览器特性,建议使用Chrome/Edge/Firefox最新版本

## 测试建议

### 测试用例

1. **输入参数提示测试**
   - 配置2-3个不同类型的输入参数
   - 输入 `inputs.get(` 验证提示是否正确显示
   - 验证选择后是否正确填充参数名和默认值

2. **输出参数提示测试**
   - 配置2-3个输出参数
   - 输入 `outputs = {` 验证提示
   - 输入 `output` 并触发完整模板验证

3. **上下文变量提示测试**
   - 输入 `inputs.get('ctx.` 验证提示显示

4. **安全转换函数测试**
   - 输入 `safe_` 验证三个函数的提示
   - 验证代码片段的Tab跳转功能

5. **边界情况测试**
   - 没有配置输入输出参数时的行为
   - 输入参数为空时的默认值
   - 特殊字符参数名的处理

## 总结

通过添加智能代码提示功能,BlockFlow的块编辑器现在可以:

✅ **减少输入错误** - 通过选择而非手动输入参数名
✅ **提高开发效率** - 自动填充常用代码模板
✅ **增强用户体验** - 提供实时的上下文相关建议
✅ **降低学习成本** - 新用户可以通过提示了解可用的参数和函数
✅ **保持一致性** - 确保参数使用与配置一致

这是一个显著的用户体验提升,特别是对于不熟悉Python或BlockFlow脚本规范的用户。
