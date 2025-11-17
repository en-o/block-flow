// API响应基础类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页请求参数
export interface PageRequest {
  pageNo?: number;
  pageSize?: number;
}

// 分页响应
export interface PageResponse<T> {
  records: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

// 登录请求
export interface LoginRequest {
  loginName: string;
  loginPassword: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

// 用户信息
export interface UserInfo {
  id: number;
  username: string;
  email?: string;
  realName?: string;
  role: string;
}

// 块类型
export interface BlockType {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  createTime: string;
  updateTime: string;
}

// 块
export interface Block {
  id: number;
  name: string;
  typeCode: string;
  blockTypeId: number;
  description?: string;
  color: string;
  icon?: string;
  script: string;
  pythonEnvId?: number;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  category?: string;
  isPublic: boolean;
  authorId?: number;
  usageCount: number;
  version: string;
  createTime: string;
  updateTime: string;
}

// 上下文变量
export interface ContextVariable {
  id: number;
  varKey: string;
  varValue: string;
  varType: 'text' | 'secret' | 'json' | 'file';
  groupName?: string;
  description?: string;
  isEncrypted: boolean;
  environment: string;
  createTime: string;
  updateTime: string;
}

// Python 环境
export interface PythonEnvironment {
  id: number;
  name: string;
  pythonVersion: string;
  description?: string;
  packages?: Array<{ name: string; version: string }>;
  isDefault: boolean;
  createTime: string;
  updateTime: string;
}

// 流程
export interface Workflow {
  id: number;
  name: string;
  description?: string;
  blocklyXml: string;
  blocklyJson?: any;
  authorId?: number;
  isTemplate: boolean;
  category?: string;
  tags?: string[];
  version: string;
  isActive: boolean;
  createTime: string;
  updateTime: string;
}

// 执行记录
export interface ExecutionLog {
  id: number;
  workflowId: number;
  workflowName: string;
  executorId?: number;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  triggerType: 'manual' | 'schedule' | 'webhook' | 'api';
  logs?: string;
  errorMessage?: string;
  inputParams?: any;
  outputResult?: any;
  startTime: string;
  endTime?: string;
  duration?: number;
}
