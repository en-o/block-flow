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

// Spring Data Page 结构（用于 ContextVariable）
export interface SpringPage<T> {
  content: T[]; // 数据列表
  pageable: {
    pageNumber: number; // 当前页码，从0开始
    pageSize: number; // 每页大小
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number; // 总页数
  totalElements: number; // 总记录数
  last: boolean; // 是否最后一页
  size: number; // 每页大小
  number: number; // 当前页码，从0开始
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  numberOfElements: number; // 当前页的记录数
  first: boolean; // 是否第一页
  empty: boolean; // 是否为空
}

// ===================
// 登录相关
// ===================

// 登录请求（对应后端 LoginPassword）
export interface LoginRequest {
  loginName: string;
  password: string;
}

// 登录响应（对应后端 LoginVO）
export interface LoginResponse {
  token: string;
  role: 'ADMIN' | 'USER' | 'VIEWER'; // UserRole 枚举
}

// ===================
// 用户相关（User Entity）
// ===================

export interface User {
  id: number;
  username: string;
  email?: string;
  realName?: string;
  role: 'ADMIN' | 'USER' | 'VIEWER'; // UserRole 枚举
  isActive: boolean;
  lastLoginTime?: string;
  createTime: string;
  updateTime: string;
}

// 用户分页查询参数
export interface UserPage {
  username?: string;
  role?: 'ADMIN' | 'USER' | 'VIEWER';
  isActive?: boolean;
  page?: PagingSorteds;
}

// 用户创建DTO（对应后端 AccountRegisterAdmin）
export interface UserCreateDTO {
  username: string; // 必填
  password: string; // 必填
  email?: string;
  realName: string; // 必填
  userRole: 'ADMIN' | 'USER' | 'VIEWER'; // 必填，对应后端的 userRole 字段
}

// 用户更新DTO
export interface UserUpdateDTO {
  id: number; // 必填
  username?: string;
  email?: string;
  realName?: string;
  role?: 'ADMIN' | 'USER' | 'VIEWER';
  isActive?: boolean;
}

// 修改密码DTO
export interface ChangePasswordDTO {
  oldPassword: string; // 必填
  newPassword: string; // 必填
}

// 更新个人信息DTO
export interface UpdateProfileDTO {
  email?: string;
  realName?: string;
}

// ===================
// 块类型相关（BlockType Entity）
// ===================

export interface BlockType {
  id: number;
  code: string;
  name: string;
  sortOrder: number; // 排序，升序
  createTime: string;
  updateTime: string;
}

// 块类型分页查询参数
export interface BlockTypePage {
  name?: string;
  page?: PagingSorteds;
}

// 块类型创建DTO
export interface BlockTypeCreateDTO {
  code: string; // 必填
  name: string; // 必填
  sortOrder?: number;
}

// 块类型更新DTO
export interface BlockTypeUpdateDTO {
  id: number; // 必填
  code?: string;
  name?: string;
  sortOrder?: number;
}

// ===================
// 块相关（Block Entity）
// ===================

export interface Block {
  id: number;
  name: string;
  typeCode: string;
  description?: string;
  color: string;
  icon?: string;
  definitionMode?: 'BLOCKLY' | 'CODE'; // DefinitionMode 枚举
  blocklyDefinition?: string;
  script: string;
  pythonEnvId?: number;
  inputs?: Record<string, any>; // JSONObject
  outputs?: Record<string, any>; // JSONObject
  tags?: string[]; // 标签列表
  isPublic: boolean;
  authorUsername?: string; // 作者用户名
  version?: string;
  createTime: string;
  updateTime: string;
}

// 块创建DTO（对应后端 BlockCreateDTO）
export interface BlockCreateDTO {
  name: string; // 必填
  typeCode: string; // 必填
  description?: string;
  color?: string;
  icon?: string;
  definitionMode?: 'BLOCKLY' | 'CODE';
  blocklyDefinition?: string;
  script: string; // 必填
  pythonEnvId?: number;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  tags?: string[];
  isPublic?: boolean;
  authorUsername?: string;
  version?: string;
}

// 块更新DTO（对应后端 BlockUpdateDTO）
export interface BlockUpdateDTO {
  id: number; // 必填
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
  // 注意：更新时不允许修改 authorUsername
}

// 块分页查询参数（对应后端 BlockPage）
export interface BlockPage {
  name?: string; // 块名称（LIKE查询）
  typeCode?: string; // 类型代码（EQ查询）
  pythonEnvId?: number; // Python环境ID（EQ查询）
  isPublic?: boolean; // 是否公开（EQ查询）
  tag?: string; // 标签查询（模糊匹配）
  page?: PagingSorteds; // 分页排序
}

// 块测试DTO（对应后端 BlockTestDTO）
export interface BlockTestDTO {
  inputs: Record<string, any>;
}

// ===================
// 上下文变量相关（ContextVariable Entity）
// ===================

export interface ContextVariable {
  id: number;
  varKey: string;
  varValue: string;
  varType: 'TEXT' | 'SECRET' | 'JSON' | 'NUMBER' | 'FILE'; // VarType 枚举
  groupName?: string;
  description?: string;
  isEncrypted: boolean;
  environment: 'DEFAULT' | 'DEV' | 'TEST' | 'PROD'; // Environment 枚举
  createTime: string;
  updateTime: string;
}

// 上下文变量分页查询参数
export interface ContextVariablePage {
  varKey?: string;
  groupName?: string;
  environment?: 'DEFAULT' | 'DEV' | 'TEST' | 'PROD';
  page?: PagingSorteds;
}

// 上下文变量创建DTO
export interface ContextVariableCreateDTO {
  varKey: string; // 必填
  varValue: string; // 必填
  varType?: 'TEXT' | 'SECRET' | 'JSON' | 'NUMBER' | 'FILE';
  groupName?: string;
  description?: string;
  isEncrypted?: boolean;
  environment?: 'DEFAULT' | 'DEV' | 'TEST' | 'PROD';
}

// 上下文变量更新DTO
export interface ContextVariableUpdateDTO {
  id: number; // 必填
  varKey?: string;
  varValue?: string;
  varType?: 'TEXT' | 'SECRET' | 'JSON' | 'NUMBER' | 'FILE';
  groupName?: string;
  description?: string;
  isEncrypted?: boolean;
  environment?: 'DEFAULT' | 'DEV' | 'TEST' | 'PROD';
}

// ===================
// Python环境相关（PythonEnvironment Entity）
// ===================

export interface PythonEnvironment {
  id: number;
  name: string;
  pythonVersion: string;
  description?: string;
  packages?: Record<string, any>; // JSONObject（已安装包列表）
  isDefault: boolean;
  createTime: string;
  updateTime: string;
}

// Python环境分页查询参数
export interface PythonEnvironmentPage {
  name?: string;
  pythonVersion?: string;
  page?: PagingSorteds;
}

// Python环境创建DTO
export interface PythonEnvironmentCreateDTO {
  name: string; // 必填
  pythonVersion: string; // 必填
  description?: string;
  packages?: Record<string, any>;
  isDefault?: boolean;
}

// Python环境更新DTO
export interface PythonEnvironmentUpdateDTO {
  id: number; // 必填
  name?: string;
  pythonVersion?: string;
  description?: string;
  packages?: Record<string, any>;
  isDefault?: boolean;
}

// ===================
// 流程相关（Workflow Entity）
// ===================

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  flowDefinition: Record<string, any>; // JSONObject（xyflow流程JSON定义：nodes+edges）
  authorUsername?: string; // 创建者登录名
  isTemplate: boolean;
  category?: string; // 流程分类
  tags?: string; // JSON字段，类型为String
  version: string;
  isActive: boolean;
  createTime: string;
  updateTime: string;
}

// 流程分页查询参数
export interface WorkflowPage {
  name?: string;
  category?: string;
  isTemplate?: boolean;
  isActive?: boolean;
  page?: PagingSorteds;
}

// 流程创建DTO
export interface WorkflowCreateDTO {
  name: string; // 必填
  description?: string;
  flowDefinition: Record<string, any>; // 必填
  authorUsername?: string;
  isTemplate?: boolean;
  category?: string;
  tags?: string;
  version?: string;
  isActive?: boolean;
}

// 流程更新DTO
export interface WorkflowUpdateDTO {
  id: number; // 必填
  name?: string;
  description?: string;
  flowDefinition?: Record<string, any>;
  isTemplate?: boolean;
  category?: string;
  tags?: string;
  version?: string;
  isActive?: boolean;
}

// 流程执行DTO
export interface WorkflowExecuteDTO {
  inputParams?: Record<string, any>;
}

// ===================
// 执行记录相关（ExecutionLog Entity）
// ===================

export interface ExecutionLog {
  id: number; // Long类型，但TypeScript统一用number
  workflowId: number;
  workflowName: string;
  executorUsername?: string; // 执行者登录名
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'; // ExecutionStatus 枚举
  triggerType: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'API'; // TriggerType 枚举
  logs?: string;
  errorMessage?: string;
  inputParams?: Record<string, any>; // JSONObject
  outputResult?: Record<string, any>; // JSONObject
  startTime: string;
  endTime?: string;
  duration?: number; // 执行时长（秒）
}

// 执行记录分页查询参数
export interface ExecutionLogPage {
  workflowId?: number;
  status?: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  triggerType?: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'API';
  page?: PagingSorteds;
}
