import request from './request';

/**
 * Blockly块管理API
 */

/**
 * 创建Blockly块
 */
export const createBlocklyBlock = (data: any) => {
  return request.post('/api/blockly-blocks', data);
};

/**
 * 更新Blockly块
 */
export const updateBlocklyBlock = (data: any) => {
  return request.put('/api/blockly-blocks', data);
};

/**
 * 删除Blockly块
 */
export const deleteBlocklyBlock = (id: number) => {
  return request.delete(`/api/blockly-blocks/${id}`);
};

/**
 * 根据ID查询块
 */
export const getBlocklyBlockById = (id: number) => {
  return request.get(`/api/blockly-blocks/${id}`);
};

/**
 * 根据类型查询块
 */
export const getBlocklyBlockByType = (type: string) => {
  return request.get(`/api/blockly-blocks/type/${type}`);
};

/**
 * 分页查询Blockly块
 */
export const getBlocklyBlockPage = (data: any) => {
  return request.post('/api/blockly-blocks/page', data);
};

/**
 * 获取所有启用的块
 */
export const getEnabledBlocklyBlocks = () => {
  return request.get('/api/blockly-blocks/enabled');
};

/**
 * 获取所有分类
 */
export const getBlocklyCategories = () => {
  return request.get('/api/blockly-blocks/categories');
};

/**
 * 根据分类获取块列表
 */
export const getBlocklyBlocksByCategory = (category: string) => {
  return request.get(`/api/blockly-blocks/category/${category}`);
};

/**
 * 获取工具箱配置（用于动态加载）
 */
export const getBlocklyToolboxConfig = () => {
  return request.get('/api/blockly-blocks/toolbox');
};

/**
 * 启用/禁用块
 */
export const toggleBlocklyBlock = (id: number, enabled: boolean) => {
  return request.put(`/api/blockly-blocks/${id}/toggle?enabled=${enabled}`);
};

/**
 * 批量导入块定义
 */
export const batchImportBlocklyBlocks = (blocks: any[]) => {
  return request.post('/api/blockly-blocks/batch-import', blocks);
};

/**
 * 验证块定义
 */
export const validateBlocklyDefinition = (definition: string, pythonGenerator: string) => {
  return request.post('/api/blockly-blocks/validate', { definition, pythonGenerator });
};
