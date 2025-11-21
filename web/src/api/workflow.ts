import { http } from './request';
import type {
  ApiResponse,
  ResultPageVO,
  Workflow,
  WorkflowPage,
  WorkflowCreateDTO,
  WorkflowUpdateDTO,
  WorkflowExecuteDTO
} from '../types/api';

export const workflowApi = {
  // 创建流程
  // POST /workflows
  create(data: WorkflowCreateDTO): Promise<ApiResponse<Workflow>> {
    return http.post('/workflows', data);
  },

  // 更新流程
  // PUT /workflows
  update(data: WorkflowUpdateDTO): Promise<ApiResponse<Workflow>> {
    return http.put('/workflows', data);
  },

  // 删除流程
  // DELETE /workflows/{id}
  delete(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/workflows/${id}`);
  },

  // 获取流程详情
  // GET /workflows/{id}
  getById(id: number): Promise<ApiResponse<Workflow>> {
    return http.get(`/workflows/${id}`);
  },

  // 分页查询流程
  // POST /workflows/page
  page(params: WorkflowPage): Promise<ResultPageVO<Workflow>> {
    return http.post('/workflows/page', params);
  },

  // 分页查询流程
  // POST /workflows/page
  pagePublic(params: WorkflowPage): Promise<ResultPageVO<Workflow>> {
    return http.post('/workflows/page/public', params);
  },


  // 注意：执行流程的接口已移至 executionApi.execute()
  // 请使用 executionApi.execute() 来执行流程

  // 克隆流程
  // POST /workflows/{id}/clone
  clone(id: number): Promise<ApiResponse<Workflow>> {
    return http.post(`/workflows/${id}/clone`);
  },

  // 激活/停用流程
  // PUT /workflows/{id}/toggle-active
  toggleActive(id: number): Promise<ApiResponse<Workflow>> {
    return http.put(`/workflows/${id}/toggle-active`);
  },

  // 切换流程公开/私有状态
  // PUT /workflows/{id}/toggle-public
  togglePublic(id: number): Promise<ApiResponse<Workflow>> {
    return http.put(`/workflows/${id}/toggle-public`);
  },
};
