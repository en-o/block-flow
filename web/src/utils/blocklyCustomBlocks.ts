/**
 * 自定义Blockly块定义（Python相关）
 * 包括: 输入/输出处理、文件操作、HTTP请求、字典操作等
 */
import * as Blockly from 'blockly';
import { pythonGenerator, Order } from 'blockly/python';

// 确保生成器已初始化
if (!pythonGenerator) {
  console.error('Python生成器未正确加载');
}

/**
 * 初始化所有自定义块
 */
export function initCustomBlocks() {
  try {
    // Python输入参数块
    definePythonInputBlock();

    // Python输出块
    definePythonOutputBlock();

    // Python print块
    definePythonPrintBlock();

    // 字典创建块
    defineDictCreateBlock();

    // 字典设置键值块
    defineDictSetBlock();

    // 字典获取值块
    defineDictGetBlock();

    // 列表操作块
    defineListOperationBlocks();

    // 文件读取块
    defineFileReadBlock();

    // 文件写入块
    defineFileWriteBlock();

    // HTTP请求块
    defineHttpRequestBlock();

    // JSON解析块
    defineJsonParseBlock();

    // JSON序列化块
    defineJsonStringifyBlock();

    // 安全类型转换块
    defineSafeConversionBlocks();

    // 修复数学运算符生成器（使用 * / 而非 × ÷）
    fixMathArithmeticGenerator();

    console.log('Blockly自定义块初始化成功');
  } catch (error) {
    console.error('Blockly自定义块初始化失败', error);
  }
}

/**
 * Python inputs.get() 块
 */
function definePythonInputBlock() {
  Blockly.Blocks['python_input_get'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('获取输入参数')
          .appendField(new Blockly.FieldTextInput('param_name'), 'PARAM_NAME')
          .appendField('默认值')
          .appendField(new Blockly.FieldTextInput(''), 'DEFAULT_VALUE');
      this.setOutput(true, null);
      this.setColour(180);
      this.setTooltip('从inputs字典获取参数值');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['python_input_get'] = function(block: any) {
    const paramName = block.getFieldValue('PARAM_NAME');
    const defaultValue = block.getFieldValue('DEFAULT_VALUE');
    const defaultStr = defaultValue ? `'${defaultValue}'` : "''";
    const code = `inputs.get('${paramName}', ${defaultStr})`;
    return [code, Order.ATOMIC];
  };
}

/**
 * Python outputs 设置块
 */
function definePythonOutputBlock() {
  Blockly.Blocks['python_output_set'] = {
    init: function() {
      this.appendValueInput('VALUE')
          .setCheck(null)
          .appendField('设置输出')
          .appendField(new Blockly.FieldTextInput('result'), 'KEY')
          .appendField('=');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(180);
      this.setTooltip('设置outputs字典的值');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['python_output_set'] = function(block: any, generator: any) {
    const key = block.getFieldValue('KEY');
    const value = generator.valueToCode(block, 'VALUE', Order.ATOMIC) || "''";
    const code = `outputs['${key}'] = ${value}\n`;
    return code;
  };
}

/**
 * Python print() 块
 */
function definePythonPrintBlock() {
  Blockly.Blocks['python_print'] = {
    init: function() {
      this.appendValueInput('TEXT')
          .setCheck(null)
          .appendField('打印');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(180);
      this.setTooltip('Python print()函数，打印内容到控制台');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['python_print'] = function(block: any, generator: any) {
    const text = generator.valueToCode(block, 'TEXT', Order.ATOMIC) || "''";
    const code = `print(${text})\n`;
    return code;
  };
}

/**
 * 字典创建块
 */
function defineDictCreateBlock() {
  Blockly.Blocks['dict_create'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('创建字典 {');
      this.appendStatementInput('ITEMS')
          .setCheck(null);
      this.appendDummyInput()
          .appendField('}');
      this.setOutput(true, 'Dictionary');
      this.setColour(260);
      this.setTooltip('创建Python字典');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['dict_create'] = function(block: any, generator: any) {
    const items = generator.statementToCode(block, 'ITEMS');
    const code = `{${items}}`;
    return [code, Order.ATOMIC];
  };
}

/**
 * 字典设置键值块
 */
function defineDictSetBlock() {
  Blockly.Blocks['dict_set'] = {
    init: function() {
      this.appendValueInput('VALUE')
          .setCheck(null)
          .appendField('键')
          .appendField(new Blockly.FieldTextInput('key'), 'KEY')
          .appendField(':');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip('设置字典键值对');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['dict_set'] = function(block: any, generator: any) {
    const key = block.getFieldValue('KEY');
    const value = generator.valueToCode(block, 'VALUE', Order.ATOMIC) || "''";
    const code = `'${key}': ${value}, `;
    return code;
  };
}

/**
 * 字典获取值块
 */
function defineDictGetBlock() {
  Blockly.Blocks['dict_get'] = {
    init: function() {
      this.appendValueInput('DICT')
          .setCheck('Dictionary')
          .appendField('字典');
      this.appendDummyInput()
          .appendField('.get(')
          .appendField(new Blockly.FieldTextInput('key'), 'KEY')
          .appendField(', 默认:')
          .appendField(new Blockly.FieldTextInput(''), 'DEFAULT')
          .appendField(')');
      this.setOutput(true, null);
      this.setColour(260);
      this.setTooltip('从字典获取值');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['dict_get'] = function(block: any, generator: any) {
    const dict = generator.valueToCode(block, 'DICT', Order.MEMBER) || '{}';
    const key = block.getFieldValue('KEY');
    const defaultValue = block.getFieldValue('DEFAULT');
    const defaultStr = defaultValue ? `, '${defaultValue}'` : '';
    const code = `${dict}.get('${key}'${defaultStr})`;
    return [code, Order.MEMBER];
  };
}

/**
 * 列表操作块
 */
function defineListOperationBlocks() {
  // 列表追加
  Blockly.Blocks['list_append'] = {
    init: function() {
      this.appendValueInput('LIST')
          .setCheck('Array')
          .appendField('列表');
      this.appendValueInput('ITEM')
          .setCheck(null)
          .appendField('.append(');
      this.appendDummyInput()
          .appendField(')');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
      this.setTooltip('向列表追加元素');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['list_append'] = function(block: any, generator: any) {
    const list = generator.valueToCode(block, 'LIST', Order.MEMBER) || '[]';
    const item = generator.valueToCode(block, 'ITEM', Order.ATOMIC) || "''";
    const code = `${list}.append(${item})\n`;
    return code;
  };
}

/**
 * 文件读取块
 */
function defineFileReadBlock() {
  Blockly.Blocks['file_read'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('读取文件')
          .appendField(new Blockly.FieldTextInput('/path/to/file'), 'PATH');
      this.appendDummyInput()
          .appendField('编码')
          .appendField(new Blockly.FieldDropdown([
            ['UTF-8', 'utf-8'],
            ['GBK', 'gbk'],
            ['ASCII', 'ascii']
          ]), 'ENCODING');
      this.setOutput(true, 'String');
      this.setColour(120);
      this.setTooltip('读取文件内容');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['file_read'] = function(block: any) {
    const path = block.getFieldValue('PATH');
    const encoding = block.getFieldValue('ENCODING');
    const code = `open('${path}', 'r', encoding='${encoding}').read()`;
    return [code, Order.ATOMIC];
  };
}

/**
 * 文件写入块
 */
function defineFileWriteBlock() {
  Blockly.Blocks['file_write'] = {
    init: function() {
      this.appendValueInput('CONTENT')
          .setCheck('String')
          .appendField('写入文件')
          .appendField(new Blockly.FieldTextInput('/path/to/file'), 'PATH')
          .appendField('内容:');
      this.appendDummyInput()
          .appendField('编码')
          .appendField(new Blockly.FieldDropdown([
            ['UTF-8', 'utf-8'],
            ['GBK', 'gbk'],
            ['ASCII', 'ascii']
          ]), 'ENCODING');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip('写入内容到文件');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['file_write'] = function(block: any, generator: any) {
    const path = block.getFieldValue('PATH');
    const encoding = block.getFieldValue('ENCODING');
    const content = generator.valueToCode(block, 'CONTENT', Order.ATOMIC) || "''";
    const code = `with open('${path}', 'w', encoding='${encoding}') as f:\n  f.write(${content})\n`;
    return code;
  };
}

/**
 * HTTP请求块
 */
function defineHttpRequestBlock() {
  Blockly.Blocks['http_request'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('HTTP请求')
          .appendField(new Blockly.FieldDropdown([
            ['GET', 'get'],
            ['POST', 'post'],
            ['PUT', 'put'],
            ['DELETE', 'delete']
          ]), 'METHOD');
      this.appendValueInput('URL')
          .setCheck('String')
          .appendField('URL:');
      this.appendValueInput('DATA')
          .setCheck('Dictionary')
          .appendField('数据:');
      this.setOutput(true, null);
      this.setColour(30);
      this.setTooltip('发送HTTP请求（需要导入requests库）');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['http_request'] = function(block: any, generator: any) {
    const method = block.getFieldValue('METHOD');
    const url = generator.valueToCode(block, 'URL', Order.ATOMIC) || "''";
    const data = generator.valueToCode(block, 'DATA', Order.ATOMIC) || 'None';

    let code = '';
    if (method === 'get') {
      code = `requests.${method}(${url})`;
    } else {
      code = `requests.${method}(${url}, json=${data})`;
    }
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * JSON解析块
 */
function defineJsonParseBlock() {
  Blockly.Blocks['json_parse'] = {
    init: function() {
      this.appendValueInput('JSON_STRING')
          .setCheck('String')
          .appendField('JSON解析');
      this.setOutput(true, null);
      this.setColour(290);
      this.setTooltip('将JSON字符串解析为Python对象');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['json_parse'] = function(block: any, generator: any) {
    const jsonString = generator.valueToCode(block, 'JSON_STRING', Order.ATOMIC) || "'{}'";
    const code = `json.loads(${jsonString})`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * JSON序列化块
 */
function defineJsonStringifyBlock() {
  Blockly.Blocks['json_stringify'] = {
    init: function() {
      this.appendValueInput('OBJECT')
          .setCheck(null)
          .appendField('JSON序列化');
      this.appendDummyInput()
          .appendField('格式化')
          .appendField(new Blockly.FieldCheckbox('TRUE'), 'INDENT');
      this.setOutput(true, 'String');
      this.setColour(290);
      this.setTooltip('将Python对象序列化为JSON字符串');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['json_stringify'] = function(block: any, generator: any) {
    const object = generator.valueToCode(block, 'OBJECT', Order.ATOMIC) || '{}';
    const indent = block.getFieldValue('INDENT') === 'TRUE';
    const code = indent ? `json.dumps(${object}, indent=2, ensure_ascii=False)` : `json.dumps(${object}, ensure_ascii=False)`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * 安全类型转换块
 */
function defineSafeConversionBlocks() {
  // safe_int
  Blockly.Blocks['safe_int'] = {
    init: function() {
      this.appendValueInput('VALUE')
          .setCheck(null)
          .appendField('安全转换整数');
      this.appendDummyInput()
          .appendField('默认:')
          .appendField(new Blockly.FieldNumber(0), 'DEFAULT');
      this.setOutput(true, 'Number');
      this.setColour(230);
      this.setTooltip('安全地转换为整数');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['safe_int'] = function(block: any, generator: any) {
    const value = generator.valueToCode(block, 'VALUE', Order.ATOMIC) || "''";
    const defaultValue = block.getFieldValue('DEFAULT');
    const code = `safe_int(${value}, ${defaultValue})`;
    return [code, Order.FUNCTION_CALL];
  };

  // safe_float
  Blockly.Blocks['safe_float'] = {
    init: function() {
      this.appendValueInput('VALUE')
          .setCheck(null)
          .appendField('安全转换浮点数');
      this.appendDummyInput()
          .appendField('默认:')
          .appendField(new Blockly.FieldNumber(0), 'DEFAULT');
      this.setOutput(true, 'Number');
      this.setColour(230);
      this.setTooltip('安全地转换为浮点数');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['safe_float'] = function(block: any, generator: any) {
    const value = generator.valueToCode(block, 'VALUE', Order.ATOMIC) || "''";
    const defaultValue = block.getFieldValue('DEFAULT');
    const code = `safe_float(${value}, ${defaultValue})`;
    return [code, Order.FUNCTION_CALL];
  };

  // safe_bool
  Blockly.Blocks['safe_bool'] = {
    init: function() {
      this.appendValueInput('VALUE')
          .setCheck(null)
          .appendField('安全转换布尔值');
      this.appendDummyInput()
          .appendField('默认:')
          .appendField(new Blockly.FieldDropdown([
            ['True', 'True'],
            ['False', 'False']
          ]), 'DEFAULT');
      this.setOutput(true, 'Boolean');
      this.setColour(230);
      this.setTooltip('安全地转换为布尔值');
      this.setHelpUrl('');
    }
  };

  pythonGenerator.forBlock['safe_bool'] = function(block: any, generator: any) {
    const value = generator.valueToCode(block, 'VALUE', Order.ATOMIC) || "''";
    const defaultValue = block.getFieldValue('DEFAULT');
    const code = `safe_bool(${value}, ${defaultValue})`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * 修复数学运算符生成器
 * Blockly默认使用Unicode符号（× ÷），需要替换为Python运算符（* /）
 */
function fixMathArithmeticGenerator() {
  pythonGenerator.forBlock['math_arithmetic'] = function(block: any, generator: any) {
    const OPERATORS: Record<string, [string, any]> = {
      'ADD': [' + ', Order.ADDITIVE],
      'MINUS': [' - ', Order.ADDITIVE],
      'MULTIPLY': [' * ', Order.MULTIPLICATIVE],
      'DIVIDE': [' / ', Order.MULTIPLICATIVE],
      'POWER': [' ** ', Order.EXPONENTIATION],
    };
    const tuple = OPERATORS[block.getFieldValue('OP')];
    const operator = tuple[0];
    const order = tuple[1];
    const argument0 = generator.valueToCode(block, 'A', order) || '0';
    const argument1 = generator.valueToCode(block, 'B', order) || '0';
    const code = argument0 + operator + argument1;
    return [code, order];
  };
}
