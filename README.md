# AI Chat

基于 LangGraph 后端的 AI 聊天前端应用。

## 功能特性

- **三种对话模式**
  - 项目问答：RAG 查询项目资料
  - 错误诊断：粘贴错误代码，AI 分析
  - API 生成：上传 Sample + Spec 生成 API
- **流式输出**：打字机效果的实时响应
- **Markdown 渲染**：支持代码高亮
- **对话历史**：localStorage 持久化存储
- **文件附件**：支持上传文件

## 技术栈

- React 18 + TypeScript
- Vite
- shadcn/ui + Tailwind CSS
- Zustand (状态管理)
- react-markdown (Markdown 渲染)
- Lucide React (图标)

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 环境变量

创建 `.env` 文件配置后端 API 地址：

```
VITE_API_URL=http://localhost:2024
```

## 项目结构

```
src/
├── components/       # UI 组件
│   ├── ui/          # shadcn 组件
│   ├── ChatMessage.tsx
│   ├── ChatInput.tsx
│   ├── Sidebar.tsx
│   └── ModeSelector.tsx
├── hooks/           # 自定义 Hooks
├── lib/             # 工具函数和 API
├── store/           # Zustand store
├── types/           # TypeScript 类型定义
└── App.tsx          # 主应用
```

## API 接口

后端需要提供以下 LangGraph 端点：

- `POST /threads` - 创建对话线程
- `POST /threads/:id/runs/stream` - 流式对话响应
