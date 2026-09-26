<template>
  <div class="app">
    <Topbar :toolCount="tools.length" />

    <div class="command" role="search">
      <span class="prompt" aria-hidden="true">user@403:~$</span>
      <input
        v-model="searchQuery"
        placeholder="搜索工具,比如:JSON、Base64、二维码、时间戳"
        @keyup.enter="handleSearch"
        aria-label="搜索工具"
      />
    </div>

    <!-- 最近使用 -->
    <section v-if="recentTools.length && !searchQuery.trim()" class="recent" role="region" aria-label="最近使用">
      <div class="recent-head">
        <span class="recent-icon">▶</span>
        <span>最近使用</span>
      </div>
      <div class="recent-list">
        <article
          v-for="tool in recentTools"
          :key="'r-' + tool.id"
          class="recent-card"
          @click="$router.push(tool.path)"
        >
          <span class="recent-card__id">[{{ tool.id.toString().padStart(2, '0') }}]</span>
          <span class="recent-card__name">{{ tool.name }}</span>
        </article>
      </div>
    </section>

    <section class="pane" role="region" aria-label="工具列表">
      <div class="pane-head">
        <span>工具列表</span>
        <span aria-live="polite">{{ filteredTools.length }} / {{ tools.length }}</span>
      </div>
      <div class="pane-body">
        <div class="group-tabs">
          <span
            v-for="cat in categories"
            :key="cat.key"
            class="tab"
            :class="{ active: activeTab === cat.key }"
            @click="activeTab = cat.key"
          >{{ cat.label }}<span class="tab-count">{{ categoryCounts[cat.key] }}</span></span>
        </div>

        <div class="tool-list" role="list">
          <article
            class="tool-card"
            :class="{
              'tool-card--pinned': isPinned(tool.path),
              'tool-card--swiping': drag.target === tool.path && drag.ready
            }"
            :style="cardStyle(tool.path)"
            v-for="tool in visibleTools"
            :key="tool.id"
            role="listitem"
            :aria-label="tool.name + ' - ' + tool.description"
            @click="onCardClick(tool.path)"
            @pointerdown="onPointerDown($event, tool.path)"
          >
            <div class="tool-top">
              <span class="tool-id">[{{ tool.id.toString().padStart(2, '0') }}]</span>
              <span class="tool-top__path">{{ tool.path }}</span>
            </div>
            <h3>{{ tool.name }}</h3>
            <p>{{ tool.description }}</p>
            <div class="tool-foot">
              <span class="tag tag-normal">{{ tool.statusText }}</span>
              <span>{{ tool.features }}</span>
            </div>
            <div
              class="tool-card__swipe-hint"
              :class="{
                visible: drag.target === tool.path && drag.ready,
                'tool-card__swipe-hint--unpin': isPinned(tool.path)
              }"
            >{{ isPinned(tool.path) ? '← 松手取消置顶' : '← 松手置顶' }}</div>
          </article>

          <div v-if="filteredTools.length === 0" class="empty-state">
            <span class="empty-icon">⊘</span>
            <span>未找到匹配的工具</span>
          </div>
        </div>

        <!-- 无限滚动哨兵 -->
        <div ref="sentinel" class="scroll-sentinel" v-show="displayCount < filteredTools.length"></div>
      </div>
    </section>

    <footer class="footer" role="contentinfo">
      <span>403.li // 中文终端工具站</span>
      <span>纯前端 · 无追踪 · <a href="https://github.com/Xue-LC/403-li" target="_blank">开源</a></span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../components/Topbar.vue'
import { tools, categories } from '../config/tools'
import { loadPinnedTools, togglePinned, getLastUsed, getRecentPaths } from '../utils/prefs'

const LONG_PRESS_MS = 400
const SWIPE_THRESHOLD = 60

export default {
  name: 'Home',
  components: { Topbar },
  data() {
    return {
      searchQuery: '',
      activeTab: 'all',
      tools,
      categories,
      pinnedTools: loadPinnedTools(),
      displayCount: 0,
      observer: null,
      drag: {
        target: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        ready: false,
        timer: null,
        preventClick: false
      }
    }
  },
  computed: {
    recentTools() {
      const paths = getRecentPaths(6)
      return paths
        .map(p => this.tools.find(t => t.path === p))
        .filter(Boolean)
    },
    filteredTools() {
      let result = this.tools
      if (this.activeTab !== 'all') {
        result = result.filter(tool => tool.category === this.activeTab)
      }
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase()
        const qn = parseInt(this.searchQuery)
        result = result.filter(tool =>
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.features.toLowerCase().includes(q) ||
          (tool.aliases && tool.aliases.some(a => a.includes(q))) ||
          tool.id === qn
        )
      }
      const pinned = result.filter(t => this.pinnedTools.includes(t.path))
      const unpinned = result.filter(t => !this.pinnedTools.includes(t.path))
      pinned.sort((a, b) => getLastUsed(b.path) - getLastUsed(a.path))
      return [...pinned, ...unpinned]
    },
    visibleTools() {
      return this.filteredTools.slice(0, this.displayCount)
    },
    categoryCounts() {
      let base = this.tools
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase()
        const qn = parseInt(this.searchQuery)
        base = base.filter(tool =>
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.features.toLowerCase().includes(q) ||
          (tool.aliases && tool.aliases.some(a => a.includes(q))) ||
          tool.id === qn
        )
      }
      const counts = { all: base.length }
      for (const cat of this.categories) {
        if (cat.key !== 'all') {
          counts[cat.key] = base.filter(t => t.category === cat.key).length
        }
      }
      return counts
    }
  },
  watch: {
    activeTab() {
      this.resetDisplayCount()
    },
    searchQuery() {
      this.resetDisplayCount()
    }
  },
  mounted() {
    this.calcDisplayCount()
    document.addEventListener('touchmove', this.onTouchMove, { passive: false })
    document.addEventListener('keydown', this.onKeydown)
    this.setupObserver()
  },
  beforeUnmount() {
    document.removeEventListener('touchmove', this.onTouchMove)
    document.removeEventListener('pointermove', this.onPointerMove)
    document.removeEventListener('pointerup', this.onPointerUp)
    document.removeEventListener('keydown', this.onKeydown)
    clearTimeout(this.drag.timer)
    this.unlockScroll()
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  },
  methods: {
    onCardClick(path) {
      if (this.drag.preventClick) {
        this.drag.preventClick = false
        return
      }
      this.$router.push(path)
    },
    handleSearch() {},
    isPinned(path) {
      return this.pinnedTools.includes(path)
    },
    cardStyle(path) {
      if (this.drag.target !== path || !this.drag.ready) return {}
      return {
        transform: `translateX(${this.drag.offsetX}px)`,
        transition: 'none'
      }
    },

    /* ── 无限滚动 ── */
    calcDisplayCount() {
      const vh = window.innerHeight
      const cardH = 122
      this.displayCount = Math.max(6, Math.ceil(vh / cardH) + 1)
    },
    resetDisplayCount() {
      this.calcDisplayCount()
      // 切换分类/搜索后重新观察哨兵
      this.$nextTick(() => {
        if (this.observer && this.$refs.sentinel) {
          this.observer.unobserve(this.$refs.sentinel)
          this.observer.observe(this.$refs.sentinel)
        }
      })
    },
    loadMore() {
      const step = Math.max(6, Math.ceil(window.innerHeight / 122))
      this.displayCount = Math.min(this.filteredTools.length, this.displayCount + step)
    },
    setupObserver() {
      if (!window.IntersectionObserver) return
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && this.displayCount < this.filteredTools.length) {
          this.loadMore()
          // 移动端卡片小，哨兵可能仍在视口内，需要继续加载
          this.$nextTick(() => {
            if (this.$refs.sentinel && this.displayCount < this.filteredTools.length) {
              const rect = this.$refs.sentinel.getBoundingClientRect()
              if (rect.top < window.innerHeight + 200) {
                this.loadMore()
              }
            }
          })
        }
      }, { rootMargin: '200px' })
      this.$nextTick(() => {
        if (this.$refs.sentinel) {
          this.observer.observe(this.$refs.sentinel)
        }
      })
    },

    /* ── 快捷键 ── */
    onKeydown(e) {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault()
        this.$el.querySelector('.command input')?.focus()
      }
      if (e.key === 'Escape' && this.searchQuery) {
        this.searchQuery = ''
        this.$el.querySelector('.command input')?.blur()
      }
    },

    /* ── 滚动锁 ── */
    lockScroll() {
      document.body.style.overflow = 'hidden'
    },
    unlockScroll() {
      document.body.style.overflow = ''
    },
    onTouchMove(e) {
      if (this.drag.target) e.preventDefault()
    },

    onPointerDown(e, path) {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      this.resetDrag()
      this.drag.target = path
      this.drag.startX = e.clientX
      this.drag.startY = e.clientY
      this.lockScroll()
      document.addEventListener('pointermove', this.onPointerMove)
      document.addEventListener('pointerup', this.onPointerUp)
      this.drag.timer = setTimeout(() => {
        this.drag.ready = true
      }, LONG_PRESS_MS)
    },

    onPointerMove(e) {
      if (!this.drag.target) return
      const dx = e.clientX - this.drag.startX

      if (!this.drag.ready) {
        const dy = e.clientY - this.drag.startY
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          clearTimeout(this.drag.timer)
          this.drag.target = null
          this.unlockScroll()
        }
        return
      }

      this.drag.offsetX = Math.min(0, dx)

      if (Math.abs(dx) > 3) {
        this.drag.preventClick = true
      }
    },

    onPointerUp() {
      clearTimeout(this.drag.timer)
      this.unlockScroll()
      document.removeEventListener('pointermove', this.onPointerMove)
      document.removeEventListener('pointerup', this.onPointerUp)
      if (!this.drag.target || !this.drag.ready) return

      if (this.drag.offsetX <= -SWIPE_THRESHOLD) {
        this.pinnedTools = togglePinned(this.drag.target)
      }

      this.drag.target = null
      this.drag.ready = false
      this.drag.offsetX = 0
    },

    resetDrag() {
      clearTimeout(this.drag.timer)
      document.removeEventListener('pointermove', this.onPointerMove)
      document.removeEventListener('pointerup', this.onPointerUp)
      this.drag.target = null
      this.drag.ready = false
      this.drag.offsetX = 0
      this.drag.preventClick = false
      this.unlockScroll()
    }
  }
}
</script>

<style scoped>
.tag-normal {
  font-size: 11px;
  color: #9dff6b;
  border-color: #9dff6b;
  background: rgba(157,255,107,0.12);
}

[data-theme="light"] .tag-normal {
  color: #166534;
  border-color: #166534;
  background: rgba(22,101,52,0.08);
}

.tool-top__path {
  margin-left: auto;
}

/* ── 左滑置顶 ── */
.tool-card {
  user-select: none;
  -webkit-user-select: none;
}

.tool-card--swiping {
  cursor: grabbing;
  z-index: 2;
}

.tool-card--swiping .tool-card__swipe-hint.visible {
  opacity: 0.85;
}

.tool-card__swipe-hint {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--green);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.tool-card__swipe-hint--unpin {
  color: var(--dim);
}

.tool-card--pinned {
  border-left: 2px solid var(--green);
}

/* ── 分类数量标签 ── */
.tab-count {
  font-size: 10px;
  opacity: 0.5;
  margin-left: 3px;
}

/* ── 最近使用 ── */
.recent {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: var(--card-bg-gradient), var(--card-bg);
  box-shadow: var(--card-shadow);
  position: relative;
  overflow: hidden;
}

.recent::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--card-top-line);
  opacity: 0.35;
}

.recent-head {
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  background: var(--panel);
  display: flex;
  align-items: center;
  gap: 6px;
}

.recent-icon {
  color: var(--green);
  font-size: 10px;
}

.recent-list {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.recent-list::-webkit-scrollbar {
  display: none;
}

.recent-card {
  flex: 0 0 auto;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  white-space: nowrap;
}

.recent-card:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

.recent-card__id {
  font-size: 11px;
  color: var(--green);
  opacity: 0.7;
}

.recent-card__name {
  font-size: 13px;
  color: var(--text);
}

/* ── 空状态 ── */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--dim);
  font-family: var(--mono);
  font-size: 14px;
}

.empty-icon {
  font-size: 18px;
  color: var(--green);
  opacity: 0.5;
}

/* ── 无限滚动哨兵 ── */
.scroll-sentinel {
  height: 1px;
  width: 100%;
}

/* ── 移动端卡片一行两个 ── */
@media (max-width: 640px) {
  .tool-list {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px;
  }

  .tool-card {
    padding: 10px;
  }

  .tool-card h3 {
    font-size: 14px;
    margin-bottom: 4px;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tool-card p {
    display: none;
  }

  .tool-card .tool-top {
    font-size: 11px;
    margin-bottom: 4px;
  }

  .tool-card .tool-top__path {
    display: none;
  }

  .tool-card .tool-foot {
    display: none;
  }
}
</style>
