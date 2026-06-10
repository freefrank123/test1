# 济小震 - 部署指南

## 已修复的问题

1. ✅ **修复了 `user.js` 中的硬编码 localhost 问题** - 现在使用相对路径 `/api`
2. ✅ **统一了 API 配置** - 所有 API 调用现在都使用相对路径

## 服务器部署步骤

### 1. 环境准备

确保服务器已安装：
- Node.js 16+
- npm 或 yarn

### 2. 上传项目到服务器

将整个项目文件夹上传到服务器（例如：`/var/www/jxz`）

### 3. 后端配置

```bash
cd /var/www/jxz/backend
npm install
```

### 4. 环境变量配置

确保 `backend/.env` 文件中的配置正确：

```env
# 服务器配置
PORT=5000

# Supabase 配置（保持不变）
SUPABASE_URL=https://ooqhfpbiqrkxfrvdckik.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcWhmcGJpcXJreGZydmRja2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM2ODY5NCwiZXhwIjoyMDk0OTQ0Njk0fQ.kP9UmO9NxwZBIOJ1cmEi0K-4ilmHoIVsbMU4v9P_-Uc

# AI API配置（如果需要）
AI_API_KEY=7554a6cf-11a3-4c57-bf86-373267397c66
AI_API_URL=https://ark.cn-beijing.volces.com/api/v3/responses
AI_MODEL=doubao-seed-2-0-mini-260215
```

### 5. 启动后端服务

#### 方式一：直接启动（开发/测试）
```bash
npm start
```

#### 方式二：使用 PM2（生产环境推荐）
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start src/app.js --name jxz-backend

# 查看状态
pm2 status

# 查看日志
pm2 logs jxz-backend
```

### 6. Nginx 配置（推荐）

创建 Nginx 配置文件 `/etc/nginx/sites-available/jxz`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或服务器IP

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 可选：配置 HTTPS（使用 Let's Encrypt）
    # listen 443 ssl;
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/jxz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. 防火墙配置

确保防火墙允许相应端口：

```bash
# 如果使用 ufw
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # 仅在不使用 Nginx 时需要

# 如果使用 firewalld
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## 访问网站

部署完成后，通过以下方式访问：
- 使用 Nginx：`http://your-domain.com`
- 直接访问后端：`http://your-server-ip:5000`

## 常见问题排查

### 1. 502 Bad Gateway
- 检查后端服务是否正常运行：`pm2 status`
- 检查端口 5000 是否被占用：`netstat -tlnp | grep 5000`
- 查看后端日志：`pm2 logs jxz-backend`

### 2. API 请求失败
- 确保浏览器控制台没有 CORS 错误
- 检查 Nginx 配置中的 proxy_pass 是否正确
- 验证 `user.js` 中的 API 基础路径是否为 `/api`

### 3. 第三方 API (api.ceic.ac.cn) 无法访问
- 这是中国地震台网的 API，可能在服务器网络环境中无法访问
- 项目已有备用方案，会使用 mock 数据替代

### 4. Supabase 连接问题
- 确保服务器可以访问 supabase.co
- 检查 `.env` 中的 Supabase 配置是否正确

## 项目结构说明

```
jxz/
├── backend/          # 后端服务
│   ├── src/
│   │   ├── app.js   # 主入口文件
│   │   ├── routes/  # API 路由
│   │   └── ...
│   └── package.json
└── frontend/        # 前端文件
    ├── public/      # HTML 页面
    └── assets/      # CSS, JS, 图片等
```

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML/CSS/JS
- **数据库**: Supabase (PostgreSQL)
- **AI服务**: 火山引擎 (可选)
- **反向代理**: Nginx (推荐)