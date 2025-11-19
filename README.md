# Block Flow
Block Flow 是一个基于 Blockly 的可视化工作流编排系统，允许用户通过拖拽代码块的方式构建和执行自动化工作流。系统内置 Python 脚本执行引擎，支持自定义代码块、环境变量管理、多环境配置等功能。

# 待办
- [ ] 流程添加共享字段，如果同意共享在加载流程的时候就可以查询，但是不允许更新非自己的流程，非自己的保存就是copy一份存储为自己的


# python 环境

### 1. 创建并初始化Python环境
1.  访问 /manage/python-envs
2. 点击"新建Python环境"
3. 填写：
    - 环境名称：例如"数据处理环境"
    - Python版本：例如"3.9"
    - Python解释器路径：例如"C:\Python39\python.exe"
    - 描述：可选
4. 点击确定创建环境
5. 在列表中找到新建的环境，点击"初始化"按钮
6. 系统自动创建：
   python-envs/
   └── {环境ID}/
   ├── lib/site-packages/
   └── packages/
### 2. 上传和安装离线包
1. 点击环境的"离线包"按钮
2. 在弹出窗口中点击"选择文件上传"
3. 选择.whl或.tar.gz文件（例如：requests-2.28.0.whl）
4. 等待上传完成
5. 在"已上传包文件"列表中找到上传的包
6. 点击"安装"按钮
7. 等待安装完成（会自动刷新环境信息）



# block
### 1. 创建
1. 访问 /manage/blocks
2. 创建新Block
3. 脚本内容示例：
   ```python
   import requests  # 使用环境中安装的包
   
   def execute(context, inputs):
       response = requests.get('https://api.example.com')
       return {"status": "success", "data": response.text}
   ```
4. 选择Python环境ID（关联到刚创建的环境）
5. 保存Block

### 2. 测试Block执行
1. 使用PythonScriptExecutor执行Block
2. 系统自动：
   - 根据pythonEnvId加载环境配置
   - 设置PYTHONPATH指向环境的site-packages
   - 使用指定的Python解释器执行脚本
3. 验证依赖包能够正常导入和使用
