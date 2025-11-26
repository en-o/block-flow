import { BlockRegistry } from './core/BlockRegistry';
import { ToolboxManager } from './core/ToolboxManager';

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

  /**
   * 初始化所有Blockly块
   * @param customBlocks 可选的额外自定义块
   */
  static initialize(customBlocks: any[] = []): void {
    if (this.initialized) {
      console.warn('Blockly已经初始化过了，跳过重复初始化');
      return;
    }

    console.log('🚀 开始初始化Blockly自定义块...');

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
    console.log('✅ Blockly初始化完成！');
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
 * 默认导出初始化函数（便于外部调用）
 */
export function initializeBlockly(customBlocks: any[] = []): void {
  BlocklyInitializer.initialize(customBlocks);
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
