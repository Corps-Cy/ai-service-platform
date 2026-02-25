# 生产环境部署指南

## 快速部署

### 步骤1：克隆代码

```bash
git clone https://github.com/Corps-Cy/ai-service-platform.git
cd ai-service-platform
```

### 步骤2：创建必要目录

```bash
mkdir -p data uploads logs
```

### 步骤3：启动Docker服务

```bash
# 拉取镜像
docker-compose -f docker-compose.prod.yml pull

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看状态
docker-compose -f docker-compose.prod.yml ps
```

### 步骤4：配置Nginx（重要！）

**这一步是必须的**，否则前端无法访问后端API。

```bash
# 复制Nginx配置
sudo cp nginx.conf.example /etc/nginx/sites-available/ai-platform

# 编辑配置，修改域名
sudo nano /etc/nginx/sites-available/ai-platform
# 将 your-domain.com 改为你的域名或服务器IP

# 启用配置
sudo ln -s /etc/nginx/sites-available/ai-platform /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

### 步骤5：访问网站

打开浏览器访问 `http://your-domain.com`

---

## 架构说明

```
用户请求
    │
    ▼
┌─────────────┐
│    Nginx    │  (80/443)
│  反向代理   │
└─────────────┘
    │
    ├── /api/* ──────────────────► 后端服务 (容器:3001)
    │
    └── /* ─────────────────────► 前端服务 (容器:80)
```

### 关键点

1. **前端** 默认使用相对路径 `/api`
2. **Nginx** 将 `/api` 请求代理到后端容器
3. **后端** 运行在容器内的 3001 端口

---

## Nginx配置详解

### 最简配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # API请求转发到后端
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 其他请求转发到前端
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
    }
}
```

### 完整配置

参见 `nginx.conf.example` 文件，包含：
- API代理配置
- 静态资源缓存
- WebSocket支持
- 上传文件处理
- HTTPS/SSL配置

---

## 常见问题

### 1. 前端无法访问API

**症状**：注册/登录时网络错误

**原因**：Nginx未正确配置

**解决**：
```bash
# 检查Nginx配置
sudo nginx -t

# 确认后端服务运行
docker-compose -f docker-compose.prod.yml ps

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

### 2. API返回404

**原因**：location配置顺序问题

**解决**：确保 `/api` 在 `/` 之前配置
```nginx
location /api {  # 必须在前
    proxy_pass http://127.0.0.1:3001;
}

location / {  # 必须在后
    proxy_pass http://127.0.0.1:80;
}
```

### 3. 文件上传失败

**原因**：Nginx默认限制1MB

**解决**：
```nginx
server {
    client_max_body_size 50M;  # 添加在server块中
}
```

### 4. 跨域问题

**解决**：确保Nginx正确传递请求头
```nginx
location /api {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 端口说明

| 服务 | 容器端口 | 宿主机端口 | 说明 |
|------|---------|-----------|------|
| 前端 | 80 | 80 | Nginx代理 |
| 后端 | 3001 | 3001 | Nginx代理 |
| Redis | 6379 | 6379 | 仅内部访问 |

---

## SSL证书配置

### 使用Let's Encrypt

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书（自动配置Nginx）
sudo certbot --nginx -d your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

### 手动配置SSL

1. 获取SSL证书
2. 修改Nginx配置：
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # ... 其他配置
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 服务管理命令

```bash
# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 更新服务
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 停止服务
docker-compose -f docker-compose.prod.yml down
```

---

## 检查清单

部署前确认：

- [ ] Docker和Docker Compose已安装
- [ ] 目录已创建 (data, uploads, logs)
- [ ] Docker服务已启动
- [ ] Nginx已配置
- [ ] 域名DNS已解析到服务器
- [ ] 防火墙已开放80/443端口
- [ ] SSL证书已配置（生产环境）

---

## 技术支持

- GitHub: https://github.com/Corps-Cy/ai-service-platform
- Issues: https://github.com/Corps-Cy/ai-service-platform/issues
