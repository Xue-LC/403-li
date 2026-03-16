# 403.li 图标系统

终端风格图标系统 - 简约/几何/终端感

## 📁 文件结构

```
src/assets/icons/
├── home.svg        # 🏠 首页
├── tools.svg       # 🛠️ 工具
├── game.svg        # 🎮 游戏
├── github.svg      # 📦 GitHub
├── theme.svg       # 🌙/☀️ 主题切换
├── qr.svg          # 📱 二维码
├── security.svg    # 🔐 安全
├── settings.svg    # ⚙️ 设置
└── ascii-art.txt   # ASCII 字符画装饰
```

## 🎨 设计规范

- **尺寸**: 24x24px (可缩放)
- **线条粗细**: 2px
- **颜色**: 继承当前主题色 (`currentColor`)
- **风格**: 简约/几何/终端感
- **端点**: 方形 (`stroke-linecap="square"`)
- **连接**: 斜接 (`stroke-linejoin="miter"`)

## 🚀 使用方式

### 1. 使用 Icon 组件 (推荐)

```vue
<template>
  <Icon name="home" :size="24" />
  <Icon name="tools" :size="32" :strokeWidth="2.5" />
</template>

<script>
import Icon from './components/Icon.vue'

export default {
  components: { Icon }
}
</script>
```

### 2. 直接使用 SVG 文件

```vue
<template>
  <img src="@/assets/icons/home.svg" alt="首页" />
</template>
```

### 3. 在 CSS 中使用

```css
.icon-home {
  background-image: url('@/assets/icons/home.svg');
  width: 24px;
  height: 24px;
}
```

## 📋 可用图标

| 名称 | 用途 | 示例 |
|------|------|------|
| `home` | 首页/主页 | `<Icon name="home" />` |
| `tools` | 工具/设置 | `<Icon name="tools" />` |
| `game` | 游戏/娱乐 | `<Icon name="game" />` |
| `github` | GitHub/代码 | `<Icon name="github" />` |
| `theme` | 主题切换 | `<Icon name="theme" />` |
| `qr` | 二维码/扫描 | `<Icon name="qr" />` |
| `security` | 安全/权限 | `<Icon name="security" />` |
| `settings` | 设置/配置 | `<Icon name="settings" />` |

## 🎭 主题适配

图标自动继承 CSS 变量颜色：

```css
/* 深色模式 (默认) */
:root {
  --text-primary: #58a6ff;  /* 图标颜色 */
}

/* 浅色模式 */
[data-theme="light"] {
  --text-primary: #0969da;  /* 图标颜色 */
}
```

## ✨ 交互效果

- **悬停**: 图标放大 10% + 变成功能色
- **点击**: 图标缩小 5%
- **过渡**: 0.2s ease

## 🔧 自定义

### 修改尺寸
```vue
<Icon name="home" :size="32" />
```

### 修改线条粗细
```vue
<Icon name="home" :strokeWidth="3" />
```

### 修改颜色
```vue
<Icon name="home" style="color: #ff5f56;" />
```

## 📝 ASCII 装饰

在 `ascii-art.txt` 中提供终端风格装饰元素：
- Logo
- 分隔线
- 状态指示器
- 箭头
- 装饰框
- 终端提示符
- 进度条
- 复选框

---

**版本**: 1.0.0  
**风格**: Terminal / Minimal / Geometric
