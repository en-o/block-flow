import * as Blockly from 'blockly';
import { Order } from 'blockly/python';
import { BlockDefinition, BlockHelper } from '../core/BlockDefinition';

/**
 * Python inputs.get() - 获取输入参数
 */
export class PythonInputGetBlock extends BlockDefinition {
  type = 'python_input_get';
  category = 'python_io';

  definition = {
    message0: '获取输入 %1 默认值 %2',
    args0: [
      {
        type: 'input_value',
        name: 'PARAM_NAME',
        check: 'String',
      },
      {
        type: 'input_value',
        name: 'DEFAULT_VALUE',
      },
    ],
    output: null,
    colour: '#1890ff',
    tooltip: '从inputs字典获取参数值',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const paramName = BlockHelper.getInputValue(block, 'PARAM_NAME', Order.NONE);
    const defaultValue = BlockHelper.getInputValue(block, 'DEFAULT_VALUE', Order.NONE) || '\'\'';
    const code = `inputs.get(${paramName}, ${defaultValue})`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * Python outputs 设置 - 创建输出字典
 */
export class PythonOutputSetBlock extends BlockDefinition {
  type = 'python_output_set';
  category = 'python_io';

  definition = {
    message0: '设置输出 outputs',
    message1: '%1',
    args1: [
      {
        type: 'input_statement',
        name: 'OUTPUTS',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#1890ff',
    tooltip: '设置输出结果（outputs字典）',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    const statements = BlockHelper.getStatements(block, 'OUTPUTS');
    const code = 'outputs = {\n' + statements + '}\n';
    return code;
  };
}

/**
 * Python 输出键值对 - 用于outputs字典内部
 */
export class PythonOutputItemBlock extends BlockDefinition {
  type = 'python_output_item';
  category = 'python_io';

  definition = {
    message0: '"%1": %2',
    args0: [
      {
        type: 'field_input',
        name: 'KEY',
        text: 'result',
      },
      {
        type: 'input_value',
        name: 'VALUE',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#1890ff',
    tooltip: '输出字典的键值对',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    const key = BlockHelper.getFieldValue(block, 'KEY');
    const value = BlockHelper.getInputValue(block, 'VALUE', Order.NONE) || 'None';
    const code = `  "${key}": ${value},\n`;
    return code;
  };
}

/**
 * safe_int - 安全转换为整数
 */
export class SafeIntBlock extends BlockDefinition {
  type = 'safe_int';
  category = 'python_io';

  definition = {
    message0: 'safe_int %1 默认值 %2',
    args0: [
      {
        type: 'input_value',
        name: 'VALUE',
      },
      {
        type: 'field_number',
        name: 'DEFAULT',
        value: 0,
      },
    ],
    output: 'Number',
    colour: '#52c41a',
    tooltip: '安全地转换为整数，处理空值和无效值',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const value = BlockHelper.getInputValue(block, 'VALUE', Order.NONE);
    const defaultValue = BlockHelper.getFieldValue(block, 'DEFAULT');
    const code = `safe_int(${value}, ${defaultValue})`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * safe_float - 安全转换为浮点数
 */
export class SafeFloatBlock extends BlockDefinition {
  type = 'safe_float';
  category = 'python_io';

  definition = {
    message0: 'safe_float %1 默认值 %2',
    args0: [
      {
        type: 'input_value',
        name: 'VALUE',
      },
      {
        type: 'field_number',
        name: 'DEFAULT',
        value: 0.0,
        precision: 0.01,
      },
    ],
    output: 'Number',
    colour: '#52c41a',
    tooltip: '安全地转换为浮点数，处理空值和无效值',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const value = BlockHelper.getInputValue(block, 'VALUE', Order.NONE);
    const defaultValue = BlockHelper.getFieldValue(block, 'DEFAULT');
    const code = `safe_float(${value}, ${defaultValue})`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * safe_bool - 安全转换为布尔值
 */
export class SafeBoolBlock extends BlockDefinition {
  type = 'safe_bool';
  category = 'python_io';

  definition = {
    message0: 'safe_bool %1 默认值 %2',
    args0: [
      {
        type: 'input_value',
        name: 'VALUE',
      },
      {
        type: 'field_dropdown',
        name: 'DEFAULT',
        options: [
          ['False', 'False'],
          ['True', 'True'],
        ],
      },
    ],
    output: 'Boolean',
    colour: '#52c41a',
    tooltip: '安全地转换为布尔值',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const value = BlockHelper.getInputValue(block, 'VALUE', Order.NONE);
    const defaultValue = BlockHelper.getFieldValue(block, 'DEFAULT');
    const code = `safe_bool(${value}, ${defaultValue})`;
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * Python print - 打印输出
 */
export class PythonPrintBlock extends BlockDefinition {
  type = 'python_print';
  category = 'python_io';

  definition = {
    message0: 'print %1',
    args0: [
      {
        type: 'input_value',
        name: 'TEXT',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#1890ff',
    tooltip: '打印输出到控制台',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    const text = BlockHelper.getInputValue(block, 'TEXT', Order.NONE) || '\'\'';
    const code = `print(${text})\n`;
    return code;
  };
}

/**
 * 获取上下文变量
 */
export class ContextVariableBlock extends BlockDefinition {
  type = 'context_variable';
  category = 'python_io';

  definition = {
    message0: '上下文变量 ctx.%1 默认值 %2',
    args0: [
      {
        type: 'field_input',
        name: 'VAR_NAME',
        text: 'DB_HOST',
      },
      {
        type: 'input_value',
        name: 'DEFAULT_VALUE',
      },
    ],
    output: null,
    colour: '#722ed1',
    tooltip: '获取上下文变量（从inputs中读取ctx.前缀的变量）',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const varName = BlockHelper.getFieldValue(block, 'VAR_NAME');
    const defaultValue = BlockHelper.getInputValue(block, 'DEFAULT_VALUE', Order.NONE) || '\'\'';
    const code = `inputs.get('ctx.${varName}', ${defaultValue})`;
    return [code, Order.FUNCTION_CALL];
  };
}
