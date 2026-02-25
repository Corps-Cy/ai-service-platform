# AI Service Platform - 智谱AI付费服务平台

> 基于 [智谱AI](https://open.bigmodel.cn/) API 的完整 SaaS 付费平台

![GitHub Actions](https://github.com/Corps-Cy/ai-service-platform/actions/workflows/docker-build.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## 功能列表

### 核心功能
- 🎨 文生图（CogView）
- 📄 文档处理（PDF转换/解析）
- 📊 Excel操作（生成/修改/分析）
- ✍️ 文本生成（写作/翻译/摘要）
- 🖼️ 图片理解（GLM-4V）
- 🎬 视频生成（如API支持）

### 商业化功能
- 💳 微信支付（H5/扫码）
- 💰 支付宝（手机/扫码）
- 📦 会员订阅（月卡/季卡/年卡）
- 🎫 一次性付费（按次）
- 📊 后台管理系统
- 📧 邮件通知系统
- 🔄 任务队列系统
- 💾 结果缓存系统

### 管理功能
- 👥 用户管理（查看、编辑、删除）
- 🛒 订单管理（查看、状态更新、导出）
- 📋 订阅管理（状态管理、到期提醒）
- 🎯 套餐管理（创建、编辑、删除、启用/禁用）
- 📈 统计概览（用户、订单、收入、任务）
- 📊 队列监控（等待、活跃、完成、失败）

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite 5
- **样式**: TailwindCSS 3 + AI-Native UI设计系统
- **路由**: React Router 6
- **状态管理**: React Hooks + Context API
- **HTTP客户端**: Axios

### 后端
- **运行时**: Node.js 22
- **框架**: Express 4 + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **任务队列**: Bull + Redis
- **缓存**: Redis
- **日志**: Winston + 日志轮转
- **验证**: Zod
- **认证**: JWT

### 支付与通知
- **微信支付**: wechatpay-node-v3
- **支付宝**: alipay-sdk
- **邮件通知**: Nodemailer

### 部署
- **容器**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **镜像仓库**: GitHub Container Registry
- **反向代理**: Nginx

## 快速开始

### 方式一：Docker 部署（推荐）

```bash
# 克隆代码
git clone https://github.com/Corps-Cy/ai-service-platform.git
cd ai-service-platform

# 配置环境变量
cp server/.env.example .env
# 编辑 .env 文件，配置智谱API密钥等信息

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

访问 http://localhost:80

### 方式二：GitHub Actions 自动构建

项目已配置 GitHub Actions，当代码推送到 `main` 分支时，会自动构建并推送 Docker 镜像到 GitHub Container Registry。

查看构建状态：[GitHub Actions](https://github.com/Corps-Cy/ai-service-platform/actions)

### 方式三：本地开发

```bash
# 安装依赖
pnpm install

# 启动 Redis
docker run -d -p 6379:6379 redis:7-alpine

# 配置环境变量
cp server/.env.example .env
# 编辑 .env 文件

# 启动后端
cd server
pnpm dev

# 启动前端（新终端）
cd client
pnpm dev
```

## 部署指南

详细的部署文档请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)，包括：

- 环境变量配置
- Docker Compose 生产部署
- Nginx 反向代理配置
- SSL 证书配置（Let's Encrypt）
- 监控和维护
- 故障排查

## GitHub 仓库

- **仓库地址**: https://github.com/Corps-Cy/ai-service-platform
- **Issues**: https://github.com/Corps-Cy/ai-service-platform/issues
- **Discussions**: https://github.com/Corps-Cy/ai-service-platform/discussions

## 项目结构

```
ai-service-platform/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/    # 通用组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   └── main.tsx       # 入口文件
│   ├── public/            # 静态资源
│   ├── Dockerfile         # Docker镜像构建
│   └── package.json       # 依赖配置
├── server/                # 后端API
│   ├── src/
│   │   ├── middleware/    # 中间件
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── services/      # 业务服务
│   │   ├── utils/         # 工具函数
│   │   ├── queue/         # 任务队列
│   │   └── index.ts       # 入口文件
│   ├── Dockerfile         # Docker镜像构建
│   └── package.json       # 依赖配置
├── .github/               # GitHub Actions工作流
│   └── workflows/
│       └── docker-build.yml
├── design-system/         # 设计系统文档
├── docker-compose.yml      # 开发环境
├── docker-compose.prod.yml # 生产环境
├── DEPLOYMENT.md          # 部署指南
└── README.md              # 项目说明
```

## 支持与反馈

如有问题或建议，欢迎通过以下方式联系：

- 📝 提交 [Issues](https://github.com/Corps-Cy/ai-service-platform/issues)
- 💬 参与 [Discussions](https://github.com/Corps-Cy/ai-service-platform/discussions)
- 📧 发送邮件：support@example.com

## 贡献

欢迎提交 Pull Request！

## 开源协议

本项目基于 MIT 协议开源。

## 致谢

感谢以下开源项目：

- [智谱AI](https://open.bigmodel.cn/) - 提供强大的AI服务
- [React](https://react.dev/) - 前端框架
- [Express](https://expressjs.com/) - 后端框架
- [TailwindCSS](https://tailwindcss.com/) - CSS框架
- [Bull](https://docs.bullmq.io/) - 任务队列
- [Redis](https://redis.io/) - 缓存和消息队列

---

**Star ⭐ 支持一下，让更多人看到这个项目！**
