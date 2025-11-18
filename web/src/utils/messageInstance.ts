/**
 * 全局 Message 实例
 * 用于在 axios 拦截器等非组件环境中使用 Ant Design 的 message
 */
import type { MessageInstance } from 'antd/es/message/interface';

// 全局 message 实例
let globalMessage: MessageInstance | null = null;

/**
 * 设置全局 message 实例
 * 在 App 组件中调用
 */
export const setGlobalMessage = (messageInstance: MessageInstance) => {
  globalMessage = messageInstance;
  console.log('[MessageInstance] 全局 message 实例已设置:', messageInstance);
};

/**
 * 获取全局 message 实例
 * 在 axios 拦截器中使用
 */
export const getGlobalMessage = (): MessageInstance | null => {
  if (!globalMessage) {
    console.warn('[MessageInstance] 警告：全局 message 实例未初始化');
  }
  return globalMessage;
};
