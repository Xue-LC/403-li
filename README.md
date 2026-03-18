# 403.li - 终端风格工具站

纯前端工具集合，终端界面风格。

## 技术栈

- Vue 3 + Vite
- 终端风格 UI（深色背景 + 等宽字体 + 故障效果）

## 项目结构

```
403-li/
├── src/
│   ├── components/
│   │   ├── Header.vue
│   │   └── Footer.vue
│   ├── tools/
│   │   └── JsonFormatter.vue
│   ├── views/
│   │   ├── Home.vue
│   │   └── Tools.vue
│   ├── assets/
│   │   └── styles.css
│   ├── App.vue
│   ├── main.js
│   └── router.js
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

## 功能

- **首页** - 工具列表，终端风格导航
- **JSON 格式化** - 格式化/压缩/验证 JSON

计划添加：Base64 编解码、二维码生成、时间戳转换、密码生成器

## 开发

```bash
npm install
npm run dev
```

服务运行在 `http://127.0.0.1:5173/`

### 本地预览

SSH 隧道：
```bash
ssh -L 5173:localhost:5173 root@<服务器 IP>
```

然后访问 `http://localhost:5173`

## 部署

项目已配置 Vercel 部署（见 `vercel.json`），包含 CSP 安全头。

## 安全

- 纯前端，无后端
- 无数据上传
- 无第三方脚本/追踪

## 定制

修改 `src/assets/styles.css` 调整颜色和动画效果。
