import * as Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';
import { BlockDefinition, BlockHelper } from '../core/BlockDefinition';

/**
 * 文件读取块
 */
export class FileReadBlock extends BlockDefinition {
  type = 'file_read';
  category = 'python_file';

  definition = {
    message0: '读取文件 %1 编码 %2',
    args0: [
      {
        type: 'input_value',
        name: 'PATH',
        check: 'String',
      },
      {
        type: 'field_dropdown',
        name: 'ENCODING',
        options: [
          ['UTF-8', 'utf-8'],
          ['GBK', 'gbk'],
          ['ASCII', 'ascii'],
        ],
      },
    ],
    output: 'String',
    colour: '#13c2c2',
    tooltip: '读取文件内容',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const path = BlockHelper.getInputValue(block, 'PATH', pythonGenerator.ORDER_NONE);
    const encoding = BlockHelper.getFieldValue(block, 'ENCODING');

    // 生成带错误处理的代码
    const code = `(lambda: open(${path}, 'r', encoding='${encoding}').read())()`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}

/**
 * 文件写入块
 */
export class FileWriteBlock extends BlockDefinition {
  type = 'file_write';
  category = 'python_file';

  definition = {
    message0: '写入文件 %1 内容 %2 编码 %3',
    args0: [
      {
        type: 'input_value',
        name: 'PATH',
        check: 'String',
      },
      {
        type: 'input_value',
        name: 'CONTENT',
      },
      {
        type: 'field_dropdown',
        name: 'ENCODING',
        options: [
          ['UTF-8', 'utf-8'],
          ['GBK', 'gbk'],
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#13c2c2',
    tooltip: '写入内容到文件',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    const path = BlockHelper.getInputValue(block, 'PATH', pythonGenerator.ORDER_NONE);
    const content = BlockHelper.getInputValue(block, 'CONTENT', pythonGenerator.ORDER_NONE);
    const encoding = BlockHelper.getFieldValue(block, 'ENCODING');

    const code = `with open(${path}, 'w', encoding='${encoding}') as f:\n  f.write(${content})\n`;
    return code;
  };
}

/**
 * HTTP请求块
 */
export class HttpRequestBlock extends BlockDefinition {
  type = 'http_request';
  category = 'python_http';

  definition = {
    message0: 'HTTP %1 请求 %2',
    message1: 'URL %1',
    message2: '请求体 %1',
    message3: '请求头 %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'METHOD',
        options: [
          ['GET', 'GET'],
          ['POST', 'POST'],
          ['PUT', 'PUT'],
          ['DELETE', 'DELETE'],
          ['PATCH', 'PATCH'],
        ],
      },
      {
        type: 'input_dummy',
      },
    ],
    args1: [
      {
        type: 'input_value',
        name: 'URL',
        check: 'String',
      },
    ],
    args2: [
      {
        type: 'input_value',
        name: 'BODY',
      },
    ],
    args3: [
      {
        type: 'input_value',
        name: 'HEADERS',
      },
    ],
    output: null,
    colour: '#fa8c16',
    tooltip: '发送HTTP请求（需要requests库）',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const method = BlockHelper.getFieldValue(block, 'METHOD');
    const url = BlockHelper.getInputValue(block, 'URL', pythonGenerator.ORDER_NONE);
    const body = BlockHelper.getInputValue(block, 'BODY', pythonGenerator.ORDER_NONE) || 'None';
    const headers = BlockHelper.getInputValue(block, 'HEADERS', pythonGenerator.ORDER_NONE) || 'None';

    let code = '';
    if (method === 'GET') {
      code = `requests.get(${url}, headers=${headers})`;
    } else {
      code = `requests.${method.toLowerCase()}(${url}, json=${body}, headers=${headers})`;
    }

    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}

/**
 * HTTP响应属性块
 */
export class HttpResponseBlock extends BlockDefinition {
  type = 'http_response_property';
  category = 'python_http';

  definition = {
    message0: '响应 %1 . %2',
    args0: [
      {
        type: 'input_value',
        name: 'RESPONSE',
      },
      {
        type: 'field_dropdown',
        name: 'PROPERTY',
        options: [
          ['状态码 (status_code)', 'status_code'],
          ['文本内容 (text)', 'text'],
          ['JSON数据 (json())', 'json()'],
          ['响应头 (headers)', 'headers'],
        ],
      },
    ],
    output: null,
    colour: '#fa8c16',
    tooltip: '获取HTTP响应的属性',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const response = BlockHelper.getInputValue(block, 'RESPONSE', pythonGenerator.ORDER_MEMBER);
    const property = BlockHelper.getFieldValue(block, 'PROPERTY');
    const code = `${response}.${property}`;
    return [code, pythonGenerator.ORDER_MEMBER];
  };
}

/**
 * JSON解析块
 */
export class JsonParseBlock extends BlockDefinition {
  type = 'json_parse';
  category = 'python_json';

  definition = {
    message0: 'JSON解析 %1',
    args0: [
      {
        type: 'input_value',
        name: 'JSON_STRING',
        check: 'String',
      },
    ],
    output: null,
    colour: '#722ed1',
    tooltip: '将JSON字符串解析为Python对象',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const jsonString = BlockHelper.getInputValue(block, 'JSON_STRING', pythonGenerator.ORDER_NONE);
    const code = `json.loads(${jsonString})`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}

/**
 * JSON序列化块
 */
export class JsonStringifyBlock extends BlockDefinition {
  type = 'json_stringify';
  category = 'python_json';

  definition = {
    message0: 'JSON序列化 %1 缩进 %2',
    args0: [
      {
        type: 'input_value',
        name: 'OBJECT',
      },
      {
        type: 'field_checkbox',
        name: 'INDENT',
        checked: true,
      },
    ],
    output: 'String',
    colour: '#722ed1',
    tooltip: '将Python对象序列化为JSON字符串',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const object = BlockHelper.getInputValue(block, 'OBJECT', pythonGenerator.ORDER_NONE);
    const indent = block.getFieldValue('INDENT') === 'TRUE' ? '2' : 'None';
    const code = `json.dumps(${object}, indent=${indent}, ensure_ascii=False)`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}

/**
 * 字典创建块（增强版）
 */
export class DictCreateBlock extends BlockDefinition {
  type = 'dict_create_enhanced';
  category = 'python_data';

  definition = {
    message0: '创建字典',
    message1: '%1',
    args1: [
      {
        type: 'input_statement',
        name: 'ITEMS',
      },
    ],
    output: null,
    colour: '#722ed1',
    tooltip: '创建Python字典',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const items = BlockHelper.getStatements(block, 'ITEMS');
    const code = '{\n' + items + '}';
    return [code, pythonGenerator.ORDER_ATOMIC];
  };
}

/**
 * 字典键值对块
 */
export class DictItemBlock extends BlockDefinition {
  type = 'dict_item';
  category = 'python_data';

  definition = {
    message0: '"%1": %2',
    args0: [
      {
        type: 'field_input',
        name: 'KEY',
        text: 'key',
      },
      {
        type: 'input_value',
        name: 'VALUE',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#722ed1',
    tooltip: '字典的键值对',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    const key = BlockHelper.getFieldValue(block, 'KEY');
    const value = BlockHelper.getInputValue(block, 'VALUE', pythonGenerator.ORDER_NONE) || 'None';
    const code = `  "${key}": ${value},\n`;
    return code;
  };
}

/**
 * 字典获取值块
 */
export class DictGetBlock extends BlockDefinition {
  type = 'dict_get_value';
  category = 'python_data';

  definition = {
    message0: '字典 %1 获取 %2 默认值 %3',
    args0: [
      {
        type: 'input_value',
        name: 'DICT',
      },
      {
        type: 'input_value',
        name: 'KEY',
        check: 'String',
      },
      {
        type: 'input_value',
        name: 'DEFAULT',
      },
    ],
    output: null,
    colour: '#722ed1',
    tooltip: '从字典获取指定键的值',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const dict = BlockHelper.getInputValue(block, 'DICT', pythonGenerator.ORDER_MEMBER);
    const key = BlockHelper.getInputValue(block, 'KEY', pythonGenerator.ORDER_NONE);
    const defaultValue = BlockHelper.getInputValue(block, 'DEFAULT', pythonGenerator.ORDER_NONE) || 'None';
    const code = `${dict}.get(${key}, ${defaultValue})`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}

/**
 * 列表添加元素块
 */
export class ListAppendBlock extends BlockDefinition {
  type = 'list_append_item';
  category = 'python_data';

  definition = {
    message0: '列表 %1 添加 %2',
    args0: [
      {
        type: 'input_value',
        name: 'LIST',
      },
      {
        type: 'input_value',
        name: 'ITEM',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#52c41a',
    tooltip: '向列表添加元素',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    const list = BlockHelper.getInputValue(block, 'LIST', pythonGenerator.ORDER_MEMBER);
    const item = BlockHelper.getInputValue(block, 'ITEM', pythonGenerator.ORDER_NONE);
    const code = `${list}.append(${item})\n`;
    return code;
  };
}

/**
 * 字符串格式化块（f-string）
 */
export class StringFormatBlock extends BlockDefinition {
  type = 'string_format';
  category = 'python_string';

  definition = {
    message0: 'f字符串 %1',
    args0: [
      {
        type: 'field_input',
        name: 'TEMPLATE',
        text: 'Hello {name}',
      },
    ],
    output: 'String',
    colour: '#722ed1',
    tooltip: 'Python f-string格式化字符串',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const template = BlockHelper.getFieldValue(block, 'TEMPLATE');
    const code = `f"${template}"`;
    return [code, pythonGenerator.ORDER_ATOMIC];
  };
}

/**
 * Try-Except错误处理块
 */
export class TryExceptBlock extends BlockDefinition {
  type = 'try_except';
  category = 'python_control';

  definition = {
    message0: 'try 尝试执行',
    message1: '%1',
    message2: 'except 捕获异常',
    message3: '%1',
    args1: [
      {
        type: 'input_statement',
        name: 'TRY',
      },
    ],
    args3: [
      {
        type: 'input_statement',
        name: 'EXCEPT',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#5c7cfa',
    tooltip: '错误处理：try-except',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    const tryCode = BlockHelper.getStatements(block, 'TRY');
    const exceptCode = BlockHelper.getStatements(block, 'EXCEPT');

    let code = 'try:\n';
    code += tryCode ? BlockHelper.indent(tryCode) : '  pass\n';
    code += 'except Exception as e:\n';
    code += exceptCode ? BlockHelper.indent(exceptCode) : '  pass\n';

    return code;
  };
}
