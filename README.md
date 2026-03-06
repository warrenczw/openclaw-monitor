# OpenClaw 监测中心 (OpenClaw Monitor)

这是一个专为 **OpenClaw 2026.3.2** 设计的高级状态监测站。采用现代化的 React + Vite 技术栈，提供实时的性能指标可视化与机器人实例管理。

## 🌟 主要功能

- **实时性能监控**: 直观展示 CPU 使用率、内存占用及 API 延迟。
- **动态日志流**: 实时刷新系统日志，带动画效果，方便追踪任务执行进度。
- **环境配置**: 支持在页面内保存服务器地址与访问令牌 (Token)，且持久化存储。
- **生产/演示双模式**: 灵活切换真实后端连接与模拟演示模式。
- **极客风格设计**: 深度优化的暗色模式，采用玻璃拟态 (Glassmorphism) 视觉系统。

## 🚀 本地开发与部署

### 1. 前置要求

确保您的系统中已安装：
- [Node.js](https://nodejs.org/) (建议 v18.0 或更高版本)
- [npm](https://www.npmjs.com/) 或 [yarn](https://yarnpkg.com/)

### 2. 克隆项目

```bash
git clone <your-repository-url>
cd openclaw-monitor
```

### 3. 安装依赖

```bash
npm install
```

### 4. 运行开发服务器

```bash
npm run dev
```
运行后，在浏览器访问 `http://localhost:5173/`。

### 5. 构建生产版本

```bash
npm run build
```
构建产生的文件将位于 `dist/` 目录中，您可以将其部署到任一静态托管服务上。

### 6. 运行 Python 后端 (可选)

项目包含一个简单的 Python 后端，用于采集本地系统指标并存入 SQLite 数据库。

```bash
cd server
source venv/bin/activate  # macOS/Linux
# 如果是 Windows: venv\Scripts\activate
python main.py
```
后端将运行在 `http://localhost:2026`。

## ⚙️ 对接 OpenClaw 服务器

1. 进入监控页面，点击右上角的 **齿轮图标 (Settings)**。
2. 输入您的 OpenClaw 服务器基础 URL：
   - 如果运行了自带后端，输入：`http://localhost:2026`
   - 如果对接远程服务器，输入：`http://your-server-ip:port`
3. 输入您的访问令牌 (Token)。
4. 开启 **“连接生产环境”** 开关。
5. 页面将自动开始从后端抓取数据，并持久化存储在您浏览器的 IndexedDB 中。

## 📄 许可证

您可以自由使用、修改及部署此项目。
