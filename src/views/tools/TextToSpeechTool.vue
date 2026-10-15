<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🗣️ 文本转语音</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div v-if="!supported" class="status-error">
          ❌ 当前浏览器不支持 Web Speech API（speechSynthesis），请使用 Chrome / Edge / Safari 桌面版打开本页
        </div>

        <!-- ✅ 双栏：左=文本与参数，右=播放进度与输出 -->
        <div class="tool-two-col">
          <!-- 左栏：输入文本 + 语音参数 -->
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">输入文本：</label>
              <button
                class="copy-btn label-copy-btn"
                title="复制输入文本"
                :disabled="!input.trim()"
                @click="copyInput"
              >📋</button>
            </div>
            <textarea
              v-model="input"
              rows="10"
              class="code-input"
              placeholder="输入要朗读的文本，支持中英文混排、多段落…"
            ></textarea>

            <div class="meta-line">
              <span>{{ input.length }} 字符</span>
              <span class="sep">·</span>
              <span>{{ segments.length }} 段</span>
              <span class="sep">·</span>
              <span>预计 {{ fmtDuration(estTotalSec) }}</span>
            </div>

            <label class="tool-label">语速：{{ rate.toFixed(1) }}x</label>
            <div class="slider-row">
              <input type="range" class="range-input" v-model.number="rate" min="0.5" max="2" step="0.1" />
              <span class="range-value">{{ rate.toFixed(1) }}x</span>
            </div>

            <label class="tool-label">音调：{{ pitch.toFixed(1) }}</label>
            <div class="slider-row">
              <input type="range" class="range-input" v-model.number="pitch" min="0" max="2" step="0.1" />
              <span class="range-value">{{ pitch.toFixed(1) }}</span>
            </div>

            <label class="tool-label">音量：{{ Math.round(volume * 100) }}%</label>
            <div class="slider-row">
              <input type="range" class="range-input" v-model.number="volume" min="0" max="1" step="0.05" />
              <span class="range-value">{{ Math.round(volume * 100) }}%</span>
            </div>
          </div>

          <!-- 右栏：播放进度 + 分段预览 + 输出摘要 -->
          <div class="tool-col">
            <label class="tool-label">播放状态：{{ statusText }}</label>
            <div class="progress-wrap">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
              </div>
              <div class="progress-head">
                <span>{{ progressPct.toFixed(0) }}%</span>
                <span>{{ Math.round(speakPos) }} / {{ input.length }} 字符</span>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">状态</span>
                <span class="stat-value">{{ statusText }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已朗读</span>
                <span class="stat-value">{{ fmtDuration(elapsed) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">剩余</span>
                <span class="stat-value">{{ fmtDuration(remainingSec) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">当前段</span>
                <span class="stat-value">{{ activeIndex >= 0 ? activeIndex + 1 + ' / ' + segments.length : '—' }}</span>
              </div>
            </div>

            <div class="label-row">
              <label class="tool-label">分段预览（高亮为正在朗读）：</label>
              <button
                class="copy-btn label-copy-btn"
                title="复制朗读脚本"
                :disabled="!segments.length"
                @click="copyScript"
              >📋</button>
            </div>
            <div ref="previewRef" class="preview-board">
              <template v-if="segments.length">
                <span
                  v-for="(seg, i) in segments"
                  :key="i"
                  class="seg"
                  :class="{ active: i === activeIndex, done: i < activeIndex }"
                >{{ seg.text.trim() }}</span>
              </template>
              <span v-else class="preview-empty">输入文本后显示分段预览…</span>
            </div>

            <div class="label-row">
              <label class="tool-label">输出：语音参数摘要</label>
              <button class="copy-btn label-copy-btn" title="复制参数摘要" @click="copySummary">📋</button>
            </div>
            <pre class="summary-pre">{{ summaryText }}</pre>
          </div>
        </div>

        <!-- ✅ 声音选择（全宽） -->
        <div class="label-row">
          <label class="tool-label">选择语音：{{ currentVoiceName }}</label>
          <span class="voice-count">共 {{ filteredVoices.length }} 个可用语音</span>
        </div>
        <div class="voice-filter">
          <select class="filter-select" v-model="langFilter">
            <option value="all">全部语言</option>
            <option v-for="l in langOptions" :key="l.key" :value="l.key">{{ l.label }}</option>
          </select>
          <input class="code-input-sm" v-model="voiceQuery" placeholder="按名称搜索语音…" />
          <button class="tool-button" @click="loadVoices">↻ 重新加载</button>
        </div>
        <div class="voice-list">
          <button
            class="voice-item"
            :class="{ active: selectedURI === '' }"
            @click="selectVoice(null)"
          >
            <span class="voice-name">浏览器默认语音</span>
            <span class="voice-tags"><span class="tag">auto</span>
              <span class="tag local">本地</span></span>
          </button>
          <button
            v-for="v in filteredVoices"
            :key="v.voiceURI"
            class="voice-item"
            :class="{ active: selectedURI === v.voiceURI }"
            @click="selectVoice(v)"
          >
            <span class="voice-name">{{ v.name }}</span>
            <span class="voice-tags">
              <span class="tag">{{ v.lang }}</span>
              <span class="tag" :class="v.localService ? 'local' : 'remote'">
                {{ v.localService ? '本地' : '在线' }}
              </span>
            </span>
          </button>
          <span v-if="!voices.length" class="voice-empty">
            暂未检测到可用语音（部分浏览器需先与页面交互才会加载语音列表，可点击「↻ 重新加载」）
          </span>
        </div>

        <!-- ✅ 全宽按钮组 -->
        <div class="button-group button-group-4">
          <button
            class="tool-button primary"
            :disabled="!supported || !input.trim() || status === 'playing'"
            @click="startSpeak"
          >▶ 开始朗读</button>
          <button
            class="tool-button"
            :disabled="status === 'idle'"
            @click="togglePause"
          >{{ status === 'paused' ? '▶ 继续' : '⏸ 暂停' }}</button>
          <button
            class="tool-button"
            :disabled="status === 'idle' && !input.trim()"
            @click="stopPlayback(false)"
          >⏹ 停止</button>
          <button class="tool-button" :disabled="!supported" @click="previewSample">🔊 试听</button>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button" :disabled="!input.trim()" @click="copyInput">📋 复制文本</button>
          <button class="tool-button" :disabled="!input.trim()" @click="copySummary">📋 复制摘要</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <div class="rule-note">
          <span class="rule-title">▶ 使用提示</span>
          <span>
            全部朗读由浏览器内置的 Web Speech API（speechSynthesis）在本地合成，
            文本不会上传到任何服务器，也不加载任何外部音频文件。
            语音列表来自操作系统与浏览器，Windows 常见「Microsoft 晓晓 / 云希」等在线语音，
            macOS 常见「Ting-Ting / Sin-ji」等本地语音；若列表为空，请先点击页面任意位置再点「↻ 重新加载」。
            语速 1.0x 为正常速度，音调越高声音越尖锐，音量作用于最终输出。
            播放过程中会用「边界事件」实时回报朗读位置，不支持该事件的浏览器会退化为按语速估算进度；
            暂停 / 继续依赖浏览器实现，若提示不支持，请用「停止」后重新开始。
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

/* ---------- 状态 ---------- */

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

const input = ref('')
const voices = ref([])
const selectedURI = ref('')
const langFilter = ref('all')
const voiceQuery = ref('')

const rate = ref(1)
const pitch = ref(1)
const volume = ref(1)

const status = ref('idle') // idle | playing | paused
const activeIndex = ref(-1)
const speakPos = ref(0)
const elapsed = ref(0)
const error = ref('')
const success = ref('')

const previewRef = ref(null)

const segments = ref([])   // [{ text, start, end }]，响应式便于模板实时刷新
let segIdx = 0
let segStartAt = 0
let basePos = 0
let boundarySeen = false
let session = 0            // 会话令牌，避免旧 utterance 回调污染新会话
let tickTimer = null
let successTimer = null

/* ---------- 语言标签 ---------- */

const LANG_LABELS = {
  'zh-CN': '中文（大陆）', 'zh-TW': '中文（台湾）', 'zh-HK': '中文（香港）', 'zh': '中文',
  'en-US': '英语（美国）', 'en-GB': '英语（英国）', 'en-AU': '英语（澳洲）', 'en': '英语',
  'ja-JP': '日语', 'ja': '日语', 'ko-KR': '韩语', 'ko': '韩语',
  'fr-FR': '法语', 'de-DE': '德语', 'es-ES': '西班牙语', 'es-MX': '西班牙语（墨西哥）',
  'ru-RU': '俄语', 'it-IT': '意大利语', 'pt-BR': '葡萄牙语（巴西）', 'pt-PT': '葡萄牙语',
  'ar-SA': '阿拉伯语', 'hi-IN': '印地语', 'th-TH': '泰语', 'vi-VN': '越南语',
  'nl-NL': '荷兰语', 'pl-PL': '波兰语', 'tr-TR': '土耳其语', 'sv-SE': '瑞典语',
  'id-ID': '印尼语', 'ms-MY': '马来语', 'uk-UA': '乌克兰语', 'cs-CZ': '捷克语',
  'el-GR': '希腊语', 'he-IL': '希伯来语', 'da-DK': '丹麦语', 'fi-FI': '芬兰语', 'nb-NO': '挪威语'
}

/* ---------- 工具函数 ---------- */

function fmtDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = n => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`
}

function isCJK(ch) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(ch)
}

/** 判断片段是否含可朗读内容（只有标点/空白则跳过，避免发出空语音） */
function isSpeakable(s) {
  return s.replace(/[\s\p{P}]/gu, '').length > 0
}

/** 按句末标点分段，保留全局偏移，便于精确回报朗读进度 */
function splitSegments(text) {
  const out = []
  const PUNCT = '。！？!?；;.\n\r…'
  let buf = ''
  let start = 0
  for (let i = 0; i < text.length; i++) {
    buf += text[i]
    let isEnd = PUNCT.includes(text[i])
    // 小数点 / 版本号 / 域名（如 3.14、v1.2.3、403.li）不切分，避免朗读被无谓打断
    if (isEnd && (text[i] === '.' || text[i] === '…')) {
      const next = text[i + 1]
      if (next && !/\s/.test(next)) isEnd = false
    }
    const tooLong = buf.length >= 150
    if (isEnd || tooLong) {
      if (isSpeakable(buf)) out.push({ text: buf, start, end: i + 1 })
      // 纯标点/空白片段：丢弃但保留偏移连续性
      buf = ''
      start = i + 1
    }
  }
  if (isSpeakable(buf)) out.push({ text: buf, start, end: text.length })
  return out
}

/* ---------- 计算属性 ---------- */

const estCps = computed(() => {
  const t = input.value
  if (!t) return 6
  let cjk = 0
  for (const ch of t) if (isCJK(ch)) cjk++
  const ratio = cjk / t.length
  const base = 6.2 * ratio + 14 * (1 - ratio) // 字符 / 秒（rate = 1）
  return Math.max(1, base * rate.value)
})

const estTotalSec = computed(() => (input.value.length ? input.value.length / estCps.value : 0))
const remainingSec = computed(() => {
  const left = Math.max(0, input.value.length - speakPos.value)
  return left / estCps.value
})
const progressPct = computed(() => {
  if (!input.value.length) return 0
  return Math.min(100, (speakPos.value / input.value.length) * 100)
})

const statusText = computed(() => {
  if (status.value === 'playing') return '● 朗读中'
  if (status.value === 'paused') return '❚❚ 已暂停'
  return '○ 待机'
})

const langOptions = computed(() => {
  const set = new Set()
  for (const v of voices.value) if (v.lang) set.add(v.lang)
  const keys = [...set].sort((a, b) => {
    const rank = l => (l.startsWith('zh') ? 0 : l.startsWith('en') ? 1 : 2)
    return rank(a) - rank(b) || a.localeCompare(b)
  })
  return keys.map(k => ({ key: k, label: LANG_LABELS[k] ? `${k} · ${LANG_LABELS[k]}` : k }))
})

const filteredVoices = computed(() => {
  const q = voiceQuery.value.trim().toLowerCase()
  return voices.value
    .filter(v => (langFilter.value === 'all' ? true : v.lang === langFilter.value))
    .filter(v => (q ? v.name.toLowerCase().includes(q) || (v.lang || '').toLowerCase().includes(q) : true))
    .sort((a, b) => (a.lang || '').localeCompare(b.lang || '') || a.name.localeCompare(b.name))
})

const currentVoice = computed(() => voices.value.find(v => v.voiceURI === selectedURI.value) || null)
const currentVoiceName = computed(() => {
  const v = currentVoice.value
  if (!v) return '浏览器默认语音'
  return `${v.name}（${v.lang || 'auto'} · ${v.localService ? '本地' : '在线'}）`
})

const scriptText = computed(() =>
  segments.value.map((s, i) => `${i + 1}. ${s.text.trim()}`).join('\n')
)

const summaryText = computed(() => {
  const v = currentVoice.value
  const voiceLine = v
    ? `${v.name}（${v.lang || 'auto'}${v.localService ? '，本地' : '，在线'}）`
    : '浏览器默认语音'
  const lang = v && v.lang ? v.lang : 'auto'
  return [
    `语音：${voiceLine}`,
    `语言：${LANG_LABELS[lang] || lang}`,
    `语速：${rate.value.toFixed(1)}x · 音调：${pitch.value.toFixed(1)} · 音量：${Math.round(volume.value * 100)}%`,
    `文本：${input.value.length} 字符 / ${segments.value.length} 段`,
    `预计朗读时长：${fmtDuration(estTotalSec.value)}`,
    `引擎：Web Speech API（浏览器本地合成，不上传数据）`
  ].join('\n')
})

/* ---------- 语音列表 ---------- */

function loadVoices() {
  if (!supported) return
  try {
    const list = window.speechSynthesis.getVoices() || []
    voices.value = list
    if (list.length === 0) {
      success.value = ''
    } else if (selectedURI.value && !list.some(v => v.voiceURI === selectedURI.value)) {
      selectedURI.value = ''
    }
  } catch (e) {
    voices.value = []
  }
}

function selectVoice(v) {
  selectedURI.value = v ? v.voiceURI : ''
  if (status.value !== 'idle') stopPlayback(true)
  flash(v ? `已选择语音：${v.name}` : '已选择浏览器默认语音')
}

/* ---------- 播放控制 ---------- */

function startTick() {
  stopTick()
  tickTimer = setInterval(() => {
    if (status.value !== 'playing') return
    elapsed.value += 0.1
    if (!boundarySeen && segments.value[segIdx]) {
      const dt = (performance.now() - segStartAt) / 1000
      const est = basePos + dt * estCps.value
      if (est > speakPos.value) speakPos.value = Math.min(segments.value[segIdx].end, est)
    }
  }, 100)
}

function stopTick() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function speakSegment(token, i) {
  if (token !== session) return
  if (i >= segments.value.length) {
    status.value = 'idle'
    activeIndex.value = -1
    speakPos.value = input.value.length
    stopTick()
    flash('朗读完成')
    return
  }
  segIdx = i
  activeIndex.value = i
  basePos = segments.value[i].start
  segStartAt = performance.now()
  boundarySeen = false

  const u = new SpeechSynthesisUtterance(segments.value[i].text)
  const v = currentVoice.value
  if (v) {
    u.voice = v
    u.lang = v.lang || 'zh-CN'
  } else {
    u.lang = 'zh-CN'
  }
  u.rate = rate.value
  u.pitch = pitch.value
  u.volume = volume.value

  u.onboundary = e => {
    if (token !== session) return
    if (typeof e.charIndex === 'number') {
      boundarySeen = true
      const pos = segments.value[i].start + e.charIndex
      speakPos.value = Math.max(speakPos.value, Math.min(segments.value[i].end, pos))
    }
  }
  u.onend = () => {
    if (token !== session) return
    speakPos.value = Math.max(speakPos.value, segments.value[i].end)
    if (status.value === 'idle') return
    speakSegment(token, i + 1)
  }
  u.onerror = ev => {
    if (token !== session) return
    const kind = ev && ev.error
    if (kind === 'interrupted' || kind === 'canceled') return
    error.value = `语音合成失败（${kind || '未知错误'}），可尝试切换其他语音`
    stopPlayback(true)
  }

  try {
    window.speechSynthesis.speak(u)
  } catch (e) {
    error.value = '无法启动语音合成，请检查浏览器或系统语音设置'
    status.value = 'idle'
    stopTick()
  }
}

function startSpeak() {
  if (!supported) return
  if (!input.value.trim()) {
    error.value = '请输入要朗读的文本'
    return
  }
  error.value = ''
  success.value = ''
  try {
    window.speechSynthesis.cancel()
  } catch (e) { /* ignore */ }
  session++
  const token = session

  segments.value = splitSegments(input.value)
  if (!segments.value.length) {
    error.value = '没有可朗读的有效内容'
    return
  }
  segIdx = 0
  speakPos.value = 0
  elapsed.value = 0
  status.value = 'playing'
  startTick()
  speakSegment(token, 0)
}

function togglePause() {
  if (status.value === 'playing') {
    try { window.speechSynthesis.pause() } catch (e) { /* ignore */ }
    if (window.speechSynthesis.paused) {
      status.value = 'paused'
      error.value = ''
    } else {
      error.value = '当前浏览器不支持暂停，请使用「⏹ 停止」后重新开始'
    }
    return
  }
  if (status.value === 'paused') {
    try { window.speechSynthesis.resume() } catch (e) { /* ignore */ }
    status.value = 'playing'
    const token = session
    setTimeout(() => {
      if (token !== session || status.value !== 'playing') return
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        // 浏览器未真正恢复，从当前段重新开始
        speakSegment(token, segIdx)
        error.value = '当前浏览器不支持「继续」，已从当前段落重新朗读'
      }
    }, 320)
  }
}

function stopPlayback(silent) {
  session++
  try { window.speechSynthesis.cancel() } catch (e) { /* ignore */ }
  status.value = 'idle'
  activeIndex.value = -1
  stopTick()
  if (!silent) {
    speakPos.value = 0
    elapsed.value = 0
    flash('已停止朗读')
  }
}

function previewSample() {
  if (!supported) return
  const sample = '你好，这是 403.li 文本转语音工具的试听效果。'
  error.value = ''
  try {
    window.speechSynthesis.cancel()
  } catch (e) { /* ignore */ }
  session++
  const token = session
  status.value = 'idle'
  stopTick()
  const u = new SpeechSynthesisUtterance(sample)
  const v = currentVoice.value
  if (v) { u.voice = v; u.lang = v.lang || 'zh-CN' } else { u.lang = 'zh-CN' }
  u.rate = rate.value
  u.pitch = pitch.value
  u.volume = volume.value
  u.onerror = ev => {
    if (token !== session) return
    if (ev && (ev.error === 'interrupted' || ev.error === 'canceled')) return
    error.value = `试听失败（${(ev && ev.error) || '未知错误'}）`
  }
  try {
    window.speechSynthesis.speak(u)
    flash('正在播放试听语音')
  } catch (e) {
    error.value = '无法播放试听语音'
  }
}

/* ---------- 复制 / 清空 ---------- */

function flash(msg) {
  success.value = msg
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => { success.value = '' }, 2200)
}

async function copyInput() {
  if (!input.value.trim()) {
    error.value = '没有可复制的内容'
    return
  }
  if (await copyText(input.value)) {
    error.value = ''
    flash('输入文本已复制到剪贴板')
  } else {
    error.value = '复制失败，请手动选择复制'
  }
}

async function copyScript() {
  if (!segments.value.length) {
    error.value = '没有可复制的朗读脚本'
    return
  }
  if (await copyText(scriptText.value)) {
    error.value = ''
    flash('朗读脚本已复制到剪贴板')
  } else {
    error.value = '复制失败，请手动选择复制'
  }
}

async function copySummary() {
  if (await copyText(summaryText.value)) {
    error.value = ''
    flash('语音参数摘要已复制到剪贴板')
  } else {
    error.value = '复制失败，请手动选择复制'
  }
}

function clearAll() {
  stopPlayback(true)
  input.value = ''
  segments.value = []
  speakPos.value = 0
  elapsed.value = 0
  activeIndex.value = -1
  error.value = ''
  success.value = ''
}

/* ---------- 联动 ---------- */

watch(input, () => {
  if (status.value !== 'idle') stopPlayback(true)
  segments.value = splitSegments(input.value)
  speakPos.value = 0
  elapsed.value = 0
  activeIndex.value = -1
})

watch(activeIndex, async () => {
  await nextTick()
  const el = previewRef.value && previewRef.value.querySelector('.seg.active')
  if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
})

function onVoicesChanged() {
  loadVoices()
}

onMounted(() => {
  if (!supported) {
    error.value = ''
    return
  }
  loadVoices()
  // 部分浏览器（Safari / Firefox）语音列表异步就绪
  window.speechSynthesis.onvoiceschanged = onVoicesChanged
  setTimeout(loadVoices, 300)
  setTimeout(loadVoices, 1200)
})

onBeforeUnmount(() => {
  session++
  stopTick()
  if (successTimer) clearTimeout(successTimer)
  try {
    if (supported) {
      window.speechSynthesis.onvoiceschanged = null
      window.speechSynthesis.cancel()
    }
  } catch (e) { /* ignore */ }
})
</script>

<style scoped>
.label-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-copy-btn {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.label-copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.meta-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 14px;
  font-size: 12px;
  color: var(--muted);
}

.meta-line .sep {
  color: var(--line);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0 14px;
}

.slider-row .range-input {
  flex: 1;
  margin: 0;
}

.range-value {
  min-width: 52px;
  text-align: right;
  font-size: 12px;
  color: var(--green);
}

/* 播放进度 */
.progress-wrap {
  margin: 6px 0 14px;
}

.progress-track {
  height: 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--green);
  box-shadow: 0 0 8px var(--green-glow);
  transition: width 0.15s linear;
}

.progress-head {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: var(--muted);
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 14px;
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
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  font-size: 13px;
  color: var(--green);
}

/* 分段预览 */
.preview-board {
  max-height: 168px;
  overflow-y: auto;
  padding: 10px;
  margin: 6px 0 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
  word-break: break-word;
}

.preview-board .seg {
  padding: 1px 2px;
  color: var(--text);
}

.preview-board .seg.done {
  color: var(--muted);
}

.preview-board .seg.active {
  background: var(--green-soft);
  color: var(--green);
  box-shadow: inset 0 -1px 0 var(--green);
}

.preview-empty {
  color: var(--muted);
}

/* 输出摘要 */
.summary-pre {
  margin: 6px 0 14px;
  padding: 10px;
  background: var(--green-soft);
  border: 1px solid var(--line);
  color: var(--text);
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 语音筛选 */
.voice-filter {
  display: flex;
  gap: 8px;
  margin: 6px 0 10px;
  flex-wrap: wrap;
}

.filter-select {
  flex: 0 0 auto;
  min-width: 200px;
  height: 40px;
  padding: 0 10px;
  font-family: inherit;
  font-size: 13px;
  color: var(--text);
  background: var(--panel-2);
  border: 1px solid var(--line);
  outline: none;
}

.filter-select:focus {
  border-color: var(--green);
  box-shadow: 0 0 0 2px var(--green-glow);
}

.voice-filter .code-input-sm {
  flex: 1 1 180px;
  min-width: 140px;
}

/* 语音列表 */
.voice-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 16px;
  background: var(--panel-2);
  border: 1px solid var(--line);
}

.voice-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 12px;
  text-align: left;
  color: var(--text);
  background: var(--panel);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.15s;
}

.voice-item:hover {
  border-color: var(--green);
  color: var(--green);
}

.voice-item.active {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

.voice-name {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.voice-tags {
  flex: 0 0 auto;
  display: inline-flex;
  gap: 4px;
}

.tag {
  padding: 1px 5px;
  font-size: 10px;
  color: var(--muted);
  border: 1px solid var(--line);
}

.tag.local {
  color: var(--green);
  border-color: var(--green);
}

.tag.remote {
  color: var(--amber);
  border-color: var(--amber);
}

.voice-empty {
  grid-column: 1 / -1;
  padding: 6px 2px;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.7;
}

/* 使用提示 */
.rule-note {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  margin-top: 6px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-left: 2px solid var(--green);
  font-size: 12px;
  line-height: 1.75;
  color: var(--muted);
}

.rule-title {
  color: var(--green);
  font-size: 12px;
  letter-spacing: 0.04em;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .voice-list {
    grid-template-columns: 1fr;
    max-height: 200px;
  }

  .filter-select {
    min-width: 100%;
    flex: 1 1 100%;
  }

  .voice-filter .code-input-sm {
    flex: 1 1 100%;
  }

  .range-value {
    min-width: 44px;
    font-size: 11px;
  }

  .label-row {
    flex-wrap: wrap;
  }
}
</style>
