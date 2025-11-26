import * as Blockly from 'blockly';
import {  Order } from 'blockly/python';
import { BlockDefinition, BlockHelper } from '../core/BlockDefinition';

/**
 * import requests - 导入 requests 库
 */
export class ImportRequestsBlock extends BlockDefinition {
  type = 'import_requests';
  category = 'python_http';

  definition = {
    message0: 'import requests',
    previousStatement: null,
    nextStatement: null,
    colour: '#fa8c16',
    tooltip: '导入 requests 库用于 HTTP 请求',
    helpUrl: '',
  };

  generator = (_block: Blockly.Block): string => {
    return 'import requests\n';
  };
}

/**
 * requests.get() - HTTP GET 请求
 */
export class RequestsGetBlock extends BlockDefinition {
  type = 'requests_get';
  category = 'python_http';

  definition = {
    message0: 'requests.get %1',
    args0: [
      {
        type: 'input_value',
        name: 'URL',
        check: 'String',
      },
    ],
    output: null,
    colour: '#fa8c16',
    tooltip: '发送 HTTP GET 请求',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const url = BlockHelper.getInputValue(block, 'URL', Order.NONE) || '\'\'';
    const code = `requests.get(${url})`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * requests.post() - HTTP POST 请求
 */
export class RequestsPostBlock extends BlockDefinition {
  type = 'requests_post';
  category = 'python_http';

  definition = {
    message0: 'requests.post %1 数据 %2',
    args0: [
      {
        type: 'input_value',
        name: 'URL',
        check: 'String',
      },
      {
        type: 'input_value',
        name: 'DATA',
      },
    ],
    output: null,
    colour: '#fa8c16',
    tooltip: '发送 HTTP POST 请求',
    helpUrl: '',
    inputsInline: false,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const url = BlockHelper.getInputValue(block, 'URL', Order.NONE) || '\'\'';
    const data = BlockHelper.getInputValue(block, 'DATA', Order.NONE);
    const code = data ? `requests.post(${url}, data=${data})` : `requests.post(${url})`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * requests.put() - HTTP PUT 请求
 */
export class RequestsPutBlock extends BlockDefinition {
  type = 'requests_put';
  category = 'python_http';

  definition = {
    message0: 'requests.put %1 数据 %2',
    args0: [
      {
        type: 'input_value',
        name: 'URL',
        check: 'String',
      },
      {
        type: 'input_value',
        name: 'DATA',
      },
    ],
    output: null,
    colour: '#fa8c16',
    tooltip: '发送 HTTP PUT 请求',
    helpUrl: '',
    inputsInline: false,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const url = BlockHelper.getInputValue(block, 'URL', Order.NONE) || '\'\'';
    const data = BlockHelper.getInputValue(block, 'DATA', Order.NONE);
    const code = data ? `requests.put(${url}, data=${data})` : `requests.put(${url})`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * requests.delete() - HTTP DELETE 请求
 */
export class RequestsDeleteBlock extends BlockDefinition {
  type = 'requests_delete';
  category = 'python_http';

  definition = {
    message0: 'requests.delete %1',
    args0: [
      {
        type: 'input_value',
        name: 'URL',
        check: 'String',
      },
    ],
    output: null,
    colour: '#fa8c16',
    tooltip: '发送 HTTP DELETE 请求',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const url = BlockHelper.getInputValue(block, 'URL', Order.NONE) || '\'\'';
    const code = `requests.delete(${url})`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * 对象属性访问 - obj.property
 */
export class ObjectPropertyBlock extends BlockDefinition {
  type = 'object_property';
  category = 'python_calculation';

  definition = {
    message0: '%1 . %2',
    args0: [
      {
        type: 'input_value',
        name: 'OBJECT',
      },
      {
        type: 'field_input',
        name: 'PROPERTY',
        text: 'property',
      },
    ],
    output: null,
    colour: '#ff7a45',
    tooltip: '访问对象的属性（如 response.status_code）',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const object = BlockHelper.getInputValue(block, 'OBJECT', Order.MEMBER) || 'obj';
    const property = BlockHelper.getFieldValue(block, 'PROPERTY');
    const code = `${object}.${property}`;
    return [code, Order.MEMBER];
  };
}

/**
 * 对象方法调用 - obj.method(args)
 */
export class ObjectMethodCallBlock extends BlockDefinition {
  type = 'object_method_call';
  category = 'python_calculation';

  definition = {
    message0: '%1 . %2 ( %3 )',
    args0: [
      {
        type: 'input_value',
        name: 'OBJECT',
      },
      {
        type: 'field_input',
        name: 'METHOD',
        text: 'method',
      },
      {
        type: 'input_value',
        name: 'ARGS',
      },
    ],
    output: null,
    colour: '#ff7a45',
    tooltip: '调用对象的方法（如 response.json()）',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const object = BlockHelper.getInputValue(block, 'OBJECT', Order.MEMBER) || 'obj';
    const method = BlockHelper.getFieldValue(block, 'METHOD');
    const args = BlockHelper.getInputValue(block, 'ARGS', Order.NONE);
    const code = args ? `${object}.${method}(${args})` : `${object}.${method}()`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * 字符串切片 - str[:n] 或 str[start:end]
 */
export class StringSliceBlock extends BlockDefinition {
  type = 'string_slice';
  category = 'text';

  definition = {
    message0: '%1 [ %2 : %3 ]',
    args0: [
      {
        type: 'input_value',
        name: 'STRING',
        check: 'String',
      },
      {
        type: 'input_value',
        name: 'START',
        check: 'Number',
      },
      {
        type: 'input_value',
        name: 'END',
        check: 'Number',
      },
    ],
    output: 'String',
    colour: '#722ED1',
    tooltip: '字符串切片（留空表示开头/结尾）',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const string = BlockHelper.getInputValue(block, 'STRING', Order.MEMBER) || '\'\'';
    const start = BlockHelper.getInputValue(block, 'START', Order.NONE);
    const end = BlockHelper.getInputValue(block, 'END', Order.NONE);

    const startStr = start || '';
    const endStr = end || '';
    const code = `${string}[${startStr}:${endStr}]`;
    return [code, Order.MEMBER];
  };
}

/**
 * 字符串拼接 print - print('text:', value)
 */
export class PrintWithLabelBlock extends BlockDefinition {
  type = 'print_with_label';
  category = 'python_io';

  definition = {
    message0: 'print %1 %2',
    args0: [
      {
        type: 'field_input',
        name: 'LABEL',
        text: 'label:',
      },
      {
        type: 'input_value',
        name: 'VALUE',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#1890ff',
    tooltip: '打印带标签的输出（如 print("status:", code)）',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): string => {
    const label = BlockHelper.getFieldValue(block, 'LABEL');
    const value = BlockHelper.getInputValue(block, 'VALUE', Order.NONE) || '\'\'';
    const code = `print('${label}', ${value})\n`;
    return code;
  };
}
