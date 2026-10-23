<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🧲 CSS Scroll Snap 可视化器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：属性配置 -->
          <div class="tool-col">
            <label class="tool-label">吸附方向：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="axis" type="radio" value="x" />
                <span>水平 X</span>
              </label>
              <label class="radio-label">
                <input v-model="axis" type="radio" value="y" />
                <span>垂直 Y</span>
              </label>
            </div>

            <label class="tool-label">吸附强度 scroll-snap-type：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="strictness" type="radio" value="mandatory" />
                <span>mandatory（强制）</span>
              </label>
              <label class="radio-label">
                <input v-model="strictness" type="radio" value="proximity" />
                <span>proximity（就近）</span>
              </label>
              <label class="radio-label">
                <input v-model="strictness" type="radio" value="none" />
                <span>none（关闭）</span>
              </label>
            </div>

            <label class="tool-label">对齐位置 scroll-snap-align：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="align" type="radio" value="start" />
                <span>start</span>
              </label>
              <label class="radio-label">
                <input v-model="align" type="radio" value="center" />
                <span>center</span>
              </label>
              <label class="radio-label">
                <input v-model="align" type="radio" value="end" />
                <span>end</span>
              </label>
            </div>

            <label class="tool-label">停靠行为 scroll-snap-stop：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="stop" type="radio" value="normal" />
                <span>normal（可跳过）</span>
              </label>
              <label class="radio-label">
                <input v-model="stop" type="radio" value="always" />
                <span>always（逐项停靠）</span>
              </label>
            </div>

            <label class="tool-label">每屏显示：{{ perView }} 项</label>
            <input v-model.number="perView" class="range-input" type="range" min="1" max="4" step="1" />

            <label class="tool-label">卡片间距：{{ gap }}px</label>
            <input v-model.number="gap" class="range-input" type="range" min="0" max="40" step="4" />

            <label class="tool-label">滚动容器高度：{{ containerSize }}px</label>
            <input
              v-model.number="containerSize"
              class="range-input"
              type="range"
              min="240"
              max="480"
              step="20"
            />

            <label class="tool-label">卡片数量：{{ itemCount }} 项</label>
            <input v-model.number="itemCount" class="range-input" type="range" min="3" max="16" step="1" />

            <div class="options-group">
              <label class="checkbox-label">
                <input v-model="smooth" type="checkbox" />
                <span>scroll-behavior: smooth</span>
              </label>
              <label class="checkbox-label">
                <input v-model="overscroll" type="checkbox" />
                <span>overscroll-behavior: contain</span>
              </label>
            </div>

            <label class="tool-label">CSS 选择器：</label>
            <input v-model="selector" class="code-input-sm" placeholder=".snap-container" />

            <div class="result-display snap-type-line">
              scroll-snap-type: {{ snapType }}
              <button class="copy-btn" title="复制 scroll-snap-type" @click="copySnapType">📋</button>
            </div>
          </div>

          <!-- 右栏：实时预览 -->
          <div class="tool-col">
            <label class="tool-label">实时预览（第 {{ current + 1 }} / {{ itemCount }} 项）：</label>

            <div class="preview-head">
              <button class="mini-btn" :disabled="current <= 0" @click="goTo(current - 1)">◀ 上一项</button>
              <span class="preview-hint">拖动 / 滚轮滚动，松手后观察吸附效果</span>
              <button class="mini-btn" :disabled="current >= itemCount - 1" @click="goTo(current + 1)">
                下一项 ▶
              </button>
            </div>

            <div ref="scrollerRef" class="snap-scroller" :style="containerStyle" @scroll="onScroll">
              <div v-for="i in itemCount" :key="i" class="snap-item" :style="itemStyle">
                <span class="item-index">{{ String(i).padStart(2, '0') }}</span>
                <span class="item-text">ITEM {{ i }}</span>
              </div>
            </div>

            <div class="dots">
              <button
                v-for="i in itemCount"
                :key="i"
                class="dot"
                :class="{ active: current === i - 1 }"
                :title="`跳到第 ${i} 项`"
                @click="goTo(i - 1)"
              ></button>
            </div>

            <div class="progress"><span class="progress-bar" :style="{ width: progress + '%' }"></span></div>

            <div class="meta-line">
              <span>align: {{ align }}</span>
              <span>stop: {{ stop }}</span>
              <span>gap: {{ gap }}px</span>
            </div>
          </div>
        </div>

        <!-- 全宽：生成代码 -->
        <div class="tool-two-col code-cols">
          <div class="tool-col">
            <label class="tool-label">
              生成的 CSS：
              <button class="copy-btn" title="复制 CSS" :disabled="!!error" @click="copyCSS">📋</button>
            </label>
            <textarea
              class="code-input output"
              :value="cssCode"
              readonly
              rows="12"
              placeholder="调整参数后自动生成 CSS..."
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">
              对应的 HTML：
              <button class="copy-btn" title="复制 HTML" :disabled="!!error" @click="copyHTML">📋</button>
            </label>
            <textarea
              class="code-input output"
              :value="htmlCode"
              readonly
              rows="12"
              placeholder="调整参数后自动生成 HTML..."
            ></textarea>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!!error" @click="copyCSS">📋 复制 CSS</button>
          <button class="tool-button" :disabled="!!error" @click="copyHTML">📋 复制 HTML</button>
          <button class="tool-button danger" @click="reset">🗑️ 重置</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { copyText } from '../../utils/clipboard'

const axis = ref('x')
const strictness = ref('mandatory')
const align = ref('start')
const stop = ref('normal')
const perView = ref(2)
const gap = ref(12)
const containerSize = ref(360)
const itemCount = ref(8)
const smooth = ref(true)
const overscroll = ref(true)
const selector = ref('.snap-container')

const scrollerRef = ref(null)
const current = ref(0)
const progress = ref(0)
const error = ref('')
const success = ref('')
let successTimer = null

const DEFAULT_STATE = {
  axis: 'x',
  strictness: 'mandatory',
  align: 'start',
  stop: 'normal',
  perView: 2,
  gap: 12,
  containerSize: 360,
  itemCount: 8,
  smooth: true,
  overscroll: true,
  selector: '.snap-container'
}

/** scroll-snap-type 值 */
const snapType = computed(() => {
  if (strictness.value === 'none') return 'none'
  return `${axis.value} ${strictness.value}`
})

/** 预览容器行内样式（直接使用真实 CSS 属性，所见即所得） */
const containerStyle = computed(() => {
  const isX = axis.value === 'x'
  return {
    flexDirection: isX ? 'row' : 'column',
    gap: `${gap.value}px`,
    height: `${containerSize.value}px`,
    overflowX: isX ? 'auto' : 'hidden',
    overflowY: isX ? 'hidden' : 'auto',
    scrollSnapType: snapType.value,
    scrollBehavior: smooth.value ? 'smooth' : 'auto',
    overscrollBehaviorX: overscroll.value && isX ? 'contain' : 'auto',
    overscrollBehaviorY: overscroll.value && !isX ? 'contain' : 'auto'
  }
})

/** 卡片行内样式 */
const itemStyle = computed(() => {
  const totalGap = gap.value * (perView.value - 1)
  const base = {
    scrollSnapAlign: align.value,
    scrollSnapStop: stop.value
  }
  if (axis.value === 'x') {
    return {
      ...base,
      flex: `0 0 calc((100% - ${totalGap}px) / ${perView.value})`,
      height: '100%',
      minWidth: '0'
    }
  }
  return {
    ...base,
    flex: '0 0 auto',
    width: '100%',
    height: `calc((100% - ${totalGap}px) / ${perView.value})`,
    minHeight: '0'
  }
})

/** 选择器校验（仅拦截明显非法字符，不做严格语法分析） */
const selectorError = computed(() => {
  const s = selector.value.trim()
  if (!s) return '请输入 CSS 选择器，例如 .snap-container'
  if (/[<>{}\\]/.test(s)) return '选择器包含非法字符（< > { } \\）'
  return ''
})

watch(selectorError, v => {
  error.value = v
})

/** 生成 CSS 代码 */
const cssCode = computed(() => {
  const sel = selector.value.trim() || '.snap-container'
  const isX = axis.value === 'x'
  const totalGap = gap.value * (perView.value - 1)
  const lines = []
  lines.push('/* 403.li CSS Scroll Snap 生成器 */')
  lines.push(`${sel} {`)
  lines.push('  display: flex;')
  lines.push(`  flex-direction: ${isX ? 'row' : 'column'};`)
  lines.push(`  gap: ${gap.value}px;`)
  lines.push(`  height: ${containerSize.value}px;`)
  lines.push(`  overflow-x: ${isX ? 'auto' : 'hidden'};`)
  lines.push(`  overflow-y: ${isX ? 'hidden' : 'auto'};`)
  if (strictness.value !== 'none') lines.push(`  scroll-snap-type: ${snapType.value};`)
  if (smooth.value) lines.push('  scroll-behavior: smooth;')
  if (overscroll.value) lines.push(`  overscroll-behavior-${isX ? 'x' : 'y'}: contain;`)
  lines.push('}')
  lines.push('')
  lines.push(`${sel} > .snap-item {`)
  if (isX) {
    lines.push(`  flex: 0 0 calc((100% - ${totalGap}px) / ${perView.value});`)
  } else {
    lines.push('  flex: 0 0 auto;')
    lines.push(`  height: calc((100% - ${totalGap}px) / ${perView.value});`)
  }
  if (strictness.value !== 'none') lines.push(`  scroll-snap-align: ${align.value};`)
  if (strictness.value !== 'none' && stop.value === 'always') lines.push('  scroll-snap-stop: always;')
  lines.push('}')
  return lines.join('\n')
})

/** 从选择器中提取 HTML class 名 */
const className = computed(() => {
  const m = /^\.([\w-]+)/.exec(selector.value.trim())
  return m ? m[1] : 'snap-container'
})

/** 生成 HTML 结构 */
const htmlCode = computed(() => {
  const items = []
  for (let i = 1; i <= itemCount.value; i++) {
    items.push(`  <div class="snap-item">${String(i).padStart(2, '0')}</div>`)
  }
  return `<div class="${className.value}">\n${items.join('\n')}\n</div>`
})

/** 滚动位置 → 当前最接近的卡片索引 + 进度 */
function onScroll() {
  const el = scrollerRef.value
  if (!el) return
  const isX = axis.value === 'x'
  const pos = isX ? el.scrollLeft : el.scrollTop
  const max = isX ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight
  progress.value = max > 0 ? Math.min(100, Math.round((pos / max) * 100)) : 0

  let best = 0
  let bestDist = Infinity
  Array.from(el.children).forEach((child, i) => {
    const offset = isX ? child.offsetLeft : child.offsetTop
    const dist = Math.abs(offset - pos)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  })
  current.value = best
}

/** 滚动到指定卡片 */
function goTo(index) {
  const el = scrollerRef.value
  if (!el) return
  const target = el.children[Math.max(0, Math.min(index, itemCount.value - 1))]
  if (!target) return
  const isX = axis.value === 'x'
  el.scrollTo({
    left: isX ? target.offsetLeft : 0,
    top: isX ? 0 : target.offsetTop,
    behavior: smooth.value ? 'smooth' : 'auto'
  })
}

// 切换方向 / 数量时回到起点并重新计算状态
watch([axis, itemCount, perView, gap, align], async () => {
  await nextTick()
  const el = scrollerRef.value
  if (el) el.scrollTo({ left: 0, top: 0, behavior: 'auto' })
  current.value = 0
  progress.value = 0
})

function showSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => {
    success.value = ''
  }, 2500)
}

async function copyCSS() {
  if (error.value) return
  const ok = await copyText(cssCode.value)
  if (ok) showSuccess('CSS 代码已复制到剪贴板')
  else error.value = '复制失败，请手动选择复制'
}

async function copyHTML() {
  if (error.value) return
  const ok = await copyText(htmlCode.value)
  if (ok) showSuccess('HTML 结构已复制到剪贴板')
  else error.value = '复制失败，请手动选择复制'
}

async function copySnapType() {
  const ok = await copyText(`scroll-snap-type: ${snapType.value};`)
  if (ok) showSuccess('scroll-snap-type 已复制')
  else error.value = '复制失败，请手动选择复制'
}

function reset() {
  axis.value = DEFAULT_STATE.axis
  strictness.value = DEFAULT_STATE.strictness
  align.value = DEFAULT_STATE.align
  stop.value = DEFAULT_STATE.stop
  perView.value = DEFAULT_STATE.perView
  gap.value = DEFAULT_STATE.gap
  containerSize.value = DEFAULT_STATE.containerSize
  itemCount.value = DEFAULT_STATE.itemCount
  smooth.value = DEFAULT_STATE.smooth
  overscroll.value = DEFAULT_STATE.overscroll
  selector.value = DEFAULT_STATE.selector
  error.value = ''
  success.value = ''
  nextTick(() => {
    current.value = 0
    progress.value = 0
    const el = scrollerRef.value
    if (el) el.scrollTo({ left: 0, top: 0, behavior: 'auto' })
  })
}
</script>

<style scoped>
/* 标签内复制按钮定位（.copy-btn 全局为绝对定位） */
.tool-label {
  position: relative;
  padding-right: 34px;
}

.snap-type-line {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  padding-right: 34px;
  word-break: break-all;
}

/* 预览头部 */
.preview-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-btn {
  flex: 0 0 auto;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
}

.mini-btn:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
}

.mini-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.preview-hint {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
}

/* 吸附滚动容器 */
.snap-scroller {
  position: relative;
  display: flex;
  border: 1px solid var(--line);
  background: var(--panel-2);
  scrollbar-width: thin;
  scrollbar-color: var(--line-strong) transparent;
  touch-action: pan-x pan-y;
}

.snap-scroller::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.snap-scroller::-webkit-scrollbar-track {
  background: var(--panel-2);
}

.snap-scroller::-webkit-scrollbar-thumb {
  background: var(--line-strong);
}

.snap-scroller::-webkit-scrollbar-thumb:hover {
  background: var(--green);
}

.snap-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  border: 1px solid var(--line-strong);
  background: var(--panel);
  color: var(--text);
  overflow: hidden;
  transition: background 0.2s, border-color 0.2s;
}

.snap-item:nth-child(odd) {
  background: var(--green-soft);
}

.item-index {
  font-family: var(--mono);
  font-size: 28px;
  line-height: 1;
  color: var(--green);
  text-shadow: 0 0 12px var(--green-glow);
}

.item-text {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

/* 指示点 */
.dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  padding: 0;
  border: 1px solid var(--line-strong);
  background: transparent;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
}

.dot:hover {
  border-color: var(--green);
}

.dot.active {
  background: var(--green);
  border-color: var(--green);
  box-shadow: 0 0 8px var(--green-glow);
}

/* 滚动进度 */
.progress {
  height: 3px;
  background: var(--panel-2);
  border: 1px solid var(--line);
}

.progress-bar {
  display: block;
  height: 100%;
  background: var(--green);
  box-shadow: 0 0 8px var(--green-glow);
  transition: width 0.08s linear;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
}

/* 代码区与上方预览的间距 */
.code-cols {
  margin-top: 20px;
}

@media (max-width: 640px) {
  .preview-hint {
    display: none;
  }

  .preview-head {
    justify-content: space-between;
  }

  .item-index {
    font-size: 22px;
  }

  .code-cols {
    margin-top: 16px;
  }
}
</style>
