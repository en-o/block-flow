import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { message } from 'antd';
import { authUtils } from '../utils/auth';

// API基础URL
// 开发环境：使用相对路径，通过 Vite proxy 代理到后端
// 生产环境：使用环境变量配置的完整URL
const BASE_URL = import.meta.env.MODE === 'development'
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || '/api');

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加token到请求头
    const token = authUtils.getToken();
    if (token) {
      config.headers.token = token;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    message.error('请求发送失败');
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;

    // 后端使用 jdevelops 框架的 ResultVO 结构
    // 成功的响应格式：{ code: 200, message: "success", data: {...} }
    // 失败的响应格式：{ code: 非200, message: "错误信息", data: null }

    if (data.code !== undefined) {
      // 检查业务状态码
      if (data.code === 200) {
        // 请求成功，返回完整的响应对象
        return data;
      } else {
        // 业务错误，显示错误信息
        const errorMsg = data.message || data.msg || '操作失败';
        message.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
      }
    }

    // 如果没有code字段，直接返回data（兼容其他格式）
    return data;
  },
  (error: AxiosError) => {
    // 处理HTTP错误
    console.error('Response error:', error);

    if (error.response) {
      const { status, data } = error.response;
      let errorMsg = '请求失败';

      // 尝试从响应中提取错误信息
      if (data && typeof data === 'object') {
        errorMsg = (data as any).message || (data as any).msg || (data as any).error || errorMsg;
      }

      switch (status) {
        case 400:
          message.error(errorMsg || '请求参数错误');
          break;
        case 401:
          message.error('未授权，请重新登录');
          authUtils.clearAuth();
          // 延迟跳转，确保提示显示
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          break;
        case 403:
          message.error('拒绝访问，权限不足');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error(errorMsg || '服务器内部错误');
          break;
        case 502:
          message.error('网关错误');
          break;
        case 503:
          message.error('服务暂时不可用');
          break;
        case 504:
          message.error('网关超时');
          break;
        default:
          message.error(errorMsg);
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message.error('网络错误，请检查网络连接');
    } else {
      // 请求配置出错
      message.error(error.message || '请求配置错误');
    }

    return Promise.reject(error);
  }
);

export default request;

// 封装常用请求方法
export const http = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.get(url, config);
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.post(url, data, config);
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.put(url, data, config);
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.delete(url, config);
  },
};
