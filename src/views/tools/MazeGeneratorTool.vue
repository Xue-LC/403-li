<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🌀 迷宫生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <div class="tool-two-col">
          <!-- 左栏：参数控制 -->
          <div class="tool-col">
            <label class="tool-label">生成算法：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="algorithm" value="dfs" />
                <span>递归回溯（细长走廊）</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="algorithm" value="prim" />
                <span>Prim（均匀分支）</span>
              </label>
            </div>

            <label class="tool-label">列数：{{ cols }}</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="cols" min="10" max="60" step="1" />
              <span class="range-value">{{ cols }}</span>
            </div>

            <label class="tool-label">行数：{{ rows }}</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="rows" min="10" max="40" step="1" />
              <span class="range-value">{{ rows }}</span>
            </div>

            <label class="tool-label">随机种子（留空 = 随机）：</label>
            <div class="seed-row">
              <input class="code-input-sm seed-input" v-model.trim="seedText" type="text"
                inputmode="numeric" spellcheck="false" placeholder="整数种子，可复现迷宫"
                @keyup.enter="generate(true)" />
              <button class="tool-button seed-btn" @click="rollSeed" title="随机种子">🎲</button>
            </div>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="showPath" />
                <span>高亮最短路径</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="showMarkers" />
                <span>标记入口 / 出口</span>
              </label>
            </div>

            <div class="hint-inline">入口固定左上角，出口固定右下角</div>
          </div>

          <!-- 右栏：SVG 预览 -->
          <div class="tool-col">
            <label class="tool-label">迷宫预览：</label>
            <div class="mz-preview">
              <svg v-if="maze" class="mz-svg" :viewBox="viewBox"
                preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                <rect class="mz-wall" x="0.07" y="0.07"
                  :width="maze.cols - 0.14" :height="maze.rows - 0.14" fill="none" />
                <path class="mz-wall" :d="maze.wallsD" fill="none" />
                <path v-if="showPath && maze.pathD" class="mz-path" :d="maze.pathD" fill="none" />
                <rect v-if="showMarkers" class="mz-start" x="0.28" y="0.28" width="0.44" height="0.44" />
                <rect v-if="showMarkers" class="mz-end"
                  :x="maze.cols - 0.72" :y="maze.rows - 0.72" width="0.44" height="0.44" />
              </svg>
              <div v-else class="mz-empty">正在生成迷宫…</div>
              <button class="copy-btn mz-copy" @click="copySvg" title="复制 SVG 代码">📋</button>
            </div>
            <div v-if="maze" class="render-info">
              {{ maze.cols }}×{{ maze.rows }} · {{ maze.algo === 'dfs' ? '递归回溯' : 'Prim' }} ·
              生成 {{ maze.genMs }}ms · 最短路径 {{ maze.pathLen }} 格 · 种子 {{ maze.seed }}
            </div>
          </div>
        </div>

        <!-- 全宽按钮组 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="generate(true)">🌀 生成迷宫</button>
          <button class="tool-button" @click="copySvg">📋 复制 SVG</button>
          <button class="tool-button" @click="exportSvg">⬇ 导出 SVG</button>
        </div>

        <div class="hint-line">
          每次生成的都是「完美迷宫」——任意两点之间有且仅有一条通路；最短路径由 BFS 广度优先搜索求得。
          递归回溯倾向产生长而曲折的走廊，Prim 算法产生的分支则更均匀。
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'

/* ---------- 状态 ---------- */

const algorithm = ref('dfs')
const cols = ref(31)
const rows = ref(21)
const seedText = ref('')
const showPath = ref(true)
const showMarkers = ref(true)
const maze = ref(null)
const error = ref('')
const success = ref('')

let successTimer = null
let errorTimer = null
let regenTimer = null

const viewBox = computed(() => {
  const m = maze.value
  return m ? `0 0 ${m.cols} ${m.rows}` : '0 0 1 1'
})

/* ---------- 工具函数 ---------- */

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function resolveSeed() {
  const s = seedText.value || ''
  if (!s) return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0 || 1
  const n = Number(s)
  if (!Number.isInteger(n) || n < 0) return null
  return n >>> 0
}

function flashSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2200)
}

function flashError(msg) {
  error.value = msg
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => (error.value = ''), 3000)
}

/* ---------- 迷宫算法 ---------- */

const DR = [-1, 0, 1, 0]
const DC = [0, 1, 0, -1]
const BIT = [1, 2, 4, 8] // N E S W
const OPP = [4, 8, 1, 2] // 对面墙的 bit

function inGrid(r, c, rowsN, colsN) {
  return r >= 0 && r < rowsN && c >= 0 && c < colsN
}

/* 递归回溯（深度优先，迭代实现） */
function genDfs(colsN, rowsN, rng) {
  const n = colsN * rowsN
  const walls = new Uint8Array(n).fill(15)
  const visited = new Uint8Array(n)
  const stack = [0]
  visited[0] = 1
  while (stack.length) {
    const cur = stack[stack.length - 1]
    const r = (cur / colsN) | 0
    const c = cur % colsN
    const order = [0, 1, 2, 3]
    for (let i = 3; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      const tmp = order[i]
      order[i] = order[j]
      order[j] = tmp
    }
    let moved = false
    for (let k = 0; k < 4; k++) {
      const d = order[k]
      const nr = r + DR[d]
      const nc = c + DC[d]
      if (!inGrid(nr, nc, rowsN, colsN)) continue
      const nb = nr * colsN + nc
      if (visited[nb]) continue
      walls[cur] &= ~BIT[d]
      walls[nb] &= ~OPP[d]
      visited[nb] = 1
      stack.push(nb)
      moved = true
      break
    }
    if (!moved) stack.pop()
  }
  return walls
}

/* 随机 Prim（迭代实现） */
function genPrim(colsN, rowsN, rng) {
  const n = colsN * rowsN
  const walls = new Uint8Array(n).fill(15)
  const inTree = new Uint8Array(n)
  const edges = [] // 记录树内 → 树外的边
  const start = 0
  inTree[start] = 1
  for (let d = 0; d < 4; d++) {
    const nr = DR[d]
    const nc = DC[d]
    if (inGrid(nr, nc, rowsN, colsN)) edges.push(start * 4 + d)
  }
  while (edges.length) {
    const pick = Math.floor(rng() * edges.length)
    const e = edges[pick]
    edges[pick] = edges[edges.length - 1]
    edges.pop()
    const a = (e / 4) | 0
    const d = e % 4
    const ar = (a / colsN) | 0
    const ac = a % colsN
    const br = ar + DR[d]
    const bc = ac + DC[d]
    if (!inGrid(br, bc, rowsN, colsN)) continue
    const b = br * colsN + bc
    if (inTree[b]) continue
    walls[a] &= ~BIT[d]
    walls[b] &= ~OPP[d]
    inTree[b] = 1
    for (let dd = 0; dd < 4; dd++) {
      const nr = br + DR[dd]
      const nc = bc + DC[dd]
      if (inGrid(nr, nc, rowsN, colsN)) edges.push(b * 4 + dd)
    }
  }
  return walls
}

/* BFS 求最短路径（起点左上 → 终点右下） */
function solve(walls, colsN, rowsN) {
  const n = colsN * rowsN
  const start = 0
  const end = n - 1
  const parent = new Int32Array(n).fill(-2)
  const queue = new Int32Array(n)
  let head = 0
  let tail = 0
  parent[start] = -1
  queue[tail++] = start
  while (head < tail) {
    const cur = queue[head++]
    if (cur === end) break
    const r = (cur / colsN) | 0
    const c = cur % colsN
    for (let d = 0; d < 4; d++) {
      if (walls[cur] & BIT[d]) continue // 有墙，走不通
      const nr = r + DR[d]
      const nc = c + DC[d]
      if (!inGrid(nr, nc, rowsN, colsN)) continue
      const nb = nr * colsN + nc
      if (parent[nb] !== -2) continue
      parent[nb] = cur
      queue[tail++] = nb
    }
  }
  if (parent[end] === -2) return null
  const path = []
  let cur = end
  while (cur !== -1) {
    path.push(cur)
    cur = parent[cur]
  }
  path.reverse()
  return path
}

/* 把墙壁位图拼成 SVG path（整数坐标，跳过右/下外边框，由 rect 绘制） */
function buildWallsD(walls, colsN, rowsN) {
  const parts = []
  for (let r = 0; r < rowsN; r++) {
    const base = r * colsN
    for (let c = 0; c < colsN; c++) {
      const w = walls[base + c]
      if ((w & 2) && c < colsN - 1) parts.push(`M${c + 1} ${r}L${c + 1} ${r + 1}`) // E
      if ((w & 4) && r < rowsN - 1) parts.push(`M${c} ${r + 1}L${c + 1} ${r + 1}`) // S
    }
  }
  return parts.join('')
}

function buildPathD(path, colsN) {
  if (!path || !path.length) return ''
  const pts = path.map((i) => `${(i % colsN) + 0.5},${((i / colsN) | 0) + 0.5}`)
  return 'M' + pts.join('L')
}

/* ---------- 生成 ---------- */

function generate(flash) {
  const c = Math.min(Math.max(cols.value | 0, 10), 60)
  const r = Math.min(Math.max(rows.value | 0, 10), 40)
  cols.value = c
  rows.value = r
  const seedVal = resolveSeed()
  if (seedVal === null) {
    flashError('种子必须是 0 或正整数，留空则使用随机种子')
    return
  }
  const rng = mulberry32(seedVal)
  const t0 = performance.now()
  let walls
  try {
    walls = algorithm.value === 'prim' ? genPrim(c, r, rng) : genDfs(c, r, rng)
  } catch (err) {
    flashError('迷宫生成失败，请减小尺寸后重试')
    return
  }
  const genMs = performance.now() - t0
  const path = solve(walls, c, r)
  maze.value = {
    cols: c,
    rows: r,
    algo: algorithm.value,
    seed: seedVal,
    genMs: Math.round(genMs * 10) / 10,
    wallsD: buildWallsD(walls, c, r),
    pathD: path ? buildPathD(path, c) : '',
    pathLen: path ? path.length : 0
  }
  if (flash) flashSuccess(`已生成 ${c}×${r} 迷宫${path ? `，最短路径 ${path.length} 格` : ''}`)
}

function rollSeed() {
  seedText.value = String((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0)
  generate(true)
}

/* ---------- 复制 / 导出 ---------- */

function resolveCssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function buildSvgCode() {
  const m = maze.value
  if (!m) return ''
  const wall = resolveCssVar('--line-strong', '#3d444d')
  const parts = []
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.cols} ${m.rows}" width="${m.cols * 16}" height="${m.rows * 16}">`
  )
  parts.push(
    `  <rect x="0.07" y="0.07" width="${(m.cols - 0.14).toFixed(2)}" height="${(m.rows - 0.14).toFixed(2)}" fill="none" stroke="${wall}" stroke-width="0.14"/>`
  )
  parts.push(`  <path d="${m.wallsD}" fill="none" stroke="${wall}" stroke-width="0.14"/>`)
  if (showPath.value && m.pathD) {
    const pathC = resolveCssVar('--green', '#9dff6b')
    parts.push(
      `  <path d="${m.pathD}" fill="none" stroke="${pathC}" stroke-width="0.46" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`
    )
  }
  if (showMarkers.value) {
    const startC = resolveCssVar('--text', '#e6edf3')
    const endC = resolveCssVar('--red', '#ff6b7d')
    parts.push(`  <rect x="0.28" y="0.28" width="0.44" height="0.44" fill="${startC}"/>`)
    parts.push(
      `  <rect x="${(m.cols - 0.72).toFixed(2)}" y="${(m.rows - 0.72).toFixed(2)}" width="0.44" height="0.44" fill="${endC}"/>`
    )
  }
  parts.push('</svg>')
  return parts.join('\n')
}

function copyText(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => flashSuccess('SVG 代码已复制到剪贴板'))
    .catch(() => flashError('复制失败，请手动选择复制'))
}

function copySvg() {
  const code = buildSvgCode()
  if (!code) {
    flashError('还没有迷宫，请先点击「生成迷宫」')
    return
  }
  copyText(code)
}

function exportSvg() {
  const code = buildSvgCode()
  if (!code) {
    flashError('还没有迷宫，请先点击「生成迷宫」')
    return
  }
  const blob = new Blob([code], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `maze_${maze.value.cols}x${maze.value.rows}_${maze.value.algo}_s${maze.value.seed}.svg`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
  flashSuccess('SVG 文件已导出')
}

/* ---------- 生命周期 ---------- */

watch([algorithm, cols, rows], () => {
  clearTimeout(regenTimer)
  regenTimer = setTimeout(() => generate(false), 180)
})

onMounted(() => generate(false))

onBeforeUnmount(() => {
  clearTimeout(regenTimer)
  clearTimeout(successTimer)
  clearTimeout(errorTimer)
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
  min-width: 34px;
  text-align: right;
  flex-shrink: 0;
}

/* 种子输入行 */
.seed-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.seed-input {
  flex: 1;
  min-width: 0;
}

.seed-btn {
  min-height: 40px;
  padding: 0 14px;
  flex-shrink: 0;
}

.options-group {
  margin-top: 4px;
}

/* 提示 */
.hint-inline {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}

.hint-line {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
  line-height: 1.6;
}

/* SVG 预览区 */
.mz-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
  min-height: 240px;
}

.mz-svg {
  width: 100%;
  height: auto;
  display: block;
}

.mz-empty {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  padding: 60px 0;
}

.mz-copy {
  top: 14px;
  right: 14px;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  padding: 6px 8px;
  font-size: 14px;
}

/* 迷宫颜色（跟随主题 CSS 变量，禁止硬编码） */
.mz-wall {
  stroke: var(--line-strong);
  stroke-width: 0.14;
}

.mz-path {
  stroke: var(--green);
  stroke-width: 0.46;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.9;
}

.mz-start {
  fill: var(--text);
}

.mz-end {
  fill: var(--red);
}

.render-info {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin: 6px 0 12px;
}

@media (max-width: 640px) {
  .range-value {
    font-size: 12px;
    min-width: 30px;
  }

  .mz-preview {
    min-height: 180px;
  }
}
</style>
