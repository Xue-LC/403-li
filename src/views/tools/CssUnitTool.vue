<template>
    <section class="tool-pane">
      <div class="tool-pane-head"><span>📐 CSS 单位转换</span><span>在线工具</span></div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <!-- 左栏：输入区域 -->
            <div class="tool-col">
              <label class="tool-label">数值：</label>
              <input type="number" v-model.number="inputValue" class="code-input-sm"
                step="any" placeholder="输入数值..." @input="convert" />

              <label class="tool-label">源单位：</label>
              <div class="radio-group">
                <label class="radio-label" v-for="u in units" :key="u.key">
                  <input type="radio" v-model="sourceUnit" :value="u.key" @change="convert" />
                  <span>{{ u.label }}</span>
                </label>
              </div>

              <label class="tool-label">基准字号：</label>
              <div class="input-with-copy">
                <input type="number" v-model.number="baseFontSize" class="code-input-sm"
                  step="any" min="1" @input="convert" />
                <span class="unit-hint">px</span>
              </div>

              <label class="tool-label">视口宽度：</label>
              <div class="input-with-copy">
                <input type="number" v-model.number="viewportWidth" class="code-input-sm"
                  step="any" min="1" @input="convert" />
                <span class="unit-hint">px</span>
              </div>

              <label class="tool-label">视口高度：</label>
              <div class="input-with-copy">
                <input type="number" v-model.number="viewportHeight" class="code-input-sm"
                  step="any" min="1" @input="convert" />
                <span class="unit-hint">px</span>
              </div>
            </div>

            <!-- 右栏：输出区域 -->
            <div class="tool-col">
              <label class="tool-label">转换结果：</label>
              <div class="result-list">
                <div v-for="u in units" :key="u.key" class="result-item"
                  :class="{ 'result-active': u.key === sourceUnit }">
                  <span class="result-unit">{{ u.label }}：</span>
                  <span class="result-value">{{ formatResult(results[u.key]) }}</span>
                  <button class="copy-btn-inline" @click="copyResult(results[u.key])"
                    :title="'复制 ' + u.label">📋</button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="error" class="status-error">❌ {{ error }}</div>
        </div>
      </div>
    </section>
</template>

<script>
import { copyText } from '../../utils/clipboard'

export default {
  name: 'CssUnitTool',
  data() {
    return {
      inputValue: 16,
      sourceUnit: 'px',
      baseFontSize: 16,
      viewportWidth: 1920,
      viewportHeight: 1080,
      results: {},
      error: ''
    }
  },
  computed: {
    units() {
      return [
        { key: 'px', label: 'px' },
        { key: 'rem', label: 'rem' },
        { key: 'em', label: 'em' },
        { key: 'vw', label: 'vw' },
        { key: 'vh', label: 'vh' },
        { key: 'pct', label: '%' }
      ]
    }
  },
  methods: {
    toPx(value, unit) {
      switch (unit) {
        case 'px': return value
        case 'rem': return value * this.baseFontSize
        case 'em': return value * this.baseFontSize
        case 'vw': return (value / 100) * this.viewportWidth
        case 'vh': return (value / 100) * this.viewportHeight
        case 'pct': return (value / 100) * this.viewportWidth
        default: return value
      }
    },
    fromPx(pxValue, unit) {
      switch (unit) {
        case 'px': return pxValue
        case 'rem': return pxValue / this.baseFontSize
        case 'em': return pxValue / this.baseFontSize
        case 'vw': return (pxValue / this.viewportWidth) * 100
        case 'vh': return (pxValue / this.viewportHeight) * 100
        case 'pct': return (pxValue / this.viewportWidth) * 100
        default: return pxValue
      }
    },
    convert() {
      try {
        this.error = ''
        const val = this.inputValue
        if (val === '' || val === null || val === undefined || isNaN(val)) {
          this.results = {}
          return
        }
        const pxValue = this.toPx(val, this.sourceUnit)
        const newResults = {}
        for (const u of this.units) {
          newResults[u.key] = this.fromPx(pxValue, u.key)
        }
        this.results = newResults
      } catch (e) {
        this.error = e.message || '转换失败'
      }
    },
    formatResult(value) {
      if (value === undefined || value === null || isNaN(value)) return '—'
      // 保留 4 位小数，去掉尾部多余的 0
      const fixed = value.toFixed(4)
      // 去掉末尾无意义的零
      const trimmed = fixed.replace(/\.?0+$/, '')
      return trimmed === '' ? '0' : trimmed
    },
    async copyResult(value) {
      if (value === undefined || value === null) return
      const text = this.formatResult(value)
      await copyText(text)
    }
  },
  mounted() {
    this.convert()
  }
}
</script>

<style scoped>
/* === 单位转换器特有样式 === */

.input-with-copy {
  position: relative;
  display: flex;
  align-items: center;
}

.unit-hint {
  position: absolute;
  right: 10px;
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
  pointer-events: none;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: var(--output-bg, #0d0d1a);
  border: 1px solid var(--line);
  border-radius: 0;
  gap: 8px;
  position: relative;
}

.result-active {
  border-color: var(--green);
  background: rgba(0, 255, 255, 0.05);
}

.result-unit {
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
  min-width: 36px;
  flex-shrink: 0;
}

.result-value {
  color: var(--text);
  font-family: var(--mono);
  font-size: 15px;
  flex: 1;
  word-break: break-all;
}

.copy-btn-inline {
  background: transparent;
  border: none;
  color: var(--green);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  flex-shrink: 0;
  opacity: 0.6;
  transition: all 0.2s;
}

.copy-btn-inline:hover {
  opacity: 1;
  transform: scale(1.15);
}

@media (max-width: 640px) {
  .result-item {
    flex-wrap: wrap;
  }
  .result-value {
    font-size: 13px;
  }
}
</style>
