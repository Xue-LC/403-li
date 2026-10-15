<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔊 白噪声生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- ✅ 双栏：左=参数，右=实时预览与输出 -->
        <div class="tool-two-col">
          <!-- 左栏：噪声类型 / 预设 / 参数 -->
          <div class="tool-col">
            <label class="tool-label">声音预设</label>
            <div class="preset-grid">
              <button
                v-for="p in PRESETS"
                :key="p.key"
                class="preset-btn"
                :class="{ active: activePreset === p.key }"
                @click="applyPreset(p)"
              >
                <span class="preset-icon">{{ p.icon }}</span>
                <span class="preset-name">{{ p.label }}</span>
              </button>
            </div>

            <label class="tool-label">噪声类型</label>
            <div class="radio-group">
              <label v-for="t in NOISE_TYPES" :key="t.key" class="radio-label" :title="t.desc">
                <input type="radio" v-model="noiseType" :value="t.key" />
                <span>{{ t.label }}</span>
              </label>
            </div>

            <label class="tool-label">滤波器</label>
            <div class="radio-group">
              <label v-for="f in FILTER_TYPES" :key="f.key" class="radio-label">
                <input type="radio" v-model="filterType" :value="f.key" />
                <span>{{ f.label }}</span>
              </label>
            </div>

            <label class="tool-label">截止频率：{{ fmtHz(filterFreq) }}</label>
            <div class="slider-row">
              <input
                type="range"
                class="range-input"
                v-model.number="filterFreq"
                min="60"
                max="16000"
                step="20"
                :disabled="filterType === 'none'"
                @input="onParamChange"
              />
              <span class="range-value">{{ fmtHz(filterFreq) }}</span>
            </div>

            <label class="tool-label">滤波器 Q 值：{{ filterQ.toFixed(1) }}</label>
            <div class="slider-row">
              <input
                type="range"
                class="range-input"
                v-model.number="filterQ"
                min="0.1"
                max="8"
                step="0.1"
                :disabled="filterType === 'none'"
                @input="onParamChange"
              />
              <span class="range-value">Q {{ filterQ.toFixed(1) }}</span>
            </div>

            <label class="tool-label">音量：{{ volume }}%</label>
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

            <label class="tool-label">起伏强度（LFO）：{{ lfoDepth }}%</label>
            <div class="slider-row">
              <input
                type="range"
                class="range-input"
                v-model.number="lfoDepth"
                min="0"
                max="100"
                step="1"
                @input="onParamChange"
              />
              <span class="range-value">{{ lfoDepth }}%</span>
            </div>

            <label class="tool-label">起伏速度：{{ lfoRate.toFixed(2) }} Hz</label>
            <div class="slider-row">
              <input
                type="range"
                class="range-input"
                v-model.number="lfoRate"
                min="0.02"
                max="2"
                step="0.01"
                @input="onParamChange"
              />
              <span class="range-value">{{ lfoRate.toFixed(2) }} Hz</span>
            </div>

            <label class="tool-label">淡入 / 淡出时长：{{ fadeTime.toFixed(1) }} 秒</label>
            <div class="slider-row">
              <input
                type="range"
                class="range-input"
                v-model.number="fadeTime"
                min="0"
                max="6"
                step="0.5"
                @input="onParamChange"
              />
              <span class="range-value">{{ fadeTime.toFixed(1) }}s</span>
            </div>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="crackle" @change="onCrackleChange" />
                <span>篝火噼啪声（随机爆裂细节）</span>
              </label>
            </div>

            <label class="tool-label">信号链摘要（输入参数）</label>
            <div class="copy-box">
              <button class="copy-btn" @click="copyText(graphText, '信号链已复制')" title="复制信号链">📋</button>
              <pre class="copy-pre">{{ graphText }}</pre>
            </div>
          </div>

          <!-- 右栏：实时频谱 + 输出配方 -->
          <div class="tool-col">
            <label class="tool-label">实时频谱预览</label>
            <div class="canvas-wrapper">
              <canvas ref="canvas" class="viz-canvas"></canvas>
              <div class="canvas-hint" v-if="!playing">已停止 · 点击下方「▶ 播放」开始生成噪声</div>
            </div>

            <label class="tool-label">输出：声音配方</label>
            <div class="copy-box">
              <button class="copy-btn" @click="copyText(recipeText, '配方已复制')" title="复制配方">📋</button>
              <pre class="copy-pre recipe">{{ recipeText }}</pre>
            </div>

            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">播放状态</span>
                <span class="stat-value">{{ playing ? '● 播放中' : '○ 已停止' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已播放</span>
                <span class="stat-value">{{ elapsedText }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">睡眠定时</span>
                <span class="stat-value">{{ sleepText }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">输出电平</span>
                <span class="stat-value">{{ levelText }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ 全宽按钮组 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="togglePlay">
            {{ playing ? '⏹ 停止' : '▶ 播放' }}
          </button>
          <button class="tool-button" @click="cycleSleep">
            ⏱ 定时 {{ sleepMinutes ? sleepMinutes + ' 分' : '关闭' }}
          </button>
          <button class="tool-button" @click="resetAll">↺ 重置参数</button>
          <button class="tool-button" @click="copyText(recipeText, '配方已复制')">📋 复制配方</button>
        </div>

        <div class="rule-note">
          <span class="rule-title">▶ 使用提示</span>
          <span>
            全部声音由浏览器 Web Audio API 实时合成，不加载任何音频文件、不上传任何数据：白噪声用于掩盖环境杂音，粉噪声听感更柔和，棕噪声低沉厚重。
            预设中的「海浪 / 篝火 / 风声」通过滤波器与低频 LFO 调制模拟自然声场，篝火预设额外叠加随机噼啪爆裂声。
            可调截止频率与 Q 值塑造音色，起伏强度决定声音的潮汐感，淡入淡出避免开关时爆音，睡眠定时到点自动淡出停止——适合专注工作与助眠。
          </span>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

/* ---------- 常量配置 ---------- */

const NOISE_TYPES = [
  { key: 'white', label: '白噪声', desc: '全频段能量均匀，掩盖力最强' },
  { key: 'pink', label: '粉噪声', desc: '能量随频率下降，听感自然柔和' },
  { key: 'brown', label: '棕噪声', desc: '低频为主，低沉厚重如瀑布' }
]

const FILTER_TYPES = [
  { key: 'none', label: '不滤波' },
  { key: 'lowpass', label: '低通' },
  { key: 'highpass', label: '高通' },
  { key: 'bandpass', label: '带通' }
]

const PRESETS = [
  { key: 'white', icon: '⚪', label: '纯白噪声', noise: 'white', filterType: 'none', filterFreq: 8000, filterQ: 0.7, volume: 42, lfoDepth: 0, lfoRate: 0.15, fadeTime: 1, crackle: false },
  { key: 'pink', icon: '🩷', label: '粉噪声', noise: 'pink', filterType: 'none', filterFreq: 8000, filterQ: 0.7, volume: 48, lfoDepth: 0, lfoRate: 0.15, fadeTime: 1, crackle: false },
  { key: 'brown', icon: '🟤', label: '棕噪声', noise: 'brown', filterType: 'none', filterFreq: 6000, filterQ: 0.7, volume: 52, lfoDepth: 0, lfoRate: 0.15, fadeTime: 1, crackle: false },
  { key: 'rain', icon: '🌧️', label: '雨声', noise: 'white', filterType: 'highpass', filterFreq: 700, filterQ: 0.6, volume: 44, lfoDepth: 12, lfoRate: 0.35, fadeTime: 1.5, crackle: false },
  { key: 'waves', icon: '🌊', label: '海浪', noise: 'brown', filterType: 'lowpass', filterFreq: 900, filterQ: 0.7, volume: 58, lfoDepth: 72, lfoRate: 0.09, fadeTime: 2.5, crackle: false },
  { key: 'campfire', icon: '🔥', label: '篝火', noise: 'brown', filterType: 'lowpass', filterFreq: 1600, filterQ: 0.8, volume: 50, lfoDepth: 18, lfoRate: 0.6, fadeTime: 1.2, crackle: true },
  { key: 'wind', icon: '🍃', label: '风声', noise: 'pink', filterType: 'bandpass', filterFreq: 520, filterQ: 1.2, volume: 50, lfoDepth: 55, lfoRate: 0.11, fadeTime: 2, crackle: false },
  { key: 'sleep', icon: '🌙', label: '助眠低频', noise: 'brown', filterType: 'lowpass', filterFreq: 320, filterQ: 0.7, volume: 46, lfoDepth: 0, lfoRate: 0.1, fadeTime: 3, crackle: false }
]

const SLEEP_CHOICES = [0, 5, 15, 30, 60, 90]

/* ---------- 状态 ---------- */

const noiseType = ref('white')
const filterType = ref('none')
const filterFreq = ref(8000)
const filterQ = ref(0.7)
const volume = ref(42)
const lfoDepth = ref(0)
const lfoRate = ref(0.15)
const fadeTime = ref(1)
const crackle = ref(false)

const activePreset = ref('white')
const playing = ref(false)
const elapsed = ref(0)
const sleepMinutes = ref(0)
const sleepLeft = ref(0)
const level = ref(0)
const error = ref('')
const success = ref('')

const canvas = ref(null)

let ctx = null
let masterGain = null
let modGain = null
let analyser = null
let lfo = null
let lfoGain = null
let noiseSource = null
let filterNode = null
let crackleTimer = null
let tickTimer = null
let rafId = null
let restartToken = 0
let freqData = null
let buffers = {}
let colorCache = null
let frameCount = 0
let levelPeak = 0

/* ---------- 工具函数 ---------- */

function fmtHz(v) {
  const n = Number(v) || 0
  return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + ' kHz' : Math.round(n) + ' Hz'
}

function fmtDuration(sec) {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = n => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`
}

const elapsedText = computed(() => fmtDuration(elapsed.value))
const sleepText = computed(() => {
  if (!sleepMinutes.value) return '关闭'
  if (!playing.value) return `${sleepMinutes.value} 分钟后停止`
  return fmtDuration(sleepLeft.value)
})
const levelText = computed(() => (playing.value ? Math.round(level.value * 100) + '%' : '—'))

const graphText = computed(() => {
  const t = NOISE_TYPES.find(x => x.key === noiseType.value)
  const f = FILTER_TYPES.find(x => x.key === filterType.value)
  const chain = []
  chain.push(`source(${t ? t.label : noiseType.value})`)
  if (filterType.value !== 'none') chain.push(`${f.key}(${fmtHz(filterFreq.value)}, Q ${filterQ.value.toFixed(1)})`)
  chain.push(`gain(${volume.value}%)`)
  if (lfoDepth.value > 0) chain.push(`lfo(${lfoRate.value.toFixed(2)}Hz, ${lfoDepth.value}%)`)
  if (crackle.value) chain.push('crackle(random)')
  chain.push(`fade(${fadeTime.value.toFixed(1)}s)`)
  return chain.join(' → ')
})

const recipeText = computed(() => {
  const t = NOISE_TYPES.find(x => x.key === noiseType.value)
  const f = FILTER_TYPES.find(x => x.key === filterType.value)
  const parts = [`${t ? t.label : noiseType.value}`]
  if (filterType.value !== 'none') parts.push(`${f.label} ${fmtHz(filterFreq.value)}（Q ${filterQ.value.toFixed(1)}）`)
  parts.push(`音量 ${volume.value}%`)
  if (lfoDepth.value > 0) parts.push(`起伏 ${lfoRate.value.toFixed(2)}Hz / ${lfoDepth.value}%`)
  if (crackle.value) parts.push('篝火噼啪')
  parts.push(`淡入淡出 ${fadeTime.value.toFixed(1)}s`)
  if (sleepMinutes.value > 0) parts.push(`睡眠定时 ${sleepMinutes.value} 分钟`)
  return parts.join(' · ')
})

/* ---------- 音频上下文与噪声缓冲 ---------- */

function ensureCtx() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) throw new Error('当前浏览器不支持 Web Audio API，无法生成噪声')
  ctx = new AC()

  masterGain = ctx.createGain()
  masterGain.gain.value = 0.0001

  modGain = ctx.createGain()
  modGain.gain.value = 1

  analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.8
  freqData = new Uint8Array(analyser.frequencyBinCount)

  masterGain.connect(modGain)
  modGain.connect(analyser)
  analyser.connect(ctx.destination)

  lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = Math.max(0.01, lfoRate.value)
  lfoGain = ctx.createGain()
  lfoGain.gain.value = 0
  lfo.connect(lfoGain)
  lfoGain.connect(modGain.gain)
  lfo.start()

  return ctx
}

function targetGain() {
  const v = Math.min(100, Math.max(0, volume.value)) / 100
  return Math.max(0.0002, Math.pow(v, 1.6) * 0.9)
}

function getNoiseBuffer(type) {
  if (buffers[type]) return buffers[type]
  const sr = ctx.sampleRate
  const len = Math.floor(sr * 4)
  const xf = Math.floor(sr * 0.05)
  const tmp = new Float32Array(len + xf)

  if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < tmp.length; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      let out = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
      tmp[i] = Math.max(-1, Math.min(1, out))
    }
  } else if (type === 'brown') {
    let last = 0
    for (let i = 0; i < tmp.length; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      tmp[i] = Math.max(-1, Math.min(1, last * 3.5))
    }
  } else {
    for (let i = 0; i < tmp.length; i++) tmp[i] = Math.random() * 2 - 1
  }

  // 首尾交叉淡化，保证 loop 接缝无爆音
  for (let i = 0; i < xf; i++) {
    const w = i / xf
    tmp[i] = tmp[i] * w + tmp[len + i] * (1 - w)
  }

  const buf = ctx.createBuffer(1, len, sr)
  buf.getChannelData(0).set(tmp.subarray(0, len))
  buffers[type] = buf
  return buf
}

function getCrackleBuffer() {
  if (buffers.__crackle) return buffers.__crackle
  const sr = ctx.sampleRate
  const len = Math.floor(sr * 0.5)
  const buf = ctx.createBuffer(1, len, sr)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  buffers.__crackle = buf
  return buf
}

function buildFilter() {
  if (filterNode) {
    try { filterNode.disconnect() } catch (e) { /* ignore */ }
    filterNode = null
  }
  if (filterType.value === 'none') return null
  const f = ctx.createBiquadFilter()
  f.type = filterType.value
  f.frequency.value = filterFreq.value
  f.Q.value = filterQ.value
  f.connect(masterGain)
  filterNode = f
  return f
}

function spawnSource() {
  const src = ctx.createBufferSource()
  src.buffer = getNoiseBuffer(noiseType.value)
  src.loop = true
  const f = buildFilter()
  if (f) src.connect(f)
  else src.connect(masterGain)
  src.start(ctx.currentTime + 0.01)
  noiseSource = src
}

function killSource(now) {
  const src = noiseSource
  noiseSource = null
  if (!src) return
  try { src.stop(now) } catch (e) { /* ignore */ }
  setTimeout(() => {
    try { src.disconnect() } catch (e) { /* ignore */ }
  }, 120)
}

/* ---------- 播放控制 ---------- */

async function start() {
  try {
    error.value = ''
    success.value = ''
    const c = ensureCtx()
    if (c.state === 'suspended') await c.resume()

    spawnSource()

    const now = c.currentTime
    lfo.frequency.setTargetAtTime(Math.max(0.01, lfoRate.value), now, 0.05)
    lfoGain.gain.setTargetAtTime((lfoDepth.value / 100) * 0.85, now, 0.05)

    const g = targetGain()
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(0.0001, now)
    if (fadeTime.value > 0) masterGain.gain.exponentialRampToValueAtTime(g, now + fadeTime.value)
    else masterGain.gain.setValueAtTime(g, now)

    playing.value = true
    elapsed.value = 0
    sleepLeft.value = sleepMinutes.value * 60
    startCrackle()
    startTicker()
    success.value = '噪声已开始生成（首次播放需浏览器允许音频播放）'
  } catch (e) {
    error.value = e && e.message ? e.message : '音频初始化失败'
    playing.value = false
  }
}

function stop(silent) {
  if (!playing.value) return
  playing.value = false
  stopCrackle()
  stopTicker()
  const c = ctx
  if (c) {
    const now = c.currentTime
    const fade = Math.max(0.05, fadeTime.value)
    const cur = Math.max(0.0002, masterGain.gain.value)
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(cur, now)
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + fade)
    const src = noiseSource
    noiseSource = null
    setTimeout(() => {
      try { if (src) { src.stop(); src.disconnect() } } catch (e) { /* ignore */ }
    }, fade * 1000 + 80)
  } else {
    killSource(0)
  }
  level.value = 0
  if (!silent) success.value = '已停止（按设定时长淡出）'
}

function togglePlay() {
  if (playing.value) stop()
  else start()
}

function onParamChange() {
  if (!playing.value || !ctx) return
  const now = ctx.currentTime
  lfo.frequency.setTargetAtTime(Math.max(0.01, lfoRate.value), now, 0.05)
  lfoGain.gain.setTargetAtTime((lfoDepth.value / 100) * 0.85, now, 0.05)
  if (filterNode) {
    filterNode.frequency.setTargetAtTime(filterFreq.value, now, 0.05)
    filterNode.Q.setTargetAtTime(filterQ.value, now, 0.05)
  }
}

function applyVolume() {
  if (!playing.value || !ctx) return
  masterGain.gain.setTargetAtTime(targetGain(), ctx.currentTime, 0.06)
}

function onCrackleChange() {
  if (playing.value) startCrackle()
}

async function restartSource() {
  if (!playing.value || !ctx) return
  const token = ++restartToken
  const now = ctx.currentTime
  const g = targetGain()
  const cur = Math.max(0.0002, masterGain.gain.value)
  // 先快速压低音量，避免切换瞬间产生爆音
  masterGain.gain.cancelScheduledValues(now)
  masterGain.gain.setValueAtTime(cur, now)
  masterGain.gain.exponentialRampToValueAtTime(0.0002, now + 0.03)
  setTimeout(() => {
    if (token !== restartToken || !playing.value || !ctx) return
    killSource(ctx.currentTime)
    spawnSource()
    const t = ctx.currentTime
    masterGain.gain.cancelScheduledValues(t)
    masterGain.gain.setValueAtTime(0.0002, t)
    masterGain.gain.exponentialRampToValueAtTime(g, t + 0.05)
  }, 45)
}

/* ---------- 篝火噼啪 ---------- */

function startCrackle() {
  stopCrackle()
  if (!crackle.value) return
  const tick = () => {
    if (!playing.value || !ctx) return
    playCrackle()
    crackleTimer = setTimeout(tick, 50 + Math.random() * 380)
  }
  crackleTimer = setTimeout(tick, 150)
}

function stopCrackle() {
  if (crackleTimer) {
    clearTimeout(crackleTimer)
    crackleTimer = null
  }
}

function playCrackle() {
  const t = ctx.currentTime + 0.01
  const src = ctx.createBufferSource()
  src.buffer = getCrackleBuffer()
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1800 + Math.random() * 4200
  const g = ctx.createGain()
  const peak = 0.05 + Math.random() * 0.4
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(peak, t + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05 + Math.random() * 0.18)
  src.connect(lp)
  lp.connect(g)
  g.connect(masterGain)
  src.start(t, Math.random() * 0.25)
  src.stop(t + 0.4)
}

/* ---------- 计时器（时长 + 睡眠定时） ---------- */

function startTicker() {
  stopTicker()
  tickTimer = setInterval(() => {
    if (!playing.value) return
    elapsed.value += 1
    if (sleepMinutes.value > 0) {
      sleepLeft.value -= 1
      if (sleepLeft.value <= 0) {
        sleepLeft.value = 0
        stop(true)
        success.value = '睡眠定时结束，已自动淡出停止'
      }
    }
  }, 1000)
}

function stopTicker() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function cycleSleep() {
  const i = SLEEP_CHOICES.indexOf(sleepMinutes.value)
  const next = SLEEP_CHOICES[(i + 1) % SLEEP_CHOICES.length]
  sleepMinutes.value = next
  sleepLeft.value = next * 60
  success.value = next ? `睡眠定时已设为 ${next} 分钟后自动停止` : '已关闭睡眠定时'
}

/* ---------- 预设 / 重置 ---------- */

function applyPreset(p) {
  activePreset.value = p.key
  noiseType.value = p.noise
  filterType.value = p.filterType
  filterFreq.value = p.filterFreq
  filterQ.value = p.filterQ
  volume.value = p.volume
  lfoDepth.value = p.lfoDepth
  lfoRate.value = p.lfoRate
  fadeTime.value = p.fadeTime
  crackle.value = p.crackle
  error.value = ''
  success.value = `已载入预设：${p.label}`
  if (playing.value) {
    onParamChange()
    applyVolume()
    startCrackle()
  }
}

function resetAll() {
  applyPreset(PRESETS[0])
  sleepMinutes.value = 0
  sleepLeft.value = 0
  if (playing.value) stop()
  elapsed.value = 0
  success.value = '参数已重置为「纯白噪声」'
}

/* ---------- 复制 ---------- */

async function copyText(text, msg) {
  const str = String(text || '')
  if (!str) {
    error.value = '没有可复制的内容'
    return
  }
  error.value = ''
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(str)
    } else {
      const ta = document.createElement('textarea')
      ta.value = str
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    success.value = msg || '已复制到剪贴板'
  } catch (e) {
    error.value = '复制失败，请手动选择文本复制'
  }
}

/* ---------- Canvas 可视化 ---------- */

/* 噪声类型 / 滤波类型变化需要重建音频节点（仅播放中） */
watch([noiseType, filterType], () => {
  if (playing.value) restartSource()
})

function readColors() {
  const cs = getComputedStyle(document.documentElement)
  const pick = (name, fb) => (cs.getPropertyValue(name) || '').trim() || fb
  colorCache = {
    green: pick('--green', '#9dff6b'),
    line: pick('--line', '#2a2f35'),
    muted: pick('--muted', '#8a9299'),
    panel: pick('--panel-2', '#0f1317')
  }
}

function resizeCanvas() {
  const el = canvas.value
  if (!el) return
  const dpr = window.devicePixelRatio || 1
  const w = el.clientWidth || 320
  const h = el.clientHeight || 200
  if (el.width !== Math.floor(w * dpr) || el.height !== Math.floor(h * dpr)) {
    el.width = Math.floor(w * dpr)
    el.height = Math.floor(h * dpr)
  }
}

function draw() {
  rafId = requestAnimationFrame(draw)
  const el = canvas.value
  if (!el) return
  resizeCanvas()
  const c2d = el.getContext('2d')
  if (!c2d) return
  if (frameCount++ % 45 === 0 || !colorCache) readColors()

  const W = el.width
  const H = el.height
  c2d.clearRect(0, 0, W, H)

  // 背景 + 网格（保持终端直角风格）
  c2d.fillStyle = colorCache.panel
  c2d.fillRect(0, 0, W, H)
  c2d.strokeStyle = colorCache.line
  c2d.lineWidth = 1
  c2d.globalAlpha = 0.6
  for (let i = 1; i < 4; i++) {
    const y = Math.round((H / 4) * i) + 0.5
    c2d.beginPath()
    c2d.moveTo(0, y)
    c2d.lineTo(W, y)
    c2d.stroke()
  }
  c2d.globalAlpha = 1

  if (!playing.value || !analyser) {
    c2d.strokeStyle = colorCache.muted
    c2d.globalAlpha = 0.55
    c2d.beginPath()
    c2d.moveTo(0, H / 2 + 0.5)
    c2d.lineTo(W, H / 2 + 0.5)
    c2d.stroke()
    c2d.globalAlpha = 1
    return
  }

  analyser.getByteFrequencyData(freqData)

  // 取前 ~70% 频段绘制柱状频谱（高频基本为空）
  const bars = 64
  const usable = Math.floor(freqData.length * 0.7)
  const barW = W / bars
  const gap = Math.max(1, barW * 0.25)
  let sum = 0
  let peak = 0
  for (let i = 0; i < bars; i++) {
    const from = Math.floor((i / bars) * usable)
    const to = Math.max(from + 1, Math.floor(((i + 1) / bars) * usable))
    let m = 0
    for (let j = from; j < to; j++) {
      if (freqData[j] > m) m = freqData[j]
      sum += freqData[j]
    }
    const v = m / 255
    peak = Math.max(peak, v)
    const bh = Math.max(2, v * H * 0.94)
    c2d.fillStyle = colorCache.green
    c2d.globalAlpha = 0.35 + v * 0.65
    c2d.fillRect(i * barW, H - bh, Math.max(1, barW - gap), bh)
  }
  c2d.globalAlpha = 1

  // 平滑电平显示（取平均能量），量化后写入以减少无谓渲染
  const avg = sum / (bars * 255)
  if (avg > levelPeak) levelPeak = avg
  else levelPeak = levelPeak * 0.85 + avg * 0.15
  const lv = Math.round(Math.max(peak * 0.5, levelPeak) * 100) / 100
  if (lv !== level.value) level.value = lv
}

/* ---------- 生命周期 ---------- */

onMounted(() => {
  readColors()
  resizeCanvas()
  draw()
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  stopCrackle()
  stopTicker()
  if (playing.value) stop(true)
  if (ctx) {
    try { if (lfo) lfo.stop() } catch (e) { /* ignore */ }
    try { ctx.close() } catch (e) { /* ignore */ }
    ctx = null
  }
})
</script>

<style scoped>
/* === 预设网格 === */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 1rem;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 4px;
  min-height: 60px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
}

.preset-btn.active {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
  box-shadow: 0 0 15px var(--green-glow);
}

.preset-icon {
  font-size: 18px;
  line-height: 1;
}

.preset-name {
  white-space: nowrap;
}

/* === 滑杆行 === */
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-row .range-input {
  flex: 1;
  min-width: 0;
}

.slider-row .range-input:disabled {
  opacity: 0.4;
}

.range-value {
  min-width: 72px;
  text-align: right;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  white-space: nowrap;
}

/* === 选项组 === */
.options-group {
  margin: 0.75rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* === 复制的文本框 === */
.copy-box {
  position: relative;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 12px 44px 12px 12px;
}

.copy-pre {
  margin: 0;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
  word-break: break-all;
  white-space: pre-wrap;
}

.copy-pre.recipe {
  color: var(--green);
}

/* === Canvas === */
.canvas-wrapper {
  position: relative;
  border: 1px solid var(--line);
  background: var(--panel-2);
  height: 220px;
}

.viz-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.canvas-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  pointer-events: none;
}

/* === 统计网格 === */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 8px 10px;
}

.stat-label {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  color: var(--muted);
}

.stat-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
}

/* === 提示条 === */
.rule-note {
  display: flex;
  gap: 10px;
  margin-top: 1rem;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.8;
  color: var(--muted);
}

.rule-title {
  color: var(--green);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .preset-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .canvas-wrapper {
    height: 180px;
  }

  .range-value {
    min-width: 62px;
    font-size: 11px;
  }

  .rule-note {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
