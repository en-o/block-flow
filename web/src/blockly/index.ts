import * as Blockly from 'blockly';
import { pythonGenerator, Order } from 'blockly/python';
import { BlockRegistry } from './core/BlockRegistry';
import { ToolboxManager } from './core/ToolboxManager';
import { getEnabledBlocklyBlocks } from '../api/blocklyBlock';

// 导入所有块定义
import {
  // Python IO块
  PythonInputGetBlock,
  PythonOutputSetBlock,
  PythonOutputItemBlock,
  SafeIntBlock,
  SafeFloatBlock,
  SafeBoolBlock,
  PythonPrintBlock,
  ContextVariableBlock,
  // Python代码工具块
  FileReadBlock,
  FileWriteBlock,
  HttpRequestBlock,
  HttpResponseBlock,
  JsonParseBlock,
  JsonStringifyBlock,
  DictCreateBlock,
  DictItemBlock,
  DictGetBlock,
  ListAppendBlock,
  StringFormatBlock,
  TryExceptBlock,
  // 计算和变量块
  VariableAssignBlock,
  VariableGetBlock,
  MathBinaryOpBlock,
  MathUnaryOpBlock,
  ComparisonBlock,
  LogicOperationBlock,
  LogicNotBlock,
  NumberConstantBlock,
  IncrementBlock,
  // 类型转换块
  IntConversionBlock,
  FloatConversionBlock,
  StrConversionBlock,
  BoolConversionBlock,
  ListConversionBlock,
  DictConversionBlock,
  // HTTP请求块
  ImportRequestsBlock,
  RequestsGetBlock,
  RequestsPostBlock,
  RequestsPutBlock,
  RequestsDeleteBlock,
  ObjectPropertyBlock,
  ObjectMethodCallBlock,
  StringSliceBlock,
  PrintWithLabelBlock,
  // 工具块
  CodingDeclarationBlock,
  CommentBlock,
  ImportBlock,
  FromImportBlock,
  // 日期时间块
  ImportDatetimeBlock,
  ImportDateutilBlock,
  DatetimeNowBlock,
  ParserParseBlock,
  DatetimeStrptimeBlock,
  DatetimeStrftimeBlock,
  TimedeltaBlock,
  ImportTimedeltaBlock,
  DatetimeAttributeBlock,
  DateFormatBlock,
} from './blocks';

/**
 * Blockly初始化管理器
 * 负责统一注册所有自定义块并生成工具箱配置
 */
export class BlocklyInitializer {
  private static initialized = false;
  private static dynamicBlocksLoaded = false;

  /**
   * 从数据库动态加载块定义
   * 这会从后端API获取启用的Blockly块并注册到Blockly
   */
  static async loadDynamicBlocks(): Promise<void> {
    if (this.dynamicBlocksLoaded) {
      console.log('⏭️  动态块已经加载过了，跳过');
      return;
    }

    console.log('🔄 正在从后端API加载动态Blockly块...');

    try {
      const response = await getEnabledBlocklyBlocks();

      if (response.data.code === 200) {
        const blocks = response.data.data || [];
        console.log(`📦 加载到 ${blocks.length} 个动态块`);

        // 用于收集新的分类
        const newCategories = new Set<string>();

        // 逐个注册动态块
        for (const blockData of blocks) {
          try {
            // 解析块定义JSON
            const definition = typeof blockData.definition === 'string'
              ? JSON.parse(blockData.definition)
              : blockData.definition;

            // 注册块定义到Blockly
            Blockly.Blocks[definition.type] = {
              init: function() {
                this.jsonInit(definition);
              }
            };

            // 创建Python代码生成器函数
            try {
              // 创建生成器函数，需要正确绑定参数
              const generatorFunc = new Function(
                'block',
                'generator',
                'Blockly',
                'Order',
                blockData.pythonGenerator
              );

              pythonGenerator.forBlock[definition.type] = function(block: any) {
                return generatorFunc(block, pythonGenerator, Blockly, Order.ATOMIC);
              };
            } catch (generatorError) {
              console.error(`❌ 块 ${definition.type} 的Python生成器创建失败:`, generatorError);
            }

            // 收集分类信息
            if (blockData.category) {
              newCategories.add(blockData.category);
            }

            console.log(`✅ 动态块已注册: ${definition.type} (分类: ${blockData.category})`);
          } catch (error) {
            console.error(`❌ 注册动态块失败: ${blockData.type}`, error);
          }
        }

        // 为新分类注册到ToolboxManager
        newCategories.forEach(categoryId => {
          // 检查分类是否已存在
          if (!ToolboxManager.getCategory(categoryId)) {
            // 注册新分类
            ToolboxManager.registerCategory({
              name: categoryId,
              categoryId: categoryId,
              colour: '#9C27B0', // 默认紫色
              order: 100 + Array.from(newCategories).indexOf(categoryId), // 动态分类排在后面
            });
            console.log(`📁 注册新分类: ${categoryId}`);
          }
        });

        this.dynamicBlocksLoaded = true;
        console.log('✅ 动态块加载完成！');
      } else {
        console.error('❌ 加载动态块失败:', response.data.message);
      }
    } catch (error) {
      console.error('❌ 从API加载动态块时出错:', error);
    }
  }

  /**
   * 初始化所有Blockly块（静态块）
   * @param customBlocks 可选的额外自定义块
   */
  static initialize(customBlocks: any[] = []): void {
    if (this.initialized) {
      console.warn('Blockly已经初始化过了，跳过重复初始化');
      return;
    }

    console.log('🚀 开始初始化Blockly自定义块（静态块）...');

    // 注册Python IO块
    BlockRegistry.registerBlocks([
      new PythonInputGetBlock(),
      new PythonOutputSetBlock(),
      new PythonOutputItemBlock(),
      new SafeIntBlock(),
      new SafeFloatBlock(),
      new SafeBoolBlock(),
      new PythonPrintBlock(),
      new ContextVariableBlock(),
    ]);

    // 注册Python代码工具块
    BlockRegistry.registerBlocks([
      new FileReadBlock(),
      new FileWriteBlock(),
      new HttpRequestBlock(),
      new HttpResponseBlock(),
      new JsonParseBlock(),
      new JsonStringifyBlock(),
      new DictCreateBlock(),
      new DictItemBlock(),
      new DictGetBlock(),
      new ListAppendBlock(),
      new StringFormatBlock(),
      new TryExceptBlock(),
    ]);

    // 注册计算和变量块
    BlockRegistry.registerBlocks([
      new VariableAssignBlock(),
      new VariableGetBlock(),
      new MathBinaryOpBlock(),
      new MathUnaryOpBlock(),
      new ComparisonBlock(),
      new LogicOperationBlock(),
      new LogicNotBlock(),
      new NumberConstantBlock(),
      new IncrementBlock(),
    ]);

    // 注册类型转换块
    BlockRegistry.registerBlocks([
      new IntConversionBlock(),
      new FloatConversionBlock(),
      new StrConversionBlock(),
      new BoolConversionBlock(),
      new ListConversionBlock(),
      new DictConversionBlock(),
    ]);

    // 注册HTTP请求块
    BlockRegistry.registerBlocks([
      new ImportRequestsBlock(),
      new RequestsGetBlock(),
      new RequestsPostBlock(),
      new RequestsPutBlock(),
      new RequestsDeleteBlock(),
      new ObjectPropertyBlock(),
      new ObjectMethodCallBlock(),
      new StringSliceBlock(),
      new PrintWithLabelBlock(),
    ]);

    // 注册工具块
    BlockRegistry.registerBlocks([
      new CodingDeclarationBlock(),
      new CommentBlock(),
      new ImportBlock(),
      new FromImportBlock(),
    ]);

    // 注册日期时间块
    BlockRegistry.registerBlocks([
      new ImportDatetimeBlock(),
      new ImportDateutilBlock(),
      new DatetimeNowBlock(),
      new ParserParseBlock(),
      new DatetimeStrptimeBlock(),
      new DatetimeStrftimeBlock(),
      new TimedeltaBlock(),
      new ImportTimedeltaBlock(),
      new DatetimeAttributeBlock(),
      new DateFormatBlock(),
    ]);

    // 注册额外的自定义块
    if (customBlocks.length > 0) {
      console.log(`📦 注册 ${customBlocks.length} 个额外自定义块...`);
      BlockRegistry.registerBlocks(customBlocks);
    }

    // 统一注册所有块到Blockly
    BlockRegistry.registerAll();

    // 初始化工具箱管理器
    ToolboxManager.reset();

    this.initialized = true;
    console.log('✅ Blockly静态块初始化完成！');
  }

  /**
   * 初始化所有块（静态 + 动态）
   * 推荐使用此方法来完整初始化Blockly
   */
  static async initializeAll(customBlocks: any[] = []): Promise<void> {
    // 先初始化静态块
    this.initialize(customBlocks);

    // 再加载动态块
    await this.loadDynamicBlocks();

    console.log('✅ Blockly完整初始化完成（静态块 + 动态块）！');
  }

  /**
   * 获取工具箱配置
   * @param categoryIds 可选的分类ID列表，如果提供则只包含这些分类
   * @returns Blockly工具箱JSON配置
   */
  static getToolboxConfig(categoryIds?: string[]): any {
    if (!this.initialized) {
      console.warn('⚠️ Blockly尚未初始化，正在自动初始化...');
      this.initialize();
    }

    if (categoryIds && categoryIds.length > 0) {
      return ToolboxManager.generateToolboxForCategories(categoryIds);
    }

    return ToolboxManager.generateToolbox();
  }

  /**
   * 重置Blockly（用于测试或重新配置）
   */
  static reset(): void {
    BlockRegistry.clear();
    ToolboxManager.clear();
    this.initialized = false;
    this.dynamicBlocksLoaded = false;
    console.log('🔄 Blockly已重置');
  }

  /**
   * 检查是否已初始化
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取所有已注册的块类型
   */
  static getAllBlockTypes(): string[] {
    return BlockRegistry.getAllBlockTypes();
  }

  /**
   * 获取指定分类的块
   */
  static getBlocksByCategory(category: string): any[] {
    return BlockRegistry.getBlocksByCategory(category);
  }
}

/**
 * 默认导出初始化函数（仅初始化静态块）
 * @deprecated 建议使用 initializeBlocklyWithDynamic
 */
export function initializeBlockly(customBlocks: any[] = []): void {
  BlocklyInitializer.initialize(customBlocks);
}

/**
 * 初始化Blockly（包含静态块和动态块）
 * 推荐使用此函数来完整初始化Blockly
 */
export async function initializeBlocklyWithDynamic(customBlocks: any[] = []): Promise<void> {
  await BlocklyInitializer.initializeAll(customBlocks);
}

/**
 * 获取工具箱配置的快捷函数
 */
export function getBlocklyToolbox(categoryIds?: string[]): any {
  return BlocklyInitializer.getToolboxConfig(categoryIds);
}

/**
 * 统一导出
 */
export { BlockRegistry, ToolboxManager };
export * from './core';
export * from './blocks';
