import { http } from './request';
import type {
  ApiResponse,
  SpringPage,
  ContextVariable,
  ContextVariableCreateDTO,
  ContextVariableUpdateDTO
} from '../types/api';

export const contextApi = {
  // 分页查询变量
  // GET /context/page?page={page}&size={size}
  page(page: number = 0, size: number = 20): Promise<ApiResponse<SpringPage<ContextVariable>>> {
    return http.get('/context/page', {
      params: { page, size }
    });
  },

  // 根据分组和环境分页查询变量
  // GET /context/filter?groupName={groupName}&environment={environment}&page={page}&size={size}
  filter(params: {
    groupName?: string;
    environment?: 'DEFAULT' | 'DEV' | 'TEST' | 'PROD';
    page?: number;
    size?: number;
  }): Promise<ApiResponse<SpringPage<ContextVariable>>> {
    return http.get('/context/filter', {
      params: {
        groupName: params.groupName,
        environment: params.environment,
        page: params.page || 0,
        size: params.size || 20,
      }
    });
  },

  // 获取单个变量（通过ID）
  // GET /context/{id}
  getById(id: number): Promise<ApiResponse<ContextVariable>> {
    return http.get(`/context/${id}`);
  },

  // 根据变量名获取变量
  // GET /context/key/{varKey}
  getByKey(varKey: string): Promise<ApiResponse<ContextVariable>> {
    return http.get(`/context/key/${varKey}`);
  },

  // 添加变量
  // POST /context
  createContextVariable(data: ContextVariableCreateDTO): Promise<ApiResponse<ContextVariable>> {
    return http.post('/context', data);
  },

  // 更新变量
  // PUT /context
  updateContextVariable(data: ContextVariableUpdateDTO): Promise<ApiResponse<ContextVariable>> {
    return http.put('/context', data);
  },

  // 删除变量（通过ID）
  // DELETE /context/{id}
  deleteContextVariable(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/context/${id}`);
  },

  // 获取所有分组
  // GET /context/groups
  getAllGroupNames(): Promise<ApiResponse<string[]>> {
    return http.get('/context/groups');
  },

  // 批量导入变量
  // POST /context/import?groupName={groupName}&environment={environment}
  importVariables(
    variables: Record<string, string>,
    params?: {
      groupName?: string;
      environment?: 'DEFAULT' | 'DEV' | 'TEST' | 'PROD';
    }
  ): Promise<ApiResponse<number>> {
    return http.post('/context/import', variables, {
      params: params
    });
  },

  // 批量导出变量
  // GET /context/export?groupName={groupName}&environment={environment}
  exportVariables(params?: {
    groupName?: string;
    environment?: 'DEFAULT' | 'DEV' | 'TEST' | 'PROD';
  }): Promise<ApiResponse<Record<string, string>>> {
    return http.get('/context/export', {
      params: params
    });
  },

  // 搜索变量（根据关键字）
  // GET /context/search?keyword={keyword}&page={page}&size={size}
  search(
    keyword: string,
    page: number = 0,
    size: number = 20
  ): Promise<ApiResponse<SpringPage<ContextVariable>>> {
    return http.get('/context/search', {
      params: { keyword, page, size }
    });
  },
};
