<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎹 网页钢琴键盘</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- ✅ 双栏：左=设置/键位，右=琴键/录音 -->
        <div class="tool-two-col">
          <!-- 左栏：演奏设置 + 键位映射 -->
          <div class="tool-col">
            <label class="tool-label">演奏设置</label>

            <label class="tool-label">起始八度：C{{ startOctave }}</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="startOctave" min="2" max="6" step="1" />
              <span class="range-value">C{{ startOctave }}</span>
            </div>

            <label class="tool-label">八度数量：{{ octaveCount }} 组</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="octaveCount" min="1" max="3" step="1" />
              <span class="range-value">{{ octaveCount }}×</span>
            </div>

            <label class="tool-label">音色：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="wave" value="sine" />
                <span>正弦波</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="wave" value="triangle" />
                <span>三角波</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="wave" value="square" />
                <span>方波</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="wave" value="sawtooth" />
                <span>锯齿波</span>
              </label>
            </div>

            <label class="tool-label">音量：{{ volume }}%</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="volume" min="0" max="100" step="1" />
              <span class="range-value">{{ volume }}%</span>
            </div>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="sustain" />
                <span>延音踏板（松开后自然衰减）</span>
              </label>
            </div>

            <label class="tool-label">键位映射：</label>
            <div class="map-rows">
              <div v-for="row in rows" :key="row.oct" class="map-row">
                <div class="map-row-name">{{ row.label }} <span class="map-row-range">{{ nameOf(midiFor(row.oct, 0)) }}–{{ nameOf(midiFor(row.oct, 11)) }}</span></div>
                <div class="map-grid">
                  <span v-for="(k, si) in row.keys" :key="si" class="map-chip" :title="nameOf(midiFor(row.oct, si)) + '（' + k.toUpperCase() + '）'">
                    <b>{{ nameOf(midiFor(row.oct, si)) }}</b>
                    <i>{{ k.toUpperCase() }}</i>
                  </span>
                </div>
              </div>
            </div>

            <div class="map-box">
              <button class="copy-btn" @click="copyMapping" title="复制键位映射">📋</button>
              <pre class="map-pre">{{ mapText }}</pre>
            </div>
          </div>

          <!-- 右栏：琴键 + 实时读谱 + 录音输出 -->
          <div class="tool-col">
            <label class="tool-label">琴键演奏区（鼠标 / 触摸 / 电脑键盘）</label>

            <div class="piano-frame">
              <div class="piano">
                <div class="keys-white">
                  <div
                    v-for="k in whiteKeys"
                    :key="k"
                    class="key white"
                    :class="{ active: activeMidis.has(k) }"
                    :title="keyTip(k)"
                    @pointerdown="onKeyDown(k, $event)"
                    @pointerup="onKeyUp(k, $event)"
                    @pointerleave="onKeyUp(k, $event)"
                    @pointercancel="onKeyUp(k, $event)"
                    @contextmenu.prevent
                  >
                    <span class="key-letter">{{ letterOf(k) }}</span>
                    <span class="key-note">{{ nameOf(k) }}</span>
                  </div>
                </div>
                <div class="keys-black">
                  <div
                    v-for="k in blackKeys"
                    :key="k"
                    class="key black"
                    :class="{ active: activeMidis.has(k) }"
                    :style="blackStyle(k)"
                    :title="keyTip(k)"
                    @pointerdown="onKeyDown(k, $event)"
                    @pointerup="onKeyUp(k, $event)"
                    @pointerleave="onKeyUp(k, $event)"
                    @pointercancel="onKeyUp(k, $event)"
                    @contextmenu.prevent
                  >
                    <span class="key-letter">{{ letterOf(k) }}</span>
                  </div>
                </div>
              </div>
              <div class="piano-range">{{ rangeText }} · {{ whiteKeys.length }} 白键 + {{ blackKeys.length }} 黑键</div>
            </div>

            <div class="stats-row">
              <span class="chord-line">
                <span class="stat-label">当前音高</span>
                <span class="chord-name">{{ chordText }}</span>
              </span>
              <span :class="recOn ? 'rec-badge' : 'rec-idle'">{{ recOn ? '● REC ' + recElapsed + 's' : '○ 待机' }}</span>
            </div>

            <label class="tool-label">录音输出：</label>
            <div class="out-wrap">
              <textarea
                class="code-input output log-input"
                :value="logText"
                readonly
                rows="6"
                placeholder="录音期间按下的音符会实时记录在这里（松开琴键后写入），停止后可复制或回放…"
              ></textarea>
              <button class="copy-btn" @click="copyLog" title="复制录音内容">📋</button>
            </div>
            <div class="stats-row">
              <span>时长 {{ recOn ? recElapsed + 's' : totalDurText }}</span>
              <span>音符 {{ noteCount }}</span>
              <span v-if="playing" class="stat-running">▶ 回放中…</span>
            </div>
          </div>
        </div>

        <!-- ✅ 全宽按钮组 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="toggleRec" :disabled="playing">
            {{ recOn ? '⏹ 停止录音' : '● 录音' }}
          </button>
          <button class="tool-button" @click="togglePlay" :disabled="recOn || !segs.length">
            {{ playing ? '⏹ 停止回放' : '▶ 播放录音' }}
          </button>
          <button class="tool-button" @click="panic" :disabled="!audioActive">🔇 停止声音</button>
          <button class="tool-button danger" @click="clearRec" :disabled="recOn">🗑 清空录音</button>
        </div>

        <div class="rule-note">
          <span class="rule-title">▶ 弹奏提示</span>
          <span>用鼠标 / 触摸点击琴键，或用电脑键盘弹奏：Z 行键位对应第一个八度，Q 行对应第二个八度，数字行对应第三个八度（需开启 3 组八度）。支持同时按下多个键组成和弦，先点击页面任意位置以获得键盘焦点。录音会记录每个音符的起止时间并支持回放，全程浏览器内 Web Audio 合成，无需后端。</span>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'

/* ---------- 常量 ---------- */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const BLACK_SEMI = new Set([1, 3, 6, 8, 10])

/* 每个物理键行的 12 半音 chromatic 键位（互不冲突） */
const ROW_KEYS_BY_COUNT = {
  1: [
    { label: '底排（Z 行）', keys: ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm'] }
  ],
  2: [
    { label: '底排（Z 行）', keys: ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm'] },
    { label: '中排（Q 行）', keys: ['q', '2', 'w', '3', 'e', 'r', '5', 't', '6', 'y', '7', 'u'] }
  ],
  3: [
    { label: '底排（Z 行）', keys: ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm'] },
    /* 三组八度时数字行让给顶排，Q 行黑键改用字母，避免键位冲突 */
    { label: '中排（Q 行）', keys: ['q', 'i', 'w', 'o', 'e', 'r', 'p', 't', '[', 'y', ']', 'u'] },
    { label: '顶排（数字行）', keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='] }
  ]
}

/* ---------- 状态 ---------- */

const startOctave = ref(4)      // C4 = MIDI 60
const octaveCount = ref(2)      // 1-3 组八度
const wave = ref('triangle')    // sine / triangle / square / sawtooth
const volume = ref(70)          // 0-100
const sustain = ref(false)      // 延音踏板

const activeMidis = reactive(new Set()) // 当前按住的音（发声 + 高亮）
const recOn = ref(false)
const recStartMs = ref(0)
const recTick = ref(0)
const segs = ref([])            // 已结束的音符段 { midi, from, to }（ms）
const recNoteCount = ref(0)
const totalDurMs = ref(0)
const playing = ref(false)
const error = ref('')
const success = ref('')

/* ---------- 非响应式内部状态 ---------- */

let audioCtx = null
let masterGain = null
const activeVoices = new Map() // midi → { osc, g }
const pointerOwners = new Map() // pointerId → midi
let recTimer = null
let pendingOns = new Map()     // 录音中尚未松开的音 midi → from(ms)
let playTimers = []
let playNodes = []
let successTimer = null
let errorTimer = null

/* ---------- 工具函数 ---------- */

const midiFor = (oct, semi) => (oct + 1) * 12 + semi
const nameOf = (midi) => NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1)
const freqOf = (midi) => 440 * Math.pow(2, (midi - 69) / 12)
const fmtSec = (ms) => (ms / 1000).toFixed(1)
const padName = (n) => n.padEnd(4, ' ')

function flashSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2600)
}

function flashError(msg) {
  error.value = msg
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => (error.value = ''), 3200)
}

/* ---------- 键位 / 琴键几何 ---------- */

const rows = computed(() => {
  const defs = ROW_KEYS_BY_COUNT[octaveCount.value] || ROW_KEYS_BY_COUNT[2]
  return defs.map((d, i) => ({ ...d, oct: startOctave.value + i }))
})

/* midi → 电脑键字母（用于琴键标签 / 提示） */
const letterMap = computed(() => {
  const m = {}
  for (const r of rows.value) {
    for (let s = 0; s < 12; s++) {
      const midi = midiFor(r.oct, s)
      if (!(midi in m)) m[midi] = r.keys[s]
    }
  }
  return m
})

/* 电脑键 → midi（键盘弹奏） */
const keyToMidi = computed(() => {
  const m = {}
  for (const r of rows.value) {
    for (let s = 0; s < 12; s++) {
      m[r.keys[s]] = midiFor(r.oct, s)
    }
  }
  return m
})

const baseMidi = computed(() => midiFor(startOctave.value, 0))
const topMidi = computed(() => baseMidi.value + octaveCount.value * 12)

const whiteKeys = computed(() => {
  const arr = []
  for (let m = baseMidi.value; m <= topMidi.value; m++) {
    if (!BLACK_SEMI.has(m % 12)) arr.push(m)
  }
  return arr
})

const blackKeys = computed(() => {
  const arr = []
  for (let m = baseMidi.value; m < topMidi.value; m++) {
    if (BLACK_SEMI.has(m % 12)) arr.push(m)
  }
  return arr
})

function blackStyle(midi) {
  const w = whiteKeys.value.length
  const whiteW = 100 / w
  let less = 0
  for (const wk of whiteKeys.value) {
    if (wk < midi) less++
    else break
  }
  return {
    left: `calc(${less * whiteW}% - ${whiteW * 0.31}%)`,
    width: `${whiteW * 0.62}%`
  }
}

const rangeText = computed(() => `${nameOf(baseMidi.value)} – ${nameOf(topMidi.value)}`)
const letterOf = (midi) => (letterMap.value[midi] ? letterMap.value[midi].toUpperCase() : '')
const keyTip = (midi) => (letterMap.value[midi] ? `${nameOf(midi)}（${letterMap.value[midi].toUpperCase()} 键）` : nameOf(midi))

/* ---------- 键位映射文本（左栏可复制） ---------- */

const mapText = computed(() => {
  return rows.value
    .map((r) => {
      const head = `【${r.label}】${nameOf(midiFor(r.oct, 0))} → ${nameOf(midiFor(r.oct, 11))}`
      const body = r.keys.map((k, s) => `${k.toUpperCase()}=${nameOf(midiFor(r.oct, s))}`).join('  ')
      return head + '\n' + body
    })
    .join('\n')
})

async function copyText(text, okMsg, failMsg) {
  if (!text) {
    flashError('没有可复制的内容')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    flashSuccess(okMsg)
  } catch (err) {
    flashError(failMsg + (err && err.message ? '：' + err.message : ''))
  }
}

function copyMapping() {
  copyText(mapText.value, '键位映射已复制到剪贴板', '复制失败')
}

/* ---------- 录音输出 ---------- */

const logText = computed(() => {
  if (!segs.value.length) return ''
  return segs.value
    .map((s) => `${padName(nameOf(s.midi))} ${fmtSec(s.from)}s → ${fmtSec(s.to)}s`)
    .join('\n')
})

const recElapsed = computed(() =>
  recOn.value ? fmtSec(Math.max(0, recTick.value - recStartMs.value)) : fmtSec(totalDurMs.value)
)

const totalDurText = computed(() => {
  if (recOn.value) return recElapsed.value + 's'
  let max = 0
  for (const s of segs.value) if (s.to > max) max = s.to
  return fmtSec(max) + 's'
})

const noteCount = computed(() => (recOn.value ? recNoteCount.value : segs.value.length))

const chordText = computed(() => {
  const list = [...activeMidis].sort((a, b) => a - b).map((m) => nameOf(m))
  return list.length ? list.join('  ') : '—'
})

function copyLog() {
  copyText(logText.value, '录音内容已复制到剪贴板', '复制失败')
}

function startRec() {
  stopPlayback()
  recOn.value = true
  segs.value = []
  pendingOns.clear()
  recNoteCount.value = 0
  totalDurMs.value = 0
  recStartMs.value = Date.now()
  recTick.value = recStartMs.value
  clearInterval(recTimer)
  recTimer = setInterval(() => (recTick.value = Date.now()), 100)
  flashSuccess('开始录音：弹奏琴键或使用电脑键盘')
}

function stopRec(silent) {
  clearInterval(recTimer)
  recTimer = null
  recOn.value = false
  const now = Date.now() - recStartMs.value
  for (const [midi, from] of pendingOns) {
    segs.value.push({ midi, from, to: Math.max(from, now) })
  }
  pendingOns.clear()
  let max = 0
  for (const s of segs.value) if (s.to > max) max = s.to
  totalDurMs.value = max
  if (!silent) {
    if (segs.value.length) flashSuccess(`录音完成：共 ${segs.value.length} 个音符，时长 ${fmtSec(max)}s`)
    else flashSuccess('录音已停止（没有记录到音符）')
  }
}

function clearRec() {
  stopPlayback()
  if (recOn.value) stopRec(true)
  segs.value = []
  totalDurMs.value = 0
  recNoteCount.value = 0
  flashSuccess('录音已清空')
}

function toggleRec() {
  if (recOn.value) stopRec(false)
  else startRec()
}

/* ---------- Web Audio 合成 ---------- */

const audioActive = computed(() => !!audioCtx || activeMidis.size > 0 || playing.value)

function gainFromVolume(v) {
  return 0.0001 + Math.pow(v / 100, 2) * 0.85
}

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    try {
      audioCtx = new AC()
      masterGain = audioCtx.createGain()
      masterGain.gain.value = gainFromVolume(volume.value)
      masterGain.connect(audioCtx.destination)
    } catch (err) {
      return false
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return true
}

function noteOn(midi) {
  if (activeVoices.has(midi)) return
  if (!ensureAudio()) {
    flashError('当前浏览器不支持 Web Audio，无法发声')
    return
  }
  const ctx = audioCtx
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = wave.value
  osc.frequency.value = freqOf(midi)
  osc.detune.value = Math.random() * 10 - 5
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.55, t + 0.015)
  osc.connect(g)
  g.connect(masterGain)
  osc.start(t)
  activeVoices.set(midi, { osc, g })
  activeMidis.add(midi)

  /* 录音：记录按下事件 */
  if (recOn.value) {
    pendingOns.set(midi, Date.now() - recStartMs.value)
    recNoteCount.value++
  }
}

function noteOff(midi) {
  const v = activeVoices.get(midi)
  if (!v) return
  activeVoices.delete(midi)
  const ctx = audioCtx
  const t = ctx.currentTime
  const tc = sustain.value ? 0.8 : 0.09
  const tail = sustain.value ? 4 : 0.6
  v.g.gain.cancelScheduledValues(t)
  v.g.gain.setTargetAtTime(0.0001, t, tc)
  try {
    v.osc.stop(t + tail)
  } catch (err) {
    /* 已停止则忽略 */
  }
  v.osc.onended = () => {
    try {
      v.g.disconnect()
    } catch (err) {
      /* 忽略 */
    }
  }
  activeMidis.delete(midi)

  /* 录音：松键时写入完成段 */
  if (recOn.value) {
    const from = pendingOns.get(midi)
    if (from != null) {
      pendingOns.delete(midi)
      segs.value.push({ midi, from, to: Date.now() - recStartMs.value })
    }
  }
}

/* 释放所有按住中的音符（不打断回放） */
function releaseAllNotes() {
  for (const midi of [...activeVoices.keys()]) noteOff(midi)
  pointerOwners.clear()
}

/* 一键静音：立即停止所有声音（含回放） */
function panic() {
  stopPlayback()
  for (const [midi, v] of activeVoices) {
    const ctx = audioCtx
    const t = ctx ? ctx.currentTime : 0
    try {
      v.g.gain.cancelScheduledValues(t)
      v.g.gain.setTargetAtTime(0.0001, t, 0.02)
      v.osc.stop(t + 0.15)
    } catch (err) {
      /* 忽略 */
    }
    try {
      v.g.disconnect()
    } catch (err) {
      /* 忽略 */
    }
  }
  activeVoices.clear()
  activeMidis.clear()
}

/* ---------- 回放 ---------- */

function schedulePlayNote(midi, tOn, tOff) {
  const ctx = audioCtx
  const osc = ctx.createOscillator()
  osc.type = wave.value
  osc.frequency.value = freqOf(midi)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, tOn)
  g.gain.exponentialRampToValueAtTime(0.55, tOn + 0.015)
  g.gain.setTargetAtTime(0.0001, tOff, 0.06)
  osc.connect(g)
  g.connect(masterGain)
  osc.start(tOn)
  try {
    osc.stop(tOff + 0.6)
  } catch (err) {
    /* 忽略 */
  }
  osc.onended = () => {
    try {
      g.disconnect()
    } catch (err) {
      /* 忽略 */
    }
  }
  playNodes.push({ osc, g })
}

function stopPlayback() {
  playing.value = false
  for (const t of playTimers) clearTimeout(t)
  playTimers = []
  for (const n of playNodes) {
    try {
      n.osc.stop()
    } catch (err) {
      /* 已停止则忽略 */
    }
    try {
      n.g.disconnect()
    } catch (err) {
      /* 忽略 */
    }
  }
  playNodes = []
  activeMidis.clear()
}

async function playRec() {
  if (!segs.value.length) {
    flashError('没有可回放的录音：先点击「录音」弹奏一段')
    return
  }
  if (!ensureAudio()) {
    flashError('当前浏览器不支持 Web Audio，无法回放')
    return
  }
  stopPlayback()
  try {
    await audioCtx.resume()
  } catch (err) {
    /* 忽略 */
  }
  const ctx = audioCtx
  const tBase = ctx.currentTime + 0.12
  let endMs = 0
  for (const s of segs.value) {
    schedulePlayNote(s.midi, tBase + s.from / 1000, tBase + s.to / 1000)
    playTimers.push(setTimeout(() => activeMidis.add(s.midi), s.from))
    playTimers.push(setTimeout(() => activeMidis.delete(s.midi), s.to))
    if (s.to > endMs) endMs = s.to
  }
  playing.value = true
  playTimers.push(setTimeout(() => {
    playing.value = false
    activeMidis.clear()
    playNodes = []
  }, endMs + 200))
  flashSuccess(`开始回放录音（${segs.value.length} 个音符，${fmtSec(endMs)}s）`)
}

function togglePlay() {
  if (playing.value) stopPlayback()
  else playRec()
}

/* ---------- 指针交互（鼠标 / 触摸） ---------- */

function onKeyDown(midi, ev) {
  if (ev.pointerType === 'mouse' && ev.button !== 0) return
  try {
    ev.currentTarget.setPointerCapture(ev.pointerId)
  } catch (err) {
    /* 忽略捕获失败 */
  }
  pointerOwners.set(ev.pointerId, midi)
  noteOn(midi)
}

function onKeyUp(midi, ev) {
  const owned = pointerOwners.get(ev.pointerId)
  if (owned == null) return
  if (owned !== midi) return
  pointerOwners.delete(ev.pointerId)
  noteOff(midi)
}

/* ---------- 电脑键盘交互 ---------- */

function isEditableTarget(ev) {
  const t = ev.target
  if (!t || t === window || t === document) return false
  const tag = (t.tagName || '').toUpperCase()
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
}

function onWindowKeyDown(ev) {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return
  if (isEditableTarget(ev)) return
  const key = ev.key.toLowerCase()
  const midi = keyToMidi.value[key]
  if (midi == null) return
  ev.preventDefault()
  if (ev.repeat) return
  noteOn(midi)
}

function onWindowKeyUp(ev) {
  if (isEditableTarget(ev)) return
  const key = ev.key.toLowerCase()
  const midi = keyToMidi.value[key]
  if (midi == null) return
  noteOff(midi)
}

/* ---------- 监听与生命周期 ---------- */

watch([startOctave, octaveCount], () => {
  /* 音域变化：停掉所有残留发声与按住状态，避免键位错乱 */
  panic()
})

watch(volume, (v) => {
  if (audioCtx && masterGain) {
    masterGain.gain.setTargetAtTime(gainFromVolume(v), audioCtx.currentTime, 0.02)
  }
})

function onWindowBlur() {
  releaseAllNotes()
}

function onVisibility() {
  if (document.hidden) releaseAllNotes()
}

onMounted(() => {
  window.addEventListener('keydown', onWindowKeyDown)
  window.addEventListener('keyup', onWindowKeyUp)
  window.addEventListener('blur', onWindowBlur)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKeyDown)
  window.removeEventListener('keyup', onWindowKeyUp)
  window.removeEventListener('blur', onWindowBlur)
  document.removeEventListener('visibilitychange', onVisibility)
  clearInterval(recTimer)
  clearTimeout(successTimer)
  clearTimeout(errorTimer)
  stopPlayback()
  panic()
  if (audioCtx) {
    try {
      audioCtx.close()
    } catch (err) {
      /* 忽略 */
    }
    audioCtx = null
    masterGain = null
  }
})
</script>

<style scoped>
/* 滑动条行 */
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-wrapper .range-input {
  flex: 1;
  min-width: 0;
  margin: 6px 0;
}

.range-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  min-width: 42px;
  text-align: right;
  flex-shrink: 0;
}

.options-group {
  margin-top: 6px;
}

/* === 键位映射 === */
.map-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
}

.map-row-name {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  margin-bottom: 4px;
}

.map-row-range {
  color: var(--muted);
  margin-left: 6px;
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.map-chip {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  padding: 3px 5px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.4;
  cursor: default;
  white-space: nowrap;
}

.map-chip b {
  color: var(--green);
  font-weight: 400;
  overflow: hidden;
}

.map-chip i {
  color: var(--muted);
  font-style: normal;
}

/* 键位映射复制块 */
.map-box {
  position: relative;
  margin-top: 6px;
}

.map-pre {
  margin: 0;
  padding: 10px 40px 10px 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.7;
  color: var(--muted);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow: auto;
}

/* === 琴键 === */
.piano-frame {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 10px 8px 8px;
}

.piano {
  position: relative;
  width: 100%;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.keys-white {
  display: flex;
}

.key {
  position: relative;
  cursor: pointer;
  touch-action: none;
  font-family: var(--mono);
}

.key.white {
  flex: 1 1 0;
  min-width: 0;
  height: 150px;
  background: var(--card);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 2px;
  padding-bottom: 8px;
  box-sizing: border-box;
  transition: background 0.06s ease;
}

.key.white:last-child {
  border-right: none;
}

.key.white:not(.active):hover {
  filter: brightness(1.12);
}

.key.white .key-letter {
  color: var(--green);
  font-size: 13px;
  min-height: 1em;
  line-height: 1.2;
}

.key.white .key-note {
  color: var(--muted);
  font-size: 10px;
  line-height: 1.2;
}

.keys-black {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 62%;
  pointer-events: none;
  z-index: 2;
}

.key.black {
  position: absolute;
  height: 100%;
  pointer-events: auto;
  background: var(--bg);
  filter: brightness(0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;
  box-sizing: border-box;
  transition: background 0.06s ease;
}

.key.black .key-letter {
  color: var(--text);
  font-size: 10px;
  line-height: 1.2;
}

.key.black:not(.active):hover {
  filter: brightness(0.75);
}

.key.white.active {
  background: var(--green);
  box-shadow: 0 0 18px var(--green-glow);
}

.key.white.active .key-letter,
.key.white.active .key-note {
  color: var(--bg);
}

.key.black.active {
  background: var(--green);
  filter: none;
  box-shadow: 0 0 14px var(--green-glow);
}

.key.black.active .key-letter {
  color: var(--bg);
}

.piano-range {
  margin-top: 6px;
  text-align: center;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
}

/* === 状态行 === */
.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  margin: 6px 0 2px;
}

.stat-label {
  color: var(--muted);
}

.chord-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.chord-name {
  color: var(--green);
  font-size: 13px;
  word-break: break-all;
}

.rec-badge {
  color: var(--red);
  font-weight: 700;
  animation: rec-blink 1s steps(2, start) infinite;
}

.rec-idle {
  color: var(--dim);
}

.stat-running {
  color: var(--green);
}

@keyframes rec-blink {
  to {
    visibility: hidden;
  }
}

/* === 录音输出 === */
.out-wrap {
  position: relative;
}

.out-wrap .log-input {
  min-height: 130px;
  height: auto;
}

/* === 规则说明 === */
.rule-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
  margin: 4px 0 0;
  padding: 10px 12px;
  border: 1px dashed var(--line);
  background: var(--panel);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.rule-title {
  color: var(--green);
  font-weight: 700;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .range-value,
  .chord-name {
    font-size: 12px;
  }

  .key.white {
    height: 108px;
    padding-bottom: 6px;
  }

  .key.white .key-letter {
    font-size: 11px;
  }

  .key.white .key-note {
    font-size: 9px;
  }

  .key.black {
    padding-top: 6px;
  }

  .key.black .key-letter {
    font-size: 9px;
  }

  .piano-range,
  .stats-row,
  .map-row-name,
  .rule-note {
    font-size: 11px;
  }

  .map-chip {
    font-size: 10px;
    padding: 2px 4px;
  }

  .out-wrap .log-input {
    min-height: 110px;
  }
}
</style>
