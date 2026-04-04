# 403.li 工具开发指南

---

## 📋 添加新工具步骤

### 1️⃣ 复制模板文件

```bash
cd /root/.openclaw/workspace/403-li-src/src/views
cp ToolTemplate.vue YourToolName.vue
```

### 2️⃣ 修改组件名称

在 `YourToolName.vue` 中修改：

```javascript
export default {
  name: 'YourToolName', // 改成你的工具名称
  components: {
    Topbar
  },
  // ...
}
```

### 3️⃣ 添加工具内容

在 `<div class="tool-content">` 中添加你的工具 HTML：

```vue
<div class="tool-content">
  <!-- 你的工具内容 -->
  <div class="input-area">
    <textarea v-model="input" placeholder="输入内容..."></textarea>
  </div>
  <div class="button-group">
    <button @click="process" class="button primary">处理</button>
  </div>
  <div class="output-area">
    <textarea v-model="output" readonly></textarea>
  </div>
</div>
```

### 4️⃣ 添加样式

在 `<style scoped>` 中添加你的工具样式：

```css
/* 使用网站统一的 CSS 变量 */
.input-area {
  margin-bottom: 1rem;
}

textarea {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  padding: 12px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin: 1rem 0;
}

.button {
  padding: 10px 20px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line-strong);
  color: var(--accent);
  font-family: var(--mono);
  cursor: pointer;
}

.button.primary {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}
```

### 5️⃣ 添加到路由

编辑 `src/router.js`：

```javascript
import YourTool from './views/YourToolName.vue'

const routes = [
  // ... 现有路由
  {
    path: '/tools/your-tool',
    name: 'YourTool',
    component: YourTool
  }
]
```

### 6️⃣ 添加到主页工具列表

编辑 `src/views/Home.vue` 的 `tools` 数组：

```javascript
tools: [
  { 
    id: 1, 
    path: '/tools/json', 
    name: 'JSON 格式化', 
    // ...
  },
  { 
    id: 9, 
    path: '/tools/your-tool', 
    name: '你的工具名', 
    description: '工具描述',
    status: 'normal',
    statusText: '正常',
    statusColor: '#9dff6b',
    features: '功能 1 / 功能 2',
    category: 'encoding' // encoding, text, image, time
  }
]
```

---

## 🎨 统一样式规范

### CSS 变量

所有工具页面使用统一的 CSS 变量（在 `src/assets/styles.css` 中定义）：

```css
/* 背景色 */
--bg: #0d1117;           /* 主背景 */
--panel: #161b22;        /* 面板背景 */
--panel-2: #0f1317;      /* 次级面板 */
--card: #21262d;         /* 卡片背景 */

/* 边框 */
--line: #30363d;         /* 普通边框 */
--line-strong: #39424d;  /* 强调边框 */

/* 文字 */
--text: #c9d1d9;         /* 主文字 */
--text-dim: #8b949e;     /* 次要文字 */
--text-muted: #484f58;   /* 弱化文字 */

/* 强调色 */
--green: #9dff6b;        /* 绿色（主强调色） */
--green-soft: rgba(157,255,107,.12);
--green-glow: rgba(157,255,107,.15);
--red: #ff8a8a;          /* 红色（错误） */
--amber: #ffd866;        /* 黄色（警告） */
```

### 响应式断点

```css
/* 桌面端：默认样式 */

/* 移动端 */
@media (max-width: 640px) {
  /* 容器高度：400px → 300px */
  .tool-container {
    height: 300px;
  }
}

/* 小屏幕手机 */
@media (max-width: 375px) {
  /* 容器高度：300px → 250px */
  .tool-container {
    height: 250px;
  }
}
```

### 通用组件样式

**按钮**：
```css
.button {
  padding: 10px 20px;
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line-strong);
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s;
}

.button:hover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 20px var(--green-glow);
  color: var(--green);
}
```

**输入框**：
```css
textarea, input {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  padding: 12px;
}

textarea:focus, input:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}
```

---

## ✅ 检查清单

添加新工具后检查：

- [ ] 组件名称已修改
- [ ] 工具内容已添加
- [ ] 样式使用统一 CSS 变量
- [ ] 响应式样式已添加
- [ ] 路由已配置
- [ ] 主页工具列表已更新
- [ ] 移动端测试通过
- [ ] `npm run build` 构建成功
- [ ] Git 提交推送

---

## 📁 文件结构

```
src/
├── assets/
│   └── styles.css          # 全局样式（CSS 变量定义）
├── components/
│   ├── Topbar.vue          # 顶部导航栏
│   └── Footer.vue          # 底部信息栏
├── views/
│   ├── ToolTemplate.vue    # 工具模板（复制这个）
│   ├── Home.vue            # 主页
│   ├── Tools.vue           # 工具列表页
│   ├── NotFound.vue        # 404 游戏页
│   └── YourToolName.vue    # 你的新工具
└── router.js               # 路由配置
```

---

## 🚀 快速开始

1. 复制 `ToolTemplate.vue` → `YourToolName.vue`
2. 修改组件名称和内容
3. 添加到路由和主页
4. `npm run build`
5. 部署到 VPS

就这么简单！
