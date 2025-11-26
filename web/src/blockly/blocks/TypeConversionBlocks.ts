import * as Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';
import { BlockDefinition, BlockHelper } from '../core/BlockDefinition';

/**
 * int() - 转换为整数
 */
export class IntConversionBlock extends BlockDefinition {
  type = 'int_conversion';
  category = 'python_calculation';

  definition = {
    message0: 'int %1',
    args0: [
      {
        type: 'input_value',
        name: 'VALUE',
      },
    ],
    output: 'Number',
    colour: '#FA8C16',
    tooltip: '转换为整数类型（注意：空字符串会报错，建议使用 safe_int）',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const value = BlockHelper.getInputValue(block, 'VALUE', pythonGenerator.ORDER_NONE);
    const code = `int(${value})`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}

/**
 * float() - 转换为浮点数
 */
export class FloatConversionBlock extends BlockDefinition {
  type = 'float_conversion';
  category = 'python_calculation';

  definition = {
    message0: 'float %1',
    args0: [
      {
        type: 'input_value',
        name: 'VALUE',
      },
    ],
    output: 'Number',
    colour: '#FA8C16',
    tooltip: '转换为浮点数类型（注意：空字符串会报错，建议使用 safe_float）',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const value = BlockHelper.getInputValue(block, 'VALUE', pythonGenerator.ORDER_NONE);
    const code = `float(${value})`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}

/**
 * str() - 转换为字符串
 */
export class StrConversionBlock extends BlockDefinition {
  type = 'str_conversion';
  category = 'python_calculation';

  definition = {
    message0: 'str %1',
    args0: [
      {
        type: 'input_value',
        name: 'VALUE',
      },
    ],
    output: 'String',
    colour: '#FA8C16',
    tooltip: '转换为字符串类型',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const value = BlockHelper.getInputValue(block, 'VALUE', pythonGenerator.ORDER_NONE);
    const code = `str(${value})`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}

/**
 * bool() - 转换为布尔值
 */
export class BoolConversionBlock extends BlockDefinition {
  type = 'bool_conversion';
  category = 'python_calculation';

  definition = {
    message0: 'bool %1',
    args0: [
      {
        type: 'input_value',
        name: 'VALUE',
      },
    ],
    output: 'Boolean',
    colour: '#FA8C16',
    tooltip: '转换为布尔值类型（注意：空字符串和0为False，建议使用 safe_bool）',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const value = BlockHelper.getInputValue(block, 'VALUE', pythonGenerator.ORDER_NONE);
    const code = `bool(${value})`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}

/**
 * list() - 转换为列表
 */
export class ListConversionBlock extends BlockDefinition {
  type = 'list_conversion';
  category = 'python_data';

  definition = {
    message0: 'list %1',
    args0: [
      {
        type: 'input_value',
        name: 'VALUE',
      },
    ],
    output: 'Array',
    colour: '#52c41a',
    tooltip: '转换为列表类型',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const value = BlockHelper.getInputValue(block, 'VALUE', pythonGenerator.ORDER_NONE);
    const code = `list(${value})`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}

/**
 * dict() - 转换为字典
 */
export class DictConversionBlock extends BlockDefinition {
  type = 'dict_conversion';
  category = 'python_data';

  definition = {
    message0: 'dict %1',
    args0: [
      {
        type: 'input_value',
        name: 'VALUE',
      },
    ],
    output: null,
    colour: '#52c41a',
    tooltip: '转换为字典类型',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const value = BlockHelper.getInputValue(block, 'VALUE', pythonGenerator.ORDER_NONE);
    const code = `dict(${value})`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };
}
