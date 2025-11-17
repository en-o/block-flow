const TOKEN_KEY = 'block-flow-token';
const USER_INFO_KEY = 'block-flow-user';

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
  }
};
