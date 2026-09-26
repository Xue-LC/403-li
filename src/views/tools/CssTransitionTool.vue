<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎬 CSS Transition 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- ============ 左栏：控制面板 ============ -->
          <div class="tool-col">
            <label class="tool-label">过渡属性（{{ transitions.length }} 个）：</label>
            <div class="transitions-list">
              <div v-for="(t, idx) in transitions" :key="idx" class="transition-item">
                <div class="t-item-header">
                  <span class="t-item-num">#{{ idx + 1 }}</span>
                  <button
                    v-if="transitions.length > 1"
                    class="t-item-remove"
                    @click="removeTransition(idx)"
                    title="移除此过渡"
                  >✕</button>
                </div>

                <div class="t-row">
                  <span class="t-label">属性</span>
                  <select v-model="t.property" class="t-select">
                    <option value="all">all</option>
                    <option value="opacity">opacity</option>
                    <option value="transform">transform</option>
                    <option value="background-color">background-color</option>
                    <option value="color">color</option>
                    <option value="width">width</option>
                    <option value="height">height</option>
                    <option value="margin">margin</option>
                    <option value="padding">padding</option>
                    <option value="border-color">border-color</option>
                    <option value="box-shadow">box-shadow</option>
                    <option value="filter">filter</option>
                    <option value="left">left</option>
                    <option value="top">top</option>
                  </select>
                </div>

                <div class="t-row">
                  <span class="t-label">持续时间</span>
                  <div class="t-range-wrap">
                    <input type="range" v-model.number="t.duration" min="0.1" max="3" step="0.1" class="range-input t-range" />
                    <span class="t-val">{{ t.duration }}s</span>
                  </div>
                </div>

                <div class="t-row">
                  <span class="t-label">缓动函数</span>
                  <select v-model="t.easing" class="t-select">
                    <option value="ease">ease</option>
                    <option value="ease-in">ease-in</option>
                    <option value="ease-out">ease-out</option>
                    <option value="ease-in-out">ease-in-out</option>
                    <option value="linear">linear</option>
                    <option value="cubic-bezier">cubic-bezier()</option>
                    <option value="steps">steps()</option>
                  </select>
                </div>

                <div v-if="t.easing === 'cubic-bezier'" class="t-row t-row-cb">
                  <span class="t-label">cubic-bezier</span>
                  <div class="cb-inputs">
                    <input type="number" v-model.number="t.cb[0]" min="0" max="1" step="0.01" class="t-num-input" />
                    <input type="number" v-model.number="t.cb[1]" min="-2" max="2" step="0.01" class="t-num-input" />
                    <input type="number" v-model.number="t.cb[2]" min="0" max="1" step="0.01" class="t-num-input" />
                    <input type="number" v-model.number="t.cb[3]" min="-2" max="2" step="0.01" class="t-num-input" />
                  </div>
                </div>

                <div v-if="t.easing === 'steps'" class="t-row">
                  <span class="t-label">steps</span>
                  <div class="t-range-wrap">
                    <input type="range" v-model.number="t.stepsCount" min="1" max="20" step="1" class="range-input t-range" />
                    <span class="t-val">{{ t.stepsCount }}</span>
                  </div>
                  <select v-model="t.stepsDir" class="t-select t-select-sm">
                    <option value="end">end</option>
                    <option value="start">start</option>
                  </select>
                </div>

                <div class="t-row">
                  <span class="t-label">延迟</span>
                  <div class="t-range-wrap">
                    <input type="range" v-model.number="t.delay" min="0" max="3" step="0.1" class="range-input t-range" />
                    <span class="t-val">{{ t.delay }}s</span>
                  </div>
                </div>
              </div>
            </div>

            <button class="tool-button" style="margin-top:8px" @click="addTransition">+ 添加过渡属性</button>

            <label class="tool-label">触发方式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="triggerMode" value="hover" />
                <span>hover（悬停）</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="triggerMode" value="click" />
                <span>click（点击）</span>
              </label>
            </div>

            <label class="tool-label">演示变换效果：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="effect" value="scale" />
                <span>缩放 ↑</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="effect" value="rotate" />
                <span>旋转 ↻</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="effect" value="translate" />
                <span>平移 →</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="effect" value="color" />
                <span>颜色 🎨</span>
              </label>
            </div>

            <button class="tool-button danger" style="margin-top:8px" @click="resetAll">↺ 重置全部</button>
          </div>

          <!-- ============ 右栏：预览 + CSS ============ -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="preview-wrapper">
              <div
                class="demo-element"
                :class="{ 'demo-active': isActive }"
                :style="demoStyle"
                @mouseenter="triggerMode === 'hover' && (isActive = true)"
                @mouseleave="triggerMode === 'hover' && (isActive = false)"
                @click="triggerMode === 'click' && (isActive = !isActive)"
              >
                <span class="demo-label">Hover / Click</span>
                <span class="demo-hint" v-if="triggerMode === 'click'">点击切换</span>
              </div>
              <div class="bezier-preview" v-if="hasCustomBezier">
                <span class="t-label">cubic-bezier 曲线预览：</span>
                <svg viewBox="0 0 200 200" class="bezier-svg">
                  <line x1="20" y1="180" x2="180" y2="180" stroke="var(--line)" stroke-width="1" />
                  <line x1="20" y1="180" x2="20" y2="20" stroke="var(--line)" stroke-width="1" />
                  <line x1="20" y1="180" x2="180" y2="20" stroke="var(--green-glow)" stroke-width="1" stroke-dasharray="4" opacity="0.3" />
                  <path :d="bezierPath" stroke="var(--green)" stroke-width="2" fill="none" />
                  <circle cx="20" cy="180" r="4" fill="var(--green)" />
                  <circle cx="180" cy="20" r="4" fill="var(--green)" />
                </svg>
              </div>
            </div>

            <label class="tool-label">CSS 代码：</label>
            <textarea
              class="code-input output"
              :value="generatedCSS"
              readonly
              rows="10"
              placeholder="生成的 CSS 代码将显示在这里..."
            ></textarea>

            <div class="button-group button-group-2" style="margin-top:8px">
              <button class="tool-button primary" @click="copyCSS">📋 复制 CSS</button>
              <button class="tool-button" @click="copyShorthand" v-if="hasSingleTransition">📋 复制简写</button>
            </div>
          </div>
        </div>

        <div v-if="copyMsg" class="status-success">{{ copyMsg }}</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

// --- Transition items ---
function createTransition() {
  return reactive({
    property: 'all',
    duration: 0.3,
    easing: 'ease',
    cb: [0.25, 0.1, 0.25, 1],
    stepsCount: 4,
    stepsDir: 'end',
    delay: 0,
  })
}

const transitions = reactive([createTransition()])

// --- Trigger / Effect ---
const triggerMode = ref('hover')
const effect = ref('scale')
const isActive = ref(false)

// --- Status ---
const copyMsg = ref('')
const error = ref('')

// --- Derived ---
const hasCustomBezier = computed(() => {
  return transitions.some(t => t.easing === 'cubic-bezier')
})

const hasSingleTransition = computed(() => {
  return transitions.length === 1
})

// --- Easing string for one transition ---
function getEasingString(t) {
  if (t.easing === 'cubic-bezier') {
    return `cubic-bezier(${t.cb[0]}, ${t.cb[1]}, ${t.cb[2]}, ${t.cb[3]})`
  }
  if (t.easing === 'steps') {
    return `steps(${t.stepsCount}, ${t.stepsDir})`
  }
  return t.easing
}

// --- Transition shorthand ---
const shorthand = computed(() => {
  if (transitions.length === 0) return ''
  const t = transitions[0]
  return `${t.property} ${t.duration}s ${getEasingString(t)} ${t.delay}s`
})

// --- Generated CSS ---
const generatedCSS = computed(() => {
  if (transitions.length === 0) return ''
  const lines = [`.element {`]
  if (transitions.length === 1) {
    const t = transitions[0]
    lines.push(`  transition: ${t.property} ${t.duration}s ${getEasingString(t)} ${t.delay}s;`)
  } else {
    const parts = transitions.map(t => {
      return `    ${t.property} ${t.duration}s ${getEasingString(t)} ${t.delay}s`
    }).join(',\\n')
    lines.push(`  transition: \\n${parts};`)
  }
  lines.push('}')
  return lines.join('\n')
})

// --- Demo element style ---
const demoStyle = computed(() => {
  const transitionStr = transitions.map(t => {
    return `${t.property} ${t.duration}s ${getEasingString(t)} ${t.delay}s`
  }).join(', ')

  const base = {
    transition: transitionStr,
    backgroundColor: 'var(--panel-2)',
    borderColor: 'var(--line)',
    color: 'var(--muted)',
    transform: 'scale(1) rotate(0deg) translate(0, 0)',
    boxShadow: 'none',
    filter: 'none',
  }

  if (isActive.value) {
    switch (effect.value) {
      case 'scale':
        base.transform = 'scale(1.15)'
        base.borderColor = 'var(--green)'
        base.color = 'var(--green)'
        base.boxShadow = '0 0 30px var(--green-glow)'
        break
      case 'rotate':
        base.transform = 'rotate(15deg)'
        base.borderColor = 'var(--green)'
        base.color = 'var(--green)'
        base.boxShadow = '0 0 30px var(--green-glow)'
        break
      case 'translate':
        base.transform = 'translate(12px, -6px)'
        base.borderColor = 'var(--green)'
        base.color = 'var(--green)'
        base.boxShadow = '0 0 30px var(--green-glow)'
        break
      case 'color':
        base.backgroundColor = 'var(--green-soft)'
        base.borderColor = 'var(--green)'
        base.color = 'var(--green)'
        base.boxShadow = '0 0 30px var(--green-glow)'
        break
    }
  }

  return base
})

// --- Bezier curve SVG path ---
const bezierPath = computed(() => {
  // Find first cubic-bezier transition
  const t = transitions.find(t => t.easing === 'cubic-bezier')
  if (!t) return ''
  const [x1, y1, x2, y2] = t.cb
  // Map: svg coord system: x 20..180, y 20..180 (inverted y)
  const cx1 = 20 + x1 * 160
  const cy1 = 180 - y1 * 160
  const cx2 = 20 + x2 * 160
  const cy2 = 180 - y2 * 160
  return `M 20 180 C ${cx1} ${cy1}, ${cx2} ${cy2}, 180 20`
})

// --- Actions ---
function addTransition() {
  transitions.push(createTransition())
}

function removeTransition(index) {
  if (transitions.length <= 1) return
  transitions.splice(index, 1)
}

function resetAll() {
  transitions.splice(0, transitions.length, createTransition())
  triggerMode.value = 'hover'
  effect.value = 'scale'
  isActive.value = false
  copyMsg.value = ''
  error.value = ''
}

async function copyCSS() {
  try {
    await copyText(generatedCSS.value)
    copyMsg.value = '✅ CSS 已复制到剪贴板'
    setTimeout(() => { copyMsg.value = '' }, 2000)
  } catch {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 3000)
  }
}

async function copyShorthand() {
  try {
    await copyText(shorthand.value)
    copyMsg.value = '✅ 简写已复制到剪贴板'
    setTimeout(() => { copyMsg.value = '' }, 2000)
  } catch {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 3000)
  }
}
</script>

<style scoped>
/* === Transitions list === */
.transitions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.transition-item {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 10px 12px;
  border-radius: 0;
}

.t-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.t-item-num {
  font-family: var(--mono);
  color: var(--green);
  font-size: 12px;
  text-transform: uppercase;
}

.t-item-remove {
  background: transparent;
  border: 1px solid var(--red);
  color: var(--red);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 0;
  transition: all 0.15s;
}

.t-item-remove:hover {
  background: var(--red);
  color: var(--bg);
}

.t-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.t-row:last-child {
  margin-bottom: 0;
}

.t-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  min-width: 56px;
  flex-shrink: 0;
}

.t-select {
  flex: 1;
  min-width: 100px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 0;
  cursor: pointer;
}

.t-select:focus {
  outline: 0;
  border-color: var(--green);
}

.t-select-sm {
  flex: 0;
  min-width: 70px;
}

.t-range-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 120px;
}

.t-range {
  margin: 0;
  flex: 1;
}

.t-val {
  font-family: var(--mono);
  color: var(--green);
  font-size: 12px;
  min-width: 32px;
  text-align: right;
}

.t-num-input {
  width: 48px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  padding: 3px 4px;
  text-align: center;
  border-radius: 0;
}

.t-num-input:focus {
  outline: 0;
  border-color: var(--green);
}

.cb-inputs {
  display: flex;
  gap: 4px;
  flex: 1;
}

.t-row-cb {
  background: rgba(157, 255, 107, 0.03);
  padding: 4px 8px;
  margin-left: -12px;
  margin-right: -12px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

/* === Preview === */
.preview-wrapper {
  border: 1px solid var(--line);
  background: var(--panel-2);
  border-radius: 0;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 16px;
  overflow: hidden;
}

.demo-element {
  width: 160px;
  height: 100px;
  border: 2px solid var(--line);
  background: var(--panel-2);
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  font-family: var(--mono);
}

.demo-label {
  font-size: 14px;
  font-weight: bold;
}

.demo-hint {
  font-size: 10px;
  opacity: 0.6;
}

/* === Cubic bezier preview === */
.bezier-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  max-width: 200px;
}

.bezier-svg {
  width: 100%;
  height: auto;
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 0;
}

/* === Responsive === */
@media (max-width: 640px) {
  .demo-element {
    width: 130px;
    height: 80px;
  }

  .demo-label {
    font-size: 12px;
  }

  .t-row {
    gap: 6px;
  }

  .t-label {
    min-width: 48px;
    font-size: 10px;
  }

  .t-select {
    font-size: 11px;
    padding: 3px 6px;
  }

  .t-num-input {
    width: 42px;
    font-size: 11px;
  }

  .transition-item {
    padding: 8px 10px;
  }

  .preview-wrapper {
    min-height: 150px;
    padding: 16px;
  }
}
</style>
