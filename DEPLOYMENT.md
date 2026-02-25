# 部署指南

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 服务器至少 2GB 内存
- 80 端口和 3001 端口可用
- Git

## GitHub Actions 自动构建

项目已配置GitHub Actions自动构建Docker镜像。当代码推送到`main`或`develop`分支时，会自动：

1. 构建Server镜像
2. 构建Client镜像
3. 推送到GitHub Container Registry (GHCR)

### 更新Personal Access Token

如果遇到workflow权限错误，需要更新GitHub Personal Access Token：

1. 访问 GitHub Settings → Developer settings → Personal access tokens
2. 创建新Token或更新现有Token
3. 确保勾选以下权限：
   - `repo` - 完整仓库访问权限
   - `workflow` - GitHub Actions工作流权限
   - `write:packages` - 包写入权限
4. 更新Git remote中的Token：
   ```bash
   git remote set-url origin https://NEW_TOKEN@github.com/Corps-Cy/ai-service-platform.git
   ```

### 手动触发构建

在GitHub仓库页面，进入Actions → Build and Push Docker Images → Run workflow 可以手动触发构建。

## 部署步骤

### 1. 克隆代码

```bash
git clone https://github.com/Corps-Cy/ai-service-platform.git
cd ai-service-platform
```

### 2. 配置环境变量

复制环境变量模板并编辑：

```bash
cp server/.env.example .env
```

编辑 `.env` 文件，配置以下关键变量：

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database
DATABASE_PATH=./data/database.sqlite

# Frontend
FRONTEND_URL=http://your-domain.com

# ZhipuAI Configuration
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPU_API_KEY=your_zhipu_api_key_here

# JWT Secret (请修改为随机字符串)
JWT_SECRET=your-secret-key-change-in-production

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_CACHE_DB=1

# WeChat Pay Configuration
WECHAT_APPID=your_wechat_appid
WECHAT_MCHID=your_merchant_id
WECHAT_SERIAL_NO=your_serial_no
WECHAT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
your_private_key
-----END PRIVATE KEY-----
WECHAT_NOTIFY_URL=https://your-domain.com/api/payment/wechat/notify

# Alipay Configuration
ALIPAY_APPID=your_alipay_appid
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
your_private_key
-----END RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
alipay_public_key
-----END PUBLIC KEY-----
ALIPAY_NOTIFY_URL=https://your-domain.com/api/payment/alipay/notify

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=AI Service Platform

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=info

# Retry Configuration
RETRY_MAX_ATTEMPTS=3
RETRY_DELAY_MS=1000

# Admin Configuration
ADMIN_EMAILS=admin@yourdomain.com,manager@yourdomain.com
```

### 3. 启动服务

使用生产环境配置启动：

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. 查看服务状态

```bash
docker-compose -f docker-compose.prod.yml ps
```

### 5. 查看日志

查看所有服务日志：

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

查看特定服务日志：

```bash
# Server日志
docker-compose -f docker-compose.prod.yml logs -f server

# Client日志
docker-compose -f docker-compose.prod.yml logs -f client

# Redis日志
docker-compose -f docker-compose.prod.yml logs -f redis
```

## 配置Nginx反向代理（推荐）

### 1. 创建Nginx配置文件

创建 `/etc/nginx/sites-available/ai-service-platform`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL证书配置（使用Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 前端静态文件
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 上传文件大小限制
    client_max_body_size 50M;
}
```

### 2. 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/ai-service-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 安装SSL证书（使用Certbot）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 常用管理命令

### 重启服务

```bash
docker-compose -f docker-compose.prod.yml restart
```

### 重启特定服务

```bash
docker-compose -f docker-compose.prod.yml restart server
```

### 停止服务

```bash
docker-compose -f docker-compose.prod.yml down
```

### 更新镜像

#### 使用GitHub Container Registry（推荐）

如果已配置GitHub Actions自动构建，首先修改 `docker-compose.prod.yml` 使用预构建的镜像：

```yaml
server:
  image: ghcr.io/corps-cy/ai-service-platform-server:latest
  # 移除 build 配置

client:
  image: ghcr.io/corps-cy/ai-service-platform-client:latest
  # 移除 build 配置
```

然后拉取最新镜像并重启：

```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

#### 本地构建

如果需要本地构建：

```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### 进入容器

```bash
# 进入Server容器
docker-compose -f docker-compose.prod.yml exec server bash

# 进入Redis容器
docker-compose -f docker-compose.prod.yml exec redis redis-cli
```

### 备份数据

```bash
# 备份数据库
cp ./data/database.sqlite ./backups/database_$(date +%Y%m%d).sqlite

# 备份Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli BGSAVE
```

### 恢复数据

```bash
# 恢复数据库
cp ./backups/database_20250101.sqlite ./data/database.sqlite
```

## 监控和维护

### 检查磁盘空间

```bash
df -h
```

### 清理Docker镜像

```bash
docker system prune -a
```

### 查看资源使用

```bash
docker stats
```

## 故障排查

### 服务无法启动

1. 查看日志：
```bash
docker-compose -f docker-compose.prod.yml logs
```

2. 检查端口占用：
```bash
netstat -tlnp | grep -E ':(80|3001|6379)'
```

### 数据库连接失败

1. 检查数据库文件权限：
```bash
ls -la ./data/
```

2. 检查数据库配置：
```bash
docker-compose -f docker-compose.prod.yml exec server cat .env | grep DATABASE
```

### Redis连接失败

1. 测试Redis连接：
```bash
docker-compose -f docker-compose.prod.yml exec server redis-cli -h redis -p 6379 ping
```

### 邮件发送失败

1. 检查邮件配置：
```bash
docker-compose -f docker-compose.prod.yml logs server | grep -i email
```

2. 测试SMTP连接：
```bash
telnet smtp.gmail.com 587
```

## 安全建议

1. **定期更新镜像**
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **使用强密码**
   - 修改JWT_SECRET
   - 使用强数据库密码
   - 定期更换API密钥

3. **启用防火墙**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

4. **配置自动备份**
   - 使用cron定时备份数据库
   - 将备份文件发送到远程存储

5. **监控服务状态**
   - 使用监控工具（如Prometheus、Grafana）
   - 配置告警通知

## 性能优化

1. **调整Redis配置**
   - 根据内存大小调整maxmemory
   - 配置合适的eviction策略

2. **调整日志级别**
   - 生产环境使用info或warn级别
   - 定期清理旧日志文件

3. **启用Gzip压缩**
   - 在Nginx配置中启用gzip
   - 减少传输数据量

4. **配置CDN**
   - 为静态资源配置CDN
   - 加速内容分发

## 更新日志

- 更新Docker镜像后，执行：
  ```bash
  docker-compose -f docker-compose.prod.yml pull
  docker-compose -f docker-compose.prod.yml up -d
  ```

- 查看更新状态：
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```

## 支持

如有问题，请：
1. 查看日志文件
2. 检查GitHub Issues
3. 提交新的Issue
