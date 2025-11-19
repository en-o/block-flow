import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { message } from 'antd'
import './index.css'
import App from './App.tsx'

// 配置全局 message
message.config({
  top: 80,
  duration: 3,
  maxCount: 3,
});

// 抑制 antd React 19 兼容性警告
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('[antd: compatible]')
  ) {
    return;
  }
  originalError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
