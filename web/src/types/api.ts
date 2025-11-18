// API响应基础类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页参数（PagingSorteds）
export interface PagingSorteds {
  pageNum?: number; // 页码，从0开始
  pageSize?: number; // 每页大小
  sorted?: string; // 排序字段
  order?: 'asc' | 'desc'; // 排序方向
}

// 分页响应（JpaPageResult）
export interface JpaPageResult<T> {
  currentPage: number; // 当前页，从1开始
  pageSize: number; // 每页大小
  totalPages: number; // 总页数
  total: number; // 总记录数
  rows: T[]; // 数据列表
}

// 分页响应（ResultPageVO）
export interface ResultPageVO<T> {
  code: number;
  message: string;
  data: JpaPageResult<T>;
}

// 登录请求
export interface LoginRequest {
  loginName: string;
  password: string;
}

// 登录响应（对应后端 LoginVO）
export interface LoginResponse {
  token: string;
  role: 'ADMIN' | 'USER' | 'VIEWER'; // UserRole 枚举
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

// 块类型分页查询参数
export interface BlockTypePage {
  name?: string;
  page?: PagingSorteds;
}

// 块
export interface Block {
  id: number;
  name: string;
  typeCode: string;
  description?: string;
  color: string;
  icon?: string;
  definitionMode?: 'BLOCKLY' | 'CODE';
  blocklyDefinition?: string;
  script: string;
  pythonEnvId?: number;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  tags?: string[]; // 标签列表
  isPublic: boolean;
  authorUsername?: string; // 作者用户名
  usageCount?: number;
  version?: string;
  createTime: string;
  updateTime: string;
}

// 块创建DTO
export interface BlockCreateDTO {
  name: string;
  typeCode: string;
  description?: string;
  color?: string;
  icon?: string;
  definitionMode?: 'BLOCKLY' | 'CODE';
  blocklyDefinition?: string;
  script: string;
  pythonEnvId?: number;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  tags?: string[];
  isPublic?: boolean;
  authorUsername?: string;
  version?: string;
}

// 块更新DTO
export interface BlockUpdateDTO {
  id: number;
  name?: string;
  typeCode?: string;
  description?: string;
  color?: string;
  icon?: string;
  definitionMode?: 'BLOCKLY' | 'CODE';
  blocklyDefinition?: string;
  script?: string;
  pythonEnvId?: number;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  tags?: string[];
  isPublic?: boolean;
  version?: string;
}

// 块分页查询参数
export interface BlockPage {
  name?: string; // 块名称（LIKE查询）
  typeCode?: string; // 类型代码（EQ查询）
  pythonEnvId?: number; // Python环境ID（EQ查询）
  isPublic?: boolean; // 是否公开（EQ查询）
  tag?: string; // 标签查询（模糊匹配）
  page?: PagingSorteds; // 分页排序
}

// 块测试DTO
export interface BlockTestDTO {
  inputs: Record<string, any>;
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
