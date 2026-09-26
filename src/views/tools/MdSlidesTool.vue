<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🖥️ Markdown 幻灯片演示</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- ✅ 双栏布局 -->
        <div class="tool-two-col">
          <!-- 左侧：Markdown 源文本 -->
          <div class="tool-col">
            <div class="col-head">
              <label class="tool-label">Markdown 源文本</label>
              <button class="mini-copy" @click="copyAll" :disabled="!input.trim()" title="复制全部 Markdown 源码">📋</button>
            </div>
            <textarea
              v-model="input"
              class="code-input"
              rows="16"
              spellcheck="false"
              placeholder="在此输入 Markdown，用独立的 --- 行分割每一页幻灯片...&#10;&#10;# 第一页标题&#10;&#10;---&#10;&#10;# 第二页标题"
            ></textarea>
            <div class="seg-tip">
              💡 用 <code>---</code> 分割页 · <code>```js</code> 代码高亮 · <code>```mermaid</code> 渲染图表 · 演示模式支持 ← → / 空格翻页
            </div>
            <div class="hint-row">
              <button class="hint-btn" @click="loadSample" :disabled="isSample">🧪 载入示例</button>
              <button class="hint-btn danger" @click="clearAll" :disabled="!input.trim()">🗑️ 清空</button>
            </div>
          </div>

          <!-- 右侧：幻灯片预览 -->
          <div class="tool-col">
            <div class="col-head">
              <label class="tool-label">幻灯片预览{{ slides.length ? `（${current + 1} / ${slides.length}）` : '' }}</label>
              <button class="mini-copy" @click="copyCurrent" :disabled="!currentSrc" title="复制当前页 Markdown">📋</button>
            </div>

            <div class="slide-stage" ref="stageRef">
              <div class="slide-content" v-html="currentHtml"></div>
            </div>

            <div class="slide-nav">
              <button class="tool-button nav-btn" @click="go(-1)" :disabled="!canPrev">◀</button>
              <div class="page-dots">
                <span v-for="(s, i) in slides" :key="i" class="dot"
                  :class="{ on: i === current }" @click="jump(i)"
                  :title="`第 ${i + 1} 页`"></span>
              </div>
              <button class="tool-button nav-btn" @click="go(1)" :disabled="!canNext">▶</button>
            </div>
          </div>
        </div>

        <!-- ✅ 全宽按钮 / 状态（双栏外） -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="present" :disabled="!slides.length">▶ 全屏演示</button>
          <button class="tool-button" @click="exportHtml" :disabled="!slides.length">📥 导出 HTML 分享</button>
          <button class="tool-button danger" @click="clearAll" :disabled="!input.trim()">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
        <div v-if="!slides.length && input.trim()" class="status-error">⚠ 未找到可用页面：请在 Markdown 中用独立的 <code>---</code> 行分割幻灯片</div>

      </div>
    </div>

    <!-- ✅ 全屏演示遮罩（Teleport 到 body） -->
    <Teleport to="body">
      <div v-if="presenting" class="pres-overlay" ref="presRef">
        <div class="pres-top">
          <span class="pres-brand">▶ MD SLIDES · 403.li</span>
          <span class="pres-title" :title="slideTitle">{{ slideTitle }}</span>
          <span class="pres-count">{{ current + 1 }} / {{ slides.length }}</span>
          <button class="pres-ctl" @click="toggleNativeFs" title="浏览器原生全屏 (F)">⛶</button>
          <button class="pres-ctl danger" @click="exitPresent" title="退出演示 (Esc)">✕ 退出</button>
        </div>

        <div class="pres-body">
          <button class="pres-zone" @click="go(-1)" title="上一页 (←)" :disabled="!canPrev">◀</button>
          <div class="pres-canvas" ref="presCanvasRef">
            <div class="pres-slide" ref="presSlideRef" v-html="currentHtml"></div>
          </div>
          <button class="pres-zone" @click="go(1)" title="下一页 (→)" :disabled="!canNext">▶</button>
        </div>

        <div class="pres-bottom">
          <div class="pres-progress">
            <div class="pres-progress-fill" :style="{ width: progressWidth + '%' }"></div>
          </div>
          <div class="pres-hint">← → / 空格 翻页 · Home / End 首尾页 · F 原生全屏 · Esc 退出</div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import java from 'highlight.js/lib/languages/java'
import golang from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import ini from 'highlight.js/lib/languages/ini'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import diff from 'highlight.js/lib/languages/diff'
import { copyText } from '../../utils/clipboard'

/* ================= highlight.js：注册常用语言 ================= */
const langMap = {
  javascript, typescript, xml, css, json, python, bash, sql, yaml,
  markdown, java, go: golang, rust, php, ruby, ini, dockerfile, diff
}
Object.entries(langMap).forEach(([name, mod]) => hljs.registerLanguage(name, mod))

/* ================= marked：独立实例，不污染其他工具 ================= */
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const md = new Marked()
md.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }) {
      const l = (lang || '').trim().split(/\s+/)[0].toLowerCase()
      // Mermaid 图
      if (l === 'mermaid' || l === 'mmd') {
        return `<pre class="mermaid">${escHtml(text.trim())}</pre>`
      }
      // 代码高亮
      if (l && hljs.getLanguage(l)) {
        try {
          const res = hljs.highlight(text, { language: l, ignoreIllegals: true })
          return `<pre class="code-block"><code class="hljs">${res.value}</code></pre>`
        } catch (e) { /* fallback */ }
      }
      return `<pre class="code-block"><code class="hljs">${escHtml(text)}</code></pre>`
    }
  }
})

/* ================= 状态 ================= */
const SAMPLE = `# Markdown 幻灯片

用独立的 \`---\` 行把 Markdown 切分成一页页幻灯片，点击「▶ 全屏演示」播放。

---

## 基本排版

- 列表、**粗体**、*斜体*、~~删除线~~ 都支持
- [超链接](https://403.li) 与 \`行内代码\`
- \`---\` 前后建议留空行，更清晰

> 💡 键盘 ← → / 空格翻页，Home / End 跳转首尾。

---

## 代码高亮

\`\`\`js
// JS / TS / HTML / CSS / Python / Go / Rust ... 语法高亮
function fib(n) {
  if (n < 2) return n
  return fib(n - 1) + fib(n - 2)
}
console.log('fib(10) =', fib(10)) // 55
\`\`\`

\`\`\`python
def greet(name: str) -> str:
    """高亮示例"""
    return f"Hello, {name}!"
\`\`\`

---

## Mermaid 图表

\`\`\`mermaid
flowchart LR
  A[输入 Markdown] --> B{含 --- 分隔?}
  B -- 是 --> C[按页渲染]
  B -- 否 --> D[单页演示]
  C --> E[全屏演示]
  D --> E
  E --> F[导出 HTML 分享]
\`\`\`

\`\`\`mermaid
sequenceDiagram
  participant U as 演讲者
  participant P as 403.li
  U->>P: 按空格翻页
  P->>U: 渲染下一张幻灯片
\`\`\`

---

## 表格与排版

| 功能 | 快捷键 | 说明 |
| ---- | ------ | ---- |
| 上一页 | ← / PgUp | 后退 |
| 下一页 | → / 空格 | 前进 |
| 首 / 尾 | Home / End | 快速跳转 |
| 退出 | Esc | 结束演示 |

<div align="center" style="margin-top:40px;font-size:20px">
  纯前端 · 数据不出浏览器 · 祝演示顺利 🎉
</div>`

const input = ref(SAMPLE)
const slides = ref([])
const current = ref(0)
const presenting = ref(false)
const error = ref('')
const success = ref('')
let msgTimer = null
let rebuildTimer = null
let resizeHandler = null
let renderSeq = 0

const stageRef = ref(null)
const presRef = ref(null)
const presCanvasRef = ref(null)
const presSlideRef = ref(null)

const isSample = computed(() => input.value.trim() === SAMPLE.trim())

/* ================= 幻灯片切分（识别围栏，防误切） ================= */
function splitSlides(src) {
  const lines = String(src || '').split(/\r?\n/)
  const out = []
  let buf = []
  let fence = ''
  const flush = () => {
    const t = buf.join('\n').trim()
    if (t) out.push(t)
    buf = []
  }
  for (const line of lines) {
    const t = line.trim()
    if (!fence && /^(`{3,}|~{3,})/.test(t)) {
      fence = t.match(/^(`{3,}|~{3,})/)[1]
      buf.push(line)
      continue
    }
    if (fence && t.startsWith(fence)) {
      fence = ''
      buf.push(line)
      continue
    }
    if (!fence && /^-{3,}\s*$/.test(t)) { flush(); continue }
    buf.push(line)
  }
  flush()
  return out
}

function rebuild() {
  slides.value = splitSlides(input.value)
  if (current.value > slides.value.length - 1) current.value = Math.max(0, slides.value.length - 1)
  if (current.value < 0) current.value = 0
}

watch(input, () => {
  clearTimeout(rebuildTimer)
  rebuildTimer = setTimeout(rebuild, 300)
})

/* ================= 当前页渲染 ================= */
const currentSrc = computed(() => slides.value[current.value] || '')
const currentHtml = computed(() => {
  const src = currentSrc.value
  if (!src) return '<p class="empty-hint">等待输入…（可点左侧「🧪 载入示例」）</p>'
  try {
    return DOMPurify.sanitize(md.parse(src))
  } catch (e) {
    return DOMPurify.sanitize(`<p class="md-error">⚠ 渲染失败：${escHtml((e && e.message) || e)}</p>`)
  }
})

const canPrev = computed(() => current.value > 0)
const canNext = computed(() => current.value < slides.value.length - 1)
const progressWidth = computed(() => (slides.value.length ? ((current.value + 1) / slides.value.length) * 100 : 0))

const slideTitle = computed(() => {
  const m = currentSrc.value.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : `第 ${current.value + 1} 页`
})

function go(step) {
  const n = current.value + step
  if (n >= 0 && n < slides.value.length) current.value = n
}
function jump(i) {
  if (i >= 0 && i < slides.value.length) current.value = i
}

/* ================= Mermaid（按需懒加载） ================= */
let mermaidPromise = null
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      const m = mod.default || mod
      m.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: "'Maple Mono NF CN','Monaco','Consolas',monospace",
        themeVariables: {
          background: '#0d1117',
          primaryColor: '#1c2b16',
          primaryBorderColor: '#9dff6b',
          primaryTextColor: '#d8f8c0',
          secondaryColor: '#23331c',
          secondaryBorderColor: '#7ee787',
          secondaryTextColor: '#d8f8c0',
          tertiaryColor: '#16241a',
          lineColor: '#9dff6b',
          textColor: '#c9d1d9',
          mainBkg: '#1c2b16',
          nodeBorder: '#9dff6b',
          clusterBkg: '#10161c',
          clusterBorder: '#30363d',
          edgeLabelBackground: '#161b22',
          noteBkgColor: '#22301a',
          noteTextColor: '#d8f8c0',
          noteBorderColor: '#9dff6b',
          actorBkg: '#1c2b16',
          actorBorder: '#9dff6b',
          actorTextColor: '#d8f8c0',
          signalColor: '#9dff6b',
          signalTextColor: '#d8f8c0',
          labelBoxBkgColor: '#1c2b16',
          labelBoxBorderColor: '#9dff6b',
          labelTextColor: '#d8f8c0',
          loopTextColor: '#d8f8c0',
          activationBkgColor: '#23331c',
          activationBorderColor: '#9dff6b',
          sequenceNumberColor: '#0d1117',
          sectionBkgColor: '#1c2b16',
          altSectionBkgColor: '#16241a',
          taskBorderColor: '#9dff6b',
          taskBkgColor: '#1c2b16',
          taskTextColor: '#d8f8c0',
          taskTextOutsideColor: '#d8f8c0',
          pie1: '#9dff6b', pie2: '#7ee787', pie3: '#ffd866',
          pie4: '#23331c', pie5: '#16241a', pie6: '#39424d',
          pieTitleTextColor: '#c9d1d9', pieSectionTextColor: '#0d1117',
          pieLegendTextColor: '#c9d1d9'
        }
      })
      return m
    })
  }
  return mermaidPromise
}

/* 全局唯一 id 计数器，防止同一文档内出现重复 id */
let mmdUid = 0

/**
 * 渲染容器内所有 mermaid 图（无并发保护，供导出使用）。
 * @param {HTMLElement} container
 */
async function renderMermaidCore(container) {
  if (!container || !container.querySelectorAll) return
  const nodes = Array.from(container.querySelectorAll('pre.mermaid'))
  if (!nodes.length) return
  try {
    const mermaid = await loadMermaid()
    // 为每个节点分配唯一 id，保证 mermaid.run 可稳定处理
    nodes.forEach((n) => {
      if (!n.id) n.id = `mmd-${++mmdUid}`
    })
    await mermaid.run({ nodes })
  } catch (e) {
    nodes.forEach((n) => {
      if (n.isConnected && !n.querySelector('svg')) {
        n.innerHTML = `<div class="mmd-err">⚠ Mermaid 渲染失败：${escHtml((e && e.message) || e)}</div>`
      }
    })
  }
  // 兜底：仍在文档中但既无 SVG 也无错误提示的节点，标记为失败
  nodes.forEach((n) => {
    if (n.isConnected && !n.querySelector('svg') && !n.querySelector('.mmd-err')) {
      n.classList.add('mmd-fail')
    }
  })
}

/**
 * 带渲染序号保护的 mermaid 渲染：序号过期（用户已切换页面）则跳过。
 * @param {HTMLElement} container
 * @param {number} seq 渲染序号
 */
async function renderMermaidIn(container, seq) {
  if (!container || !container.querySelectorAll) return
  if (!container.isConnected || seq !== renderSeq) return
  if (!container.querySelector('pre.mermaid')) return
  await renderMermaidCore(container)
}

/* 当前页变化 → 渲染 mermaid → 适配尺寸 */
watch(currentHtml, async () => {
  const seq = ++renderSeq
  await nextTick()
  if (seq !== renderSeq) return
  if (presenting.value) {
    await renderMermaidIn(presSlideRef.value, seq)
  } else {
    await renderMermaidIn(stageRef.value, seq)
  }
  if (seq === renderSeq) fitCurrent()
})

/* ================= 尺寸适配（演示模式等比缩放，铺满且不裁剪） ================= */
function fitCurrent() {
  if (!presenting.value) return
  const canvas = presCanvasRef.value
  const inner = presSlideRef.value
  const overlay = presRef.value
  if (!canvas || !inner || !overlay) return

  // 先量自然高度（去掉缩放）
  inner.style.transform = 'none'
  const naturalH = inner.offsetHeight
  if (!naturalH) return

  const body = overlay.querySelector('.pres-body')
  const availW = Math.max(200, body.clientWidth - 54 * 2 - 20 * 2 - 12)
  const availH = Math.max(160, body.clientHeight - 24)
  const scale = Math.min(availW / 960, availH / naturalH, 1.6)
  const w = Math.floor(960 * scale)
  const h = Math.ceil(naturalH * scale)

  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  inner.style.width = '960px'
  inner.style.transform = `scale(${scale})`
  inner.style.transformOrigin = 'top left'
}

/* ================= 演示模式 ================= */
let prevBodyOverflow = ''
function present() {
  if (!slides.value.length) return
  presenting.value = true
  prevBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  nextTick(async () => {
    await nextTick()
    renderSeq++
    await renderMermaidIn(presSlideRef.value, renderSeq)
    fitCurrent()
  })
}

function exitPresent() {
  presenting.value = false
  document.body.style.overflow = prevBodyOverflow
  // 退出后让编辑预览恢复渲染（mermaid 节点在遮罩里是独立副本）
  nextTick(() => {
    renderMermaidIn(stageRef.value, ++renderSeq)
  })
}

function toggleNativeFs() {
  const el = presRef.value
  if (!el) return
  try {
    if (document.fullscreenElement) document.exitFullscreen()
    else if (el.requestFullscreen) el.requestFullscreen()
  } catch (e) { /* ignore */ }
}

function onKeydown(e) {
  if (!presenting.value) return
  const tag = e.target && e.target.tagName
  if (tag === 'TEXTAREA' || tag === 'INPUT') return
  const k = e.key
  if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(k)) {
    e.preventDefault()
    go(1)
  } else if (['ArrowLeft', 'PageUp'].includes(k)) {
    e.preventDefault()
    go(-1)
  } else if (k === 'Home') {
    e.preventDefault()
    jump(0)
  } else if (k === 'End') {
    e.preventDefault()
    jump(slides.value.length - 1)
  } else if (k === 'Escape') {
    exitPresent()
  } else if (k === 'f' || k === 'F') {
    toggleNativeFs()
  }
}

/* ================= 复制 / 示例 / 清空 ================= */
function flash(msg, isError = false) {
  clearTimeout(msgTimer)
  error.value = ''
  success.value = ''
  if (isError) error.value = msg
  else success.value = msg
  msgTimer = setTimeout(() => { error.value = ''; success.value = '' }, 2600)
}

async function copyAll() {
  if (await copyText(input.value)) flash('全部 Markdown 源码已复制')
  else flash('复制失败，请手动复制', true)
}
async function copyCurrent() {
  if (await copyText(currentSrc.value)) flash('当前页 Markdown 已复制')
  else flash('复制失败，请手动复制', true)
}

function loadSample() {
  input.value = SAMPLE
  clearTimeout(rebuildTimer)
  rebuild()
  flash('已载入示例文稿')
}
function clearAll() {
  input.value = ''
  clearTimeout(rebuildTimer)
  slides.value = []
  current.value = 0
  flash('已清空')
}

/* ================= 导出独立 HTML（可分享演示文稿） ================= */
async function exportHtml() {
  if (!slides.value.length) return
  error.value = ''
  success.value = ''
  const count = slides.value.length
  try {
    const parts = []
    const tmp = document.createElement('div')
    tmp.style.cssText = 'position:fixed;left:-99999px;top:0;width:960px;background:#0d1117;opacity:0;pointer-events:none;z-index:-1'
    document.body.appendChild(tmp)

    for (let i = 0; i < count; i++) {
      let html = md.parse(slides.value[i])
      tmp.innerHTML = html
      if (tmp.querySelector('pre.mermaid')) {
        await renderMermaidCore(tmp)
        html = tmp.innerHTML
      }
      tmp.innerHTML = ''
      parts.push(html)
    }
    tmp.remove()

    const doc = buildStandalone(parts)
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'markdown-slides.html'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    flash(`已导出 ${count} 页演示文稿 markdown-slides.html`)
  } catch (e) {
    flash('导出失败：' + ((e && e.message) || e), true)
  }
}

/* 独立文件的样式与脚本（自包含，绿色终端主题） */
function buildStandalone(parts) {
  const slidesHtml = parts
    .map((h, i) => `<section class="slide" data-i="${i}">${h}</section>`)
    .join('\n')
  const css = `
*{box-sizing:border-box;border-radius:0!important}
:root{
  --bg:#0d1117;--panel:#161b22;--panel-2:#0f1317;--line:#30363d;--line-strong:#39424d;
  --text:#c9d1d9;--dim:#8b949e;--muted:#6e7681;--green:#9dff6b;
  --green-soft:rgba(157,255,107,.12);--green-glow:rgba(157,255,107,.15);
  --amber:#ffd866;--red:#ff8a8a;
}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);
  font-family:"Maple Mono NF CN","Inter","PingFang SC","Microsoft YaHei",system-ui,sans-serif;overflow:hidden}
#deck{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg)}
.slide{width:960px;max-width:96vw;padding:64px 76px;background:
  linear-gradient(180deg,rgba(157,255,107,.04),transparent 40%),var(--panel-2);
  border:1px solid var(--line);box-shadow:0 20px 70px rgba(0,0,0,.55);display:none;
  max-height:calc(100vh - 90px);overflow:hidden}
.slide.active{display:block}
.slide h1{color:var(--green);font-size:52px;line-height:1.3;margin:0 0 26px;text-shadow:0 0 30px var(--green-glow)}
.slide h2{color:var(--green);font-size:34px;line-height:1.35;margin:0 0 18px;border-bottom:1px solid var(--line);padding-bottom:10px}
.slide h3{color:var(--green);font-size:24px;margin:16px 0 10px}
.slide p{font-size:19px;line-height:1.85;margin:14px 0}
.slide ul,.slide ol{margin:10px 0;padding-left:28px}
.slide li{font-size:19px;line-height:1.95;margin:6px 0}
.slide a{color:var(--green)}
.slide strong{color:var(--green)}
.slide blockquote{margin:14px 0;padding:12px 20px;border-left:4px solid var(--green);
  background:var(--green-soft);color:var(--muted);font-size:17px}
.slide hr{border:none;border-top:1px solid var(--line);margin:20px 0}
.slide code{font-family:"Maple Mono NF CN","Monaco","Consolas",monospace;font-size:15px;
  background:var(--panel);border:1px solid var(--line);padding:2px 7px;color:var(--green)}
.slide pre.code-block{margin:18px 0;padding:18px 20px;background:var(--panel);
  border:1px solid var(--line);overflow:auto;max-height:56vh}
.slide pre.code-block code{background:none;border:none;padding:0;color:var(--text);font-size:15px;line-height:1.75}
.slide table{border-collapse:collapse;margin:16px 0;width:100%}
.slide th,.slide td{border:1px solid var(--line);padding:10px 14px;font-size:17px;text-align:left}
.slide th{background:var(--panel);color:var(--green)}
.slide img{max-width:100%}
.slide pre.mermaid{margin:0;text-align:center;background:transparent;border:none}
.slide pre.mermaid svg{max-width:100%;height:auto}
.slide pre.mermaid.mmd-fail{color:var(--red);border:1px dashed var(--red);padding:10px;
  text-align:left;white-space:pre-wrap;word-break:break-all;font-family:"Maple Mono NF CN","Consolas",monospace;font-size:13px}
.mmd-err{color:var(--red);font-size:14px;text-align:left}
.hljs-comment,.hljs-quote{color:var(--dim);font-style:italic}
.hljs-keyword,.hljs-selector-tag,.hljs-literal,.hljs-doctag{color:var(--green)}
.hljs-string,.hljs-regexp,.hljs-addition,.hljs-attr{color:var(--amber)}
.hljs-number,.hljs-symbol,.hljs-bullet{color:var(--amber)}
.hljs-title,.hljs-title.function_,.hljs-section,.hljs-selector-id,.hljs-variable,
.hljs-template-variable{color:#e6edf3}
.hljs-built_in,.hljs-type,.hljs-class .hljs-title{color:#7ee787}
.hljs-meta,.hljs-meta .hljs-keyword{color:var(--amber)}
.hljs-tag,.hljs-name{color:#7ee787}
.hljs-attribute{color:var(--amber)}
.hljs-deletion{color:var(--red)}
.hljs-emphasis{font-style:italic}
.hljs-strong{font-weight:700}
#bar{position:fixed;left:0;right:0;bottom:0;height:3px;background:var(--panel);border-top:1px solid var(--line);z-index:10}
#bar i{display:block;height:100%;width:0;background:var(--green);box-shadow:0 0 12px var(--green-glow)}
#pageno{position:fixed;right:18px;bottom:14px;color:var(--dim);font-family:"Maple Mono NF CN","Consolas",monospace;font-size:13px;z-index:10}
#hint{position:fixed;left:18px;bottom:14px;color:var(--muted);font-size:12px;z-index:10;opacity:.75}
@media (max-width:640px){
  .slide{padding:26px 22px}
  .slide h1{font-size:30px}.slide h2{font-size:24px}.slide p,.slide li{font-size:15px}
}
@media print{.slide{display:block!important;page-break-after:always;box-shadow:none;border:none}}
`.trim()
  const js = `
(function(){
  var slides=Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var n=slides.length,i=0,fill=document.getElementById('barFill'),
      pg=document.getElementById('pageno');
  function show(k){if(k<0)k=n-1;if(k>=n)k=0;
    slides[i].classList.remove('active');i=k;slides[i].classList.add('active');
    fill.style.width=((i+1)/n*100)+'%';pg.textContent=(i+1)+' / '+n;}
  function fs(){if(document.fullscreenElement){document.exitFullscreen();}
    else if(document.documentElement.requestFullscreen){document.documentElement.requestFullscreen();}}
  document.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown'||e.key==='Enter'){e.preventDefault();show(i+1);}
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();show(i-1);}
    else if(e.key==='Home'){e.preventDefault();show(0);}
    else if(e.key==='End'){e.preventDefault();show(n-1);}
    else if(e.key==='f'||e.key==='F'){fs();}
  });
  document.getElementById('deck').addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a')) return;
    show(e.clientX > window.innerWidth / 2 ? i + 1 : i - 1);
  });
  window.addEventListener('touchstart',function(e){
    var x=e.changedTouches[0].clientX,t=Date.now();
    window.addEventListener('touchend',function h(e2){
      var dx=e2.changedTouches[0].clientX-x;
      if(Date.now()-t<600&&Math.abs(dx)>40){show(dx<0?i+1:i-1);}
      window.removeEventListener('touchend',h);});
  });
  show(0);
})();`
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Markdown 幻灯片 · 403.li</title>
<style>${css}</style>
</head>
<body>
<main id="deck">${slidesHtml}</main>
<div id="bar"><i id="barFill"></i></div>
<div id="pageno">1 / ${parts.length}</div>
<div id="hint">← → / 空格 翻页 · Home / End 首尾 · F 全屏</div>
<script>${js}\u003c/script>
</body>
</html>`
}

/* ================= 生命周期 ================= */
onMounted(() => {
  rebuild()
  resizeHandler = () => fitCurrent()
  window.addEventListener('resize', resizeHandler)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  clearTimeout(rebuildTimer)
  clearTimeout(msgTimer)
  window.removeEventListener('resize', resizeHandler)
  window.removeEventListener('keydown', onKeydown)
  if (presenting.value) document.body.style.overflow = prevBodyOverflow
})
</script>

<style scoped>
/* ===== 列头（标签 + 复制按钮） ===== */
.col-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 1rem;
}
.tool-col > .col-head:first-child { margin-top: 0; }
.col-head .tool-label { margin: 0; }
.mini-copy {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 6px 10px;
  transition: all 0.2s;
  border-radius: 0;
  flex-shrink: 0;
}
.mini-copy:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 12px var(--green-glow);
}
.mini-copy:disabled { opacity: 0.45; cursor: not-allowed; }

/* ===== 语法提示 / 快捷按钮 ===== */
.seg-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--dim);
  line-height: 1.8;
}
.seg-tip code {
  font-family: var(--mono);
  color: var(--green);
  background: var(--green-soft);
  padding: 0 5px;
}
.hint-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.hint-btn {
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--accent);
  font-family: var(--mono);
  font-size: 12px;
  padding: 6px 12px;
  cursor: pointer;
  min-height: 34px;
  transition: all 0.2s;
  border-radius: 0;
}
.hint-btn:hover:not(:disabled) {
  border-color: var(--green);
  color: var(--green);
  background: var(--green-soft);
}
.hint-btn.danger { color: var(--red); border-color: var(--line); }
.hint-btn.danger:hover:not(:disabled) {
  border-color: var(--red);
  color: var(--red);
  background: rgba(255, 138, 138, 0.08);
}
.hint-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ===== 预览舞台（编辑模式：自然排版 + 滚动） ===== */
.slide-stage {
  width: 100%;
  min-height: 320px;
  max-height: 480px;
  overflow-x: auto;
  overflow-y: auto;
  background: var(--panel-2);
  border: 1px solid var(--line);
  transition: border-color 0.2s;
}
.slide-stage:focus-within { border-color: var(--line-strong); }
.slide-content {
  padding: 22px 24px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text);
  word-wrap: break-word;
}
.slide-content :deep(h1) {
  font-size: 1.9em;
  color: var(--green);
  margin: 0.3em 0 0.6em;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.3em;
}
.slide-content :deep(h2) {
  font-size: 1.45em;
  color: var(--green);
  margin: 0.6em 0 0.4em;
}
.slide-content :deep(h3) {
  font-size: 1.2em;
  color: var(--green);
  margin: 0.5em 0 0.3em;
}
.slide-content :deep(p) { margin: 0.5em 0; }
.slide-content :deep(ul), .slide-content :deep(ol) { margin: 0.4em 0; padding-left: 1.6em; }
.slide-content :deep(li) { margin: 0.25em 0; }
.slide-content :deep(a) { color: var(--green); }
.slide-content :deep(strong) { color: var(--green); }
.slide-content :deep(blockquote) {
  border-left: 4px solid var(--green);
  background: var(--green-soft);
  margin: 0.8em 0;
  padding: 0.5em 1em;
  color: var(--muted);
}
.slide-content :deep(hr) { border: none; border-top: 1px solid var(--line); margin: 1em 0; }
.slide-content :deep(code) {
  font-family: var(--mono);
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 0.1em 0.4em;
  font-size: 0.88em;
  color: var(--green);
}
.slide-content :deep(pre.code-block) {
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 12px 14px;
  overflow-x: auto;
  margin: 0.8em 0;
}
.slide-content :deep(pre.code-block code) {
  background: none;
  border: none;
  padding: 0;
  color: var(--text);
  font-size: 12.5px;
  line-height: 1.7;
}
.slide-content :deep(table) { border-collapse: collapse; margin: 0.8em 0; width: 100%; }
.slide-content :deep(th), .slide-content :deep(td) {
  border: 1px solid var(--line);
  padding: 6px 12px;
  text-align: left;
}
.slide-content :deep(th) { background: var(--panel); color: var(--green); }
.slide-content :deep(img) { max-width: 100%; }
.slide-content :deep(pre.mermaid) {
  background: transparent;
  border: none;
  margin: 0;
  text-align: center;
}
.slide-content :deep(pre.mermaid svg) { max-width: 100%; height: auto; }
.slide-content :deep(pre.mermaid.mmd-fail) {
  color: var(--red);
  border: 1px dashed var(--red);
  padding: 10px;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: var(--mono);
  font-size: 12px;
}
.slide-content :deep(.mmd-err) { color: var(--red); font-size: 13px; text-align: left; }
.empty-hint, .md-error { color: var(--muted); font-style: italic; }
.md-error { color: var(--red); }

/* hljs 代码高亮（终端绿配色，全部走变量） */
.slide-content :deep(.hljs-comment),
.slide-content :deep(.hljs-quote) { color: var(--dim); font-style: italic; }
.slide-content :deep(.hljs-keyword),
.slide-content :deep(.hljs-selector-tag),
.slide-content :deep(.hljs-literal),
.slide-content :deep(.hljs-doctag),
.slide-content :deep(.hljs-tag),
.slide-content :deep(.hljs-name) { color: var(--green); }
.slide-content :deep(.hljs-string),
.slide-content :deep(.hljs-regexp),
.slide-content :deep(.hljs-addition),
.slide-content :deep(.hljs-attr),
.slide-content :deep(.hljs-attribute) { color: var(--amber); }
.slide-content :deep(.hljs-number),
.slide-content :deep(.hljs-symbol),
.slide-content :deep(.hljs-bullet),
.slide-content :deep(.hljs-meta) { color: var(--amber); }
.slide-content :deep(.hljs-title),
.slide-content :deep(.hljs-section),
.slide-content :deep(.hljs-selector-id),
.slide-content :deep(.hljs-variable),
.slide-content :deep(.hljs-template-variable),
.slide-content :deep(.hljs-built_in),
.slide-content :deep(.hljs-type) { color: var(--text); font-weight: 600; }
.slide-content :deep(.hljs-emphasis) { font-style: italic; }
.slide-content :deep(.hljs-strong) { font-weight: 700; }
.slide-content :deep(.hljs-deletion) { color: var(--red); }

/* ===== 翻页控制 ===== */
.slide-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.nav-btn { min-height: 36px; padding: 6px 14px; font-size: 13px; flex-shrink: 0; }
.page-dots {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  min-height: 12px;
}
.dot {
  width: 11px;
  height: 11px;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0;
}
.dot:hover { border-color: var(--green); }
.dot.on {
  background: var(--green);
  border-color: var(--green);
  box-shadow: 0 0 8px var(--green-glow);
}

/* ===== 全屏演示遮罩 ===== */
.pres-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}
.pres-top {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
  font-family: var(--mono);
  font-size: 13px;
  flex-shrink: 0;
}
.pres-brand { color: var(--green); white-space: nowrap; }
.pres-title {
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.pres-count { color: var(--dim); font-family: var(--mono); }
.pres-ctl {
  background: var(--panel-2);
  border: 1px solid var(--line-strong);
  color: var(--accent);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 13px;
  padding: 6px 12px;
  transition: all 0.2s;
  border-radius: 0;
  white-space: nowrap;
}
.pres-ctl:hover { border-color: var(--green); color: var(--green); background: var(--green-soft); }
.pres-ctl.danger { color: var(--red); }
.pres-ctl.danger:hover { border-color: var(--red); background: rgba(255, 138, 138, 0.08); }

.pres-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 12px;
  min-height: 0;
}
.pres-zone {
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--green);
  font-size: 20px;
  width: 54px;
  height: 54px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
  border-radius: 0;
}
.pres-zone:hover:not(:disabled) { border-color: var(--green); box-shadow: 0 0 18px var(--green-glow); }
.pres-zone:disabled { opacity: 0.25; cursor: not-allowed; }

.pres-canvas {
  overflow: hidden;
  background: var(--panel-2);
  border: 1px solid var(--line);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}
.pres-slide {
  width: 960px;
  padding: 56px 72px;
  font-size: 19px;
  line-height: 1.8;
  color: var(--text);
  word-wrap: break-word;
  background: var(--panel-2);
}
.pres-slide :deep(h1) {
  font-size: 54px;
  line-height: 1.3;
  color: var(--green);
  margin: 0 0 0.5em;
  text-shadow: 0 0 30px var(--green-glow);
}
.pres-slide :deep(h2) {
  font-size: 34px;
  color: var(--green);
  margin: 0 0 0.5em;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.25em;
}
.pres-slide :deep(h3) { font-size: 24px; color: var(--green); margin: 0.6em 0 0.3em; }
.pres-slide :deep(p) { margin: 0.6em 0; }
.pres-slide :deep(ul), .pres-slide :deep(ol) { margin: 0.5em 0; padding-left: 1.5em; }
.pres-slide :deep(li) { margin: 0.35em 0; }
.pres-slide :deep(a) { color: var(--green); }
.pres-slide :deep(strong) { color: var(--green); }
.pres-slide :deep(blockquote) {
  border-left: 4px solid var(--green);
  background: var(--green-soft);
  margin: 0.8em 0;
  padding: 0.5em 1.2em;
  color: var(--muted);
}
.pres-slide :deep(code) {
  font-family: var(--mono);
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 0.15em 0.5em;
  color: var(--green);
  font-size: 0.9em;
}
.pres-slide :deep(pre.code-block) {
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 16px 20px;
  overflow: auto;
  margin: 0.8em 0;
}
.pres-slide :deep(pre.code-block code) {
  background: none;
  border: none;
  padding: 0;
  color: var(--text);
  font-size: 15px;
  line-height: 1.75;
}
.pres-slide :deep(table) { border-collapse: collapse; margin: 0.8em 0; }
.pres-slide :deep(th), .pres-slide :deep(td) {
  border: 1px solid var(--line);
  padding: 8px 16px;
  text-align: left;
  font-size: 17px;
}
.pres-slide :deep(th) { background: var(--panel); color: var(--green); }
.pres-slide :deep(img) { max-width: 100%; }
.pres-slide :deep(hr) { border: none; border-top: 1px solid var(--line); margin: 1.2em 0; }
.pres-slide :deep(pre.mermaid) {
  background: transparent;
  border: none;
  margin: 0;
  text-align: center;
}
.pres-slide :deep(pre.mermaid svg) { max-width: 100%; height: auto; }
.pres-slide :deep(pre.mermaid.mmd-fail) {
  color: var(--red);
  border: 1px dashed var(--red);
  padding: 10px;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: var(--mono);
  font-size: 13px;
}
.pres-slide :deep(.mmd-err) { color: var(--red); font-size: 14px; text-align: left; }

/* hljs in 演示模式 */
.pres-slide :deep(.hljs-comment),
.pres-slide :deep(.hljs-quote) { color: var(--dim); font-style: italic; }
.pres-slide :deep(.hljs-keyword),
.pres-slide :deep(.hljs-selector-tag),
.pres-slide :deep(.hljs-literal),
.pres-slide :deep(.hljs-doctag),
.pres-slide :deep(.hljs-tag),
.pres-slide :deep(.hljs-name) { color: var(--green); }
.pres-slide :deep(.hljs-string),
.pres-slide :deep(.hljs-regexp),
.pres-slide :deep(.hljs-addition),
.pres-slide :deep(.hljs-attr),
.pres-slide :deep(.hljs-attribute) { color: var(--amber); }
.pres-slide :deep(.hljs-number),
.pres-slide :deep(.hljs-symbol),
.pres-slide :deep(.hljs-bullet),
.pres-slide :deep(.hljs-meta) { color: var(--amber); }
.pres-slide :deep(.hljs-title),
.pres-slide :deep(.hljs-section),
.pres-slide :deep(.hljs-selector-id),
.pres-slide :deep(.hljs-variable),
.pres-slide :deep(.hljs-template-variable),
.pres-slide :deep(.hljs-built_in),
.pres-slide :deep(.hljs-type) { color: var(--text); font-weight: 600; }
.pres-slide :deep(.hljs-emphasis) { font-style: italic; }
.pres-slide :deep(.hljs-strong) { font-weight: 700; }
.pres-slide :deep(.hljs-deletion) { color: var(--red); }

.pres-bottom { padding: 8px 18px 16px; flex-shrink: 0; }
.pres-progress {
  height: 4px;
  background: var(--panel);
  border: 1px solid var(--line);
  margin-bottom: 8px;
}
.pres-progress-fill {
  height: 100%;
  background: var(--green);
  box-shadow: 0 0 10px var(--green-glow);
  transition: width 0.25s ease;
}
.pres-hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
  text-align: center;
}

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .slide-stage { min-height: 240px; max-height: 360px; }
}
@media (max-width: 640px) {
  .pres-top { gap: 8px; padding: 8px 10px; font-size: 11px; }
  .pres-ctl { padding: 5px 8px; font-size: 11px; }
  .pres-body { gap: 6px; padding: 6px; }
  .pres-zone { width: 40px; height: 40px; font-size: 15px; }
  .pres-slide { padding: 30px 24px; font-size: 15px; }
  .pres-slide :deep(h1) { font-size: 30px; }
  .pres-slide :deep(h2) { font-size: 24px; }
  .pres-slide :deep(h3) { font-size: 19px; }
  .pres-slide :deep(pre.code-block) { padding: 10px 12px; }
  .pres-slide :deep(pre.code-block code) { font-size: 12px; }
  .pres-slide :deep(th), .pres-slide :deep(td) { font-size: 13px; padding: 6px 8px; }
  .pres-hint { font-size: 10px; }
  .slide-stage { min-height: 200px; max-height: 320px; }
  .slide-content { padding: 16px 16px; font-size: 13px; }
}
</style>
