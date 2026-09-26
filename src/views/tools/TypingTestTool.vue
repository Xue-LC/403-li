<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>⌨️ 打字速度测试</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- ✅ 双栏布局：桌面端左右并排，移动端上下堆叠 -->
        <div class="tool-two-col">
          <!-- ===== 左栏：练习文本 + 配置 ===== -->
          <div class="tool-col">
            <label class="tool-label">练习文本（留空则使用随机语料）：</label>
            <div class="input-with-copy">
              <textarea
                v-model="customText"
                class="code-input practice-input"
                :disabled="status === 'running'"
                rows="7"
                spellcheck="false"
                placeholder="粘贴你想练习的文本（留空则随机抽取内置语料）&#10;换行和连续空格会自动规范为一个空格"
              ></textarea>
              <button class="copy-btn" title="复制练习文本" @click="copyTarget">📋</button>
            </div>

            <label class="tool-label">测试时长：</label>
            <div class="radio-group">
              <label v-for="d in DURATIONS" :key="d.value" class="radio-label">
                <input
                  type="radio"
                  :value="d.value"
                  v-model.number="duration"
                  :disabled="status === 'running'"
                />
                <span>{{ d.label }}</span>
              </label>
            </div>

            <label class="tool-label">选项：</label>
            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="showCurve" />
                <span>显示实时 WPM 曲线</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="showCursor" />
                <span>高亮当前字符光标</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="instantFeedback" />
                <span>逐字标红错误（关闭则只统计不标红）</span>
              </label>
            </div>

            <div class="tip-box">
              提示：点击打字区或输入框即可开始，<kbd>Esc</kbd> 重新开始。
              1 WPM = 每分钟正确输入 5 个字符。
            </div>
          </div>

          <!-- ===== 右栏：打字区 + 实时统计 + 报告 ===== -->
          <div class="tool-col">
            <label class="tool-label">
              打字区域（{{ target.length }} 字符 · 剩余 {{ timeText }}）：
            </label>
            <div ref="textBoxRef" class="typing-box" :class="{ 'show-cursor': showCursor }" @click="focusInput">
              <div class="typing-text">
                <span
                  v-for="(c, i) in charList"
                  :key="i"
                  class="ch"
                  :class="[charClass(c), { cursor: c.cursor && status !== 'finished' }]"
                >{{ c.ch }}</span>
              </div>
            </div>

            <input
              ref="inputRef"
              class="code-input-sm typing-input"
              :class="{ ready: status === 'idle' }"
              :value="typed"
              :disabled="status === 'finished'"
              type="text"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              :placeholder="inputPlaceholder"
              @input="onInput"
              @keydown.esc.prevent="restart"
              @compositionstart="composing = true"
              @compositionend="onCompositionEnd"
            />

            <div class="output-toolbar">
              <span class="output-meta">实时统计 · {{ statusLabel }}</span>
              <button class="copy-btn-inline" title="复制统计报告" @click="copyReport">📋</button>
            </div>
            <div class="stats-grid">
              <div v-for="s in statItems" :key="s.label" class="stat-item">
                <span class="stat-label">{{ s.label }}</span>
                <span class="stat-value" :class="{ bad: s.bad }">{{ s.value }}</span>
              </div>
            </div>

            <div class="report-box">
              <pre v-if="report" class="report-text">{{ report }}</pre>
              <div v-else class="report-empty">完成一次测试后，这里会生成统计报告…</div>
            </div>
          </div>

          <!-- ===== 跨两栏：WPM 曲线 ===== -->
          <div v-if="showCurve" class="tool-col tool-col--full">
            <label class="tool-label">每秒 WPM 曲线：</label>
            <div class="curve-wrapper">
              <canvas ref="canvasRef"></canvas>
            </div>
          </div>
        </div>

        <!-- ✅ 全宽区域：按钮 + 状态提示 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" :disabled="status === 'running'" @click="start">
            ▶ 开始测试
          </button>
          <button class="tool-button" @click="restart">↻ 重新开始</button>
          <button class="tool-button" :disabled="status !== 'running'" @click="finish">⏹ 结束统计</button>
          <button class="tool-button" @click="rerollText">🎲 换一篇文本</button>
        </div>
        <div class="button-group">
          <button class="tool-button danger full-width" @click="clearCustom">🗑️ 清空自定义文本</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

defineOptions({ name: 'TypingTestTool' })

/* ---------- 常量 ---------- */
const DURATIONS = [
  { value: 15, label: '15 秒' },
  { value: 30, label: '30 秒' },
  { value: 60, label: '60 秒' },
  { value: 120, label: '120 秒' }
]

const MAX_CHARS = 1200
const BEST_KEY = '403li-typing-best-'

/* 内置英文语料（含大小写、标点、数字，便于练手） */
const CORPUS = [
  'The quick brown fox jumps over the lazy dog while the sun sets slowly behind the quiet hills.',
  'A good programmer always looks both ways before crossing a one way street.',
  'Simplicity is the soul of efficiency, and clarity is the foundation of maintainable code.',
  'Testing leads to failure, and failure leads to understanding what you really built.',
  'Programs must be written for people to read, and only incidentally for machines to execute.',
  'The best error message is the one that never shows up because the bug never shipped.',
  'Talk is cheap. Show me the code.',
  'First solve the problem, then write the code, and only then refactor it with care.',
  'In the middle of difficulty lies opportunity, so keep typing and never stop learning.',
  'Any fool can write code that a computer understands; good programmers write code humans understand.',
  'Numbers matter: 2026, 3.14159, 42, and 100 percent focus on accuracy before speed.',
  'Keyboard, monitor, coffee, and a quiet room: the four pillars of deep work.',
  'Measure twice, cut once, and always read the manual before trusting your memory.',
  'A clean git history tells a story that any teammate can read six months later.'
]

/* ---------- 状态 ---------- */
const customText = ref('')
const duration = ref(60)
const showCurve = ref(true)
const showCursor = ref(true)
const instantFeedback = ref(true)

const status = ref('idle') // idle | running | finished
const typed = ref('')
const remaining = ref(60)
const samples = ref([])
const finalStats = ref(null)
const rerollSeed = ref(1)

const error = ref('')
const success = ref('')

const inputRef = ref(null)
const textBoxRef = ref(null)
const canvasRef = ref(null)

let timerId = null
let startTs = 0
let lastSampleSec = 0
let composing = false
let successTimer = null
let drawRaf = 0

/* ---------- 练习文本 ---------- */
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildText(seed) {
  const rand = mulberry32(seed * 9301 + 49297)
  const pool = [...CORPUS]
  const picked = []
  let len = 0
  while (picked.length < 6 && len < 240) {
    if (!pool.length) pool.push(...CORPUS)
    const idx = Math.floor(rand() * pool.length)
    const s = pool.splice(idx, 1)[0]
    picked.push(s)
    len += s.length + 1
  }
  return picked.join(' ')
}

/* 练习文本：自定义优先，否则按 rerollSeed 抽取内置语料 */
const target = computed(() => {
  const custom = String(customText.value || '').replace(/\s+/g, ' ').trim()
  if (custom) return custom.slice(0, MAX_CHARS)
  return buildText(rerollSeed.value)
})

/* ---------- 字符渲染 ---------- */
const charList = computed(() => {
  const t = target.value
  const p = typed.value
  const out = new Array(t.length)
  for (let i = 0; i < t.length; i++) {
    let state = 'pending'
    if (i < p.length) state = p[i] === t[i] ? 'correct' : 'wrong'
    out[i] = { ch: t[i], state, cursor: i === p.length }
  }
  return out
})

function charClass(c) {
  if (c.state === 'wrong' && !instantFeedback.value) return 'pending'
  return c.state
}

const inputPlaceholder = computed(() => {
  if (status.value === 'running') return '开始输入…（Esc 重新开始）'
  if (status.value === 'finished') return '测试已结束，点「重新开始」再练一次'
  return '点击这里开始输入，第一下按键即开始计时…'
})

/* ---------- 统计计算 ---------- */
const typedLen = computed(() => typed.value.length)

const correctCount = computed(() => {
  const t = typed.value
  const g = target.value
  let n = 0
  for (let i = 0; i < t.length; i++) if (t[i] === g[i]) n++
  return n
})

const wrongCount = computed(() => typedLen.value - correctCount.value)

function elapsedSeconds() {
  if (!startTs) return 0
  return (performance.now() - startTs) / 1000
}

const liveStats = computed(() => {
  const finished = status.value === 'finished' && finalStats.value
  const elapsed = finished ? finalStats.value.elapsed : elapsedSeconds()
  // 用时下限 1 秒：避免极短文本（<1s 打完）算出天文数字的 WPM
  const minutes = Math.max(elapsed, 1) / 60
  const net = minutes > 0 ? correctCount.value / 5 / minutes : 0
  const raw = minutes > 0 ? typedLen.value / 5 / minutes : 0
  const acc = typedLen.value > 0 ? (correctCount.value / typedLen.value) * 100 : 100
  return {
    elapsed,
    net,
    raw,
    acc: typedLen.value > 0 ? acc : 0,
    correct: correctCount.value,
    wrong: wrongCount.value,
    typed: typedLen.value,
    // 用时不足 3 秒的完成样本，速度数值无参考意义
    reliable: !(status.value === 'finished' && elapsed < 3)
  }
})

const progress = computed(() => {
  const st = liveStats.value
  if (status.value === 'idle') return 0
  const byTime = st.elapsed / duration.value
  const byText = target.value.length ? st.typed / target.value.length : 0
  return Math.min(100, Math.max(0, Math.max(byTime, byText) * 100))
})

const timeText = computed(() => {
  const s = Math.max(0, Math.ceil(remaining.value))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
})

const bestWpm = ref(0)

const statItems = computed(() => {
  const st = liveStats.value
  const dash = st.reliable ? null : '—'
  return [
    { label: '速度 WPM', value: dash || st.net.toFixed(1) },
    { label: '原始 WPM', value: dash || st.raw.toFixed(1) },
    { label: '准确率', value: `${st.acc.toFixed(1)}%`, bad: st.acc < 90 && st.typed > 0 },
    { label: '正确 / 错误', value: `${st.correct} / ${st.wrong}`, bad: st.wrong > 0 },
    { label: '剩余时间', value: timeText.value },
    { label: '进度', value: `${progress.value.toFixed(0)}%` }
  ]
})

const statusLabel = computed(() => {
  if (status.value === 'running') return '计时中…'
  if (status.value === 'finished') return '测试完成'
  return '等待开始'
})

/* ---------- 报告 ---------- */
const report = computed(() => {
  if (status.value !== 'finished' || !finalStats.value) return ''
  const st = liveStats.value
  const used = Math.min(finalStats.value.elapsed, duration.value)
  const lines = [
    '=== 打字速度测试报告 ===',
    `练习文本长度 : ${target.value.length} 字符`,
    `实际用时     : ${used.toFixed(1)} 秒（设定 ${duration.value} 秒）`,
    `已输入       : ${st.typed} 字符（完成度 ${((st.typed / target.value.length) * 100).toFixed(1)}%）`,
    `正确 / 错误  : ${st.correct} / ${st.wrong}`,
    `准确率       : ${st.acc.toFixed(1)}%`,
    `速度 WPM     : ${
      st.reliable ? `${st.net.toFixed(1)}（原始 ${st.raw.toFixed(1)}，1 WPM = 每分钟 5 个正确字符）` : '—（样本过短，不计入）'
    }`,
    `最佳记录 WPM : ${bestWpm.value.toFixed(1)}（${duration.value} 秒档）`
  ]
  if (used < 3) {
    lines.push('⚠ 本次用时不足 3 秒（文本过短），WPM 与纪录不计入，建议换更长的练习文本')
  }
  if (samples.value.length > 1 && st.reliable) {
    lines.push('每秒 WPM   : ' + samples.value.map((s) => s.wpm.toFixed(0)).join(', '))
  }
  return lines.join('\n')
})

/* ---------- 计时与输入 ---------- */
function focusInput() {
  if (status.value === 'finished') return
  nextTick(() => inputRef.value && inputRef.value.focus())
}

function reset() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
  status.value = 'idle'
  typed.value = ''
  finalStats.value = null
  samples.value = []
  remaining.value = duration.value
  startTs = 0
  lastSampleSec = 0
  scheduleDraw()
}

function start() {
  if (!target.value.length) {
    flashError('练习文本为空，请先输入练习内容或点「换一篇文本」')
    return
  }
  reset()
  status.value = 'running'
  startTs = performance.now()
  remaining.value = duration.value
  samples.value = [{ sec: 0, wpm: 0, raw: 0, errors: 0 }]
  timerId = setInterval(tick, 100)
  focusInput()
  scheduleDraw()
}

/* start() 内部已先 reset()，无需重复清理 */
const restart = start

function tick() {
  const elapsed = elapsedSeconds()
  remaining.value = Math.max(0, duration.value - elapsed)
  const sec = Math.floor(elapsed)
  if (sec > lastSampleSec) {
    lastSampleSec = sec
    const minutes = elapsed / 60
    const net = minutes > 0 ? correctCount.value / 5 / minutes : 0
    const raw = minutes > 0 ? typed.value.length / 5 / minutes : 0
    samples.value = [...samples.value, { sec, wpm: net, raw, errors: wrongCount.value }]
    scheduleDraw()
  }
  if (duration.value - elapsed <= 0) finish()
}

function onInput(e) {
  if (composing) return
  applyTyped(e.target.value)
}

function onCompositionEnd(e) {
  composing = false
  applyTyped(e.target.value)
}

function applyTyped(raw) {
  if (status.value === 'finished') {
    if (inputRef.value) inputRef.value.value = typed.value
    return
  }
  let val = String(raw)
  const limit = target.value.length
  if (val.length > limit) val = val.slice(0, limit)
  if (status.value === 'idle' && val.length > 0) start()
  typed.value = val
  if (inputRef.value && inputRef.value.value !== val) inputRef.value.value = val
  if (val.length >= limit && limit > 0) finish()
}

function finish() {
  if (status.value !== 'running') return
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
  const rawElapsed = elapsedSeconds()
  const elapsed = Math.min(rawElapsed > 0 ? rawElapsed : 0.05, duration.value)
  status.value = 'finished'
  remaining.value = Math.max(0, duration.value - elapsed)
  finalStats.value = { elapsed }
  // 与 liveStats 一致：低于 1 秒按 1 秒计，避免天文数字
  const minutes = Math.max(elapsed, 1) / 60
  const net = correctCount.value / 5 / minutes
  const raw = typed.value.length / 5 / minutes
  samples.value = [
    ...samples.value,
    { sec: Math.round(elapsed * 10) / 10, wpm: net, raw, errors: wrongCount.value }
  ]
  // 用时过短的样本不写入历史纪录，避免刷分
  if (elapsed >= 3) saveBest(net)
  scheduleDraw()
}

function saveBest(wpm) {
  try {
    const key = BEST_KEY + duration.value
    const prev = parseFloat(localStorage.getItem(key) || '0') || 0
    if (wpm > prev) {
      localStorage.setItem(key, String(wpm))
      bestWpm.value = wpm
      flashSuccess(`新纪录！${duration.value} 秒档最佳 WPM：${wpm.toFixed(1)}`)
    } else {
      bestWpm.value = prev
    }
  } catch {
    /* localStorage 不可用时忽略 */
  }
}

function loadBest() {
  try {
    const prev = parseFloat(localStorage.getItem(BEST_KEY + duration.value) || '0') || 0
    bestWpm.value = prev
  } catch {
    bestWpm.value = 0
  }
}

/* ---------- 文本切换 ---------- */
function rerollText() {
  if (customText.value.trim()) {
    flashError('当前使用自定义文本，清空左侧文本后才能切换内置语料')
    return
  }
  rerollSeed.value += 1
  flashSuccess('已换一篇练习文本')
}

function clearCustom() {
  customText.value = ''
  rerollSeed.value += 1
  flashSuccess('已清空自定义文本，使用内置语料')
}

/* ---------- 复制 ---------- */
async function copyTarget() {
  if (!target.value) {
    flashError('练习文本为空，无可复制内容')
    return
  }
  const ok = await copyText(target.value)
  if (ok) flashSuccess('练习文本已复制到剪贴板')
  else flashError('复制失败，请手动选择复制')
}

async function copyReport() {
  if (!report.value) {
    flashError('还没有统计报告，先完成一次测试吧')
    return
  }
  const ok = await copyText(report.value)
  if (ok) flashSuccess('统计报告已复制到剪贴板')
  else flashError('复制失败，请手动选择复制')
}

/* ---------- 提示 ---------- */
function flashSuccess(msg) {
  success.value = msg
  error.value = ''
  clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2200)
}

function flashError(msg) {
  error.value = msg
  success.value = ''
  clearTimeout(successTimer)
  successTimer = setTimeout(() => (error.value = ''), 2600)
}

/* ---------- WPM 曲线 ---------- */
function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function scheduleDraw() {
  if (drawRaf) return
  drawRaf = requestAnimationFrame(() => {
    drawRaf = 0
    drawCurve()
  })
}

function drawCurve() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth || 600
  const h = canvas.clientHeight || 150
  canvas.width = Math.max(1, Math.round(w * dpr))
  canvas.height = Math.max(1, Math.round(h * dpr))
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const green = cssVar('--green', '#9dff6b')
  const line = cssVar('--line', '#30363d')
  const muted = cssVar('--muted', '#8b949e')
  const panel2 = cssVar('--panel-2', '#0f1317')

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = panel2
  ctx.fillRect(0, 0, w, h)

  const pad = { l: 40, r: 12, t: 12, b: 22 }
  const plotW = Math.max(10, w - pad.l - pad.r)
  const plotH = Math.max(10, h - pad.t - pad.b)

  const data = samples.value
  const maxVal = Math.max(40, ...data.map((s) => s.wpm)) * 1.15

  // 网格 + Y 轴刻度
  ctx.strokeStyle = line
  ctx.fillStyle = muted
  ctx.lineWidth = 1
  ctx.font = '10px monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  const rows = 4
  for (let i = 0; i <= rows; i++) {
    const y = pad.t + (plotH * i) / rows
    ctx.beginPath()
    ctx.moveTo(pad.l, y + 0.5)
    ctx.lineTo(pad.l + plotW, y + 0.5)
    ctx.stroke()
    const label = Math.round(maxVal - (maxVal * i) / rows)
    ctx.fillText(String(label), pad.l - 6, y)
  }

  if (!data.length) {
    ctx.fillStyle = muted
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('开始测试后实时绘制每秒 WPM', pad.l + plotW / 2, pad.t + plotH / 2)
    return
  }

  const n = data.length
  const xOf = (i) => pad.l + (n <= 1 ? 0 : (plotW * i) / (n - 1))
  const yOf = (v) => pad.t + plotH - (plotH * Math.min(v, maxVal)) / maxVal

  // 曲线填充
  ctx.beginPath()
  ctx.moveTo(xOf(0), yOf(data[0].wpm))
  for (let i = 1; i < n; i++) ctx.lineTo(xOf(i), yOf(data[i].wpm))
  ctx.lineTo(xOf(n - 1), pad.t + plotH)
  ctx.lineTo(xOf(0), pad.t + plotH)
  ctx.closePath()
  ctx.fillStyle = 'rgba(157,255,107,0.10)'
  ctx.fill()

  // 曲线
  ctx.beginPath()
  ctx.moveTo(xOf(0), yOf(data[0].wpm))
  for (let i = 1; i < n; i++) ctx.lineTo(xOf(i), yOf(data[i].wpm))
  ctx.strokeStyle = green
  ctx.lineWidth = 2
  ctx.stroke()

  // 数据点
  ctx.fillStyle = green
  for (let i = 0; i < n; i++) {
    ctx.beginPath()
    ctx.arc(xOf(i), yOf(data[i].wpm), n > 60 ? 1.2 : 2.2, 0, Math.PI * 2)
    ctx.fill()
  }

  // 最新值标注
  ctx.fillStyle = green
  ctx.font = '11px monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(`${data[n - 1].wpm.toFixed(0)} WPM`, pad.l + 4, pad.t + 2)
}

function handleResize() {
  scheduleDraw()
}

/* ---------- 生命周期 ---------- */
watch(duration, () => {
  loadBest()
  reset()
})

watch(target, () => {
  reset()
})

watch(showCurve, () => {
  nextTick(scheduleDraw)
})

watch(typed, () => {
  if (status.value !== 'running' || !showCursor.value) return
  nextTick(() => {
    const box = textBoxRef.value
    if (!box) return
    const el = box.querySelector('.ch.cursor')
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
  })
})

let themeObserver = null

onMounted(() => {
  loadBest()
  scheduleDraw()
  window.addEventListener('resize', handleResize)
  if (window.MutationObserver) {
    themeObserver = new MutationObserver(scheduleDraw)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  }
})

onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId)
  clearTimeout(successTimer)
  if (drawRaf) cancelAnimationFrame(drawRaf)
  window.removeEventListener('resize', handleResize)
  if (themeObserver) themeObserver.disconnect()
})
</script>

<style scoped>
/* 左侧练习文本域：避免被全局 height:100% 拉到过高 */
.tool-col .input-with-copy {
  align-items: stretch;
}

.tool-col .input-with-copy .practice-input {
  height: auto;
  min-height: 140px;
  resize: vertical;
}

.tool-col .input-with-copy .practice-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-box {
  margin-top: 4px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.7;
}

.tip-box kbd {
  border: 1px solid var(--line-strong);
  background: var(--panel-2);
  color: var(--green);
  padding: 1px 5px;
  font-family: var(--mono);
  font-size: 11px;
}

/* 打字区 */
.typing-box {
  border: 1px solid var(--line-strong);
  background: var(--green-soft);
  padding: 14px;
  min-height: 160px;
  max-height: 44vh;
  overflow: auto;
  cursor: text;
}

.typing-text {
  font-family: var(--mono);
  font-size: 17px;
  line-height: 1.9;
  letter-spacing: 0.02em;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
}

.typing-text .ch {
  color: var(--muted);
  transition: color 0.1s;
}

.typing-text .ch.correct {
  color: var(--green);
}

.typing-text .ch.wrong {
  color: var(--red);
  background: rgba(255, 138, 138, 0.14);
  text-decoration: underline;
}

.typing-text .ch.pending {
  color: var(--muted);
}

.typing-text .ch.cursor {
  border-left: 2px solid transparent;
}

.show-cursor .typing-text .ch.cursor {
  border-left-color: var(--green);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    border-left-color: var(--green);
  }
  50% {
    border-left-color: transparent;
  }
}

/* 输入框 */
.tool-col .typing-input {
  height: 46px;
  line-height: 46px;
  font-size: 15px;
  padding: 0 12px;
}

.tool-col .typing-input.ready {
  border-color: var(--line-strong);
}

/* 输出区工具条 */
.output-toolbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 6px 40px 6px 10px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  min-height: 34px;
  margin-top: 4px;
}

.output-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn-inline {
  position: absolute;
  top: 4px;
  right: 6px;
  background: transparent;
  border: none;
  color: var(--green);
  cursor: pointer;
  font-size: 15px;
  padding: 2px 4px;
  border-radius: 0;
}

.copy-btn-inline:hover {
  transform: scale(1.15);
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stat-label {
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--muted);
  font-family: var(--mono);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--mono);
  font-size: 15px;
  color: var(--green);
  word-break: break-all;
}

.stat-value.bad {
  color: var(--red);
}

/* 报告 */
.report-box {
  border: 1px solid var(--line-strong);
  background: var(--panel-2);
  overflow: auto;
  max-height: 30vh;
}

.report-text {
  margin: 0;
  padding: 12px;
  font-family: var(--mono);
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--green);
  white-space: pre-wrap;
  word-break: break-word;
}

.report-empty {
  padding: 14px 12px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
}

/* 曲线 */
.curve-wrapper {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 6px;
}

.curve-wrapper canvas {
  display: block;
  width: 100%;
  height: 160px;
  background: var(--panel-2);
}

@media (min-width: 900px) {
  .report-box {
    max-height: none;
  }
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .typing-text {
    font-size: 15px;
    line-height: 1.8;
  }
  .typing-box {
    padding: 10px;
    max-height: 38vh;
  }
  .stat-value {
    font-size: 14px;
  }
  .report-text {
    font-size: 12px;
    padding: 10px;
  }
  .curve-wrapper canvas {
    height: 130px;
  }
}
</style>
