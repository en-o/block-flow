const TOKEN_KEY = 'block-flow-token';
const USER_INFO_KEY = 'block-flow-user';

/**
 * 用户角色枚举
 * 与后端 cn.tannn.cat.block.enums.UserRole 保持一致
 */
export const UserRole = {
  /** 管理员 - 可以完成所有操作 */
  ADMIN: 'ADMIN' as const,
  /** 普通用户 - 不能管理用户 */
  USER: 'USER' as const,
  /** 访客 - 只能访问 /flow 页面 */
  VIEWER: 'VIEWER' as const
};

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const authUtils = {
  // 获取token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // 设置token
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // 移除token
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  // 获取用户信息
  getUserInfo(): any {
    const userStr = localStorage.getItem(USER_INFO_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // 设置用户信息
  setUserInfo(userInfo: any): void {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  },

  // 移除用户信息
  removeUserInfo(): void {
    localStorage.removeItem(USER_INFO_KEY);
  },

  // 清除所有认证信息
  clearAuth(): void {
    this.removeToken();
    this.removeUserInfo();
  },

  // 检查是否已登录
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // 获取当前用户角色
  getUserRole(): UserRole | null {
    const userInfo = this.getUserInfo();
    return userInfo?.role || null;
  },

  // 检查是否是管理员
  isAdmin(): boolean {
    return this.getUserRole() === UserRole.ADMIN;
  },

  // 检查是否是普通用户
  isUser(): boolean {
    return this.getUserRole() === UserRole.USER;
  },

  // 检查是否是访客
  isViewer(): boolean {
    return this.getUserRole() === UserRole.VIEWER;
  },

  // 检查是否有权限访问指定角色的资源
  hasRole(roles: UserRole[]): boolean {
    const currentRole = this.getUserRole();
    if (!currentRole) return false;
    return roles.includes(currentRole);
  },

  // 检查是否可以访问用户管理页面
  canAccessUserManagement(): boolean {
    const role = this.getUserRole();
    // 只有 ADMIN 可以访问用户管理
    return role === UserRole.ADMIN;
  },

  // 检查是否可以访问管理后台（除用户管理外）
  canAccessManagement(): boolean {
    const role = this.getUserRole();
    // ADMIN 和 USER 可以访问管理后台
    return role === UserRole.ADMIN || role === UserRole.USER;
  }
};
