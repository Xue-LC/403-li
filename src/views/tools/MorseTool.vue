<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📡 Morse 电码转换器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">文本：</label>
            <textarea
              v-model="text"
              placeholder="输入文本内容..."
              rows="10"
              class="code-input"
              @input="onTextInput"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">摩斯电码：</label>
            <textarea
              v-model="morse"
              placeholder="输入摩斯电码（用空格分隔字母，用 / 分隔单词）..."
              rows="10"
              class="code-input output"
              @input="onMorseInput"
            ></textarea>
          </div>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="playAudio" :disabled="!morse.trim() || isPlaying">
            🔊 {{ isPlaying ? '播放中...' : '播放电码' }}
          </button>
          <button class="tool-button" @click="copyText" :disabled="!text.trim()">
            📋 复制文本
          </button>
          <button class="tool-button" @click="copyMorse" :disabled="!morse.trim()">
            📋 复制电码
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <!-- 摩斯电码参考表 -->
        <details class="morse-ref" style="margin-top: 16px">
          <summary class="section-header" style="cursor: pointer">
            <span class="section-title">▼ 摩斯电码参考表</span>
          </summary>
          <div class="morse-table">
            <div class="morse-group">
              <h4 style="color: var(--green); margin: 8px 0 4px; font-size: 13px;">字母</h4>
              <div class="morse-grid">
                <span v-for="(code, char) in LETTER_MAP" :key="'L'+char" class="morse-item">
                  <strong>{{ char }}</strong> {{ code }}
                </span>
              </div>
            </div>
            <div class="morse-group">
              <h4 style="color: var(--green); margin: 8px 0 4px; font-size: 13px;">数字</h4>
              <div class="morse-grid">
                <span v-for="(code, char) in DIGIT_MAP" :key="'D'+char" class="morse-item">
                  <strong>{{ char }}</strong> {{ code }}
                </span>
              </div>
            </div>
            <div class="morse-group">
              <h4 style="color: var(--green); margin: 8px 0 4px; font-size: 13px;">标点符号</h4>
              <div class="morse-grid">
                <span v-for="(code, char) in PUNCT_MAP" :key="'P'+char" class="morse-item">
                  <strong>{{ char }}</strong> {{ code }}
                </span>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText as copyToClipboard } from '../../utils/clipboard'

// ---- Morse 映射表 ----
const LETTER_MAP = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
  H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
  O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
}

const DIGIT_MAP = {
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
}

const PUNCT_MAP = {
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.',
}

// 构建完整的 文本→摩斯 映射
const textToMorseMap = { ...LETTER_MAP, ...DIGIT_MAP, ...PUNCT_MAP }

// 构建反向 摩斯→文本 映射
const morseToTextMap = {}
for (const [char, code] of Object.entries(textToMorseMap)) {
  morseToTextMap[code] = char
}

// ---- 状态 ----
const text = ref('')
const morse = ref('')
const error = ref('')
const success = ref('')
const isPlaying = ref(false)
let lastEdited = 'text' // 'text' | 'morse'

// ---- 核心转换 ----
function textToMorse(str) {
  return str
    .toUpperCase()
    .split('')
    .map(ch => {
      if (ch === ' ') return '/'
      return textToMorseMap[ch] || ch
    })
    .join(' ')
    .replace(/ \/ /g, ' / ')
}

function morseToText(str) {
  // 按空格分割，/ 表示单词分隔
  const parts = str.trim().split(/\s+/)
  return parts
    .map(part => {
      if (part === '/') return ' '
      return morseToTextMap[part] || part
    })
    .join('')
}

// ---- 输入事件（双向实时联动） ----
function onTextInput() {
  lastEdited = 'text'
  error.value = ''
  success.value = ''
  try {
    morse.value = textToMorse(text.value)
  } catch (e) {
    error.value = '转换失败：' + e.message
  }
}

function onMorseInput() {
  lastEdited = 'morse'
  error.value = ''
  success.value = ''
  try {
    text.value = morseToText(morse.value)
  } catch (e) {
    error.value = '解析失败：' + e.message
  }
}

// ---- 音频播放（Web Audio API） ----
let audioCtx = null
let playbackTimer = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

function playTone(ctx, duration, frequency = 700) {
  return new Promise(resolve => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
    oscillator.onended = resolve
  })
}

function sleep(ms) {
  return new Promise(resolve => { setTimeout(resolve, ms) })
}

async function playAudio() {
  if (isPlaying.value || !morse.value.trim()) return

  isPlaying.value = true

  try {
    const ctx = getAudioContext()
    // WPM 约 20，dot = 60ms, dash = 180ms
    const dotDuration = 0.06
    const dashDuration = 0.18
    const intraGap = 0.06   // 符号间间隔
    const charGap = 0.18    // 字母间间隔（3个dot）
    const wordGap = 0.42    // 单词间间隔（7个dot）

    const tokens = morse.value.trim().split(/\s+/)

    for (let i = 0; i < tokens.length; i++) {
      if (!isPlaying.value) break

      const token = tokens[i]
      if (token === '/') {
        await sleep(wordGap - charGap)
        continue
      }

      for (let j = 0; j < token.length; j++) {
        if (!isPlaying.value) break
        const symbol = token[j]
        if (symbol === '.') {
          await playTone(ctx, dotDuration)
        } else if (symbol === '-') {
          await playTone(ctx, dashDuration)
        }
        if (j < token.length - 1) {
          await sleep(intraGap)
        }
      }

      if (i < tokens.length - 1) {
        const nextIsWordSep = tokens[i + 1] === '/'
        await sleep(nextIsWordSep ? wordGap : charGap)
      }
    }
  } catch (e) {
    error.value = '音频播放失败：' + e.message
  } finally {
    isPlaying.value = false
  }
}

// ---- 复制 ----
async function copyText() {
  if (await copyToClipboard(text.value)) {
    success.value = '文本已复制'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyMorse() {
  if (await copyToClipboard(morse.value)) {
    success.value = '电码已复制'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

// ---- 清空 ----
function clearAll() {
  text.value = ''
  morse.value = ''
  error.value = ''
  success.value = ''
  if (isPlaying.value) {
    isPlaying.value = false
  }
}
</script>

<style scoped>
.morse-ref {
  border: 1px solid var(--line, #333);
  background: var(--panel, #111);
  padding: 0 12px 12px;
  margin-top: 16px;
}

.morse-ref summary {
  padding: 10px 0;
}

.morse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 4px 8px;
}

.morse-item {
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  font-size: 13px;
  color: var(--text, #ccc);
  padding: 2px 0;
}

.morse-item strong {
  color: var(--green, #9dff6b);
  margin-right: 6px;
}

.morse-group + .morse-group {
  margin-top: 4px;
}

@media (max-width: 640px) {
  .morse-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 2px 6px;
  }
  .morse-item {
    font-size: 12px;
  }
}
</style>
