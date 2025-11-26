import * as Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';
import { BlockDefinition, BlockHelper } from '../core/BlockDefinition';

/**
 * 清理变量名,确保是合法的Python标识符
 */
function sanitizeVariableName(varName: string): string {
  if (!varName) return 'var';

  // 手动清理: 只保留字母、数字和下划线
  let cleaned = varName.replace(/[^a-zA-Z0-9_]/g, '_');

  // 确保不以数字开头
  if (/^\d/.test(cleaned)) {
    cleaned = 'var_' + cleaned;
  }

  // 确保不为空
  if (!cleaned || cleaned === '_') {
    cleaned = 'var';
  }

  return cleaned;
}

/**
 * 变量赋值块 - 支持从表达式接收值
 * 例如: res = a * 2
 */
export class VariableAssignBlock extends BlockDefinition {
  type = 'variable_assign';
  category = 'python_calculation';

  definition = {
    message0: '%1 = %2',
    args0: [
      {
        type: 'field_variable',
        name: 'VAR',
        variable: 'result',
      },
      {
        type: 'input_value',
        name: 'VALUE',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#ff7a45',
    tooltip: '将表达式的结果赋值给变量',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    // 获取变量对象，使用显示名称而不是内部ID
    const field = block.getField('VAR');
    const variable = field?.getVariable?.();
    const varName = variable ? variable.name : BlockHelper.getFieldValue(block, 'VAR');
    const cleanedName = sanitizeVariableName(varName);

    const value = BlockHelper.getInputValue(block, 'VALUE', pythonGenerator.ORDER_NONE) || '0';
    const code = `${cleanedName} = ${value}\n`;
    return code;
  };
}

/**
 * 获取变量值块
 */
export class VariableGetBlock extends BlockDefinition {
  type = 'variable_get_value';
  category = 'python_calculation';

  definition = {
    message0: '%1',
    args0: [
      {
        type: 'field_variable',
        name: 'VAR',
        variable: 'result',
      },
    ],
    output: null,
    colour: '#ff7a45',
    tooltip: '获取变量的值',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    // 获取变量对象，使用显示名称而不是内部ID
    const field = block.getField('VAR');
    const variable = field?.getVariable?.();
    const varName = variable ? variable.name : BlockHelper.getFieldValue(block, 'VAR');
    const cleanedName = sanitizeVariableName(varName);

    return [cleanedName, pythonGenerator.ORDER_ATOMIC];
  };
}

/**
 * 数学运算块 - 二元运算
 */
export class MathBinaryOpBlock extends BlockDefinition {
  type = 'math_binary_operation';
  category = 'python_calculation';

  definition = {
    message0: '%1 %2 %3',
    args0: [
      {
        type: 'input_value',
        name: 'A',
        check: 'Number',
      },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['+ 加', 'ADD'],
          ['- 减', 'MINUS'],
          ['× 乘', 'MULTIPLY'],
          ['÷ 除', 'DIVIDE'],
          ['^ 幂', 'POWER'],
          ['% 取余', 'MODULO'],
          ['// 整除', 'FLOOR_DIVIDE'],
        ],
      },
      {
        type: 'input_value',
        name: 'B',
        check: 'Number',
      },
    ],
    output: 'Number',
    colour: '#ff7a45',
    tooltip: '数学二元运算',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const OPERATORS: Record<string, [string, number]> = {
      'ADD': [' + ', pythonGenerator.ORDER_ADDITIVE],
      'MINUS': [' - ', pythonGenerator.ORDER_ADDITIVE],
      'MULTIPLY': [' * ', pythonGenerator.ORDER_MULTIPLICATIVE],
      'DIVIDE': [' / ', pythonGenerator.ORDER_MULTIPLICATIVE],
      'POWER': [' ** ', pythonGenerator.ORDER_EXPONENTIATION],
      'MODULO': [' % ', pythonGenerator.ORDER_MULTIPLICATIVE],
      'FLOOR_DIVIDE': [' // ', pythonGenerator.ORDER_MULTIPLICATIVE],
    };

    const opField = BlockHelper.getFieldValue(block, 'OP');
    const tuple = OPERATORS[opField];
    const operator = tuple[0];
    const order = tuple[1];

    const argument0 = BlockHelper.getInputValue(block, 'A', order) || '0';
    const argument1 = BlockHelper.getInputValue(block, 'B', order) || '0';

    const code = argument0 + operator + argument1;
    return [code, order];
  };
}

/**
 * 数学一元运算块
 */
export class MathUnaryOpBlock extends BlockDefinition {
  type = 'math_unary_operation';
  category = 'python_calculation';

  definition = {
    message0: '%1 %2',
    args0: [
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['- 负号', 'NEG'],
          ['abs 绝对值', 'ABS'],
          ['round 四舍五入', 'ROUND'],
          ['int 取整', 'INT'],
          ['float 转浮点', 'FLOAT'],
        ],
      },
      {
        type: 'input_value',
        name: 'NUM',
        check: 'Number',
      },
    ],
    output: 'Number',
    colour: '#ff7a45',
    tooltip: '数学一元运算',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const op = BlockHelper.getFieldValue(block, 'OP');
    const num = BlockHelper.getInputValue(block, 'NUM', pythonGenerator.ORDER_NONE) || '0';

    let code = '';
    let order = pythonGenerator.ORDER_FUNCTION_CALL;

    switch (op) {
      case 'NEG':
        code = `-${num}`;
        order = pythonGenerator.ORDER_UNARY_SIGN;
        break;
      case 'ABS':
        code = `abs(${num})`;
        break;
      case 'ROUND':
        code = `round(${num})`;
        break;
      case 'INT':
        code = `int(${num})`;
        break;
      case 'FLOAT':
        code = `float(${num})`;
        break;
    }

    return [code, order];
  };
}

/**
 * 比较运算块
 */
export class ComparisonBlock extends BlockDefinition {
  type = 'comparison_operation';
  category = 'python_calculation';

  definition = {
    message0: '%1 %2 %3',
    args0: [
      {
        type: 'input_value',
        name: 'A',
      },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['= 等于', 'EQ'],
          ['≠ 不等于', 'NEQ'],
          ['< 小于', 'LT'],
          ['≤ 小于等于', 'LTE'],
          ['> 大于', 'GT'],
          ['≥ 大于等于', 'GTE'],
        ],
      },
      {
        type: 'input_value',
        name: 'B',
      },
    ],
    output: 'Boolean',
    colour: '#ff7a45',
    tooltip: '比较两个值',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const OPERATORS: Record<string, [string, number]> = {
      'EQ': [' == ', pythonGenerator.ORDER_RELATIONAL],
      'NEQ': [' != ', pythonGenerator.ORDER_RELATIONAL],
      'LT': [' < ', pythonGenerator.ORDER_RELATIONAL],
      'LTE': [' <= ', pythonGenerator.ORDER_RELATIONAL],
      'GT': [' > ', pythonGenerator.ORDER_RELATIONAL],
      'GTE': [' >= ', pythonGenerator.ORDER_RELATIONAL],
    };

    const opField = BlockHelper.getFieldValue(block, 'OP');
    const tuple = OPERATORS[opField];
    const operator = tuple[0];
    const order = tuple[1];

    const argument0 = BlockHelper.getInputValue(block, 'A', order) || '0';
    const argument1 = BlockHelper.getInputValue(block, 'B', order) || '0';

    const code = argument0 + operator + argument1;
    return [code, order];
  };
}

/**
 * 逻辑运算块
 */
export class LogicOperationBlock extends BlockDefinition {
  type = 'logic_operation';
  category = 'python_calculation';

  definition = {
    message0: '%1 %2 %3',
    args0: [
      {
        type: 'input_value',
        name: 'A',
        check: 'Boolean',
      },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['and 且', 'AND'],
          ['or 或', 'OR'],
        ],
      },
      {
        type: 'input_value',
        name: 'B',
        check: 'Boolean',
      },
    ],
    output: 'Boolean',
    colour: '#ff7a45',
    tooltip: '逻辑运算',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const OPERATORS: Record<string, [string, number]> = {
      'AND': [' and ', pythonGenerator.ORDER_LOGICAL_AND],
      'OR': [' or ', pythonGenerator.ORDER_LOGICAL_OR],
    };

    const opField = BlockHelper.getFieldValue(block, 'OP');
    const tuple = OPERATORS[opField];
    const operator = tuple[0];
    const order = tuple[1];

    const argument0 = BlockHelper.getInputValue(block, 'A', order) || 'False';
    const argument1 = BlockHelper.getInputValue(block, 'B', order) || 'False';

    const code = argument0 + operator + argument1;
    return [code, order];
  };
}

/**
 * 逻辑非运算块
 */
export class LogicNotBlock extends BlockDefinition {
  type = 'logic_not';
  category = 'python_calculation';

  definition = {
    message0: 'not %1',
    args0: [
      {
        type: 'input_value',
        name: 'BOOL',
        check: 'Boolean',
      },
    ],
    output: 'Boolean',
    colour: '#ff7a45',
    tooltip: '逻辑非运算',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const bool = BlockHelper.getInputValue(block, 'BOOL', pythonGenerator.ORDER_LOGICAL_NOT) || 'False';
    const code = `not ${bool}`;
    return [code, pythonGenerator.ORDER_LOGICAL_NOT];
  };
}

/**
 * 数字常量块
 */
export class NumberConstantBlock extends BlockDefinition {
  type = 'number_constant';
  category = 'python_calculation';

  definition = {
    message0: '%1',
    args0: [
      {
        type: 'field_number',
        name: 'NUM',
        value: 0,
      },
    ],
    output: 'Number',
    colour: '#ff7a45',
    tooltip: '数字常量',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const num = BlockHelper.getFieldValue(block, 'NUM');
    const code = String(num);
    return [code, pythonGenerator.ORDER_ATOMIC];
  };
}

/**
 * 增量操作块 (+=, -=, *=, /=)
 */
export class IncrementBlock extends BlockDefinition {
  type = 'increment_operation';
  category = 'python_calculation';

  definition = {
    message0: '%1 %2 %3',
    args0: [
      {
        type: 'field_variable',
        name: 'VAR',
        variable: 'counter',
      },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['+= 增加', 'ADD'],
          ['-= 减少', 'MINUS'],
          ['*= 乘以', 'MULTIPLY'],
          ['/= 除以', 'DIVIDE'],
        ],
      },
      {
        type: 'input_value',
        name: 'VALUE',
        check: 'Number',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#ff7a45',
    tooltip: '增量操作 (+=, -=, *=, /=)',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): string => {
    const OPERATORS: Record<string, string> = {
      'ADD': ' += ',
      'MINUS': ' -= ',
      'MULTIPLY': ' *= ',
      'DIVIDE': ' /= ',
    };

    // 获取变量对象，使用显示名称而不是内部ID
    const field = block.getField('VAR');
    const variable = field?.getVariable?.();
    const varName = variable ? variable.name : BlockHelper.getFieldValue(block, 'VAR');
    const cleanedName = sanitizeVariableName(varName);

    const opField = BlockHelper.getFieldValue(block, 'OP');
    const operator = OPERATORS[opField];
    const value = BlockHelper.getInputValue(block, 'VALUE', pythonGenerator.ORDER_NONE) || '1';

    const code = `${cleanedName}${operator}${value}\n`;
    return code;
  };
}
