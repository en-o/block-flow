import { BlockDefinition } from './BlockDefinition';

/**
 * Blockly块注册管理器
 * 统一管理所有自定义块的注册
 */
export class BlockRegistry {
  private static blocks: Map<string, BlockDefinition> = new Map();
  private static registered: boolean = false;

  /**
   * 注册一个块定义
   */
  static registerBlock(block: BlockDefinition): void {
    if (this.blocks.has(block.type)) {
      console.warn(`Block type "${block.type}" is already registered. Overwriting...`);
    }
    this.blocks.set(block.type, block);
  }

  /**
   * 批量注册块定义
   */
  static registerBlocks(blocks: BlockDefinition[]): void {
    blocks.forEach(block => this.registerBlock(block));
  }

  /**
   * 注册所有已添加的块到Blockly
   */
  static registerAll(): void {
    if (this.registered) {
      console.warn('Blocks have already been registered. Skipping...');
      return;
    }

    console.log(`Registering ${this.blocks.size} custom blocks...`);
    this.blocks.forEach((block, type) => {
      try {
        block.register();
        console.log(`✓ Registered block: ${type}`);
      } catch (error) {
        console.error(`✗ Failed to register block: ${type}`, error);
      }
    });

    this.registered = true;
    console.log('All custom blocks registered successfully!');
  }

  /**
   * 获取指定类型的块定义
   */
  static getBlock(type: string): BlockDefinition | undefined {
    return this.blocks.get(type);
  }

  /**
   * 获取所有已注册的块类型
   */
  static getAllBlockTypes(): string[] {
    return Array.from(this.blocks.keys());
  }

  /**
   * 按分类获取块类型
   */
  static getBlocksByCategory(category: string): BlockDefinition[] {
    return Array.from(this.blocks.values()).filter(
      block => block.category === category
    );
  }

  /**
   * 清除所有已注册的块（用于测试或重置）
   */
  static clear(): void {
    this.blocks.clear();
    this.registered = false;
  }
}
