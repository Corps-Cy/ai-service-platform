# AI Service Platform

基于智谱API的付费SaaS平台，提供多种AI服务。

## 功能

- 文生图（CogView）
- 文本生成（GLM-4）
- 图片理解（GLM-4V）
- 文档处理
- Excel操作
- 视频生成

## 技术栈

- 前端：React + TypeScript + TailwindCSS + Vite
- 后端：Node.js + Express + TypeScript
- 数据库：SQLite（可升级PostgreSQL）
- 支付：微信支付 + 支付宝
- 部署：Docker + Docker Compose

## 快速开始

```bash
# 克隆项目
git clone https://github.com/yourusername/ai-service-platform.git
cd ai-service-platform

# 配置环境变量
cp .env.example .env
# 编辑.env，填入智谱API密钥等配置

# 安装依赖
pnpm install

# 启动开发环境
pnpm dev

# 生产部署
docker-compose up -d
```

## 配置说明

### 环境变量

- `ZHIPU_API_KEY`: 智谱AI API密钥
- `JWT_SECRET`: JWT密钥
- `WECHAT_*`: 微信支付配置
- `ALIPAY_*`: 支付宝配置

### 支付接入

1. 微信支付：申请商户账号，配置商户号和API密钥
2. 支付宝：申请开放平台账号，配置应用ID和密钥

## 项目结构

```
.
├── client/          # 前端应用
│   ├── src/
│   │   ├── components/  # React组件
│   │   ├── pages/       # 页面
│   │   ├── services/    # API服务
│   │   └── hooks/       # 自定义hooks
│   ├── Dockerfile
│   └── nginx.conf
├── server/          # 后端API
│   ├── src/
│   │   ├── routes/      # 路由
│   │   ├── services/    # 业务逻辑
│   │   ├── models/      # 数据模型
│   │   └── middleware/  # 中间件
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## 许可证

MIT
