import { http } from './request';
import type { ApiResponse, ResultPageVO, BlockType, BlockTypePage } from '../types/api';

export const blockTypeApi = {
  // 创建块类型
  // POST /block-types
  create(data: Partial<BlockType>): Promise<ApiResponse<BlockType>> {
    return http.post('/block-types', data);
  },

  // 更新块类型
  // PUT /block-types
  update(data: Partial<BlockType> & { id: number }): Promise<ApiResponse<BlockType>> {
    return http.put('/block-types', data);
  },

  // 删除块类型
  // DELETE /block-types/{id}
  delete(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/block-types/${id}`);
  },

  // 获取块类型详情
  // GET /block-types/{id}
  getById(id: number): Promise<ApiResponse<BlockType>> {
    return http.get(`/block-types/${id}`);
  },

  // 根据code获取块类型
  // GET /block-types/code/{code}
  getByCode(code: string): Promise<ApiResponse<BlockType>> {
    return http.get(`/block-types/code/${code}`);
  },

  // 获取所有块类型列表
  // GET /block-types/list
  listAll(): Promise<ApiResponse<BlockType[]>> {
    return http.get('/block-types/list');
  },

  // 分页查询块类型
  // POST /block-types/page
  page(params: BlockTypePage): Promise<ResultPageVO<BlockType>> {
    return http.post('/block-types/page', params);
  },

  // 搜索块类型
  // GET /block-types/search?name={name}
  searchByName(name: string): Promise<ApiResponse<BlockType[]>> {
    return http.get('/block-types/search', { params: { name } });
  },
};
