import { http } from './request';
import type {
  ApiResponse,
  ResultPageVO,
  ExecutionLog,
  ExecutionLogPage,
  WorkflowExecuteDTO
} from '../types/api';

export const executionApi = {
  // 执行流程
  // POST /executions
  execute(data: WorkflowExecuteDTO): Promise<ApiResponse<ExecutionLog>> {
    return http.post('/executions', data);
  },

  // 获取执行详情
  // GET /executions/{id}
  getById(id: number): Promise<ApiResponse<ExecutionLog>> {
    return http.get(`/executions/${id}`);
  },

  // 分页查询执行历史
  // POST /executions/page
  page(params: ExecutionLogPage): Promise<ResultPageVO<ExecutionLog>> {
    return http.post('/executions/page', params);
  },

  // 获取执行日志
  // GET /executions/{id}/logs
  getLogs(id: number): Promise<ApiResponse<string>> {
    return http.get(`/executions/${id}/logs`);
  },

  // 取消执行
  // POST /executions/{id}/cancel
  cancel(id: number): Promise<ApiResponse<ExecutionLog>> {
    return http.post(`/executions/${id}/cancel`);
  },

  // 删除执行记录
  // DELETE /executions/{id}
  delete(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/executions/${id}`);
  },

  // 获取流程执行次数
  // GET /executions/workflow/{workflowId}/count
  getExecutionCount(workflowId: number): Promise<ApiResponse<number>> {
    return http.get(`/executions/workflow/${workflowId}/count`);
  },

  // 获取流程成功次数
  // GET /executions/workflow/{workflowId}/success-count
  getSuccessCount(workflowId: number): Promise<ApiResponse<number>> {
    return http.get(`/executions/workflow/${workflowId}/success-count`);
  },

  // 获取流程失败次数
  // GET /executions/workflow/{workflowId}/failed-count
  getFailedCount(workflowId: number): Promise<ApiResponse<number>> {
    return http.get(`/executions/workflow/${workflowId}/failed-count`);
  },
};
