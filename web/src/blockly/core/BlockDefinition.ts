import * as Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';

/**
 * Blockly块定义接口
 */
export interface IBlockDefinition {
  /** 块类型名称（唯一标识） */
  type: string;

  /** 块的JSON定义 */
  definition: any;

  /** Python代码生成器 */
  generator: (block: Blockly.Block) => [string, number] | string;

  /** 块所属分类 */
  category?: string;

  /** 块的颜色（可选，会被分类颜色覆盖） */
  colour?: string;
}

/**
 * Blockly块定义基类
 * 提供块定义和代码生成的标准模板
 */
export abstract class BlockDefinition implements IBlockDefinition {
  abstract type: string;
  abstract definition: any;
  abstract generator: (block: Blockly.Block) => [string, number] | string;
  category?: string;
  colour?: string;

  /**
   * 注册块到Blockly
   */
  register(): void {
    // 注册块定义
    Blockly.Blocks[this.type] = {
      init: function() {
        this.jsonInit(this.getDefinition());
      }.bind(this),
    };

    // 注册Python代码生成器
    pythonGenerator.forBlock[this.type] = this.generator;
  }

  /**
   * 获取块定义（可以在子类中重写以动态生成）
   */
  protected getDefinition(): any {
    return this.definition;
  }
}

/**
 * 获取输入值的辅助函数
 */
export class BlockHelper {
  /**
   * 获取字段值
   */
  static getFieldValue(block: Blockly.Block, fieldName: string): string {
    return block.getFieldValue(fieldName) || '';
  }

  /**
   * 获取输入值代码
   */
  static getInputValue(block: Blockly.Block, inputName: string, order: number = pythonGenerator.ORDER_ATOMIC): string {
    return pythonGenerator.valueToCode(block, inputName, order) || '""';
  }

  /**
   * 获取语句代码
   */
  static getStatements(block: Blockly.Block, statementName: string): string {
    return pythonGenerator.statementToCode(block, statementName) || '';
  }

  /**
   * 添加缩进
   */
  static indent(code: string, level: number = 1): string {
    const indentation = '  '.repeat(level);
    return code.split('\n').map(line => line ? indentation + line : line).join('\n');
  }

  /**
   * 确保代码以换行符结束
   */
  static ensureNewline(code: string): string {
    return code.endsWith('\n') ? code : code + '\n';
  }
}
