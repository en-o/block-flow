import { http } from './request';
import type { ApiResponse, ContextVariable } from '../types/api';

export const contextApi = {
  // 获取所有变量
  getContextVariables(params?: {
    groupName?: string;
    environment?: string;
  }): Promise<ApiResponse<ContextVariable[]>> {
    return http.get('/context', { params });
  },

  // 获取单个变量
  getContextVariable(key: string): Promise<ApiResponse<ContextVariable>> {
    return http.get(`/context/${key}`);
  },

  // 添加变量
  createContextVariable(data: Partial<ContextVariable>): Promise<ApiResponse<ContextVariable>> {
    return http.post('/context', data);
  },

  // 更新变量
  updateContextVariable(key: string, data: Partial<ContextVariable>): Promise<ApiResponse<ContextVariable>> {
    return http.put(`/context/${key}`, data);
  },

  // 删除变量
  deleteContextVariable(key: string): Promise<ApiResponse<void>> {
    return http.delete(`/context/${key}`);
  },

  // 批量导入变量
  importContextVariables(file: File): Promise<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('file', file);
    return http.post('/context/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 批量导出变量
  exportContextVariables(params?: {
    groupName?: string;
    environment?: string;
  }): Promise<Blob> {
    return http.get('/context/export', {
      params,
      responseType: 'blob',
    });
  },
};
