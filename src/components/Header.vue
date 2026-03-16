<template>
  <header class="header">
    <div class="terminal-window">
      <div class="terminal-header">
        <span class="terminal-title glitch">user@403-li:~</span>
        <div class="terminal-buttons">
          <span class="btn btn-close"></span>
          <span class="btn btn-minimize"></span>
          <span class="btn btn-maximize"></span>
        </div>
      </div>
      <div class="terminal-body" style="padding: 0.5rem 1rem; min-height: auto;">
        <nav class="nav">
          <router-link to="/" class="nav-link">
            <Icon name="home" :size="20" />
            <span class="nav-text">首页</span>
          </router-link>
          <span class="nav-separator">|</span>
          <router-link to="/tools" class="nav-link">
            <Icon name="tools" :size="20" />
            <span class="nav-text">工具</span>
          </router-link>
          <span class="nav-separator">|</span>
          <router-link to="/games" class="nav-link">
            <Icon name="game" :size="20" />
            <span class="nav-text">游戏</span>
          </router-link>
          <span class="nav-separator">|</span>
          <a href="https://github.com/你的 GitHub/403-li" target="_blank" class="nav-link">
            <Icon name="github" :size="20" />
            <span class="nav-text">GitHub</span>
          </a>
          <span class="nav-separator">|</span>
          <button @click="toggleTheme" class="theme-toggle" :title="isDark ? '切换到浅色模式' : '切换到深色模式'">
            <Icon :name="isDark ? 'theme' : 'theme'" :size="20" class="theme-icon" :class="{ 'theme-flip': !isDark }" />
          </button>
        </nav>
      </div>
    </div>
  </header>
</template>

<script>
import Icon from './Icon.vue'

export default {
  name: 'Header',
  components: {
    Icon
  },
  data() {
    return {
      isDark: true
    }
  },
  mounted() {
    // 从 localStorage 读取主题偏好
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      this.isDark = savedTheme === 'dark'
    } else {
      // 默认深色模式
      this.isDark = true
    }
    this.applyTheme()
  },
  methods: {
    toggleTheme() {
      this.isDark = !this.isDark
      const theme = this.isDark ? 'dark' : 'light'
      localStorage.setItem('theme', theme)
      this.applyTheme()
    },
    applyTheme() {
      if (this.isDark) {
        document.documentElement.removeAttribute('data-theme')
      } else {
        document.documentElement.setAttribute('data-theme', 'light')
      }
    }
  }
}
</script>

<style scoped>
.header {
  padding: 1rem 0;
}

.nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.nav-link {
  color: var(--text-primary);
  text-decoration: none;
  transition: color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.nav-link:hover {
  color: var(--text-success);
}

.nav-link:hover .icon {
  color: var(--text-success);
}

.nav-text {
  font-size: 0.95rem;
}

.nav-separator {
  color: var(--text-dim);
  margin: 0 0.2rem;
}

.theme-toggle {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.3rem 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  border-color: var(--text-primary);
  background: var(--bg-secondary);
}

.theme-toggle:hover .icon {
  color: var(--text-success);
}

.theme-toggle:active {
  transform: scale(0.95);
}

/* 主题图标翻转效果（浅色模式） */
.theme-flip {
  transform: rotate(180deg);
}

/* 图标动画 */
.icon {
  transition: all 0.2s ease;
}
</style>
