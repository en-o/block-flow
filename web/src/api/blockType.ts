import { http } from './request';
import type { ApiResponse, PageRequest, PageResponse, BlockType } from '../types/api';

export const blockTypeApi = {
  // 获取块类型列表
  getBlockTypeList(params?: PageRequest): Promise<ApiResponse<PageResponse<BlockType>>> {
    return http.get('/block-types', { params });
  },

  // 获取块类型详情
  getBlockTypeById(id: number): Promise<ApiResponse<BlockType>> {
    return http.get(`/block-types/${id}`);
  },

  // 创建块类型
  createBlockType(data: Partial<BlockType>): Promise<ApiResponse<BlockType>> {
    return http.post('/block-types', data);
  },

  // 更新块类型
  updateBlockType(id: number, data: Partial<BlockType>): Promise<ApiResponse<BlockType>> {
    return http.put(`/block-types/${id}`, data);
  },

  // 删除块类型
  deleteBlockType(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/block-types/${id}`);
  },
};
