import { http } from './request';
import type { LoginRequest, LoginResponse, ApiResponse } from '../types/api';

export const authApi = {
  // 登录
  login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return http.post('/login', data);
  },

  // 登出
  logout(): Promise<ApiResponse<void>> {
    return http.post('/logout');
  },

  // 获取当前用户信息
  getCurrentUser(): Promise<ApiResponse<any>> {
    return http.get('/auth/me');
  },

  // 刷新Token
  refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return http.post('/auth/refresh');
  },
};
