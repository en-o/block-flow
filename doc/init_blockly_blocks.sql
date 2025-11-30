-- ============================================================
-- Blockly自定义块初始化数据
-- 本文件包含系统预设的Blockly块定义，用于可视化编程功能
--
-- 表结构说明：
-- - id: 主键ID (自增)
-- - create_time: 创建时间
-- - update_time: 更新时间
-- - type: 块类型（唯一标识符）
-- - name: 块名称（显示名称）
-- - category: 块分类（用于工具箱分组）
-- - color: 块颜色（16进制色值）
-- - definition: 块定义（JSON格式）
-- - python_generator: Python代码生成器（JavaScript代码）
-- - description: 块描述
-- - example: 使用示例
-- - enabled: 是否启用（1=启用，0=禁用）
-- - sort_order: 排序顺序
-- - is_system: 是否为系统块（1=系统块，0=用户自定义块）
-- - version: 版本号
-- ============================================================

-- ============================================================
-- 分类1: Python输入输出块 (python_io)
-- ============================================================

-- 1. 获取输入参数块
INSERT INTO `blockly_blocks` (
  `create_time`, `update_time`,
  `type`, `name`, `category`, `color`,
  `definition`, `python_generator`,
  `description`, `example`,
  `enabled`, `sort_order`, `is_system`, `version`
) VALUES (
  NOW(), NOW(),
  'python_input_get',
  '获取输入参数',
  'python_io',
  '#1890ff',
  '{"type":"python_input_get","message0":"获取输入 %1 默认值 %2","args0":[{"type":"input_value","name":"PARAM_NAME","check":"String"},{"type":"input_value","name":"DEFAULT_VALUE"}],"output":null,"colour":"#1890ff","tooltip":"从inputs字典获取参数值","helpUrl":""}',
  'const paramName = generator.valueToCode(block, ''PARAM_NAME'', Order.NONE);
const defaultValue = generator.valueToCode(block, ''DEFAULT_VALUE'', Order.NONE) || "''''";
const code = `inputs.get(${paramName}, ${defaultValue})`;
return [code, Order.FUNCTION_CALL];',
  '从inputs字典获取参数值，支持设置默认值',
  '示例：获取用户名参数
输入：参数名="username", 默认值="guest"
输出：inputs.get("username", "guest")',
  1, 1, 1, 1
);

-- 2. 设置输出块
INSERT INTO `blockly_blocks` (
  `create_time`, `update_time`,
  `type`, `name`, `category`, `color`,
  `definition`, `python_generator`,
  `description`, `example`,
  `enabled`, `sort_order`, `is_system`, `version`
) VALUES (
  NOW(), NOW(),
  'python_output_set',
  '设置输出',
  'python_io',
  '#1890ff',
  '{"type":"python_output_set","message0":"设置输出 outputs","message1":"%1","args1":[{"type":"input_statement","name":"OUTPUTS"}],"previousStatement":null,"nextStatement":null,"colour":"#1890ff","tooltip":"设置输出结果（outputs字典）","helpUrl":""}',
  'const statements = generator.statementToCode(block, ''OUTPUTS'');
const code = ''outputs = {\\n'' + statements + ''}\\n'';
return code;',
  '设置输出结果字典，用于返回执行结果',
  '示例：设置返回数据
outputs = {
  "success": True,
  "data": result
}',
  1, 2, 1, 1
);

-- 3. 输出键值对块
INSERT INTO `blockly_blocks` (
  `create_time`, `update_time`,
  `type`, `name`, `category`, `color`,
  `definition`, `python_generator`,
  `description`, `example`,
  `enabled`, `sort_order`, `is_system`, `version`
) VALUES (
  NOW(), NOW(),
  'python_output_item',
  '输出键值对',
  'python_io',
  '#1890ff',
  '{"type":"python_output_item","message0":"\"%1\": %2","args0":[{"type":"field_input","name":"KEY","text":"key"},{"type":"input_value","name":"VALUE"}],"previousStatement":null,"nextStatement":null,"colour":"#1890ff","tooltip":"输出字典的键值对","helpUrl":""}',
  'const key = block.getFieldValue(''KEY'');
const value = generator.valueToCode(block, ''VALUE'', Order.NONE) || ''None'';
const code = `  "${key}": ${value},\\n`;
return code;',
  '在outputs字典中添加键值对',
  '示例：添加输出项
"result": 100
"message": "成功"',
  1, 3, 1, 1
);

-- ============================================================
-- 分类2: Python计算块 (python_calculation)
-- ============================================================

-- 4. 变量赋值块
INSERT INTO `blockly_blocks` (
  `create_time`, `update_time`,
  `type`, `name`, `category`, `color`,
  `definition`, `python_generator`,
  `description`, `example`,
  `enabled`, `sort_order`, `is_system`, `version`
) VALUES (
  NOW(), NOW(),
  'variable_assign',
  '变量赋值',
  'python_calculation',
  '#ff7a45',
  '{"type":"variable_assign","message0":"设置 %1 = %2","args0":[{"type":"field_variable","name":"VAR","variable":"result"},{"type":"input_value","name":"VALUE"}],"previousStatement":null,"nextStatement":null,"colour":"#ff7a45","tooltip":"【语句块】给变量赋值，如: aa = 10 或 bb = aa + 5\\n必须连接在其他块的下方或上方","helpUrl":""}',
  'const field = block.getField(''VAR'');
const variable = field?.getVariable?.();
const varName = variable ? variable.name : block.getFieldValue(''VAR'');
const value = generator.valueToCode(block, ''VALUE'', Order.NONE) || ''0'';
const code = `${varName} = ${value}\\n`;
return code;',
  '给变量赋值，支持从表达式接收值',
  '示例：计算并赋值
result = a * 2
count = count + 1',
  1, 1, 1, 1
);

-- 5. 数学二元运算块
INSERT INTO `blockly_blocks` (
  `create_time`, `update_time`,
  `type`, `name`, `category`, `color`,
  `definition`, `python_generator`,
  `description`, `example`,
  `enabled`, `sort_order`, `is_system`, `version`
) VALUES (
  NOW(), NOW(),
  'math_binary_op',
  '数学运算',
  'python_calculation',
  '#ff7a45',
  '{"type":"math_binary_op","message0":"%1 %2 %3","args0":[{"type":"input_value","name":"A"},{"type":"field_dropdown","name":"OP","options":[["+","ADD"],["-","MINUS"],["×","MULTIPLY"],["÷","DIVIDE"],["**","POWER"]]},{"type":"input_value","name":"B"}],"inputsInline":true,"output":"Number","colour":"#ff7a45","tooltip":"执行数学运算","helpUrl":""}',
  'const OPERATORS = {
  ''ADD'': [''+='', Order.ADDITIVE],
  ''MINUS'': [''-'', Order.ADDITIVE],
  ''MULTIPLY'': [''*'', Order.MULTIPLICATIVE],
  ''DIVIDE'': [''/'', Order.MULTIPLICATIVE],
  ''POWER'': [''**'', Order.EXPONENTIATION]
};
const op = block.getFieldValue(''OP'');
const tuple = OPERATORS[op];
const operator = tuple[0];
const order = tuple[1];
const a = generator.valueToCode(block, ''A'', order) || ''0'';
const b = generator.valueToCode(block, ''B'', order) || ''0'';
const code = `(${a} ${operator} ${b})`;
return [code, order];',
  '执行基本数学运算：加减乘除和幂运算',
  '示例：
10 + 5 = 15
10 - 5 = 5
10 × 2 = 20
10 ÷ 2 = 5
2 ** 3 = 8',
  1, 2, 1, 1
);

-- ============================================================
-- 分类3: HTTP请求块 (python_http)
-- ============================================================

-- 6. 导入requests库
INSERT INTO `blockly_blocks` (
  `create_time`, `update_time`,
  `type`, `name`, `category`, `color`,
  `definition`, `python_generator`,
  `description`, `example`,
  `enabled`, `sort_order`, `is_system`, `version`
) VALUES (
  NOW(), NOW(),
  'import_requests',
  '导入requests库',
  'python_http',
  '#fa8c16',
  '{"type":"import_requests","message0":"import requests","previousStatement":null,"nextStatement":null,"colour":"#fa8c16","tooltip":"导入 requests 库用于 HTTP 请求","helpUrl":""}',
  'return ''import requests\\n'';',
  '导入Python的requests库，用于发送HTTP请求',
  '使用前必须先导入requests库',
  1, 1, 1, 1
);

-- 7. HTTP GET请求
INSERT INTO `blockly_blocks` (
  `create_time`, `update_time`,
  `type`, `name`, `category`, `color`,
  `definition`, `python_generator`,
  `description`, `example`,
  `enabled`, `sort_order`, `is_system`, `version`
) VALUES (
  NOW(), NOW(),
  'requests_get',
  'HTTP GET请求',
  'python_http',
  '#fa8c16',
  '{"type":"requests_get","message0":"requests.get %1","args0":[{"type":"input_value","name":"URL","check":"String"}],"output":null,"colour":"#fa8c16","tooltip":"发送 HTTP GET 请求","helpUrl":""}',
  'const url = generator.valueToCode(block, ''URL'', Order.NONE) || "''''";
const code = `requests.get(${url})`;
return [code, Order.FUNCTION_CALL];',
  '发送HTTP GET请求到指定URL',
  '示例：
response = requests.get("https://api.example.com/data")
data = response.json()',
  1, 2, 1, 1
);

-- 8. HTTP POST请求
INSERT INTO `blockly_blocks` (
  `create_time`, `update_time`,
  `type`, `name`, `category`, `color`,
  `definition`, `python_generator`,
  `description`, `example`,
  `enabled`, `sort_order`, `is_system`, `version`
) VALUES (
  NOW(), NOW(),
  'requests_post',
  'HTTP POST请求',
  'python_http',
  '#fa8c16',
  '{"type":"requests_post","message0":"requests.post %1 数据 %2","args0":[{"type":"input_value","name":"URL","check":"String"},{"type":"input_value","name":"DATA"}],"output":null,"colour":"#fa8c16","tooltip":"发送 HTTP POST 请求","helpUrl":"","inputsInline":false}',
  'const url = generator.valueToCode(block, ''URL'', Order.NONE) || "''''";
const data = generator.valueToCode(block, ''DATA'', Order.NONE);
const code = data ? `requests.post(${url}, data=${data})` : `requests.post(${url})`;
return [code, Order.FUNCTION_CALL];',
  '发送HTTP POST请求，可以携带数据',
  '示例：
data = {"name": "张三", "age": 25}
response = requests.post("https://api.example.com/user", data)',
  1, 3, 1, 1
);

-- ============================================================
-- 分类4: 类型转换块 (python_type_conversion)
-- ============================================================

-- 9. 整数转换
INSERT INTO `blockly_blocks` (
  `create_time`, `update_time`,
  `type`, `name`, `category`, `color`,
  `definition`, `python_generator`,
  `description`, `example`,
  `enabled`, `sort_order`, `is_system`, `version`
) VALUES (
  NOW(), NOW(),
  'int_conversion',
  '转换为整数',
  'python_type_conversion',
  '#52c41a',
  '{"type":"int_conversion","message0":"int( %1 )","args0":[{"type":"input_value","name":"VALUE"}],"output":"Number","colour":"#52c41a","tooltip":"将值转换为整数","helpUrl":""}',
  'const value = generator.valueToCode(block, ''VALUE'', Order.NONE) || ''0'';
const code = `int(${value})`;
return [code, Order.FUNCTION_CALL];',
  '将任意值转换为整数类型',
  '示例：
int("123") = 123
int(45.67) = 45
int(True) = 1',
  1, 1, 1, 1
);

-- 10. 字符串转换
INSERT INTO `blockly_blocks` (
  `create_time`, `update_time`,
  `type`, `name`, `category`, `color`,
  `definition`, `python_generator`,
  `description`, `example`,
  `enabled`, `sort_order`, `is_system`, `version`
) VALUES (
  NOW(), NOW(),
  'str_conversion',
  '转换为字符串',
  'python_type_conversion',
  '#52c41a',
  '{"type":"str_conversion","message0":"str( %1 )","args0":[{"type":"input_value","name":"VALUE"}],"output":"String","colour":"#52c41a","tooltip":"将值转换为字符串","helpUrl":""}',
  'const value = generator.valueToCode(block, ''VALUE'', Order.NONE) || "''''";
const code = `str(${value})`;
return [code, Order.FUNCTION_CALL];',
  '将任意值转换为字符串类型',
  '示例：
str(123) = "123"
str(45.67) = "45.67"
str(True) = "True"',
  1, 2, 1, 1
);

-- ============================================================
-- 说明
-- ============================================================
--
-- 使用说明：
-- 1. 执行此SQL脚本将初始化10个系统预设的Blockly块
-- 2. 所有块都标记为 is_system=1（系统块），不可删除但可以禁用
-- 3. enabled=1 表示块已启用，会出现在Blockly编辑器的工具箱中
-- 4. 块按分类组织：
--    - python_io: Python输入输出
--    - python_calculation: Python计算
--    - python_http: HTTP请求
--    - python_type_conversion: 类型转换
-- 5. definition字段是JSON格式的Blockly块定义
-- 6. python_generator字段是JavaScript代码，用于生成Python代码
-- 7. color字段使用16进制颜色值
--
-- 扩展建议：
-- - 可以通过管理界面添加更多自定义块
-- - 参考现有块的定义格式创建新块
-- - 建议为每个块添加详细的description和example
-- - 新增块时version从1开始，每次修改递增
--
-- ============================================================
