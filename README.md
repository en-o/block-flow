# Block Flow
Block Flow 是一个基于 Blockly 的可视化工作流编排系统，允许用户通过拖拽代码块的方式构建和执行自动化工作流。系统内置 Python 脚本执行引擎，支持自定义代码块、环境变量管理、多环境配置等功能。

# 待办


# run
初始化数据 [doc](api/doc), 默认库名：db_block_flow

## 源码运行
1. 运行api项目 ，注意数据库地址和账户密码，库会自己创建不用管
2. 运行web前端 `npm install && npm run dev`

## docker运行
```shell
# -e MYSQL_DB=db_block_flow
# -e MYSQL_URL=192.168.0.162:3306
docker run -d -p 1250:1250 --name block-flow  -e PYTHON_ENV_ROOT_PATH=/app/python-envs -v $(pwd)/python-envs:/app/python-envs -v $(pwd)/logs:/app/logs  tannnn/block-flow:0.0.1
```

# 第一次使用
1. 初始化数据 [doc](api/doc), 默认库名：db_block_flow
2. 进入后台管理创建python环境 (https://www.python.org/ftp/python/3.12.5/)
 - windows 下载: xx-embed-amd64.zip （python-3.12.5-embed-amd64.zip）
 - docker(linux) 下载：xx.tgz （Python-3.12.5.tgz） 上传上去会自动编译
 - linux备用方案：https://github.com/astral-sh/python-build-standalone/releases
 - 安装 pip https://pypi.org/project/pip/#files （openpyxl-3.1.5-py2.py3-none-any.whl）
3. 创建上下文变量（非必须
4. 创建块
5. 进入流程编排测试流程

# 注意
1. 不建议使用h2数据库，体验可以，其他问题不敢保证也不会去修复
2. 数据初始化 [doc](api/doc)
