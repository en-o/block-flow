import { http } from './request';
import type { ApiResponse, PageRequest, PageResponse, BlockType } from '../types/api';

export const blockTypeApi = {
  // 获取所有块类型列表
  listAll(): Promise<ApiResponse<BlockType[]>> {
    return http.get('/block-types/list');
  },

  // 分页查询块类型列表
  getBlockTypeList(params?: PageRequest): Promise<ApiResponse<PageResponse<BlockType>>> {
    return http.post('/block-types/page', params);
  },

  // 获取块类型详情
  getBlockTypeById(id: number): Promise<ApiResponse<BlockType>> {
    return http.get(`/block-types/${id}`);
  },

  // 根据code获取块类型
  getBlockTypeByCode(code: string): Promise<ApiResponse<BlockType>> {
    return http.get(`/block-types/code/${code}`);
  },

  // 创建块类型
  createBlockType(data: Partial<BlockType>): Promise<ApiResponse<BlockType>> {
    return http.post('/block-types', data);
  },

  // 更新块类型
  updateBlockType(id: number, data: Partial<BlockType>): Promise<ApiResponse<BlockType>> {
    return http.put('/block-types', data);
  },

  // 删除块类型
  deleteBlockType(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/block-types/${id}`);
  },

  // 搜索块类型
  searchByName(name: string): Promise<ApiResponse<BlockType[]>> {
    return http.get('/block-types/search', { params: { name } });
  },
};
