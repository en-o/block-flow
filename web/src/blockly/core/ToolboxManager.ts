import { BlockRegistry } from './BlockRegistry';

/**
 * 工具箱分类配置接口
 */
export interface ToolboxCategory {
  /** 分类名称 */
  name: string;
  /** 分类标识（与块的category字段对应） */
  categoryId: string;
  /** 分类颜色 */
  colour: string;
  /** 分类图标（可选） */
  icon?: string;
  /** 排序优先级（数字越小越靠前） */
  order: number;
  /** 是否为内置分类（如变量、函数） */
  custom?: string;
}

/**
 * Blockly工具箱配置管理器
 * 负责生成和管理Blockly的工具箱结构
 */
export class ToolboxManager {
  private static categories: Map<string, ToolboxCategory> = new Map();

  /**
   * 默认分类配置
   * 已优化：去除重复分类，更清晰的Python专用结构
   */
  private static defaultCategories: ToolboxCategory[] = [
    // === Python 基础分类 ===
    {
      name: '📥 输入输出',
      categoryId: 'python_io',
      colour: '#1890ff',
      order: 1,
    },
    {
      name: '🔢 变量与运算',
      categoryId: 'python_calculation',
      colour: '#ff7a45',
      order: 2,
    },

    // === Blockly 内置分类 ===
    {
      name: '➕ 数学',
      categoryId: 'math',
      colour: '#FA8C16',
      order: 3,
    },
    {
      name: '🔀 逻辑',
      categoryId: 'logic',
      colour: '#5C7CFA',
      order: 4,
    },
    {
      name: '🔁 循环',
      categoryId: 'loops',
      colour: '#52C41A',
      order: 5,
    },
    {
      name: '📝 文本',
      categoryId: 'text',
      colour: '#722ED1',
      order: 6,
    },

    // === Python 高级功能 ===
    {
      name: '🎯 字符串处理',
      categoryId: 'python_string',
      colour: '#9254de',
      order: 7,
    },
    {
      name: '📦 列表/字典',
      categoryId: 'python_data',
      colour: '#52c41a',
      order: 8,
    },
    {
      name: '🛡️ 异常处理',
      categoryId: 'python_control',
      colour: '#fa541c',
      order: 9,
    },
    {
      name: '📁 文件操作',
      categoryId: 'python_file',
      colour: '#13c2c2',
      order: 10,
    },
    {
      name: '🌐 HTTP请求',
      categoryId: 'python_http',
      colour: '#fa8c16',
      order: 11,
    },
    {
      name: '{ } JSON',
      categoryId: 'python_json',
      colour: '#722ed1',
      order: 12,
    },
    {
      name: '🕐 日期时间',
      categoryId: 'python_datetime',
      colour: '#eb2f96',
      order: 13,
    },

    // === 自定义积木 ===
    {
      name: '⚙️ 自定义积木',
      categoryId: 'system_custom',
      colour: '#9C27B0',
      order: 100,
    },
  ];

  /**
   * 初始化默认分类
   */
  static initialize(): void {
    this.categories.clear();
    this.defaultCategories.forEach(category => {
      this.categories.set(category.categoryId, category);
    });
  }

  /**
   * 注册自定义分类
   */
  static registerCategory(category: ToolboxCategory): void {
    this.categories.set(category.categoryId, category);
  }

  /**
   * 批量注册分类
   */
  static registerCategories(categories: ToolboxCategory[]): void {
    categories.forEach(category => this.registerCategory(category));
  }

  /**
   * 获取指定分类
   */
  static getCategory(categoryId: string): ToolboxCategory | undefined {
    return this.categories.get(categoryId);
  }

  /**
   * 获取所有分类（按order排序）
   */
  static getAllCategories(): ToolboxCategory[] {
    return Array.from(this.categories.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * 生成Blockly工具箱JSON配置
   * 根据已注册的块和分类自动生成工具箱结构
   */
  static generateToolbox(): any {
    const contents: any[] = [];

    // 获取所有已注册的块类型
    const allBlockTypes = BlockRegistry.getAllBlockTypes();

    // 按分类组织块
    const categorizedBlocks = new Map<string, string[]>();

    // 将块分配到对应的分类
    allBlockTypes.forEach(blockType => {
      const block = BlockRegistry.getBlock(blockType);
      if (block && block.category) {
        const category = block.category;
        if (!categorizedBlocks.has(category)) {
          categorizedBlocks.set(category, []);
        }
        categorizedBlocks.get(category)!.push(blockType);
      }
    });

    // 按顺序生成分类
    const sortedCategories = this.getAllCategories();

    sortedCategories.forEach(category => {
      const blocks = categorizedBlocks.get(category.categoryId);

      // 如果是内置分类（变量、函数）
      if (category.custom) {
        contents.push({
          kind: 'category',
          name: category.name,
          colour: category.colour,
          custom: category.custom,
        });
      }
      // 如果该分类有块
      else if (blocks && blocks.length > 0) {
        const blockContents = blocks.map(blockType => ({
          kind: 'block',
          type: blockType,
        }));

        contents.push({
          kind: 'category',
          name: category.name,
          colour: category.colour,
          contents: blockContents,
        });
      }
      // 对于内置Blockly分类（logic, loops, math, text, lists），添加标准块
      else if (this.isBuiltInCategory(category.categoryId)) {
        const builtInBlocks = this.getBuiltInCategoryBlocks(category.categoryId);
        if (builtInBlocks.length > 0) {
          contents.push({
            kind: 'category',
            name: category.name,
            colour: category.colour,
            contents: builtInBlocks,
          });
        }
      }
    });

    return {
      kind: 'categoryToolbox',
      contents: contents,
    };
  }

  /**
   * 判断是否为Blockly内置分类
   * 只保留核心的内置分类，其他使用自定义块
   */
  private static isBuiltInCategory(categoryId: string): boolean {
    const builtInCategories = ['logic', 'loops', 'math', 'text'];
    return builtInCategories.includes(categoryId);
  }

  /**
   * 获取Blockly内置分类的块定义
   * 针对Python优化：只提供最常用的块
   */
  private static getBuiltInCategoryBlocks(categoryId: string): any[] {
    const blockDefinitions: Record<string, any[]> = {
      logic: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'logic_boolean' },
        { kind: 'block', type: 'logic_null' },
      ],
      loops: [
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for' },
        { kind: 'block', type: 'controls_forEach' },
        { kind: 'block', type: 'controls_flow_statements' },
      ],
      math: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_single' },
        { kind: 'block', type: 'math_round' },
        { kind: 'block', type: 'math_modulo' },
        { kind: 'block', type: 'math_random_int' },
        { kind: 'block', type: 'math_random_float' },
      ],
      text: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_join' },
        { kind: 'block', type: 'text_length' },
        { kind: 'block', type: 'text_isEmpty' },
        { kind: 'block', type: 'text_indexOf' },
        { kind: 'block', type: 'text_charAt' },
        { kind: 'block', type: 'text_getSubstring' },
        { kind: 'block', type: 'text_changeCase' },
        { kind: 'block', type: 'text_trim' },
      ],
    };

    return blockDefinitions[categoryId] || [];
  }

  /**
   * 生成简化的工具箱配置（仅包含指定分类）
   */
  static generateToolboxForCategories(categoryIds: string[]): any {
    const contents: any[] = [];

    categoryIds.forEach(categoryId => {
      const category = this.categories.get(categoryId);
      if (!category) return;

      const blocks = BlockRegistry.getBlocksByCategory(categoryId);

      if (category.custom) {
        contents.push({
          kind: 'category',
          name: category.name,
          colour: category.colour,
          custom: category.custom,
        });
      } else if (blocks.length > 0) {
        const blockContents = blocks.map(block => ({
          kind: 'block',
          type: block.type,
        }));

        contents.push({
          kind: 'category',
          name: category.name,
          colour: category.colour,
          contents: blockContents,
        });
      } else if (this.isBuiltInCategory(categoryId)) {
        const builtInBlocks = this.getBuiltInCategoryBlocks(categoryId);
        if (builtInBlocks.length > 0) {
          contents.push({
            kind: 'category',
            name: category.name,
            colour: category.colour,
            contents: builtInBlocks,
          });
        }
      }
    });

    return {
      kind: 'categoryToolbox',
      contents: contents,
    };
  }

  /**
   * 清除所有分类配置
   */
  static clear(): void {
    this.categories.clear();
  }

  /**
   * 重置为默认分类
   */
  static reset(): void {
    this.initialize();
  }
}

// 自动初始化默认分类
ToolboxManager.initialize();
