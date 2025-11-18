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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
