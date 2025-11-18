import React from 'react';
import { Navigate } from 'react-router-dom';
import { authUtils, UserRole } from '../utils/auth';

interface RoleRouteProps {
  children: React.ReactNode;
  /** 允许访问的角色列表 */
  allowedRoles?: UserRole[];
  /** 无权限时重定向的路径，默认为 /flow */
  redirectTo?: string;
}

/**
 * 角色权限路由组件
 * 用于限制特定角色才能访问的路由
 */
const RoleRoute: React.FC<RoleRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/flow'
}) => {
  // 检查是否已登录
  const isAuthenticated = authUtils.isAuthenticated();

  // 未登录则重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果没有指定允许的角色，则只需要登录即可访问
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // 检查用户角色是否在允许的角色列表中
  const hasPermission = authUtils.hasRole(allowedRoles);

  // 无权限则重定向
  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;
