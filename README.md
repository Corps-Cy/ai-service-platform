# AI Service Platform - 智谱AI付费服务平台

基于智谱API的SaaS付费平台，提供多种AI服务。

## 功能列表

### 核心功能
- 🎨 文生图（CogView）
- 📄 文档处理（PDF转换/解析）
- 📊 Excel操作（生成/修改/分析）
- ✍️ 文本生成（写作/翻译/摘要）
- 🖼️ 图片理解（GLM-4V）
- 🎬 视频生成（如API支持）

### 支付方式
- 微信支付（H5/扫码）
- 支付宝（手机/扫码）

### 计费模式
- 一次性付费（按次）
- 会员订阅（月卡/季卡/年卡）

## 技术栈

- 前端：React + Vite + TailwindCSS
- 后端：Node.js + Express + TypeScript
- 数据库：SQLite（可升级PostgreSQL）
- 支付：微信支付 + 支付宝
- 部署：Docker + Docker Compose

## 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 启动开发环境
pnpm dev

# 生产部署
docker-compose up -d
```

## 项目结构

```
.
├── client/          # 前端 React
├── server/          # 后端 API
├── nginx/           # Nginx 配置
└── docker-compose.yml
```
