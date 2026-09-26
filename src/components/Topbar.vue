<template>
  <header class="topbar" role="banner">
    <div class="topbar-left">
      <router-link to="/" class="brand" aria-label="403.li 首页">
        <div class="leds" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="brand-text">403.LI</span>
      </router-link>
    </div>
    <div class="topbar-right">
      <span class="status" aria-label="共 {{ toolCount }} 个工具">{{ toolCount }} 个工具</span>
      <a href="https://github.com/Xue-LC/403-li" target="_blank" class="icon-link" title="GitHub" aria-label="GitHub 仓库">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
      </a>
      <button class="theme-btn" @click="cycleTheme" :title="themeTitle">
        <!-- 深色：太阳（点击切到浅色） -->
        <svg v-if="mode === 'dark'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <!-- 浅色：月亮（点击切到跟随系统） -->
        <svg v-else-if="mode === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <!-- 跟随系统：显示器图标（点击切到深色） -->
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </button>
    </div>
  </header>
</template>

<script>
const THEME_ORDER = ['dark', 'light', 'system']

export default {
  name: 'Topbar',
  props: {
    toolCount: {
      type: [Number, String],
      default: 0
    }
  },
  data() {
    return {
      mode: 'dark',        // 用户选择：'dark' | 'light' | 'system'
      systemDark: true,     // 系统实际偏好
      mediaQuery: null,
      mediaHandler: null
    }
  },
  computed: {
    // 实际生效的主题（解析 system 为 dark/light）
    effectiveTheme() {
      if (this.mode === 'system') {
        return this.systemDark ? 'dark' : 'light'
      }
      return this.mode
    },
    themeTitle() {
      const labels = { dark: '深色模式', light: '浅色模式', system: '跟随系统' }
      return labels[this.mode]
    }
  },
  mounted() {
    const saved = localStorage.getItem('theme')
    if (saved && THEME_ORDER.includes(saved)) {
      this.mode = saved
    }
    // 检测系统偏好
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.systemDark = this.mediaQuery.matches
    this.mediaHandler = (e) => {
      this.systemDark = e.matches
      if (this.mode === 'system') {
        this.applyTheme(true)
      }
    }
    this.mediaQuery.addEventListener('change', this.mediaHandler)
    this.applyTheme(false)
  },
  beforeUnmount() {
    if (this.mediaQuery && this.mediaHandler) {
      this.mediaQuery.removeEventListener('change', this.mediaHandler)
    }
  },
  methods: {
    cycleTheme() {
      const idx = THEME_ORDER.indexOf(this.mode)
      this.mode = THEME_ORDER[(idx + 1) % THEME_ORDER.length]
      localStorage.setItem('theme', this.mode)
      this.applyTheme(true)
    },
    applyTheme(animate) {
      if (animate) {
        // 启用过渡动画
        const el = document.documentElement
        el.classList.add('theme-transitioning')
        // 等过渡结束后移除，避免影响后续 hover 等交互
        clearTimeout(this._transitionTimer)
        this._transitionTimer = setTimeout(() => {
          el.classList.remove('theme-transitioning')
        }, 400)
      }
      if (this.effectiveTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light')
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }
  },
  watch: {
    effectiveTheme() {
      this.applyTheme(false)
    }
  }
}
</script>

<style scoped>
.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding-top: 2px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.brand-text {
  white-space: nowrap;
}

.icon-link {
  color: var(--dim);
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
}

.icon-link:hover {
  color: var(--text);
}

.theme-btn {
  background: none;
  border: 1px solid var(--line);
  color: var(--dim);
  cursor: pointer;
  padding: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.theme-btn:hover {
  color: var(--green);
  border-color: var(--green);
}

@media (max-width: 640px) {
  .status {
    display: none;
  }
}
</style>
