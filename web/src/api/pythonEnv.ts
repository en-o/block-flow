import { http } from './request';
import type {
  ApiResponse,
  ResultPageVO,
  PythonEnvironment,
  PythonEnvironmentPage,
  PythonEnvironmentCreateDTO,
  PythonEnvironmentUpdateDTO,
  PythonRuntimeUploadResultDTO
} from '../types/api';

export const pythonEnvApi = {
  // 创建Python环境
  // POST /python-envs
  create(data: PythonEnvironmentCreateDTO): Promise<ApiResponse<PythonEnvironment>> {
    return http.post('/python-envs', data);
  },

  // 更新Python环境
  // PUT /python-envs
  update(data: PythonEnvironmentUpdateDTO): Promise<ApiResponse<PythonEnvironment>> {
    return http.put('/python-envs', data);
  },

  // 删除Python环境
  // DELETE /python-envs/{id}
  delete(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/python-envs/${id}`);
  },

  // 获取Python环境详情
  // GET /python-envs/{id}
  getById(id: number): Promise<ApiResponse<PythonEnvironment>> {
    return http.get(`/python-envs/${id}`);
  },

  // 根据名称获取Python环境
  // GET /python-envs/name/{name}
  getByName(name: string): Promise<ApiResponse<PythonEnvironment>> {
    return http.get(`/python-envs/name/${name}`);
  },

  // 获取所有Python环境列表
  // GET /python-envs/list
  listAll(): Promise<ApiResponse<PythonEnvironment[]>> {
    return http.get('/python-envs/list');
  },

  // 分页查询Python环境
  // POST /python-envs/page
  page(params: PythonEnvironmentPage): Promise<ResultPageVO<PythonEnvironment>> {
    return http.post('/python-envs/page', params);
  },

  // 搜索Python环境
  // GET /python-envs/search?keyword={keyword}
  search(keyword: string): Promise<ApiResponse<PythonEnvironment[]>> {
    return http.get('/python-envs/search', { params: { keyword } });
  },

  // 获取默认Python环境
  // GET /python-envs/default
  getDefault(): Promise<ApiResponse<PythonEnvironment>> {
    return http.get('/python-envs/default');
  },

  // 设置默认Python环境
  // PUT /python-envs/{id}/set-default
  setAsDefault(id: number): Promise<ApiResponse<PythonEnvironment>> {
    return http.put(`/python-envs/${id}/set-default`);
  },

  // 安装包
  // POST /python-envs/{id}/packages
  installPackage(id: number, data: { packageName: string; version?: string }): Promise<ApiResponse<PythonEnvironment>> {
    return http.post(`/python-envs/${id}/packages`, data);
  },

  // 卸载包
  // DELETE /python-envs/{id}/packages/{packageName}
  uninstallPackage(id: number, packageName: string): Promise<ApiResponse<PythonEnvironment>> {
    return http.delete(`/python-envs/${id}/packages/${packageName}`);
  },

  // 导出依赖
  // GET /python-envs/{id}/requirements/export
  exportRequirements(id: number): Promise<ApiResponse<string>> {
    return http.get(`/python-envs/${id}/requirements/export`);
  },

  // 导入依赖
  // POST /python-envs/{id}/requirements/import
  importRequirements(id: number, requirementsText: string): Promise<ApiResponse<PythonEnvironment>> {
    return http.post(`/python-envs/${id}/requirements/import`, requirementsText, {
      headers: { 'Content-Type': 'text/plain' }
    });
  },

  // 初始化环境
  // POST /python-envs/{id}/initialize
  initializeEnvironment(id: number): Promise<ApiResponse<PythonEnvironment>> {
    return http.post(`/python-envs/${id}/initialize`);
  },

  // 上传离线包
  // POST /python-envs/{id}/packages/upload
  uploadPackageFile(id: number, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`/python-envs/${id}/packages/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // 安装已上传的包
  // POST /python-envs/{id}/packages/install/{fileName}
  installPackageFile(id: number, fileName: string): Promise<ApiResponse<PythonEnvironment>> {
    return http.post(`/python-envs/${id}/packages/install/${encodeURIComponent(fileName)}`);
  },

  // 获取已上传包列表
  // GET /python-envs/{id}/packages/files
  listUploadedPackageFiles(id: number): Promise<ApiResponse<any[]>> {
    return http.get(`/python-envs/${id}/packages/files`);
  },

  // 删除包文件
  // DELETE /python-envs/{id}/packages/files/{fileName}
  deletePackageFile(id: number, fileName: string): Promise<ApiResponse<void>> {
    return http.delete(`/python-envs/${id}/packages/files/${encodeURIComponent(fileName)}`);
  },

  // 上传Python运行时环境
  // POST /python-envs/{id}/runtime/upload
  uploadPythonRuntime(id: number, file: File): Promise<ApiResponse<PythonRuntimeUploadResultDTO>> {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`/python-envs/${id}/runtime/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // 自动检测Python可执行文件路径
  // POST /python-envs/{id}/detect-python
  detectPythonExecutable(id: number): Promise<ApiResponse<PythonEnvironment>> {
    return http.post(`/python-envs/${id}/detect-python`);
  },
};
