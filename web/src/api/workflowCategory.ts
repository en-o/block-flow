import { http } from './request';
import type { ApiResponse, ResultPageVO, WorkflowCategory, WorkflowCategoryPage } from '../types/api';

export const workflowCategoryApi = {
  // 创建流程分类
  // POST /workflow-categories
  create(data: Partial<WorkflowCategory>): Promise<ApiResponse<WorkflowCategory>> {
    return http.post('/workflow-categories', data);
  },

  // 更新流程分类
  // PUT /workflow-categories
  update(data: Partial<WorkflowCategory> & { id: number }): Promise<ApiResponse<WorkflowCategory>> {
    return http.put('/workflow-categories', data);
  },

  // 删除流程分类
  // DELETE /workflow-categories/{id}
  delete(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/workflow-categories/${id}`);
  },

  // 获取流程分类详情
  // GET /workflow-categories/{id}
  getById(id: number): Promise<ApiResponse<WorkflowCategory>> {
    return http.get(`/workflow-categories/${id}`);
  },

  // 根据code获取流程分类
  // GET /workflow-categories/code/{code}
  getByCode(code: string): Promise<ApiResponse<WorkflowCategory>> {
    return http.get(`/workflow-categories/code/${code}`);
  },

  // 获取所有流程分类列表
  // GET /workflow-categories/list
  listAll(): Promise<ApiResponse<WorkflowCategory[]>> {
    return http.get('/workflow-categories/list');
  },

  // 分页查询流程分类
  // POST /workflow-categories/page
  page(params: WorkflowCategoryPage): Promise<ResultPageVO<WorkflowCategory>> {
    return http.post('/workflow-categories/page', params);
  },

  // 搜索流程分类
  // GET /workflow-categories/search?name={name}
  searchByName(name: string): Promise<ApiResponse<WorkflowCategory[]>> {
    return http.get('/workflow-categories/search', { params: { name } });
  },
};
