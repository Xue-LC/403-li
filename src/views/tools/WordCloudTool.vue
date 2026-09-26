<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>☁️ 词云生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：文本输入 + 参数配置 -->
          <div class="tool-col">
            <label class="tool-label">文本来源：</label>
            <div
              class="upload-area"
              :class="{ 'drag-over': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".txt,.md,.log,.csv,.json,.js,.py,.vue,.css,.html,.xml,.yml"
                @change="handleFileChange"
                style="display: none"
              />
              <div class="upload-content">
                <span class="upload-icon">📄</span>
                <span class="upload-text">点击或拖拽上传文本文件</span>
                <span class="upload-hint">TXT / MD / LOG / CSV / JSON · ≤ 1MB</span>
              </div>
            </div>

            <label class="tool-label">文本内容：</label>
            <div class="input-with-copy">
              <textarea
                class="code-input"
                v-model="text"
                rows="8"
                spellcheck="false"
                placeholder="粘贴英文 / 中文文本，自动分词并生成词云…"
              ></textarea>
              <button class="copy-btn" @click="copyInput" title="复制文本">📋</button>
            </div>

            <!-- 分词与布局参数 -->
            <div class="config-section">
              <label class="tool-label">最大词数：{{ maxWords }}</label>
              <div class="slider-row">
                <input type="range" v-model.number="maxWords" min="20" max="300" step="10" class="range-input" />
                <span class="range-value">{{ maxWords }}</span>
              </div>

              <label class="tool-label">最少字数：{{ minLen }} 字</label>
              <div class="slider-row">
                <input type="range" v-model.number="minLen" min="1" max="6" step="1" class="range-input" />
                <span class="range-value">{{ minLen }}</span>
              </div>

              <label class="tool-label">最小字号：{{ minFont }}px</label>
              <div class="slider-row">
                <input type="range" v-model.number="minFont" min="10" max="40" step="1" class="range-input" />
                <span class="range-value">{{ minFont }}</span>
              </div>

              <label class="tool-label">最大字号：{{ maxFont }}px</label>
              <div class="slider-row">
                <input type="range" v-model.number="maxFont" min="30" max="150" step="2" class="range-input" />
                <span class="range-value">{{ maxFont }}</span>
              </div>

              <div class="options-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="ignoreDigits" />
                  <span>忽略纯数字</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="useStopwords" />
                  <span>过滤停用词</span>
                </label>
              </div>

              <label class="tool-label">词云形状：</label>
              <div class="radio-group">
                <label v-for="s in shapeOptions" :key="s.key" class="radio-label">
                  <input type="radio" v-model="shape" :value="s.key" />
                  <span>{{ s.label }}</span>
                </label>
              </div>

              <label class="tool-label">文字方向：</label>
              <div class="radio-group">
                <label v-for="m in angleModes" :key="m.key" class="radio-label">
                  <input type="radio" v-model="angleMode" :value="m.key" />
                  <span>{{ m.label }}</span>
                </label>
              </div>

              <label class="tool-label">配色方案：</label>
              <div class="radio-group">
                <label v-for="p in palettes" :key="p.key" class="radio-label">
                  <input type="radio" v-model="palette" :value="p.key" />
                  <span class="palette-name">
                    <span class="palette-dots">
                      <i v-for="(c, i) in p.colors.slice(0, 4)" :key="i" :style="{ backgroundColor: c }"></i>
                    </span>
                    {{ p.label }}
                  </span>
                </label>
              </div>

              <label class="tool-label">画布背景：</label>
              <div class="radio-group">
                <label v-for="b in bgModes" :key="b.key" class="radio-label">
                  <input type="radio" v-model="bgMode" :value="b.key" />
                  <span>{{ b.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 右栏：词云预览 + 词频统计 -->
          <div class="tool-col">
            <label class="tool-label">词云预览：</label>
            <div class="canvas-scroll">
              <div class="canvas-wrapper" :class="{ 'canvas-alpha': bgMode === 'alpha' }">
                <canvas ref="canvasRef" :width="canvasW" :height="canvasH"></canvas>
                <button class="copy-btn canvas-copy" @click="copyImage" title="复制图片">📋</button>
              </div>
            </div>

            <div v-if="renderInfo" class="wc-stats">{{ renderInfo }}</div>
            <div v-if="warnMsg" class="wc-warn">⚠️ {{ warnMsg }}</div>

            <div class="list-header">
              <span class="list-title">▼ 词频 TOP {{ topWords.length }}</span>
              <button class="copy-btn-inline" @click="copyList" title="复制词频表">📋 复制词表</button>
            </div>
            <div class="word-list" v-if="topWords.length">
              <div class="word-row" v-for="(w, i) in topWords.slice(0, 60)" :key="w.word">
                <span class="word-rank" :class="{ 'rank-first': i === 0 }">{{ i + 1 }}</span>
                <span class="word-name" :title="w.word">{{ w.word }}</span>
                <span class="word-bar"><i :style="{ width: barPct(w.freq) + '%' }"></i></span>
                <span class="word-freq">{{ w.freq }}</span>
              </div>
            </div>
            <div v-else class="empty-hint">暂无词频数据，先在上方粘贴文本</div>
          </div>
        </div>

        <!-- 全宽按钮组 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="loadSample">载入示例</button>
          <button class="tool-button" @click="randomize">🎲 随机布局</button>
          <button class="tool-button" @click="downloadPng">导出 PNG</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

/* ================= 常量 ================= */

const MONO = "'Maple Mono NF CN', 'Monaco', 'Consolas', monospace"
const W = 720 // 逻辑宽度
const H = 480 // 逻辑高度
const DPR = 2 // 固定 2x 超采样
const PAD = 26 // 画布内边距
const FAIL_QUIT = 6 // 小词连续放置失败 N 次后提前终止（空间已近饱和）

/* 调色板：严格遵守站点暖色（绿/黄/橙/红），不含蓝紫色 */
const palettes = [
  {
    key: 'neon',
    label: '霓虹',
    colors: ['#9dff6b', '#ffd866', '#ff8a8a', '#7ee787', '#ffa657', '#e3b341', '#56d364', '#ff7b72']
  },
  {
    key: 'forest',
    label: '森林',
    colors: ['#39d353', '#56d364', '#7ee787', '#9dff6b', '#2ea043', '#aff5b4', '#238636', '#b5e8a3']
  },
  {
    key: 'amber',
    label: '琥珀',
    colors: ['#ffd866', '#e3b341', '#ffa657', '#f0883e', '#ffb26b', '#d29922', '#ff8a8a', '#ffe97b']
  },
  {
    key: 'fire',
    label: '火焰',
    colors: ['#ff8a8a', '#ffa657', '#ffd866', '#ff7b72', '#f0883e', '#fff3b3', '#e3b341', '#ffc77b']
  },
  {
    key: 'mono',
    label: '荧光绿',
    colors: ['#9dff6b', '#7ee787', '#56d364', '#39d353', '#2ea043', '#aff5b4', '#b5e8a3', '#d2ffb0']
  }
]

const shapeOptions = [
  { key: 'rect', label: '矩形' },
  { key: 'ellipse', label: '椭圆' },
  { key: 'diamond', label: '菱形' }
]

const angleModes = [
  { key: 'h', label: '水平' },
  { key: 'hv', label: '水平+垂直' },
  { key: 'free', label: '自由倾斜' }
]

const bgModes = [
  { key: 'dark', label: '深色' },
  { key: 'alpha', label: '透明' }
]

/* 英文停用词（高频虚词） */
const STOP_EN =
  'a an and are as at be but by for from has have he her here him his i if in into is it its may me more most my no not of on or our out over she so some such than that the their them then there these they this those to too up us was we were what when where which who why will with would you your do does did done being been can could should shall might must nor own same only off under again once all any both each few other just about against between during before after above below down while because etc vs via per e g ie dont cant wont im youre s t m ll ve re'

/* 中文停用词（单字虚词 + 高频双字代词/连词） */
const STOP_CN =
  '的 了 是 在 我 你 他 她 它 们 有 就 都 人 一 个 上 也 很 到 说 去 会 着 没 看 好 这 那 被 把 让 向 从 为 与 及 并 或 而 但 且 吗 呢 吧 啊 哦 又 再 还 不 无 之 其 此 各 每 某 该 哪 谁 么 得 地 中 下 大 小 多 少 些 样 子 儿 头 里 外 前 后 间 时 年 月 日 我们 你们 他们 她们 它们 自己 没有 因为 所以 但是 如果 就是 还是 时候 知道 觉得 应该 不要 不会 已经 正在 现在 今天 明天 昨天 这里 那里 这些 那些 一个 一种 以及 或者 对于 关于 通过 由于 作为 还有 于是 接着 然后 最后 首先 其次 虽然 然而 只要 除非 无论 更加 非常 十分 特别 什么 怎么 可以 不能 这个 那个 那样 这样 如何 为何 倘若 即便 即使 并且 而且 况且'

const STOP_SET = new Set([...STOP_EN.split(/\s+/), ...STOP_CN.split(/\s+/)])

/* 纯虚字集合：作为中文长片段的分词边界（丢弃虚字本身分段），并用于整词停用。
   刻意排除"不/无/大/小/上/下/时/年/月/日/人/一/个"等常见实词词素，避免误伤"不错/现在/小时"等词 */
const STOP_SINGLE = new Set('的了是在我你他她它们就也都也很没被把让向从为与及并或而但且吗呢吧啊哦又再还这那着'.split(''))

/* 切分一个连续中文片段：
   以虚字为边界分段（虚字本身丢弃，如"是流行的编程语言"→ 流行 / 编程语言）；
   段 1 字直接输出（交给最少字数过滤）；2-4 字为整词；5-8 字无虚字连缀按整段保留；
   超过 8 字的实词连缀退化为 2-gram 滑窗 */
function splitCnRun(run) {
  const segs = []
  let cur = ''
  for (const ch of run) {
    if (STOP_SINGLE.has(ch)) {
      if (cur) { segs.push(cur); cur = '' }
    } else {
      cur += ch
    }
  }
  if (cur) segs.push(cur)
  const out = []
  for (const seg of segs) {
    const len = seg.length
    if (len === 0) continue
    if (len <= 8) {
      out.push(seg)
    } else {
      for (let i = 0; i + 1 < len; i++) out.push(seg.slice(i, i + 2))
    }
  }
  return out
}

const SAMPLE = `JavaScript、TypeScript、Python、Go、Rust 都是流行的编程语言。前端开发、后端开发、全栈开发、跨端开发，也都离不开它们。
Vue、React、Angular、Svelte、Next.js 是主流前端框架。Node.js、Deno、Bun 是新兴运行时。Webpack、Vite、Rollup 是常用构建工具。NPM、Yarn、Pnpm 是包管理器。
算法、数据结构、设计模式、函数式编程、并发编程、网络协议、数据库、缓存、消息队列、容器化、微服务、DevOps、CI/CD、单元测试、性能优化、安全加固，都是工程师的日常关键词。
Artificial intelligence, machine learning, deep learning, neural networks, natural language processing and computer vision are changing the world.
Cloud computing, big data, cybersecurity, blockchain, internet of things, edge computing and open source are hot topics in software engineering.
文档、社区、开源、分享、重构、代码评审、版本控制、自动化、监控告警、日志分析，每一个细节都值得认真对待。`

/* ================= 状态 ================= */

const canvasRef = ref(null)
const text = ref('')
const dragOver = ref(false)

const maxWords = ref(120)
const minLen = ref(2)
const minFont = ref(14)
const maxFont = ref(76)
const ignoreDigits = ref(true)
const useStopwords = ref(true)
const shape = ref('rect')
const angleMode = ref('h')
const palette = ref('neon')
const bgMode = ref('dark')

const topWords = ref([]) // [{ word, freq }]
const renderInfo = ref('')
const warnMsg = ref('')
const error = ref('')
const success = ref('')

const canvasW = W * DPR
const canvasH = H * DPR

let seed = 20260907
let runTimer = null
let msgTimer = null

const paletteColors = computed(() => {
  const p = palettes.find(p => p.key === palette.value) || palettes[0]
  return p.colors
})

/* ================= 工具函数 ================= */

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)
  return (v && v.trim()) ? v.trim() : fallback
}

/* 确定性伪随机数（mulberry32），保证同一种子可复现布局 */
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* 分词：英文按单词（小写合并）；中文连续片段交给 splitCnRun 智能切分 */
function tokenize(str) {
  const out = []
  const re = /[\u4e00-\u9fff\u3400-\u4dbf]+|[A-Za-z][A-Za-z0-9_'-]*/g
  let m
  while ((m = re.exec(str))) {
    const t = m[0]
    if (/[\u4e00-\u9fff]/.test(t[0])) {
      out.push(...splitCnRun(t))
    } else {
      out.push(t.toLowerCase())
    }
  }
  return out
}

/* 统计词频并过滤，返回按频次降序的 top N */
function analyze() {
  const counts = new Map()
  for (const tok of tokenize(text.value)) {
    if (ignoreDigits.value && /^[0-9]+([.,][0-9]+)?$/.test(tok)) continue
    if ([...tok].length < minLen.value) continue
    if (useStopwords.value && STOP_SET.has(tok)) continue
    counts.set(tok, (counts.get(tok) || 0) + 1)
  }
  const arr = []
  for (const [word, freq] of counts) arr.push({ word, freq })
  arr.sort((a, b) => b.freq - a.freq || [...b.word].length - [...a.word].length)
  return arr.slice(0, maxWords.value)
}

function barPct(freq) {
  const max = topWords.value.length ? topWords.value[0].freq : 1
  return Math.max(4, Math.round((freq / max) * 100))
}

/* ================= 布局算法 ================= */

/* 词云布局：阿基米德螺旋（连续曲线扫描半径带）中心向外放置，返回放置结果数组
   scale：全局字号缩放系数（空间不足时由 runPipeline 逐级调小重试） */
function layout(ctx, words, scale) {
  const maxFreq = words.length ? words[0].freq : 1
  const fMax = Math.max(maxFont.value, minFont.value + 4)
  const fMin = Math.min(minFont.value, fMax - 4)
  // 字号映射：幂 1.6（强势头）。maxFreq 词取最大字号，低频词快速收缩，
  // 避免 ×1/×2 主导的文本所有词都占超大字号而放不下
  const sizeOf = freq => (fMin + (fMax - fMin) * Math.pow(freq / maxFreq, 1.6)) * scale
  const rand = mulberry32(seed)
  const cx = W / 2
  const cy = H / 2
  const rx = W / 2 - PAD
  const ry = H / 2 - PAD
  const colors = paletteColors.value
  const placed = []
  const SPIRAL_STEP = 1.7 // 阿基米德螺旋半径系数：r = STEP·θ（每圈半径带 ≈ 10.7px < 词高）
  const THETA_STEP = 0.05 // 角步长：每圈约 126 个采样点，弧向采样 < 词宽
  const rMaxGlobal = shape.value === 'rect' ? Math.hypot(rx, ry) + 10 : Math.max(rx, ry)
  // 螺旋总步数：逐圈向外直到覆盖画布最远角（约 4700 步，每步 0.05rad）
  const MAX_K = Math.ceil(rMaxGlobal / SPIRAL_STEP / THETA_STEP) + 1
  let failStreak = 0 // 小词连续放置失败计数（空间饱和后提前终止，避免无效搜索）

  const inShape = (ax, ay) => {
    if (shape.value === 'ellipse') return (ax * ax) / (rx * rx) + (ay * ay) / (ry * ry) <= 1
    if (shape.value === 'diamond') return Math.abs(ax) / rx + Math.abs(ay) / ry <= 1
    return true
  }

  for (let i = 0; i < words.length; i++) {
    const { word, freq } = words[i]
    let size = sizeOf(freq)

    // 旋转角度
    let angle = 0
    if (angleMode.value === 'hv') {
      if (rand() < 0.3) angle = (rand() < 0.5 ? -1 : 1) * (Math.PI / 2)
    } else if (angleMode.value === 'free') {
      if (rand() < 0.25) {
        angle = (rand() < 0.5 ? -1 : 1) * (Math.PI / 2)
      } else {
        angle = (rand() - 0.5) * (Math.PI / 2.4)
      }
    }

    ctx.font = `600 ${size}px ${MONO}`
    let w = ctx.measureText(word).width
    // 超长词按宽度等比缩小字号，保证可放置
    const maxW = W - PAD * 2 - 8
    if (w > maxW) {
      size *= maxW / w
      ctx.font = `600 ${size}px ${MONO}`
      w = ctx.measureText(word).width
    }
    const h = size * 1.08
    const cosA = Math.abs(Math.cos(angle))
    const sinA = Math.abs(Math.sin(angle))
    const bw = w * cosA + h * sinA + 3 // 旋转后 AABB（碰撞用）
    const bh = w * sinA + h * cosA + 3
    const hw = bw / 2
    const hh = bh / 2
    const cA = Math.cos(angle)
    const sA = Math.sin(angle)
    const x1 = (w / 2) * cA - (h / 2) * sA
    const y1 = (w / 2) * sA + (h / 2) * cA
    const x2 = (w / 2) * cA + (h / 2) * sA
    const y2 = (w / 2) * sA - (h / 2) * cA
    const pts = [[x1, y1], [-x1, -y1], [x2, y2], [-x2, -y2]]

    // 提交放置结果（重置失败计数）
    const commitPlace = (dx, dy, horizontal) => {
      failStreak = 0
      placed.push({
        x: cx + dx - hw,
        y: cy + dy - hh,
        w: bw,
        h: bh,
        word, freq, size,
        angle: horizontal ? 0 : angle,
        dx, dy,
        color: colors[placed.length % colors.length]
      })
    }

    let found = false
    // 搜索预算分级：大词找大空隙、难命中，给较少尝试快速失败；小词（填缝）给足预算
    const ratio = size / fMax
    const maxK = ratio > 0.66 ? Math.min(MAX_K, 1500) : ratio > 0.33 ? Math.min(MAX_K, 3200) : MAX_K
    // 螺旋从中心 (r=0) 出发，方向随机旋转，逐圈向外直到覆盖画布
    const th0 = rand() * Math.PI * 2

    for (let k = 0; k < maxK; k++) {
      const th = th0 + k * THETA_STEP
      const r = SPIRAL_STEP * k * THETA_STEP
      const ox = Math.cos(th) * r
      const oy = Math.sin(th) * r

      // 形状检测：词真实角点需落在形状/画布内
      let ok = true
      for (let p = 0; p < 4; p++) {
        const ax = ox + pts[p][0]
        const ay = oy + pts[p][1]
        if (shape.value === 'rect') {
          if (Math.abs(ax) > rx - 2 || Math.abs(ay) > ry - 2) { ok = false; break }
        } else if (!inShape(ax, ay)) {
          ok = false
          break
        }
      }
      if (!ok) continue

      // AABB 碰撞检测
      const bx = cx + ox - hw
      const by = cy + oy - hh
      let hit = false
      for (let p = 0; p < placed.length; p++) {
        const b = placed[p]
        if (bx < b.x + b.w && bx + bw > b.x && by < b.y + b.h && by + bh > b.y) {
          hit = true
          break
        }
      }
      if (hit) continue

      commitPlace(ox, oy)
      found = true
      break
    }

    // 首词兜底：常规螺旋放不下时尝试水平居中放置（仅当确实能放进中心区域）
    if (!found && i === 0 && w <= rx * 2 - 4 && h <= ry * 2 - 4) {
      commitPlace(0, 0, true)
      found = true
    }

    // 只有小词（填缝词）连续失败才判定空间饱和；大词放不下属正常，继续尝试后续小词
    if (!found && ratio <= 0.45 && ++failStreak >= FAIL_QUIT) break
  }
  return placed
}

/* 绘制词云到 canvas */
function draw(ctx, placed) {
  ctx.clearRect(0, 0, W, H)
  if (bgMode.value === 'dark') {
    ctx.fillStyle = cssVar('--bg', '#0d1117')
    ctx.fillRect(0, 0, W, H)
  }
  for (const it of placed) {
    ctx.save()
    ctx.translate(W / 2 + it.dx, H / 2 + it.dy)
    ctx.rotate(it.angle)
    ctx.font = `600 ${it.size}px ${MONO}`
    ctx.fillStyle = it.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(it.word, 0, it.size * 0.03)
    ctx.restore()
  }
}

/* ================= 主流程 ================= */

function runPipeline() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

  // 空文本：清空并显示占位提示
  if (!text.value.trim()) {
    topWords.value = []
    renderInfo.value = ''
    warnMsg.value = ''
    ctx.clearRect(0, 0, W, H)
    if (bgMode.value === 'dark') {
      ctx.fillStyle = cssVar('--bg', '#0d1117')
      ctx.fillRect(0, 0, W, H)
    }
    ctx.fillStyle = 'rgba(139,148,158,0.7)'
    ctx.font = `400 14px ${MONO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('☁️ 粘贴文本后自动生成词云', W / 2, H / 2)
    return
  }

  const t0 = performance.now()
  const words = analyze()
  topWords.value = words

  if (!words.length) {
    ctx.clearRect(0, 0, W, H)
    renderInfo.value = '未识别到可用词汇（可尝试调低「最少字数」或关闭停用词过滤）'
    warnMsg.value = ''
    return
  }

  // 自适应缩放：放置率过低（多为同频短文本）时整体字号等比缩小重试，最多 4 次
  let scale = 1
  let placed = []
  for (let i = 0; i < 4; i++) {
    placed = layout(ctx, words, scale)
    const skipRatio = (words.length - placed.length) / words.length
    if (skipRatio <= 0.18 || scale <= 0.62) break
    scale = Math.max(0.62, scale * 0.82)
  }
  draw(ctx, placed)

  const ms = Math.round(performance.now() - t0)
  const skipped = words.length - placed.length
  renderInfo.value = `共识别 ${words.length} 个词 · 放置 ${placed.length} 个 · 耗时 ${ms}ms`
  warnMsg.value = skipped > 0
    ? `${skipped} 个词因空间不足未放置，可减少最大词数或调低字号`
    : ''
}

function scheduleRun() {
  clearTimeout(runTimer)
  runTimer = setTimeout(runPipeline, 260)
}

/* ================= 交互 ================= */

function flashSuccess(msg) {
  clearTimeout(msgTimer)
  success.value = msg
  error.value = ''
  msgTimer = setTimeout(() => { success.value = '' }, 2200)
}

function flashError(msg) {
  clearTimeout(msgTimer)
  error.value = msg
  success.value = ''
  msgTimer = setTimeout(() => { error.value = '' }, 3500)
}

function copyInput() {
  if (!text.value) { flashError('没有可复制的文本'); return }
  navigator.clipboard.writeText(text.value)
    .then(() => flashSuccess('输入文本已复制'))
    .catch(() => flashError('复制失败，请手动选择复制'))
}

function copyList() {
  if (!topWords.value.length) { flashError('词频表为空'); return }
  const body = topWords.value.map((w, i) => `${i + 1}. ${w.word}\t${w.freq}`).join('\n')
  navigator.clipboard.writeText(body)
    .then(() => flashSuccess(`词频表已复制（${topWords.value.length} 词）`))
    .catch(() => flashError('复制失败，请手动选择复制'))
}

async function copyImage() {
  const canvas = canvasRef.value
  if (!canvas) return
  try {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('png 生成失败'))), 'image/png')
    })
    if (!navigator.clipboard || !window.ClipboardItem) {
      flashError('当前浏览器不支持复制图片，请使用「导出 PNG」')
      return
    }
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    flashSuccess('词云图片已复制到剪贴板')
  } catch (e) {
    flashError('复制图片失败：' + (e && e.message ? e.message : '未知错误'))
  }
}

function downloadPng() {
  const canvas = canvasRef.value
  if (!canvas || !topWords.value.length) { flashError('没有可导出的词云'); return }
  const link = document.createElement('a')
  link.download = `wordcloud_${shape.value}_${palette.value}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  flashSuccess('PNG 已导出')
}

function loadSample() {
  text.value = SAMPLE
  flashSuccess('已载入示例文本')
}

function randomize() {
  seed = Math.floor(Math.random() * 1e9)
  runPipeline()
  flashSuccess('已随机重排布局（随机种子 #' + seed + '）')
}

function clearAll() {
  text.value = ''
  runPipeline()
  flashSuccess('已清空')
}

/* ================= 文件上传 ================= */

function handleFileChange(e) {
  const f = e.target.files && e.target.files[0]
  if (f) readFile(f)
  e.target.value = ''
}

function handleDrop(e) {
  dragOver.value = false
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (f) readFile(f)
}

function readFile(file) {
  if (file.size > 1024 * 1024) {
    flashError(`文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），请上传 ≤1MB 的文本文件`)
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    text.value = String(reader.result || '')
    flashSuccess(`已载入 ${file.name}`)
  }
  reader.onerror = () => flashError('文件读取失败，请重试')
  reader.readAsText(file)
}

/* ================= 生命周期 ================= */

watch(text, scheduleRun)
watch(
  [maxWords, minLen, minFont, maxFont, ignoreDigits, useStopwords, shape, angleMode, palette, bgMode],
  scheduleRun
)

onMounted(() => {
  text.value = SAMPLE
  runPipeline()
})

onBeforeUnmount(() => {
  clearTimeout(runTimer)
  clearTimeout(msgTimer)
})
</script>

<style scoped>
/* ==== 文本输入区 ==== */
.input-with-copy {
  align-items: stretch;
}

/* ==== 上传区域 ==== */
.upload-area {
  border: 2px dashed var(--line);
  padding: 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.2);
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: var(--green);
  background: var(--green-soft);
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.upload-icon {
  font-size: 22px;
  line-height: 1;
}

.upload-text {
  color: var(--text);
  font-size: 13px;
}

.upload-hint {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
}

/* ==== 滑杆行 ==== */
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-row .range-input {
  flex: 1;
  margin: 6px 0;
}

.range-value {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  min-width: 34px;
  text-align: right;
}

.options-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin: 4px 0 2px;
}

/* ==== 配色方案色点 ==== */
.palette-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.palette-dots {
  display: inline-flex;
  gap: 3px;
}

.palette-dots i {
  width: 9px;
  height: 9px;
  display: inline-block;
  border-radius: 0;
}

/* ==== 预览区 ==== */
.canvas-scroll {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
  overflow-x: auto;
}

.canvas-wrapper {
  position: relative;
  min-width: 0;
}

.canvas-wrapper canvas {
  width: 100%;
  height: auto;
  display: block;
  border: 1px solid var(--line);
}

/* 透明背景预览：棋盘格示意 */
.canvas-wrapper.canvas-alpha canvas {
  background-image:
    linear-gradient(45deg, rgba(157, 255, 107, 0.07) 25%, transparent 25%, transparent 75%, rgba(157, 255, 107, 0.07) 75%),
    linear-gradient(45deg, rgba(157, 255, 107, 0.07) 25%, transparent 25%, transparent 75%, rgba(157, 255, 107, 0.07) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 8px 8px;
}

.canvas-copy {
  top: 14px;
  right: 14px;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  padding: 6px 8px;
  font-size: 14px;
}

/* ==== 统计与提示 ==== */
.wc-stats {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  margin-top: 6px;
  text-align: center;
}

.wc-warn {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--amber);
  margin-top: 6px;
  text-align: center;
}

/* ==== 词频列表 ==== */
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.list-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
}

.copy-btn-inline {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  cursor: pointer;
  font-size: 12px;
  font-family: var(--mono);
  padding: 3px 8px;
  transition: all 0.2s;
}

.copy-btn-inline:hover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 12px var(--green-glow);
}

.word-list {
  margin-top: 6px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.word-row {
  display: grid;
  grid-template-columns: 26px 1fr 90px 36px;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-bottom: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 12px;
}

.word-row:last-child {
  border-bottom: none;
}

.word-rank {
  color: var(--muted);
  text-align: right;
}

.word-rank.rank-first {
  color: var(--green);
  font-weight: 700;
}

.word-name {
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.word-bar {
  height: 6px;
  background: var(--panel);
  border: 1px solid var(--line);
  display: block;
}

.word-bar i {
  display: block;
  height: 100%;
  background: var(--green-soft);
  border-right: 2px solid var(--green);
}

.word-row:nth-child(2) .word-bar i,
.word-row:nth-child(3) .word-bar i {
  background: rgba(157, 255, 107, 0.22);
}

.word-freq {
  color: var(--green);
  text-align: right;
}

.empty-hint {
  margin-top: 6px;
  padding: 18px 10px;
  border: 1px dashed var(--line);
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
  text-align: center;
}

/* ==== 移动端 ==== */
@media (max-width: 640px) {
  .word-row {
    grid-template-columns: 22px 1fr 70px 30px;
    gap: 6px;
    padding: 3px 8px;
    font-size: 11px;
  }
}
</style>
