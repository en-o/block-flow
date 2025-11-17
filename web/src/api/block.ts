import { http } from './request';
import type { ApiResponse, PageRequest, PageResponse, Block } from '../types/api';

export const blockApi = {
  // 获取块列表
  getBlockList(params?: PageRequest & {
    name?: string;
    typeCode?: string;
    category?: string;
  }): Promise<ApiResponse<PageResponse<Block>>> {
    return http.get('/blocks', { params });
  },

  // 获取块详情
  getBlockById(id: number): Promise<ApiResponse<Block>> {
    return http.get(`/blocks/${id}`);
  },

  // 创建块
  createBlock(data: Partial<Block>): Promise<ApiResponse<Block>> {
    return http.post('/blocks', data);
  },

  // 更新块
  updateBlock(id: number, data: Partial<Block>): Promise<ApiResponse<Block>> {
    return http.put(`/blocks/${id}`, data);
  },

  // 删除块
  deleteBlock(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/blocks/${id}`);
  },

  // 测试块执行
  testBlock(id: number, inputs: any): Promise<ApiResponse<any>> {
    return http.post(`/blocks/${id}/test`, { inputs });
  },

  // 克隆块
  cloneBlock(id: number): Promise<ApiResponse<Block>> {
    return http.post(`/blocks/${id}/clone`);
  },

  // 获取块使用统计
  getBlockUsage(id: number): Promise<ApiResponse<any>> {
    return http.get(`/blocks/${id}/usage`);
  },
};
