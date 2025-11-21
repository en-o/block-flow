import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { authUtils } from '../utils/auth';
import { getGlobalMessage } from '../utils/messageInstance';

// API基础URL
// 开发环境：使用 /api 前缀，通过 Vite proxy 代理到后端
// 生产环境（merged模式）：VITE_API_BASE_URL 为空时直接请求后端路径
const BASE_URL = import.meta.env.MODE === 'development'
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL ?? '');

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
    const message = getGlobalMessage();
    message?.error('请求发送失败');
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

    console.log('=== 响应拦截器执行 ===');
    // console.log('Response data:', data);
    // console.log('data.code:', data.code);
    // console.log('data.message:', data.message);

    if (data.code !== undefined) {
      // 检查业务状态码
      if (data.code === 200) {
        console.log('✅ 业务成功，返回数据');
        // 请求成功，返回完整的响应对象
        return data;
      } else {
        // 业务错误，根据错误码进行不同处理
        const errorMsg = data.message || data.msg || '操作失败';
        const message = getGlobalMessage();

        // 处理后端定义的业务异常码
        switch (data.code) {
          case 401:
            // TOKEN_ERROR / REDIS_EXPIRED_USER / REDIS_NO_USER
            // token校验失败、Redis登录失效、非法登录
            console.log('处理401错误 - Token失效');
            console.log('调用 message?.error');
            message?.error(errorMsg || '登录失效，请重新登录');
            authUtils.clearAuth();
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
            break;

          case 402:
            // SYS_AUTHORIZED_PAST - 授权过期
            console.log('处理402错误 - 授权过期');
            message?.error(errorMsg || '授权过期，请重新登录');
            authUtils.clearAuth();
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
            break;

          case 403:
            // UNAUTHENTICATED / UNAUTHENTICATED_PLATFORM
            // 系统未授权、非法令牌访问未授权系统
            console.log('处理403错误 - 系统未授权');
            message?.error(errorMsg || '系统未授权，禁止访问');
            break;

          case 405:
            // USER_EXIST_ERROR / USER_PASSWORD_ERROR
            // 账户或密码错误（登录时）
            console.log('处理405错误 - 账户密码错误');
            console.log('即将调用 message?.error，参数:', errorMsg);

            if (message) {
              console.log('message 实例存在，调用 error 方法');
              const result = message.error(errorMsg || '账户或者密码错误，请检查后重试');
              console.log('message.error 返回值:', result);
            } else {
              console.error('❌ message 实例不存在！');
              alert('[错误] message 实例未初始化！');
            }
            break;

          default:
            // 其他业务错误
            console.log('处理其他错误 - code:', data.code);
            message?.error(errorMsg);
        }

        console.log('返回 Promise.reject');
        const error = new Error(errorMsg);
        (error as any).code = data.code;
        (error as any).response = data;
        return Promise.reject(error);
      }
    }

    // 如果没有code字段，直接返回data（兼容其他格式）
    console.log('⚠️ 没有code字段，直接返回数据');
    return data;
  },
  (error: AxiosError) => {
    // 处理HTTP错误
    console.error('Response error:', error);
    const message = getGlobalMessage();

    if (error.response) {
      const { status, data } = error.response;
      let errorMsg = '请求失败';

      // 尝试从响应中提取错误信息
      if (data && typeof data === 'object') {
        errorMsg = (data as any).message || (data as any).msg || (data as any).error || errorMsg;
      }

      switch (status) {
        case 400:
          message?.error(errorMsg || '请求参数错误');
          break;
        case 401:
          message?.error('未授权，请重新登录');
          authUtils.clearAuth();
          // 延迟跳转，确保提示显示
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          break;
        case 403:
          message?.error('拒绝访问，权限不足');
          break;
        case 404:
          message?.error('请求的资源不存在');
          break;
        case 500:
          message?.error(errorMsg || '服务器内部错误');
          break;
        case 502:
          message?.error('网关错误');
          break;
        case 503:
          message?.error('服务暂时不可用');
          break;
        case 504:
          message?.error('网关超时');
          break;
        default:
          message?.error(errorMsg);
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message?.error('网络错误，请检查网络连接');
    } else {
      // 请求配置出错
      message?.error(error.message || '请求配置错误');
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
