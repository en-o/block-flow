# 环境
node 20.19.2以上
> node v20.19.2

## run
```shell
npm install
npm run dev
```



## 部署指南

### 方式一：合并部署（推荐）

将前端构建到后端静态资源目录，与 Java 后端一起部署：

```bash
# 1. 构建前端
npm run build:merged

# 2. 前端文件会自动输出到 ../api/src/main/resources/static

# 3. 构建后端 JAR（会包含前端静态文件）
cd ../api
mvn clean package

# 4. 运行应用
cd target/output
java -jar block-flow-0.0.1-SNAPSHOT.jar

# 访问: http://localhost:1249
```

### 方式二：Nginx 独立部署

构建独立的前端静态文件，部署到 Nginx：

```bash
# 1. 修改 .env.standalone 配置后端 API 地址
# VITE_API_BASE_URL=http://your-backend-api.com/api

# 2. 构建
npm run build:standalone

# 3. 将 dist 目录内容复制到 Nginx 静态目录
cp -r dist/* /usr/share/nginx/html/

# 4. Nginx 配置示例
```

Nginx 配置文件 (`/etc/nginx/conf.d/oasis.conf`):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /usr/share/nginx/html;
    index index.html;

    # 单页应用路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（可选，如果后端跨域）
    location /api {
        proxy_pass http://your-backend:1249;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```
