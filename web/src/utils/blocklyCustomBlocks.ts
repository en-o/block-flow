/**
 * 自定义Blockly块定义（Python相关）
 *
 * ⚠️ 已废弃：此文件保留用于向后兼容
 * 新架构使用 /src/blockly 模块化系统
 *
 * 包括: 输入/输出处理、文件操作、HTTP请求、字典操作等
 */
import * as Blockly from 'blockly';
import { pythonGenerator, Order } from 'blockly/python';
import { initializeBlocklyWithDynamic } from '../blockly';

// 确保生成器已初始化
if (!pythonGenerator) {
  console.error('Python生成器未正确加载');
}

/**
 * 初始化所有自定义块
 *
 * ⚠️ 已迁移到新架构：使用 /src/blockly 模块
 * 此函数现在调用新的初始化系统（包含动态块）
 */
export async function initCustomBlocks() {
  try {
    console.log('🔄 使用新的Blockly模块化架构初始化（静态 + 动态）...');

    // 使用新架构初始化（包含动态块）
    await initializeBlocklyWithDynamic();

    // 修复数学运算符生成器（使用 * / 而非 × ÷）
    fixMathArithmeticGenerator();

    // 修复变量块生成器（处理特殊字符）
    fixVariableBlockGenerators();

    console.log('✅ Blockly自定义块初始化成功（新架构）');
  } catch (error) {
    console.error('❌ Blockly自定义块初始化失败', error);
  }
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
 * 修复Blockly内置变量块的Python生成器
 * 使用变量的显示名称而不是内部ID，并处理特殊字符
 */
function fixVariableBlockGenerators() {
  // 修复 variables_get 块（获取变量值）
  pythonGenerator.forBlock['variables_get'] = function(block: any) {
    // 获取变量对象，使用显示名称而不是内部ID
    const variable = block.getField('VAR')?.getVariable();
    const varName = variable ? variable.name : block.getFieldValue('VAR');
    const cleanedName = sanitizeVariableName(varName);
    return [cleanedName, Order.ATOMIC];
  };

  // 修复 variables_set 块（设置变量值）
  pythonGenerator.forBlock['variables_set'] = function(block: any, generator: any) {
    // 获取变量对象，使用显示名称而不是内部ID
    const variable = block.getField('VAR')?.getVariable();
    const varName = variable ? variable.name : block.getFieldValue('VAR');
    const cleanedName = sanitizeVariableName(varName);
    const value = generator.valueToCode(block, 'VALUE', Order.NONE) || 'None';
    return cleanedName + ' = ' + value + '\n';
  };

  // 禁用自动变量声明（去掉 "变量名 = None" 的初始化）
  // 覆盖 init 函数，让它不生成变量声明
  pythonGenerator.init = function(workspace: any) {
    // 创建一个空的变量定义映射，但不生成声明代码
    // 这样可以保留变量跟踪功能，但不会在代码开头添加 "var = None"
    if (!pythonGenerator.nameDB_) {
      pythonGenerator.nameDB_ = new (Blockly as any).Names(pythonGenerator.RESERVED_WORDS_);
    } else {
      pythonGenerator.nameDB_.reset();
    }

    pythonGenerator.nameDB_?.setVariableMap(workspace.getVariableMap());

    // 重要：不生成变量初始化代码
    // 原始实现会在这里生成 "变量名 = None"，我们跳过这一步
    pythonGenerator.definitions_ = Object.create(null);
    pythonGenerator.functionNames_ = Object.create(null);
  };
}


