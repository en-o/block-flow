import { http } from './request';
import type {
  ApiResponse,
  ResultPageVO,
  User,
  UserPage,
  UserCreateDTO,
  UserUpdateDTO,
  ChangePasswordDTO,
  UpdateProfileDTO
} from '../types/api';

export const userApi = {
  // 创建用户
  // POST /users
  create(data: UserCreateDTO): Promise<ApiResponse<User>> {
    return http.post('/register/system', data);
  },

  // 更新用户
  // PUT /users
  update(data: UserUpdateDTO): Promise<ApiResponse<User>> {
    return http.put('/users', data);
  },

  // 删除用户
  // DELETE /users/{id}
  delete(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/users/${id}`);
  },

  // 获取用户详情
  // GET /users/{id}
  getById(id: number): Promise<ApiResponse<User>> {
    return http.get(`/users/${id}`);
  },

  // 根据用户名获取用户
  // GET /users/username/{username}
  getByUsername(username: string): Promise<ApiResponse<User>> {
    return http.get(`/users/username/${username}`);
  },

  // 获取所有用户列表
  // GET /users/list
  listAll(): Promise<ApiResponse<User[]>> {
    return http.get('/users/list');
  },

  // 分页查询用户
  // POST /users/page
  page(params: UserPage): Promise<ResultPageVO<User>> {
    return http.post('/users/page', params);
  },

  // 搜索用户
  // GET /users/search?keyword={keyword}
  search(keyword: string): Promise<ApiResponse<User[]>> {
    return http.get('/users/search', { params: { keyword } });
  },

  // 激活/停用用户
  // PUT /users/{id}/toggle-active
  toggleActive(id: number): Promise<ApiResponse<User>> {
    return http.put(`/users/${id}/toggle-active`);
  },

  // 重置用户密码（管理员）
  // PUT /users/{id}/reset-password
  resetPassword(id: number, newPassword: string): Promise<ApiResponse<void>> {
    return http.put(`/users/${id}/reset-password`, { newPassword });
  },

  // 修改自己的密码
  // PUT /users/profile/password
  changePassword(data: ChangePasswordDTO): Promise<ApiResponse<void>> {
    return http.put('/users/profile/password', data);
  },

  // 更新个人信息
  // PUT /users/profile
  updateProfile(data: UpdateProfileDTO): Promise<ApiResponse<User>> {
    return http.put('/users/profile', data);
  },

  // 获取当前用户信息
  // GET /users/profile
  getProfile(): Promise<ApiResponse<User>> {
    return http.get('/users/profile');
  },
};
