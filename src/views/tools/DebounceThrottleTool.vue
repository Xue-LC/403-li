<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>⏱️ Debounce / Throttle 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- ✅ 双栏布局：桌面端左右并排，移动端上下堆叠 -->
        <div class="tool-two-col">
          <!-- 左栏：参数配置 -->
          <div class="tool-col">
            <label class="tool-label">模式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="mode" value="debounce" />
                <span>防抖 Debounce</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="mode" value="throttle" />
                <span>节流 Throttle</span>
              </label>
            </div>

            <label class="tool-label">等待时间：{{ waitMs }} ms</label>
            <div class="wait-row">
              <input
                type="range"
                v-model.number="wait"
                min="50"
                max="2000"
                step="10"
                class="range-input"
              />
              <input
                class="code-input-sm wait-number"
                type="number"
                v-model.number="wait"
                min="10"
                max="5000"
                step="10"
                @change="normalizeWait"
              />
            </div>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="leading" />
                <span>leading — 首次触发立即执行</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="trailing" />
                <span>trailing — 结束后再执行一次</span>
              </label>
            </div>

            <div class="behavior-box" :class="{ invalid: invalidOptions }">
              <span class="behavior-key">行为</span>
              <span>{{ behaviorText }}</span>
            </div>

            <div class="preset-row">
              <button class="tool-button" @click="applyPreset('debounce')">输入框搜索</button>
              <button class="tool-button" @click="applyPreset('throttle')">滚动 / 拖拽</button>
              <button class="tool-button" @click="applyPreset('button')">防重复点击</button>
            </div>

            <button class="tool-button" @click="copyConfig">📋 复制参数</button>
          </div>

          <!-- 右栏：生成的代码 -->
          <div class="tool-col">
            <label class="tool-label">生成的代码：</label>
            <div class="input-with-copy code-wrap">
              <textarea
                class="code-input output"
                :value="generatedCode"
                readonly
                rows="20"
                spellcheck="false"
                placeholder="代码将显示在这里..."
              ></textarea>
              <button class="copy-btn" @click="copyCode" title="复制代码">📋</button>
            </div>
          </div>
        </div>

        <!-- ✅ 操作按钮（双栏外面，自动全宽） -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="invalidOptions" @click="triggerOnce">
            ⚡ 单次触发
          </button>
          <button class="tool-button" :disabled="invalidOptions" @click="burst">
            🔁 连续触发 ×8
          </button>
          <button class="tool-button danger" @click="resetSession()">🗑️ 重置</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <!-- 实时测试面板（全宽） -->
        <div class="test-panel">
          <div class="test-head">
            <span class="test-title">▼ 实时触发测试</span>
            <span class="test-scale">窗口 {{ (scaleMax / 1000).toFixed(1) }}s</span>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">触发次数</span>
              <span class="stat-value">{{ rawCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">实际执行</span>
              <span class="stat-value">{{ execCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">合并调用</span>
              <span class="stat-value">{{ mergedCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">执行率</span>
              <span class="stat-value">{{ execRate }}%</span>
            </div>
          </div>

          <div class="signal-board">
            <div class="lane-row">
              <span class="lane-name">触发</span>
              <div class="lane">
                <span
                  v-for="(e, i) in triggerEvents"
                  :key="'tr' + i"
                  class="tick tick-trigger"
                  :style="{ left: pos(e.t) }"
                ></span>
                <span v-if="!triggerEvents.length" class="lane-empty">等待触发…</span>
              </div>
            </div>
            <div class="lane-row">
              <span class="lane-name">执行</span>
              <div class="lane">
                <span
                  v-for="(e, i) in execEvents"
                  :key="'ex' + i"
                  class="tick tick-exec"
                  :style="{ left: pos(e.t) }"
                ></span>
              </div>
            </div>
            <div class="lane-axis">
              <span
                v-for="m in axisMarks"
                :key="m"
                class="axis-label"
                :style="{ left: m + '%' }"
              >{{ axisText(m) }}</span>
            </div>
          </div>

          <div class="legend">
            <span class="legend-item"><i class="legend-mark trigger"></i>原始触发</span>
            <span class="legend-item"><i class="legend-mark exec"></i>实际执行</span>
            <span class="legend-tip">观察绿色执行条如何被合并</span>
          </div>

          <div v-if="lastEvents.length" class="event-log">
            <div v-for="(e, i) in lastEvents" :key="'log' + i" class="event-line">
              <span class="event-time">{{ (e.t / 1000).toFixed(2) }}s</span>
              <span class="event-type" :class="e.type">{{ e.type === 'trigger' ? '⚡ 触发' : '✅ 执行' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'
import { loadToolPrefs, saveToolPrefs } from '../../utils/prefs'

const mode = ref('debounce')
const wait = ref(300)
const leading = ref(false)
const trailing = ref(true)

const events = ref([])
const rawCount = ref(0)
const execCount = ref(0)
const nowMs = ref(0)
const running = ref(false)

const error = ref('')
const success = ref('')

let runner = null
let burstTimer = null
let clockTimer = null
let endTimer = null
let testStart = 0

const waitMs = computed(() => {
  const n = Number(wait.value)
  if (!Number.isFinite(n)) return 300
  return Math.min(5000, Math.max(10, Math.round(n)))
})

const invalidOptions = computed(() => !leading.value && !trailing.value)

const behaviorText = computed(() => {
  if (invalidOptions.value) return 'leading 与 trailing 至少开启一项，否则永远不会执行'
  if (mode.value === 'debounce') {
    if (leading.value && trailing.value) return '首次立即执行；连续触发结束后，再补执行最后一次'
    if (leading.value) return '首次立即执行；等待窗口内的后续触发全部丢弃'
    return '连续触发停止后，等待结束时执行最后一次'
  }
  if (leading.value && trailing.value) return '首次立即执行；窗口内最多执行一次，最后一次在窗口末尾补执行'
  if (leading.value) return '首次立即执行；窗口内的后续触发全部丢弃，不再补执行'
  return '首次调用延后一个窗口执行；窗口内最多执行一次'
})

const execRate = computed(() => {
  if (!rawCount.value) return 0
  return Math.round((execCount.value / rawCount.value) * 100)
})

const mergedCount = computed(() => Math.max(0, rawCount.value - execCount.value))

const triggerEvents = computed(() => events.value.filter(e => e.type === 'trigger'))
const execEvents = computed(() => events.value.filter(e => e.type === 'exec'))
const lastEvents = computed(() => events.value.slice(-8).reverse())

const lastEventTime = computed(() => {
  if (!events.value.length) return 0
  return events.value[events.value.length - 1].t
})

const scaleMax = computed(() => {
  return Math.max(1000, waitMs.value * 2, nowMs.value, lastEventTime.value + 200)
})

const axisMarks = [0, 25, 50, 75, 100]

function axisText(pct) {
  const sec = (scaleMax.value * pct) / 100 / 1000
  return sec >= 10 ? `${sec.toFixed(0)}s` : `${sec.toFixed(1)}s`
}

function pos(t) {
  const pct = (t / scaleMax.value) * 100
  return `${Math.min(99.4, Math.max(0, pct))}%`
}

/* ===== 真实实现（与生成的代码保持一致） ===== */

function makeDebounce(fn, ms, opts) {
  const { leading: lead, trailing: trail } = opts
  let timer = null
  let lastArgs = null
  let context = null
  let pending = false

  function debounced(...args) {
    const isFirst = timer === null
    lastArgs = args
    context = this

    if (isFirst && lead) {
      fn.apply(context, args)
      pending = false
    } else {
      pending = true
    }

    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      if (trail && pending) {
        pending = false
        fn.apply(context, lastArgs)
      }
      pending = false
    }, ms)
  }

  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    pending = false
  }

  return debounced
}

function makeThrottle(fn, ms, opts) {
  const { leading: lead, trailing: trail } = opts
  let lastTime = 0
  let timer = null
  let lastArgs = null
  let context = null

  function invoke() {
    lastTime = Date.now()
    fn.apply(context, lastArgs)
  }

  function throttled(...args) {
    context = this
    lastArgs = args
    const now = Date.now()
    if (!lastTime && !lead) lastTime = now
    const remaining = ms - (now - lastTime)

    if (remaining <= 0 || remaining > ms) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      invoke()
    } else if (!timer && trail) {
      timer = setTimeout(() => {
        timer = null
        invoke()
      }, remaining)
    }
  }

  throttled.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    lastTime = 0
  }

  return throttled
}

function pushEvent(type) {
  if (!testStart) return
  events.value.push({ t: performance.now() - testStart, type })
  if (events.value.length > 300) events.value.shift()
}

function buildRunner() {
  if (runner && runner.cancel) runner.cancel()
  const onExec = () => {
    execCount.value += 1
    pushEvent('exec')
  }
  const opts = { leading: leading.value, trailing: trailing.value }
  runner = mode.value === 'debounce'
    ? makeDebounce(onExec, waitMs.value, opts)
    : makeThrottle(onExec, waitMs.value, opts)
}

function startClock() {
  if (clockTimer) return
  clockTimer = setInterval(() => {
    nowMs.value = performance.now() - testStart
    if (!running.value && nowMs.value - lastEventTime.value > waitMs.value + 1200) {
      stopClock()
    }
  }, 50)
}

function stopClock() {
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }
}

function triggerOnce() {
  if (invalidOptions.value) {
    error.value = '请至少开启 leading 或 trailing 之一'
    return
  }
  error.value = ''
  success.value = ''

  if (rawCount.value === 0) {
    testStart = performance.now()
    nowMs.value = 0
    startClock()
  }

  rawCount.value += 1
  pushEvent('trigger')
  runner()
}

function stopBurst() {
  if (burstTimer) {
    clearInterval(burstTimer)
    burstTimer = null
  }
  if (endTimer) {
    clearTimeout(endTimer)
    endTimer = null
  }
  running.value = false
}

function burst() {
  if (invalidOptions.value) {
    error.value = '请至少开启 leading 或 trailing 之一'
    return
  }
  resetSession(false)
  error.value = ''
  success.value = ''
  running.value = true

  let fired = 0
  const total = 8
  burstTimer = setInterval(() => {
    triggerOnce()
    fired += 1
    if (fired >= total) {
      clearInterval(burstTimer)
      burstTimer = null
      endTimer = setTimeout(() => {
        endTimer = null
        running.value = false
        success.value = `已连续触发 ${total} 次，实际执行 ${execCount.value} 次`
        setTimeout(() => { success.value = '' }, 3000)
      }, waitMs.value + 250)
    }
  }, 80)
}

function resetSession(showMsg = true) {
  stopBurst()
  if (runner && runner.cancel) runner.cancel()
  execCount.value = 0
  events.value = []
  rawCount.value = 0
  nowMs.value = 0
  testStart = 0
  stopClock()
  buildRunner()
  if (showMsg) {
    success.value = '测试面板已重置'
    setTimeout(() => { success.value = '' }, 1800)
  }
}

function normalizeWait() {
  wait.value = waitMs.value
}

function applyPreset(kind) {
  if (kind === 'debounce') {
    mode.value = 'debounce'
    wait.value = 300
    leading.value = false
    trailing.value = true
  } else if (kind === 'throttle') {
    mode.value = 'throttle'
    wait.value = 100
    leading.value = true
    trailing.value = true
  } else {
    mode.value = 'debounce'
    wait.value = 800
    leading.value = true
    trailing.value = false
  }
  resetSession(false)
  success.value = '已套用预设参数'
  setTimeout(() => { success.value = '' }, 1800)
}

/* ===== 代码生成 ===== */

const generatedCode = computed(() => {
  const opts = `{ leading: ${leading.value}, trailing: ${trailing.value} }`
  if (mode.value === 'debounce') {
    return `/**
 * 防抖（Debounce）
 * 连续触发时只在停止触发 ${waitMs.value}ms 后执行一次。
 * @param {Function} fn   目标函数
 * @param {number}   wait 等待时间（毫秒）
 * @param {{ leading?: boolean, trailing?: boolean }} options
 */
function debounce(fn, wait, options = {}) {
  const { leading = false, trailing = true } = options
  let timer = null
  let lastArgs = null
  let context = null
  let pending = false

  function debounced(...args) {
    const isFirst = timer === null
    lastArgs = args
    context = this

    // 首次触发且开启 leading：立即执行
    if (isFirst && leading) {
      fn.apply(context, args)
      pending = false
    } else {
      pending = true
    }

    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      // 结束时若开启 trailing 且有挂起的调用
      if (trailing && pending) {
        pending = false
        fn.apply(context, lastArgs)
      }
      pending = false
    }, wait)
  }

  // 取消尚未执行的调用
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    pending = false
  }

  return debounced
}

// 使用示例
const onSearch = debounce((keyword) => {
  console.log('请求搜索接口:', keyword)
}, ${waitMs.value}, ${opts})

// 需要时取消等待中的调用
// onSearch.cancel()
`
  }

  return `/**
 * 节流（Throttle）
 * 连续触发时每 ${waitMs.value}ms 最多执行一次。
 * @param {Function} fn   目标函数
 * @param {number}   wait 时间窗口（毫秒）
 * @param {{ leading?: boolean, trailing?: boolean }} options
 */
function throttle(fn, wait, options = {}) {
  const { leading = true, trailing = true } = options
  let lastTime = 0
  let timer = null
  let lastArgs = null
  let context = null

  function invoke() {
    lastTime = Date.now()
    fn.apply(context, lastArgs)
  }

  function throttled(...args) {
    context = this
    lastArgs = args
    const now = Date.now()
    if (!lastTime && !leading) lastTime = now
    const remaining = wait - (now - lastTime)

    if (remaining <= 0 || remaining > wait) {
      // 窗口已过：立即执行
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      invoke()
    } else if (!timer && trailing) {
      // 窗口末尾补执行最后一次
      timer = setTimeout(() => {
        timer = null
        invoke()
      }, remaining)
    }
  }

  // 取消尚未执行的调用
  throttled.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    lastTime = 0
  }

  return throttled
}

// 使用示例
const onScroll = throttle((event) => {
  console.log('滚动位置:', window.scrollY)
}, ${waitMs.value}, ${opts})

// 需要时取消等待中的调用
// onScroll.cancel()
`
})

/* ===== 复制 ===== */

async function copyCode() {
  if (await copyText(generatedCode.value)) {
    success.value = '代码已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动选择复制'
  }
}

async function copyConfig() {
  const cfg = [
    `模式: ${mode.value === 'debounce' ? 'debounce（防抖）' : 'throttle（节流）'}`,
    `等待时间: ${waitMs.value}ms`,
    `leading: ${leading.value}`,
    `trailing: ${trailing.value}`
  ].join('\n')
  if (await copyText(cfg)) {
    success.value = '参数已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动选择复制'
  }
}

/* ===== 生命周期 ===== */

watch([mode, wait, leading, trailing], () => {
  resetQuietly()
  buildRunner()
  saveToolPrefs('debounce-throttle', {
    mode: mode.value,
    wait: waitMs.value,
    leading: leading.value,
    trailing: trailing.value
  })
})

/* 参数变化时清空上一次的测试记录，避免时间轴误导 */
function resetQuietly() {
  stopBurst()
  rawCount.value = 0
  execCount.value = 0
  events.value = []
  nowMs.value = 0
  testStart = 0
  stopClock()
}

onMounted(() => {
  const saved = loadToolPrefs('debounce-throttle')
  if (saved) {
    if (saved.mode === 'debounce' || saved.mode === 'throttle') mode.value = saved.mode
    if (saved.wait !== undefined) wait.value = saved.wait
    if (typeof saved.leading === 'boolean') leading.value = saved.leading
    if (typeof saved.trailing === 'boolean') trailing.value = saved.trailing
  }
  buildRunner()
})

onBeforeUnmount(() => {
  stopBurst()
  stopClock()
  if (runner && runner.cancel) runner.cancel()
})
</script>

<style scoped>
/* === 等待时间行 === */
.wait-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wait-row .range-input {
  flex: 1;
  min-width: 0;
}

.wait-number {
  width: 96px;
  flex-shrink: 0;
  text-align: center;
}

/* === 行为说明 === */
.behavior-box {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin: 12px 0;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-left: 2px solid var(--green);
  background: var(--green-soft);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.7;
  color: var(--text);
}

.behavior-box.invalid {
  border-left-color: var(--red);
  background: var(--panel-2);
  color: var(--red);
}

.behavior-key {
  flex-shrink: 0;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* === 预设 === */
.preset-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.preset-row .tool-button {
  flex: 1;
  padding: 8px 6px;
  font-size: 12px;
}

/* === 代码输出 === */
.code-wrap {
  height: 100%;
}

.code-wrap .code-input {
  font-size: 12px;
  line-height: 1.6;
  tab-size: 2;
}

/* === 测试面板 === */
.test-panel {
  margin-top: 18px;
  padding: 14px;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.test-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.test-title {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--green);
  text-transform: uppercase;
}

.test-scale {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

/* === 统计 === */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.stat-item {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 10px 6px;
  text-align: center;
  min-width: 0;
}

.stat-label {
  display: block;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stat-value {
  display: block;
  font-family: var(--mono);
  font-size: 18px;
  color: var(--green);
  margin-top: 4px;
}

/* === 信号时间轴 === */
.signal-board {
  padding: 10px 0 0;
}

.lane-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.lane-name {
  width: 40px;
  flex-shrink: 0;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-align: right;
}

.lane {
  position: relative;
  flex: 1;
  height: 34px;
  min-width: 0;
  border: 1px solid var(--line);
  border-left-color: var(--line-strong, var(--line));
  background-color: var(--panel);
  background-image: linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 25% 100%;
  overflow: hidden;
}

.tick {
  position: absolute;
  top: 50%;
  transform: translate(-1px, -50%);
  width: 2px;
}

.tick-trigger {
  height: 20px;
  background: var(--muted);
}

.tick-exec {
  height: 28px;
  background: var(--green);
  box-shadow: 0 0 8px var(--green-glow);
}

.lane-empty {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

.lane-axis {
  position: relative;
  height: 16px;
  margin-left: 50px;
  margin-right: 2px;
}

.axis-label {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-family: var(--mono);
  font-size: 10px;
  color: var(--muted);
  white-space: nowrap;
}

/* === 图例 & 日志 === */
.legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-top: 10px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-mark {
  display: inline-block;
  width: 3px;
  height: 12px;
}

.legend-mark.trigger {
  background: var(--muted);
}

.legend-mark.exec {
  background: var(--green);
  box-shadow: 0 0 8px var(--green-glow);
}

.legend-tip {
  margin-left: auto;
}

.event-log {
  margin-top: 12px;
  border-top: 1px dashed var(--line);
  padding-top: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.event-line {
  display: flex;
  gap: 12px;
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.7;
}

.event-time {
  color: var(--muted);
  width: 56px;
  flex-shrink: 0;
}

.event-type.trigger {
  color: var(--muted);
}

.event-type.exec {
  color: var(--green);
}

@media (max-width: 640px) {
  .wait-row {
    flex-wrap: wrap;
  }

  .wait-number {
    width: 100%;
  }

  .preset-row {
    flex-wrap: wrap;
  }

  .preset-row .tool-button {
    flex: 1 1 45%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .legend-tip {
    margin-left: 0;
    width: 100%;
  }
}
</style>
