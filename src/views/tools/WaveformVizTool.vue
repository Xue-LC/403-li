<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎚️ 波形音频可视化器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- ✅ 双栏：左=控制面板，右=实时画布预览 -->
        <div class="tool-two-col">
          <!-- 左栏：来源 / 模式 / 参数 / 配色 -->
          <div class="tool-col">
            <label class="tool-label">音频来源</label>
            <div class="button-group button-group-2">
              <button class="tool-button" :class="{ primary: source === 'file' }" @click="pickFile">
                📁 上传音频
              </button>
              <button class="tool-button" :class="{ primary: source === 'mic' }" @click="toggleMic">
                {{ micActive ? '⏹ 停止麦克风' : '🎙️ 麦克风' }}
              </button>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="audio/*"
              class="hidden-file"
              @change="handleFile"
            />
            <div class="source-info">
              <span class="dot" :class="source === 'mic' ? 'on' : ''"></span>
              <span v-if="source === 'mic'">麦克风实时输入</span>
              <span v-else-if="fileName" :title="fileName">{{ fileName }}</span>
              <span v-else>未选择音频文件</span>
            </div>

            <label class="tool-label">可视化模式</label>
            <div class="radio-group">
              <label v-for="m in MODES" :key="m.key" class="radio-label">
                <input type="radio" v-model="mode" :value="m.key" />
                <span>{{ m.label }}</span>
              </label>
            </div>

            <label class="tool-label">FFT 大小：{{ fftSize }}</label>
            <div class="radio-group">
              <label v-for="n in FFT_SIZES" :key="n" class="radio-label">
                <input type="radio" v-model.number="fftSize" :value="n" @change="applyFft" />
                <span>{{ n }}</span>
              </label>
            </div>

            <label class="tool-label">平滑度：{{ smoothing.toFixed(2) }}</label>
            <div class="slider-row">
              <input
                type="range"
                class="range-input"
                v-model.number="smoothing"
                min="0"
                max="0.95"
                step="0.05"
                @input="applySmoothing"
              />
              <span class="range-value">{{ smoothing.toFixed(2) }}</span>
            </div>

            <label class="tool-label">显示增益：{{ gain.toFixed(1) }}×</label>
            <div class="slider-row">
              <input type="range" class="range-input" v-model.number="gain" min="0.2" max="5" step="0.1" />
              <span class="range-value">{{ gain.toFixed(1) }}×</span>
            </div>

            <label class="tool-label">播放音量：{{ volume }}%</label>
            <div class="slider-row">
              <input
                type="range"
                class="range-input"
                v-model.number="volume"
                min="0"
                max="100"
                step="1"
                @input="applyVolume"
              />
              <span class="range-value">{{ volume }}%</span>
            </div>

            <label class="tool-label">配色方案</label>
            <div class="scheme-grid">
              <button
                v-for="s in schemes"
                :key="s.key"
                class="scheme-btn"
                :class="{ active: schemeKey === s.key }"
                :title="s.label"
                @click="schemeKey = s.key"
              >
                <span class="scheme-swatch" :style="{ background: s.swatch }"></span>
                <span class="scheme-name">{{ s.label }}</span>
              </button>
            </div>
          </div>

          <!-- 右栏：Canvas 预览 + 统计 -->
          <div class="tool-col">
            <label class="tool-label">实时波形 / 频谱</label>
            <div class="canvas-wrapper">
              <canvas ref="canvas" class="viz-canvas"></canvas>
              <div v-if="!active" class="canvas-hint">上传音频或开启麦克风后开始渲染</div>
            </div>

            <label class="tool-label">播放进度</label>
            <div class="progress-row">
              <input
                type="range"
                class="range-input"
                min="0"
                :max="duration || 0"
                step="0.05"
                :value="progress"
                :disabled="source === 'mic' || !audioBuffer"
                @input="seek"
              />
              <span class="progress-time">{{ fmtTime(progress) }} / {{ fmtTime(duration) }}</span>
            </div>

            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">状态</span>
                <span class="stat-value">{{ statusText }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">采样率</span>
                <span class="stat-value">{{ sampleRate ? sampleRate + ' Hz' : '—' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">峰值电平</span>
                <span class="stat-value">{{ levelText }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">主频</span>
                <span class="stat-value">{{ dominantText }}</span>
              </div>
            </div>

            <div class="meter">
              <div class="meter-fill" :style="{ width: level + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- ✅ 全宽按钮组 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" :disabled="source === 'mic' || !audioBuffer" @click="togglePlay">
            {{ playing ? '⏸ 暂停' : '▶ 播放' }}
          </button>
          <button class="tool-button" :disabled="!active" @click="stopAll">⏹ 停止</button>
          <button class="tool-button" @click="exportPng">💾 导出 PNG</button>
          <button class="tool-button danger" @click="resetAll">🗑️ 清空</button>
        </div>

        <div class="rule-note">
          <span class="rule-title">▶ 使用提示</span>
          <span>
            全部音频处理与渲染都在浏览器内完成，音频文件不会上传服务器。点击「上传音频」选择本地音频文件解码播放；
            点击「麦克风」授权后实时采集声音（不会回声外放）。可视化支持<strong>波形</strong>（示波器曲线）、
            <strong>频谱</strong>（填充包络）与<strong>柱状频谱</strong>三种模式，可调 FFT 大小、平滑度与显示增益，
            配色方案中使用「彩虹」会按频率动态着色。画布可随时导出为 PNG 图片。
          </span>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const MODES = [
  { key: 'waveform', label: '波形' },
  { key: 'spectrum', label: '频谱' },
  { key: 'bars', label: '柱状频谱' }
]

const FFT_SIZES = [512, 1024, 2048, 4096, 8192]

/* ---------- 状态 ---------- */
const source = ref('file') // file | mic
const mode = ref('waveform')
const fftSize = ref(2048)
const smoothing = ref(0.8)
const gain = ref(1.6)
const volume = ref(80)
const schemeKey = ref('theme')

const fileName = ref('')
const audioBuffer = ref(null)
const duration = ref(0)
const progress = ref(0)
const playing = ref(false)
const micActive = ref(false)
const active = ref(false)
const level = ref(0)
const sampleRate = ref(0)
const dominant = ref(0)
const error = ref('')
const success = ref('')

const fileInput = ref(null)
const canvas = ref(null)

/* ---------- 音频节点 ---------- */
let ctx = null
let analyser = null
let playGain = null
let masterOut = null
let bufferSource = null
let micStream = null
let micSource = null
let timeData = null
let freqData = null
let rafId = null
let startedAt = 0
let offset = 0
let manualStop = false
let resizeObserver = null
let dpr = 1
let scheme = null

/* ---------- 配色方案 ---------- */
const schemes = ref([])

function cssVar(name, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return v || fallback
  } catch (e) {
    return fallback
  }
}

function buildSchemes() {
  const green = cssVar('--green', '#9dff6b')
  schemes.value = [
    { key: 'theme', label: '主题绿', swatch: green, primary: green, secondary: green, bg: '#08110a', grid: 'rgba(157,255,107,0.12)' },
    { key: 'amber', label: '琥珀', swatch: '#ffb02e', primary: '#ffcc55', secondary: '#ff7a1a', bg: '#120d05', grid: 'rgba(255,176,46,0.12)' },
    { key: 'magenta', label: '品红', swatch: '#ff5cc8', primary: '#ff8fd8', secondary: '#ff2d6f', bg: '#140709', grid: 'rgba(255,92,200,0.12)' },
    { key: 'mono', label: '单色', swatch: '#e8f5e0', primary: '#ffffff', secondary: '#9aa79a', bg: '#0c0f0c', grid: 'rgba(232,245,224,0.1)' },
    { key: 'rainbow', label: '彩虹', swatch: 'linear-gradient(90deg,#ff5c5c,#ffd166,#9dff6b)', primary: null, secondary: null, bg: '#0a0e0b', grid: 'rgba(160,180,160,0.1)' }
  ]
  const found = schemes.value.find(s => s.key === schemeKey.value)
  scheme = found || schemes.value[0]
}

function currentScheme() {
  return schemes.value.find(s => s.key === schemeKey.value) || schemes.value[0]
}

// 为波形/频谱提供描边颜色，彩虹方案生成横向渐变（暖色→绿，避免蓝紫）
function strokeStyleFor(g, w, sc, fallback) {
  if (sc.key === 'rainbow') {
    const grad = g.createLinearGradient(0, 0, w, 0)
    grad.addColorStop(0, '#ff5c5c')
    grad.addColorStop(0.4, '#ffa93c')
    grad.addColorStop(0.7, '#ffd166')
    grad.addColorStop(1, '#9dff6b')
    return grad
  }
  return sc.primary || sc.secondary || fallback
}

/* ---------- 计算属性 ---------- */
const statusText = computed(() => {
  if (micActive.value) return '● 麦克风采集中'
  if (playing.value) return '● 播放中'
  if (audioBuffer.value) return '○ 已就绪'
  return '○ 空闲'
})
const levelText = computed(() => (active.value ? level.value + '%' : '—'))
const dominantText = computed(() => {
  if (!active.value || mode.value === 'waveform' || !dominant.value) return '—'
  return dominant.value >= 1000 ? (dominant.value / 1000).toFixed(2) + ' kHz' : Math.round(dominant.value) + ' Hz'
})

function fmtTime(sec) {
  const s = Math.max(0, sec || 0)
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  return `${m}:${String(ss).padStart(2, '0')}`
}

/* ---------- 音频上下文 ---------- */
function ensureCtx() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) throw new Error('当前浏览器不支持 Web Audio API')
  ctx = new AC()
  sampleRate.value = ctx.sampleRate

  analyser = ctx.createAnalyser()
  analyser.fftSize = fftSize.value
  analyser.smoothingTimeConstant = smoothing.value

  playGain = ctx.createGain()
  playGain.gain.value = volume.value / 100

  masterOut = ctx.createGain()
  masterOut.gain.value = 1
  masterOut.connect(ctx.destination)

  // 播放链路：source -> playGain -> analyser -> masterOut -> destination
  playGain.connect(analyser)
  analyser.connect(masterOut)

  allocData()
  return ctx
}

function allocData() {
  if (!analyser) return
  timeData = new Uint8Array(analyser.fftSize)
  freqData = new Uint8Array(analyser.frequencyBinCount)
}

function applyFft() {
  if (analyser) {
    analyser.fftSize = fftSize.value
    allocData()
  }
}

function applySmoothing() {
  if (analyser) analyser.smoothingTimeConstant = smoothing.value
}

function applyVolume() {
  if (playGain) playGain.gain.value = volume.value / 100
}

/* ---------- 文件处理 ---------- */
function pickFile() {
  stopMic()
  fileInput.value && fileInput.value.click()
}

async function handleFile(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  error.value = ''
  success.value = ''
  stopSource()
  try {
    const c = ensureCtx()
    const arrayBuf = await file.arrayBuffer()
    const buf = await c.decodeAudioData(arrayBuf.slice(0))
    audioBuffer.value = buf
    fileName.value = file.name
    duration.value = buf.duration
    progress.value = 0
    offset = 0
    source.value = 'file'
    success.value = `已加载「${file.name}」(${fmtTime(buf.duration)})，点击播放开始可视化`
  } catch (err) {
    audioBuffer.value = null
    duration.value = 0
    error.value = '音频解码失败：' + (err && err.message ? err.message : '文件格式不受支持')
  } finally {
    e.target.value = ''
  }
}

/* ---------- 播放控制（文件） ---------- */
async function togglePlay() {
  if (source.value === 'mic') return
  if (!audioBuffer.value) {
    error.value = '请先上传音频文件'
    return
  }
  error.value = ''
  try {
    const c = ensureCtx()
    if (c.state === 'suspended') await c.resume()
    if (playing.value) pause()
    else play()
  } catch (err) {
    error.value = err && err.message ? err.message : '播放失败'
  }
}

function play() {
  const c = ctx
  stopSource()
  masterOut.gain.value = 1
  const src = c.createBufferSource()
  src.buffer = audioBuffer.value
  src.connect(playGain)
  manualStop = false
  src.onended = () => {
    if (manualStop) return
    // 自然播放结束
    playing.value = false
    offset = 0
    progress.value = 0
    active.value = false
  }
  const start = offset >= duration.value ? 0 : offset
  if (start === 0) offset = 0
  src.start(0, start)
  startedAt = c.currentTime
  bufferSource = src
  playing.value = true
  active.value = true
}

function pause() {
  if (!playing.value) return
  const c = ctx
  offset = Math.min(duration.value, offset + (c.currentTime - startedAt))
  progress.value = offset
  stopSource()
  playing.value = false
  active.value = false
}

function stopSource() {
  manualStop = true
  if (bufferSource) {
    try { bufferSource.onended = null } catch (e) { /* ignore */ }
    try { bufferSource.stop() } catch (e) { /* ignore */ }
    try { bufferSource.disconnect() } catch (e) { /* ignore */ }
    bufferSource = null
  }
}

function seek(e) {
  const val = Number(e.target.value)
  offset = Math.max(0, Math.min(duration.value, val))
  progress.value = offset
  if (playing.value) play()
}

/* ---------- 麦克风 ---------- */
async function toggleMic() {
  if (micActive.value) {
    stopMic()
    return
  }
  error.value = ''
  success.value = ''
  stopSource()
  playing.value = false
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    error.value = '当前浏览器不支持麦克风采集（需 HTTPS 环境）'
    return
  }
  try {
    const c = ensureCtx()
    if (c.state === 'suspended') await c.resume()
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    })
    micSource = c.createMediaStreamSource(micStream)
    // 麦克风仅接入 analyser，不接 destination，避免回声
    masterOut.gain.value = 0
    micSource.connect(analyser)
    source.value = 'mic'
    micActive.value = true
    active.value = true
    offset = 0
    progress.value = 0
    success.value = '麦克风采集中，对着麦克风说话即可看到实时波形'
  } catch (err) {
    error.value = '无法访问麦克风：' + (err && err.message ? err.message : '权限被拒绝')
    stopMic()
  }
}

function stopMic() {
  if (micSource) {
    try { micSource.disconnect() } catch (e) { /* ignore */ }
    micSource = null
  }
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop())
    micStream = null
  }
  if (micActive.value) {
    micActive.value = false
    active.value = false
  }
  if (masterOut) masterOut.gain.value = 1
}

/* ---------- 渲染循环 ---------- */
function draw() {
  rafId = requestAnimationFrame(draw)
  const cv = canvas.value
  if (!cv) return
  const g = cv.getContext('2d')
  const w = cv.width
  const h = cv.height
  const sc = currentScheme()

  // 背景
  g.fillStyle = sc.bg
  g.fillRect(0, 0, w, h)

  // 网格
  g.strokeStyle = sc.grid
  g.lineWidth = 1 * dpr
  g.beginPath()
  for (let i = 1; i < 8; i++) {
    const x = (w / 8) * i
    g.moveTo(x, 0)
    g.lineTo(x, h)
  }
  for (let j = 1; j < 4; j++) {
    const y = (h / 4) * j
    g.moveTo(0, y)
    g.lineTo(w, y)
  }
  g.stroke()

  if (!analyser || !active.value) {
    // 空闲平线
    g.strokeStyle = sc.primary || sc.secondary
    g.lineWidth = 2 * dpr
    g.globalAlpha = 0.35
    g.beginPath()
    g.moveTo(0, h / 2)
    g.lineTo(w, h / 2)
    g.stroke()
    g.globalAlpha = 1
    return
  }

  if (mode.value === 'waveform') {
    analyser.getByteTimeDomainData(timeData)
    drawWaveform(g, w, h, sc)
  } else {
    analyser.getByteFrequencyData(freqData)
    if (mode.value === 'spectrum') drawSpectrum(g, w, h, sc)
    else drawBars(g, w, h, sc)
  }

  if (bufferSource && playing.value && duration.value) {
    progress.value = Math.min(duration.value, offset + (ctx.currentTime - startedAt))
  }
}

function computeLevel() {
  if (!timeData) return
  let peak = 0
  for (let i = 0; i < timeData.length; i++) {
    const v = Math.abs(timeData[i] - 128) / 128
    if (v > peak) peak = v
  }
  const pct = Math.round(Math.min(1, peak * gain.value) * 100)
  // 平滑
  level.value = Math.round(level.value * 0.6 + pct * 0.4)
}

function computeDominant() {
  if (!freqData || mode.value === 'waveform' || !sampleRate.value) {
    dominant.value = 0
    return
  }
  let maxI = 0
  let maxV = 0
  for (let i = 1; i < freqData.length; i++) {
    if (freqData[i] > maxV) {
      maxV = freqData[i]
      maxI = i
    }
  }
  dominant.value = (maxI * sampleRate.value) / analyser.fftSize
}

function drawWaveform(g, w, h, sc) {
  computeLevel()
  const g2 = currentScheme()
  g.strokeStyle = strokeStyleFor(g, w, g2, '#9dff6b')
  g.lineWidth = 2 * dpr
  g.shadowBlur = 8 * dpr
  g.shadowColor = g2.primary || g2.secondary || '#9dff6b'
  g.beginPath()
  const mid = h / 2
  const slice = w / timeData.length
  for (let i = 0; i < timeData.length; i++) {
    const v = (timeData[i] - 128) / 128
    const y = mid + v * (h / 2) * gain.value
    const x = i * slice
    if (i === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  }
  g.stroke()
  g.shadowBlur = 0

  // 渐变填充
  const grad = g.createLinearGradient(0, 0, 0, h)
  const base = g2.primary || g2.secondary || '#9dff6b'
  grad.addColorStop(0, hexA(base, 0.0))
  grad.addColorStop(0.5, hexA(base, 0.18))
  grad.addColorStop(1, hexA(base, 0.0))
  g.fillStyle = grad
  g.beginPath()
  g.moveTo(0, mid)
  for (let i = 0; i < timeData.length; i++) {
    const v = (timeData[i] - 128) / 128
    g.lineTo(i * slice, mid + v * (h / 2) * gain.value)
  }
  g.lineTo(w, mid)
  g.closePath()
  g.fill()
}

function drawSpectrum(g, w, h, sc) {
  computeDominant()
  const g2 = currentScheme()
  const n = freqData.length
  const grad = g.createLinearGradient(0, 0, 0, h)
  const base = g2.primary || g2.secondary || '#9dff6b'
  grad.addColorStop(0, base)
  grad.addColorStop(1, g2.secondary || base)
  g.strokeStyle = strokeStyleFor(g, w, g2, base)
  g.fillStyle = grad
  g.lineWidth = 2 * dpr
  g.beginPath()
  g.moveTo(0, h)
  for (let i = 0; i < n; i++) {
    const v = Math.min(1, (freqData[i] / 255) * gain.value)
    const x = (i / (n - 1)) * w
    const y = h - v * h
    g.lineTo(x, y)
  }
  g.lineTo(w, h)
  g.closePath()
  g.fill()
  g.stroke()
}

function drawBars(g, w, h, sc) {
  computeDominant()
  const n = freqData.length
  const bars = 96
  const step = Math.floor(n / bars) || 1
  const bw = w / bars
  for (let i = 0; i < bars; i++) {
    let sum = 0
    for (let j = 0; j < step; j++) sum += freqData[i * step + j] || 0
    const avg = sum / step
    const v = Math.min(1, (avg / 255) * gain.value)
    const bh = Math.max(1 * dpr, v * h)
    const x = i * bw
    let color
    if (sc.key === 'rainbow') {
      color = `hsl(${Math.round((i / bars) * 120)}, 90%, 60%)`
    } else {
      const grad = g.createLinearGradient(0, h, 0, h - bh)
      grad.addColorStop(0, sc.secondary)
      grad.addColorStop(1, sc.primary || sc.secondary)
      color = grad
    }
    g.fillStyle = color
    g.fillRect(x + 1 * dpr, h - bh, Math.max(1 * dpr, bw - 2 * dpr), bh)
  }
}

function hexA(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`
  let c = hex.replace('#', '')
  if (c.length === 3) c = c.split('').map(x => x + x).join('')
  const r = parseInt(c.slice(0, 2), 16)
  const gg = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return `rgba(${r},${gg},${b},${alpha})`
}

/* ---------- 导出与重置 ---------- */
function exportPng() {
  const cv = canvas.value
  if (!cv) return
  try {
    const url = cv.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `waveform-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    success.value = '已导出当前画布为 PNG 图片'
    error.value = ''
  } catch (err) {
    error.value = '导出失败：' + (err && err.message ? err.message : '未知错误')
  }
}

function stopAll() {
  stopSource()
  playing.value = false
  if (micActive.value) {
    // 仅停止麦克风，保留其它状态提示
    stopMic()
  }
  active.value = false
  offset = 0
  progress.value = 0
  success.value = '已停止'
}

function resetAll() {
  stopSource()
  stopMic()
  playing.value = false
  active.value = false
  audioBuffer.value = null
  fileName.value = ''
  duration.value = 0
  progress.value = 0
  offset = 0
  level.value = 0
  dominant.value = 0
  error.value = ''
  success.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

/* ---------- 画布尺寸 ---------- */
function resizeCanvas() {
  const cv = canvas.value
  if (!cv) return
  dpr = window.devicePixelRatio || 1
  const rect = cv.getBoundingClientRect()
  const w = Math.max(280, Math.round(rect.width))
  const h = 300
  cv.width = Math.round(w * dpr)
  cv.height = Math.round(h * dpr)
  cv.style.height = h + 'px'
}

/* ---------- 生命周期 ---------- */
onMounted(() => {
  buildSchemes()
  resizeCanvas()
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => resizeCanvas())
    resizeObserver.observe(canvas.value)
  } else {
    window.addEventListener('resize', resizeCanvas)
  }
  rafId = requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  stopSource()
  stopMic()
  if (resizeObserver) resizeObserver.disconnect()
  else window.removeEventListener('resize', resizeCanvas)
  if (ctx) {
    try { ctx.close() } catch (e) { /* ignore */ }
    ctx = null
  }
})
</script>

<style scoped>
.hidden-file {
  display: none;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-info .dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  background: var(--line-strong);
}

.source-info .dot.on {
  background: var(--green);
  box-shadow: 0 0 8px var(--green-glow);
}

.canvas-wrapper {
  position: relative;
  background: var(--panel-2);
  border: 1px solid var(--line);
  width: 100%;
  overflow: hidden;
}

.viz-canvas {
  display: block;
  width: 100%;
  height: 300px;
}

.canvas-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  pointer-events: none;
  text-align: center;
  padding: 0 16px;
}

.slider-row,
.progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-row .range-input,
.progress-row .range-input {
  flex: 1;
}

.range-value,
.progress-time {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  min-width: 62px;
  text-align: right;
}

.scheme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
}

.scheme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.15s;
}

.scheme-btn:hover {
  border-color: var(--line-strong);
  color: var(--text);
}

.scheme-btn.active {
  border-color: var(--green);
  color: var(--green);
  box-shadow: 0 0 12px var(--green-glow);
}

.scheme-swatch {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  border: 1px solid var(--line);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
}

.stat-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
}

.meter {
  height: 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: var(--green);
  box-shadow: 0 0 10px var(--green-glow);
  transition: width 0.08s linear;
}

.rule-note {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
  padding: 12px;
  background: var(--green-soft);
  border: 1px solid var(--line);
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
}

.rule-title {
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
}

.rule-note strong {
  color: var(--green);
  font-weight: 600;
}

@media (max-width: 640px) {
  .viz-canvas {
    height: 220px;
  }
  .range-value,
  .progress-time {
    min-width: 54px;
    font-size: 11px;
  }
}
</style>
