# Blockly 模块化架构说明

## 📁 目录结构

```
src/blockly/
├── core/                      # 核心模块
│   ├── BlockDefinition.ts    # 块定义基类和辅助工具
│   ├── BlockRegistry.ts      # 块注册管理器
│   ├── ToolboxManager.ts     # 工具箱配置管理器
│   └── index.ts              # 核心模块统一导出
├── blocks/                    # 所有自定义块定义
│   ├── PythonIOBlocks.ts     # Python输入输出块（8个块）
│   ├── PythonCodeBlocks.ts   # Python代码工具块（15个块）
│   └── index.ts              # 块定义统一导出
└── index.ts                   # 模块总入口，提供初始化和配置接口
```

## 🚀 快速开始

### 1. 初始化Blockly

```typescript
import { initializeBlockly } from './blockly';

// 在应用启动时调用一次
initializeBlockly();
```

### 2. 获取工具箱配置

```typescript
import { getBlocklyToolbox } from './blockly';

// 获取完整工具箱（包含所有分类）
const toolbox = getBlocklyToolbox();

// 或仅获取指定分类
const toolbox = getBlocklyToolbox(['python_io', 'python_file', 'logic']);
```

### 3. 在组件中使用

```typescript
import { getBlocklyToolbox } from './blockly';

const MyComponent = () => {
  const workspace = Blockly.inject(divRef.current, {
    toolbox: getBlocklyToolbox(),
    // ... 其他配置
  });
};
```

## 📦 核心模块

### BlockDefinition (块定义基类)

所有自定义块都继承自 `BlockDefinition` 抽象类。

```typescript
import { BlockDefinition, BlockHelper } from '../blockly/core';

export class MyCustomBlock extends BlockDefinition {
  type = 'my_custom_block';
  category = 'my_category';

  definition = {
    type: this.type,
    message0: '我的块 %1',
    args0: [
      {
        type: 'input_value',
        name: 'INPUT',
      },
    ],
    output: 'String',
    colour: '#ff0000',
    tooltip: '这是我的自定义块',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const input = BlockHelper.getInputValue(block, 'INPUT', pythonGenerator.ORDER_NONE);
    const code = `my_function(${input})`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}
```

### BlockHelper (辅助工具)

提供常用的代码生成辅助方法：

```typescript
// 获取字段值
const value = BlockHelper.getFieldValue(block, 'FIELD_NAME');

// 获取输入值代码
const code = BlockHelper.getInputValue(block, 'INPUT_NAME', order);

// 获取语句代码
const statements = BlockHelper.getStatements(block, 'DO');

// 添加缩进
const indented = BlockHelper.indent(code, 2); // 2层缩进

// 确保换行符
const withNewline = BlockHelper.ensureNewline(code);
```

### BlockRegistry (块注册器)

统一管理所有块的注册和查询。

```typescript
import { BlockRegistry } from './blockly/core';

// 注册单个块
BlockRegistry.registerBlock(new MyCustomBlock());

// 批量注册
BlockRegistry.registerBlocks([
  new Block1(),
  new Block2(),
]);

// 注册所有块到Blockly
BlockRegistry.registerAll();

// 获取所有块类型
const types = BlockRegistry.getAllBlockTypes();

// 按分类获取块
const ioBlocks = BlockRegistry.getBlocksByCategory('python_io');
```

### ToolboxManager (工具箱管理器)

管理Blockly工具箱的分类和配置。

```typescript
import { ToolboxManager } from './blockly/core';

// 注册自定义分类
ToolboxManager.registerCategory({
  name: '我的分类',
  categoryId: 'my_category',
  colour: '#ff0000',
  order: 100,
});

// 生成工具箱配置
const toolbox = ToolboxManager.generateToolbox();

// 生成指定分类的工具箱
const toolbox = ToolboxManager.generateToolboxForCategories(['python_io', 'logic']);
```

## 🧩 已有的块分类

### 1. Python输入/输出 (python_io)

- `python_input_get` - 获取输入参数
- `python_output_set` - 设置输出字典
- `python_output_item` - 输出键值对
- `safe_int` - 安全转换为整数
- `safe_float` - 安全转换为浮点数
- `safe_bool` - 安全转换为布尔值
- `python_print` - 打印输出
- `context_variable` - 获取上下文变量

### 2. 文件操作 (python_file)

- `file_read` - 读取文件
- `file_write` - 写入文件

### 3. HTTP请求 (python_http)

- `http_request` - 发送HTTP请求
- `http_response_property` - 获取响应属性

### 4. JSON操作 (python_json)

- `json_parse` - JSON解析
- `json_stringify` - JSON序列化

### 5. 数据结构 (python_data)

- `dict_create_enhanced` - 创建字典
- `dict_item` - 字典键值对
- `dict_get_value` - 获取字典值
- `list_append_item` - 列表添加元素

### 6. 字符串操作 (python_string)

- `string_format` - f-string格式化

### 7. 控制流 (python_control)

- `try_except` - 错误处理

## ✨ 新增自定义块

### 步骤 1: 创建块定义类

在 `src/blockly/blocks/` 目录下创建新文件，例如 `MyBlocks.ts`：

```typescript
import * as Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';
import { BlockDefinition, BlockHelper } from '../core/BlockDefinition';

export class MyAwesomeBlock extends BlockDefinition {
  type = 'my_awesome_block';
  category = 'my_category'; // 分类ID

  definition = {
    type: this.type,
    message0: '做点厉害的事 %1',
    args0: [
      {
        type: 'input_value',
        name: 'PARAM',
        check: 'String',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#ff6b6b',
    tooltip: '这是一个很厉害的块',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    const param = BlockHelper.getInputValue(block, 'PARAM', pythonGenerator.ORDER_NONE);
    const code = `do_something_awesome(${param})\n`;
    return code;
  };
}
```

### 步骤 2: 导出块

在 `src/blockly/blocks/index.ts` 中导出：

```typescript
export { MyAwesomeBlock } from './MyBlocks';
```

### 步骤 3: 注册块

在 `src/blockly/index.ts` 的 `BlocklyInitializer.initialize()` 中注册：

```typescript
import { MyAwesomeBlock } from './blocks';

// 在initialize方法中添加
BlockRegistry.registerBlocks([
  // ... 其他块
  new MyAwesomeBlock(),
]);
```

### 步骤 4: 配置工具箱分类（可选）

如果使用新分类，在 `src/blockly/core/ToolboxManager.ts` 的 `defaultCategories` 中添加：

```typescript
{
  name: '我的分类',
  categoryId: 'my_category',
  colour: '#ff6b6b',
  order: 50,
}
```

## 🎨 块定义参考

### 块类型

- **输出块** (output block): 返回值的块
  ```typescript
  definition = {
    output: 'String', // 或 null 表示任意类型
    // ...
  };
  ```

- **语句块** (statement block): 执行操作的块
  ```typescript
  definition = {
    previousStatement: null,
    nextStatement: null,
    // ...
  };
  ```

### 输入类型

- `input_value`: 值输入（可连接输出块）
- `input_statement`: 语句输入（可连接语句块）
- `input_dummy`: 占位输入（无连接）

### 字段类型

- `field_input`: 文本输入框
- `field_dropdown`: 下拉选择
- `field_checkbox`: 复选框
- `field_number`: 数字输入
- `field_angle`: 角度选择
- `field_colour`: 颜色选择

## 🔧 代码生成器

### 返回值类型

- **输出块**: 返回 `[code, order]`
  ```typescript
  return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  ```

- **语句块**: 返回 `string`
  ```typescript
  return code + '\n';
  ```

### 优先级常量 (Order)

```typescript
pythonGenerator.ORDER_ATOMIC          // 最高优先级
pythonGenerator.ORDER_MEMBER          // 成员访问 obj.attr
pythonGenerator.ORDER_FUNCTION_CALL   // 函数调用 func()
pythonGenerator.ORDER_EXPONENTIATION  // 指数 **
pythonGenerator.ORDER_MULTIPLICATIVE  // 乘除 * / //
pythonGenerator.ORDER_ADDITIVE        // 加减 + -
pythonGenerator.ORDER_BITWISE_SHIFT   // 位移 << >>
pythonGenerator.ORDER_BITWISE_AND     // 位与 &
pythonGenerator.ORDER_BITWISE_XOR     // 位异或 ^
pythonGenerator.ORDER_BITWISE_OR      // 位或 |
pythonGenerator.ORDER_RELATIONAL      // 比较 < > <= >=
pythonGenerator.ORDER_LOGICAL_NOT     // 逻辑非 not
pythonGenerator.ORDER_LOGICAL_AND     // 逻辑与 and
pythonGenerator.ORDER_LOGICAL_OR      // 逻辑或 or
pythonGenerator.ORDER_CONDITIONAL     // 三元 x if y else z
pythonGenerator.ORDER_LAMBDA          // lambda
pythonGenerator.ORDER_NONE            // 最低优先级
```

## 📝 最佳实践

### 1. 块命名规范

- **类型 (type)**: 小写字母+下划线，如 `python_input_get`
- **类名**: 大驼峰+Block后缀，如 `PythonInputGetBlock`
- **分类 (category)**: 小写字母+下划线，如 `python_io`

### 2. 颜色规范

```typescript
'#1890ff' // 蓝色 - 输入输出
'#13c2c2' // 青色 - 文件操作
'#fa8c16' // 橙色 - HTTP/网络
'#722ed1' // 紫色 - JSON/数据
'#52c41a' // 绿色 - 数据结构/列表
'#eb2f96' // 粉色 - 字符串
'#5c7cfa' // 蓝紫 - 控制流
```

### 3. 代码生成技巧

```typescript
// ✅ 好的做法
const value = BlockHelper.getInputValue(block, 'VALUE', pythonGenerator.ORDER_NONE) || "''";;

// ❌ 避免
const value = pythonGenerator.valueToCode(block, 'VALUE', 0);
```

### 4. 错误处理

```typescript
generator = (block: Blockly.Block): [string, number] => {
  const value = BlockHelper.getInputValue(block, 'VALUE', pythonGenerator.ORDER_NONE);

  // 提供默认值
  if (!value || value === '') {
    return ["''", pythonGenerator.ORDER_ATOMIC];
  }

  const code = `process(${value})`;
  return [code, pythonGenerator.ORDER_FUNCTION_CALL];
};
```

## 🔄 迁移指南

### 从旧架构迁移

旧代码 (blocklyCustomBlocks.ts):
```typescript
function defineMyBlock() {
  Blockly.Blocks['my_block'] = {
    init: function() {
      // ...
    }
  };

  pythonGenerator.forBlock['my_block'] = function(block, generator) {
    // ...
  };
}
```

新代码 (MyBlock.ts):
```typescript
export class MyBlock extends BlockDefinition {
  type = 'my_block';
  category = 'my_category';

  definition = {
    type: this.type,
    // ... 之前 init() 中的 jsonInit 参数
  };

  generator = (block: Blockly.Block) => {
    // ... 之前的生成器逻辑
  };
}
```

## 🧪 测试

```typescript
import { BlockRegistry, BlocklyInitializer } from './blockly';

// 测试块注册
describe('BlocklyInitializer', () => {
  it('should register all blocks', () => {
    BlocklyInitializer.initialize();
    const types = BlocklyInitializer.getAllBlockTypes();
    expect(types.length).toBeGreaterThan(0);
  });

  it('should generate toolbox config', () => {
    const toolbox = BlocklyInitializer.getToolboxConfig();
    expect(toolbox.kind).toBe('categoryToolbox');
    expect(toolbox.contents.length).toBeGreaterThan(0);
  });
});
```

## 📚 参考资源

- [Blockly官方文档](https://developers.google.com/blockly)
- [Blockly Python生成器](https://developers.google.com/blockly/guides/create-custom-blocks/generating-code)
- [TypeScript官方文档](https://www.typescriptlang.org/)

## 🤝 贡献

欢迎贡献新的块定义！请遵循以下步骤：

1. 创建块定义类（继承 `BlockDefinition`）
2. 编写清晰的注释和tooltip
3. 提供使用示例
4. 更新此README文档

## 📄 许可

MIT License
