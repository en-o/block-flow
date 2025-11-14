#  项目概述  
构建一个基于 `Google Blockly` 的可视化部署编排平台，允许用户通过拖拽自定义块来编排 `Java/React/Vue `项目的部署流程。可结合 AI 辅助生流程替换手动的过程。

1. 完成对teamcity部署的脚本控制，实现通过固定脚本的方式完成原本人工手动在原生ui上的一系列操作，减少记忆和操作成本
2. 完成python脚本的管理和流程化，后期不仅仅用于部署，可以根据脚本库中的数据进行任意的脚本流程化。



# 规划
> + 原本考虑的是sh脚本，但是shell脚本没有python脚本强大，所以改成了python脚本的编排
> + 前端分为 manage和flow 不分项目只分路由，flow不需要鉴权就显示，manage需要登录后才能显示
>

第一阶段：完成基础建设

第二阶段：完成块的执行测试

第三阶段：完成流程测试

第四阶段：完成teamcity相关块的定制

# <font style="color:rgb(38, 38, 38);">核心功能模块  </font>
##  块管理模块  
> 核心功能，用户拖拉拽的组件块，同时也是脚本块
>

核心能力

+ 创建块类型
    - 服务器相关
    - 打包相关
    - 等等
+ 创建自定义块（填写名称、类型、描述、选择颜色<font style="color:rgb(38, 38, 38);">、</font>类型）
+  为块编写执行脚本（支持 Shell/Python）  
    - 一键测试
+  配置块的输入参数（可选，用于传递动态数据，可以上下文变量进行动态获取固定变量）  
+ 编辑已有块
+ 删除不需要的块
+ 块列表查看

数据结构：

```json
块 = {
  名称: "SSH 上传文件",
  类型标识: "ssh_upload",
  描述: "通过 SSH 上传文件到远程服务器",
  颜色: "蓝色",
  执行脚本: "实际执行的代码",
  输入参数: [{参数名, 参数类型, 参数说明}],
  块类型: "服务器"
}
```

##  上下文变量模块  
>  统一管理部署过程中需要的配置信息  
>

核心能力：

+ 添加全局变量（键值对）
+ 删除全局变量
+ 变量列表查看
+ 脚本中通过 `context.变量名` 直接使用

典型变量：

+ 服务器地址、端口
+ SSH/FTP 账号密码
+ Docker 镜像仓库地址
+ 通知 Webhook 地址
+ API Token

## python环境管理模块
核心能力：

+ 添加python环境
+ 为环境添加指定依赖
+ 在编写脚本的时候选择环境同时显示当前可用依赖，不满足的可以来此追加



## 可视化编排模块
> 通过拖拽方式构建部署流程
>

**核心能力**：

+ 集成 Google Blockly 可视化编程界面
+ 从工具箱拖拽自定义块到工作区
+ 块之间连接形成执行顺序
+ 为块填入参数值
+ 清空工作区
+ 导出/导入流程（保存为 JSON/XML）



**交互方式**：  

工具箱（左侧）         工作区（中央）

┌─────────────┐      ┌────────────┐

│ 📦 Maven构建      │  →  │  [Maven构建]      │

│ ⚛️ React构建        │       │      ↓                     │

│ 🐳 Docker打包      │       │  [Docker打包]      │

│ 📤 SSH上传           │       │      ↓                     │

│ 🔔 钉钉通知           │       │  [钉钉通知]           │

└─────────────┘       └────────────┘

## 脚本执行引擎模块
>  将可视化流程转换为实际执行  
>

+ Blockly 生成代码（按块顺序）
+ 遍历每个块，调用对应的脚本
+ 脚本接收上下文变量和输入参数
+ 执行实际的部署操作
+ 返回执行结果（成功/失败）
+ 输出日志到控制台

#  AI 辅助
> 降低使用门槛，快速生成部署流程  
>

1. 用户输入自然语言需求 
2. 系统将可用的自定义块列表发送给 AI 
3. AI 分析需求，选择合适的块组合
4. 自动在工作区生成完整流程



示例

输入：构建 React 项目，打包成 Docker 镜像，部署到 K8s，发送钉钉通知

```json
AI 生成：
1. [React 构建]
2. [Docker 构建]
3. [K8s 部署]
4. [钉钉通知]
```



# 技术架构  
## 前端技术栈
+ **Blockly.js**：可视化编程核心库
+ **React**：管理后台 UI 框架
+ **代码编辑器**：Monaco Editor / CodeMirror

## 后端技术栈
+ **开发语言**：Java
+ **数据库**：MySQL 
+ **框架：** spring boot 3 , spring boot jpa
+ **执行引擎**： 
    - ProcessBuilder/Apache Commons Exec 执行脚本
    - JSch 远程执行脚本
    - Python 脚本

## 项目结构
```latex
BlockFlow
├─api
└─ui
```



## 数据库设计
###  块/脚本表
```sql
CREATE TABLE blocks (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100),          -- 块名称
  type VARCHAR(50) UNIQUE,    -- 块类型标识 #blocks_type#code
  description TEXT,           -- 描述
  color VARCHAR(20),          -- 颜色代码
  script TEXT,                -- 执行脚本
  inputs JSON,                -- 输入参数配置
  create_time TIMESTAMP,
  update_time TIMESTAMP
);
```

### 块类型表
```sql
CREATE TABLE blocks_type (
  id BIGINT PRIMARY KEY,
  code VARCHAR(100),         -- 类型code
  descr VARCHAR(100),        -- 类型备注
  create_time TIMESTAMP,
  update_time TIMESTAMP
);
```

### 上下文变量表
```sql
CREATE TABLE context_vars (
  id BIGINT PRIMARY KEY,
  var_key VARCHAR(100) UNIQUE,  -- 变量名
  var_value TEXT,               -- 变量值（加密）
  create_time TIMESTAMP,
  update_time TIMESTAMP
);
```

### python环境表
```sql

```

### 流程表
```sql
CREATE TABLE workflows (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100),         -- 流程名称
  blockly_xml TEXT,          -- Blockly XML 数据
  create_time TIMESTAMP,
  update_time TIMESTAMP
);
```

### 执行日志表
```sql
CREATE TABLE execution_logs (
  id BIGINT PRIMARY KEY,
  workflow_id BIGINT,        -- 关联流程
  status VARCHAR(20),        -- 成功/失败
  logs TEXT,                 -- 执行日志
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INT               -- 执行时长（秒）
);
```

## 核心 API 设计
### 块管理接口
```http

POST   /api/blocks          - 创建块
GET    /api/blocks          - 获取块列表
GET    /api/blocks/:id      - 获取块详情
PUT    /api/blocks/:id      - 更新块
DELETE /api/blocks/:id      - 删除块
```

### **<font style="color:rgb(38, 38, 38);">块</font>**类型接口
```http
POST   /api/blocks/type          - 创建块类型
DELETE /api/blocks/type/:id      - 删除块类型
GET    /api/blocks/type/:id      - 获取块类型列表
```

### 上下文变量接口
```http
POST   /api/context         - 添加变量
GET    /api/context         - 获取所有变量
DELETE /api/context/:key    - 删除变量
```

### 执行接口
```http
POST   /api/execute         - 执行部署流程
GET    /api/execute/:id/logs - 获取执行日志
```

### AI 生成接口
```http
POST   /api/ai/generate     - AI 生成流程
```



# 问题点
1. 安全限制（防止恶意代码）

# 典型使用场景
场景 1：Java 后端部署

> <font style="color:rgb(80, 161, 79);">Maven 构建 → Docker 镜像 → 推送仓库 → K8s 部署 → 健康检查 → 钉钉通知  </font>
>

场景 2：前端静态资源部署

> <font style="color:rgb(80, 161, 79);">React 构建 → 文件压缩 → SSH 上传 → Nginx 重载 → 邮件通知</font>
>

