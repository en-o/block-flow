import { http } from './request';
import type { ApiResponse, ResultPageVO, Block, BlockPage, BlockCreateDTO, BlockUpdateDTO, BlockTestDTO } from '../types/api';

export const blockApi = {
  // 创建块
  // POST /blocks
  create(data: BlockCreateDTO): Promise<ApiResponse<Block>> {
    return http.post('/blocks', data);
  },

  // 更新块
  // PUT /blocks
  update(data: BlockUpdateDTO): Promise<ApiResponse<Block>> {
    return http.put('/blocks', data);
  },

  // 删除块
  // DELETE /blocks/{id}
  delete(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/blocks/${id}`);
  },

  // 获取块详情
  // GET /blocks/{id}
  getById(id: number): Promise<ApiResponse<Block>> {
    return http.get(`/blocks/${id}`);
  },

  // 分页查询块
  // POST /blocks/page
  page(params: BlockPage): Promise<ResultPageVO<Block>> {
    return http.post('/blocks/page', params);
  },

  // 分页查询块 流程编排专用
  // POST /blocks/page/flow
  pageFlow(params: BlockPage): Promise<ResultPageVO<Block>> {
    return http.post('/blocks/page/flow', params);
  },


  // 测试块执行
  // POST /blocks/{id}/test
  test(id: number, data: BlockTestDTO): Promise<ApiResponse<string>> {
    return http.post(`/blocks/${id}/test`, data);
  },

  // 克隆块
  // POST /blocks/{id}/clone
  clone(id: number): Promise<ApiResponse<Block>> {
    return http.post(`/blocks/${id}/clone`);
  },

  // 获取标签聚类统计
  // GET /blocks/tags/statistics
  getTagsStatistics(): Promise<ApiResponse<Record<string, number>>> {
    return http.get('/blocks/tags/statistics');
  },
};
