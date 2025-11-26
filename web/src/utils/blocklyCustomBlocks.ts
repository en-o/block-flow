/**
 * 自定义Blockly块定义（Python相关）
 *
 * ⚠️ 已废弃：此文件保留用于向后兼容
 * 新架构使用 /src/blockly 模块化系统
 *
 * 包括: 输入/输出处理、文件操作、HTTP请求、字典操作等
 */
import { pythonGenerator, Order } from 'blockly/python';
import { initializeBlockly } from '../blockly';

// 确保生成器已初始化
if (!pythonGenerator) {
  console.error('Python生成器未正确加载');
}

/**
 * 初始化所有自定义块
 *
 * ⚠️ 已迁移到新架构：使用 /src/blockly 模块
 * 此函数现在调用新的初始化系统
 */
export function initCustomBlocks() {
  try {
    console.log('🔄 使用新的Blockly模块化架构初始化...');

    // 使用新架构初始化
    initializeBlockly();

    // 修复数学运算符生成器（使用 * / 而非 × ÷）
    fixMathArithmeticGenerator();

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
