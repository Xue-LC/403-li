<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>⚡ Emmet 缩写展开器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：输入 -->
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">Emmet 缩写：</label>
              <button
                class="icon-copy"
                :disabled="!input.trim()"
                title="复制缩写"
                @click="copyInput"
              >📋</button>
            </div>
            <textarea
              v-model="input"
              rows="12"
              class="code-input"
              spellcheck="false"
              placeholder="例如：ul>li.item$*3>a{Item $}"
            ></textarea>

            <label class="tool-label">语法模式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="syntax" value="html" />
                <span>HTML 标签</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="syntax" value="css" />
                <span>CSS 属性</span>
              </label>
            </div>

            <label class="tool-label">缩进方式：</label>
            <div class="radio-group">
              <label class="radio-label" v-for="opt in indentOptions" :key="opt.value">
                <input type="radio" v-model="indentKey" :value="opt.value" />
                <span>{{ opt.label }}</span>
              </label>
            </div>
            <p class="hint">
              支持父子 <code>&gt;</code>、兄弟 <code>+</code>、上溯 <code>^</code>、分组
              <code>( )</code>、乘法 <code>*</code>、属性 <code>[ ]</code>、文本
              <code>{ }</code>、编号 <code>$</code>、<code>lorem</code> 占位文本与
              <code>|c</code> / <code>|e</code> 过滤器。
            </p>
          </div>

          <!-- 右栏：输出 -->
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">展开结果：</label>
              <button
                class="icon-copy"
                :disabled="!output"
                title="复制结果"
                @click="copyOutput"
              >📋</button>
            </div>
            <textarea
              :value="output"
              readonly
              rows="12"
              class="code-input output"
              spellcheck="false"
              :placeholder="input.trim() ? '展开结果将显示在这里...' : '输入缩写后即时展开...'"
            ></textarea>
            <div class="stats-line">
              <span v-if="output">共 {{ outputLines }} 行 · {{ output.length }} 字符</span>
              <span v-else>等待输入</span>
            </div>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!output" @click="copyOutput">
            📋 复制结果
          </button>
          <button class="tool-button" :disabled="!input.trim()" @click="copyInput">
            📋 复制缩写
          </button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <label class="tool-label">常用示例（点击填入）：</label>
        <div class="example-grid">
          <button
            v-for="ex in examples"
            :key="ex.abbr"
            class="example-chip"
            :title="ex.desc"
            @click="applyExample(ex)"
          >{{ ex.label }}</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

/* ===================== 基础常量表 ===================== */

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen',
  'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'
])

const INLINE_TAGS = new Set([
  'a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'br', 'button', 'cite', 'code',
  'dfn', 'em', 'font', 'i', 'img', 'input', 'kbd', 'label', 'map', 'object',
  'q', 'samp', 'select', 'small', 'span', 'strike', 'strong', 'sub', 'sup',
  'textarea', 'tt', 'u', 'var', 'wbr'
])

// 内容模型为「行内内容」的标签：其行内子元素保持在同一行（与 Emmet 一致）
const INLINE_CONTENT_TAGS = new Set([
  'a', 'abbr', 'b', 'bdo', 'button', 'caption', 'cite', 'code', 'dd', 'dfn',
  'dt', 'em', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'i', 'kbd',
  'label', 'legend', 'li', 'option', 'p', 'q', 's', 'samp', 'small', 'span',
  'strong', 'sub', 'summary', 'sup', 'td', 'th', 'time', 'u', 'var'
])

const TAG_ALIASES = {
  acr: 'acronym', adr: 'address', art: 'article', asd: 'aside', bq: 'blockquote',
  btn: 'button', cap: 'caption', colg: 'colgroup', dlg: 'dialog', fig: 'figure',
  figc: 'figcaption', ftr: 'footer', hdr: 'header', ifr: 'iframe', optg: 'optgroup',
  sect: 'section', src: 'source', str: 'strong', tbl: 'table', tarea: 'textarea',
  tem: 'template'
}

const TAG_SNIPPETS = {
  a: ['href=""'],
  img: ['src=""', 'alt=""'],
  input: ['type="text"'],
  'input:text': ['type="text"'],
  'input:password': ['type="password"', 'name=""'],
  'input:checkbox': ['type="checkbox"', 'name=""', 'value=""'],
  'input:radio': ['type="radio"', 'name=""', 'value=""'],
  'input:email': ['type="email"', 'name=""'],
  'input:search': ['type="search"', 'name=""'],
  'input:file': ['type="file"', 'name=""'],
  'input:hidden': ['type="hidden"', 'name=""'],
  'input:submit': ['type="submit"', 'value=""'],
  form: ['action=""'],
  link: ['rel="stylesheet"', 'href=""'],
  'link:css': ['rel="stylesheet"', 'href=""'],
  script: ['src=""'],
  iframe: ['src=""', 'frameborder="0"'],
  meta: ['name=""', 'content=""'],
  select: ['name=""', 'id=""'],
  textarea: ['name=""', 'id=""', 'cols="30"', 'rows="10"'],
  button: ['type="button"'],
  option: ['value=""']
}

const RAW_SNIPPETS = {
  '!': [
    [0, '<!DOCTYPE html>'],
    [0, '<html lang="en">'],
    [1, '<head>'],
    [2, '<meta charset="UTF-8">'],
    [2, '<meta name="viewport" content="width=device-width, initial-scale=1.0">'],
    [2, '<title>Document</title>'],
    [1, '</head>'],
    [1, '<body>'],
    [1, '</body>'],
    [0, '</html>']
  ],
  '!!!': [[0, '<!DOCTYPE html>']],
  doc: [
    [0, '<!DOCTYPE html>'],
    [0, '<html lang="en">'],
    [1, '<head>'],
    [2, '<meta charset="UTF-8">'],
    [2, '<meta name="viewport" content="width=device-width, initial-scale=1.0">'],
    [2, '<title>Document</title>'],
    [1, '</head>'],
    [1, '<body>'],
    [1, '</body>'],
    [0, '</html>']
  ]
}

const LOREM_WORDS = (
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ' +
  'incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud ' +
  'exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute ' +
  'irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur ' +
  'excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt ' +
  'mollit anim id est laborum'
).split(' ')

const CSS_ALIASES = {
  m: 'margin', mt: 'margin-top', mr: 'margin-right', mb: 'margin-bottom', ml: 'margin-left',
  p: 'padding', pt: 'padding-top', pr: 'padding-right', pb: 'padding-bottom', pl: 'padding-left',
  w: 'width', h: 'height', mw: 'max-width', mh: 'max-height', miw: 'min-width', mih: 'min-height',
  fz: 'font-size', fw: 'font-weight', ff: 'font-family', fst: 'font-style', lh: 'line-height',
  ls: 'letter-spacing', ta: 'text-align', td: 'text-decoration', tt: 'text-transform',
  ws: 'white-space', wb: 'word-break', vb: 'vertical-align',
  c: 'color', bg: 'background', bgc: 'background-color', bgi: 'background-image',
  bgr: 'background-repeat', bgs: 'background-size', bgp: 'background-position',
  bga: 'background-attachment', bgcp: 'background-clip',
  bd: 'border', bdt: 'border-top', bdr: 'border-right', bdb: 'border-bottom', bdl: 'border-left',
  bdc: 'border-color', bdw: 'border-width', bds: 'border-style',
  bdrs: 'border-radius', bdtlrs: 'border-top-left-radius', bdtrrs: 'border-top-right-radius',
  bdbrrs: 'border-bottom-right-radius', bdblrs: 'border-bottom-left-radius',
  li: 'list-style', lis: 'list-style', list: 'list-style', lsp: 'list-style-position',
  lst: 'list-style-type', oli: 'list-style-image',
  ol: 'outline', olw: 'outline-width', ols: 'outline-style', olc: 'outline-color',
  bxsh: 'box-shadow', sh: 'box-shadow', op: 'opacity', o: 'opacity',
  d: 'display', pos: 'position', t: 'top', r: 'right', b: 'bottom', l: 'left', z: 'z-index',
  ov: 'overflow', ovx: 'overflow-x', ovy: 'overflow-y', v: 'visibility', cp: 'clip-path',
  cur: 'cursor', fl: 'float', cl: 'clear', fx: 'flex', fxb: 'flex-basis', fxg: 'flex-grow',
  fxs: 'flex-shrink', fxd: 'flex-direction', fxw: 'flex-wrap', ord: 'order',
  ai: 'align-items', ac: 'align-content', ase: 'align-self', jc: 'justify-content',
  js: 'justify-self', g: 'gap', gr: 'gap', gg: 'grid-gap', gc: 'grid-template-columns',
  gtc: 'grid-template-columns', gtr: 'grid-template-rows', ga: 'grid-area',
  tr: 'transition', trf: 'transform', tro: 'transform-origin', an: 'animation',
  us: 'user-select', pe: 'pointer-events', tf: 'transform', obf: 'object-fit', objp: 'object-position',
  cnt: 'content', zx: 'z-index', mbx: 'mix-blend-mode', f: 'filter'
}

const CSS_KNOWN = new Set([
  ...Object.values(CSS_ALIASES),
  'list-style', 'list-style-position', 'list-style-type', 'list-style-image',
  'outline', 'outline-width', 'outline-style', 'outline-color', 'outline-offset',
  'text-shadow', 'text-decoration-color', 'text-decoration-line', 'text-decoration-style',
  'text-overflow', 'text-indent', 'font', 'font-variant', 'font-stretch',
  'background-blend-mode', 'background', 'background-color', 'background-image',
  'aspect-ratio', 'resize', 'scroll-behavior', 'will-change', 'backdrop-filter',
  'clip', 'content-visibility', 'place-items', 'place-content', 'place-self',
  'inset', 'inline-size', 'block-size', 'min-inline-size', 'max-inline-size',
  'writing-mode', 'table-layout', 'border-collapse', 'border-spacing',
  'margin-inline', 'margin-block', 'padding-inline', 'padding-block',
  'scrollbar-width', 'accent-color', 'caret-color', 'fill', 'stroke', 'stroke-width'
])

const CSS_PROPERTY_SNIPPETS = {
  db: ['display', 'block'], dn: ['display', 'none'], di: ['display', 'inline'],
  dib: ['display', 'inline-block'], df: ['display', 'flex'], dif: ['display', 'inline-flex'],
  dg: ['display', 'grid'], dt: ['display', 'table'],
  posa: ['position', 'absolute'], posr: ['position', 'relative'], posf: ['position', 'fixed'],
  poss: ['position', 'static'], posst: ['position', 'sticky'],
  fll: ['float', 'left'], flr: ['float', 'right'], fln: ['float', 'none'],
  cpi: ['cursor', 'pointer'], cpd: ['cursor', 'default']
}

const CSS_VALUE_ALIASES = {
  f: 'flex', n: 'none', b: 'block', i: 'inline', ib: 'inline-block', if: 'inline-flex',
  a: 'absolute', r: 'relative', s: 'static', st: 'sticky', c: 'center', sb: 'space-between',
  sa: 'space-around', se: 'space-evenly', p: 'pointer', hid: 'hidden', au: 'auto',
  t: 'top', l: 'left', k: 'keep-all', w: 'wrap'
}

const CSS_NO_UNIT = new Set([
  'opacity', 'z-index', 'font-weight', 'line-height', 'flex', 'flex-grow', 'flex-shrink',
  'order', 'zoom', 'column-count', 'orphans', 'widows', 'animation-iteration-count',
  'tab-size', 'mix-blend-mode', 'pointer-events', 'filter'
])

/* ===================== 缩写解析（Parser） ===================== */

function parseAbbreviation(src) {
  const state = { s: src, i: 0 }
  const nodes = parseExpression(state)
  if (state.i < state.s.length) {
    throw new Error('无法解析的内容：' + state.s.slice(state.i, state.i + 12))
  }
  if (!nodes.length) throw new Error('缩写为空')
  return nodes
}

function parseExpression(state) {
  const root = { type: 'root', children: [] }
  const stack = [root]
  const cur = () => stack[stack.length - 1]

  while (state.i < state.s.length) {
    const ch = state.s[state.i]
    if (ch === ')') break
    if (ch === '^') {
      if (stack.length > 1) stack.pop()
      state.i++
      continue
    }
    if (ch === '+' || ch === '>' || ch === ' ' || ch === '\t' || ch === '\n') {
      state.i++
      continue
    }
    const before = state.i
    const node = parseItem(state)
    if (!node) break
    if (state.i === before) {
      throw new Error('无法解析的内容：' + state.s.slice(state.i, state.i + 12))
    }
    cur().children.push(node)

    // 连续上溯
    while (state.i < state.s.length && state.s[state.i] === '^') {
      if (stack.length > 1) stack.pop()
      state.i++
    }
    const op = state.s[state.i]
    if (op === '>') {
      state.i++
      stack.push(node)
    } else if (op === '+') {
      state.i++
    } else if (op === undefined) {
      break
    }
  }
  return root.children
}

function parseItem(state) {
  const ch = state.s[state.i]
  if (ch === '(') {
    state.i++
    const children = parseExpression(state)
    if (state.s[state.i] !== ')') throw new Error('分组括号未闭合，缺少 ")"')
    state.i++
    const node = { type: 'group', children, multiply: 1 }
    readMultiply(state, node)
    return node
  }
  if (ch === '{') {
    const node = { type: 'text', text: readBraces(state), multiply: 1 }
    readMultiply(state, node)
    return node
  }
  return parseElement(state)
}

function parseElement(state) {
  const s = state.s
  const start = state.i
  while (state.i < s.length && /[A-Za-z0-9_!:-]/.test(s[state.i])) state.i++
  const node = {
    type: 'element',
    tag: s.slice(start, state.i),
    id: '',
    classes: [],
    attrs: [],
    text: null,
    children: [],
    multiply: 1
  }
  while (state.i < s.length) {
    const ch = s[state.i]
    if (ch === '#') {
      state.i++
      node.id = readName(state)
    } else if (ch === '.') {
      state.i++
      const cls = readName(state)
      if (cls) node.classes.push(cls)
    } else if (ch === '[') {
      readAttrList(state).forEach(a => node.attrs.push(a))
    } else if (ch === '{') {
      const t = readBraces(state)
      node.text = node.text == null ? t : node.text + t
    } else {
      break
    }
  }
  readMultiply(state, node)
  return node
}

function readName(state) {
  const s = state.s
  const start = state.i
  while (state.i < s.length && /[A-Za-z0-9_$@-]/.test(s[state.i])) state.i++
  return s.slice(start, state.i)
}

function readMultiply(state, node) {
  if (state.s[state.i] !== '*') return
  state.i++
  let digits = ''
  while (state.i < state.s.length && /[0-9]/.test(state.s[state.i])) {
    digits += state.s[state.i]
    state.i++
  }
  node.multiply = digits ? Math.min(parseInt(digits, 10), 200) : 2
}

function readBraces(state) {
  const s = state.s
  state.i++ // '{'
  let buf = ''
  while (state.i < s.length) {
    const ch = s[state.i]
    if (ch === '\\') {
      buf += s[state.i + 1] == null ? '' : s[state.i + 1]
      state.i += 2
      continue
    }
    if (ch === '}') {
      state.i++
      return buf
    }
    buf += ch
    state.i++
  }
  throw new Error('文本花括号未闭合，缺少 "}"')
}

function readAttrList(state) {
  const s = state.s
  state.i++ // '['
  let quote = ''
  let buf = ''
  let closed = false
  while (state.i < s.length) {
    const ch = s[state.i]
    if (quote) {
      buf += ch
      if (ch === quote) quote = ''
      state.i++
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      buf += ch
      state.i++
      continue
    }
    if (ch === ']') {
      state.i++
      closed = true
      break
    }
    buf += ch
    state.i++
  }
  if (!closed) throw new Error('属性方括号未闭合，缺少 "]"')
  return splitAttrs(buf)
}

function splitAttrs(buf) {
  const attrs = []
  let cur = ''
  let q = ''
  for (const ch of buf) {
    if (q) {
      cur += ch
      if (ch === q) q = ''
      continue
    }
    if (ch === '"' || ch === "'") {
      q = ch
      cur += ch
      continue
    }
    if (/\s/.test(ch)) {
      if (cur) attrs.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur) attrs.push(cur)
  return attrs
}

/* ===================== 编号（$ / $@- / $@3） ===================== */

function applyNumbering(str, ctx) {
  if (str == null) return ''
  return String(str).replace(/\$+(@-?\d*)?/g, (match, spec) => {
    const pad = match.match(/^\$+/)[0].length
    const desc = !!spec && spec.indexOf('@-') === 0
    const raw = spec ? spec.replace('@-', '').replace('@', '') : ''
    const start = raw ? parseInt(raw, 10) : null
    const total = ctx && ctx.total ? ctx.total : 1
    const idx = ctx && typeof ctx.index === 'number' ? ctx.index : 0
    let value
    if (desc) {
      value = (start == null ? total : start) - idx
    } else {
      value = (start == null ? 1 : start) + idx
    }
    let out = String(value)
    while (out.length < pad) out = '0' + out
    return out
  })
}

/* ===================== 标签 / 属性解析 ===================== */

function isLorem(tag) {
  return /^lorem(\d+)?(ipsum)?$/i.test(tag || '')
}

function loremText(count) {
  const n = Math.max(1, Math.min(count || 30, 300))
  const words = []
  for (let i = 0; i < n; i++) words.push(LOREM_WORDS[i % LOREM_WORDS.length])
  let text = words.join(' ')
  text = text.charAt(0).toUpperCase() + text.slice(1)
  return text + '.'
}

function resolveTag(node) {
  const raw = (node.tag || '').trim()
  const lower = raw.toLowerCase()
  if (RAW_SNIPPETS[lower]) return { tag: lower, rawLines: RAW_SNIPPETS[lower], attrs: [] }

  let tag = TAG_ALIASES[lower] || raw || 'div'
  let attrs = TAG_SNIPPETS[tag.toLowerCase()] || []
  // input:text / link:css / script:src 之类的变体简写
  if (TAG_SNIPPETS[lower] && lower.indexOf(':') !== -1) {
    tag = lower.split(':')[0]
    attrs = TAG_SNIPPETS[lower]
  }
  return { tag, attrs }
}

function normalizeAttr(attr, ctx) {
  const resolved = applyNumbering(attr, ctx)
  const eq = resolved.indexOf('=')
  if (eq === -1) return resolved
  const name = resolved.slice(0, eq).trim()
  const value = resolved.slice(eq + 1).trim()
  if (!name) return resolved
  const quote = value.charAt(0)
  if (quote === '"' || quote === "'") return name + '=' + value
  if (!value) return name + '=""'
  return name + '="' + value + '"'
}

function buildAttrs(node, res, ctx) {
  const parts = []
  const used = new Map()
  const userAttrs = (node.attrs || []).map(a => normalizeAttr(a, ctx))
  const userIndex = new Map()
  userAttrs.forEach((attr, i) => {
    const name = attr.split('=')[0].trim().toLowerCase()
    if (name && !userIndex.has(name)) userIndex.set(name, i)
  })
  const consumed = new Set()

  // 先输出片段默认属性（用户同名属性就地替换，保持 Emmet 的属性顺序）
  for (const def of res.attrs || []) {
    const name = def.split('=')[0].trim().toLowerCase()
    if (userIndex.has(name)) {
      const idx = userIndex.get(name)
      consumed.add(idx)
      used.set(name, parts.length)
      parts.push(userAttrs[idx])
    } else {
      used.set(name, parts.length)
      parts.push(def)
    }
  }

  // 其余用户属性按书写顺序追加
  userAttrs.forEach((attr, i) => {
    if (consumed.has(i)) return
    const name = attr.split('=')[0].trim().toLowerCase()
    if (name && !used.has(name)) used.set(name, parts.length)
    parts.push(attr)
  })

  if (node.id && !used.has('id')) {
    used.set('id', parts.length)
    parts.push('id="' + applyNumbering(node.id, ctx) + '"')
  }
  if (node.classes.length) {
    const cls = node.classes.map(c => applyNumbering(c, ctx)).join(' ')
    const pos = used.get('class')
    if (pos === undefined) {
      used.set('class', parts.length)
      parts.push('class="' + cls + '"')
    } else {
      const existing = parts[pos]
      const m = existing.match(/^class\s*=\s*(.*)$/i)
      if (m) {
        let val = m[1]
        const quote = val.charAt(0)
        if (quote === '"' || quote === "'") {
          val = val.slice(1, val.length - 1)
          parts[pos] = 'class=' + quote + (val ? val + ' ' : '') + cls + quote
        } else {
          parts[pos] = 'class=' + quote + val + ' ' + cls + quote
        }
      }
    }
  }

  return parts.length ? ' ' + parts.join(' ') : ''
}

/* ===================== 生成（HTML） ===================== */

function textOf(raw, ctx, opts) {
  const text = applyNumbering(raw, ctx)
  return opts && opts.escape ? escapeHtml(text) : text
}

function renderNode(node, level, ctx, lines, opts) {
  if (node.type === 'text') {
    const text = textOf(node.text, ctx, opts)
    const n = countOf(node)
    if (!n) return
    for (let i = 0; i < n; i++) {
      text.split('\n').forEach(l => lines.push({ level, text: l }))
    }
    return
  }

  if (node.type === 'group') {
    const n = countOf(node)
    if (!n) return
    for (let i = 0; i < n; i++) {
      const gctx = n > 1 ? { index: i, total: n } : ctx
      node.children.forEach(c => renderNode(c, level, gctx, lines, opts))
    }
    return
  }

  if (isLorem(node.tag)) {
    const m = String(node.tag).match(/^lorem(\d+)?/i)
    const text = loremText(m && m[1] ? parseInt(m[1], 10) : 30)
    const n = countOf(node)
    if (!n) return
    for (let i = 0; i < n; i++) lines.push({ level, text })
    return
  }

  const n = countOf(node)
  if (!n) return
  for (let i = 0; i < n; i++) {
    const nctx = n > 1 ? { index: i, total: n } : ctx
    renderElement(node, level, nctx, lines, opts)
  }
}

function countOf(node) {
  return typeof node.multiply === 'number' ? node.multiply : 1
}

function renderElement(node, level, ctx, lines, opts) {
  const res = resolveTag(node)
  if (res.rawLines) {
    res.rawLines.forEach(pair => lines.push({ level: level + pair[0], text: pair[1], raw: true }))
    return
  }

  const tag = res.tag
  const lower = tag.toLowerCase()
  const isVoid = VOID_TAGS.has(lower)
  const attrs = buildAttrs(node, res, ctx)
  const open = '<' + tag + attrs + '>'

  if (isVoid) {
    lines.push({ level, text: open })
    addComment(node, tag, level, lines, opts)
    return
  }

  const close = '</' + tag + '>'
  const text = node.text != null ? textOf(node.text, ctx, opts) : null
  const textLines = text == null ? [] : String(text).split('\n')

  // 无子元素
  if (!node.children.length) {
    if (!textLines.length) {
      lines.push({ level, text: open + close })
    } else if (textLines.length === 1) {
      lines.push({ level, text: open + textLines[0] + close })
    } else {
      lines.push({ level, text: open })
      textLines.forEach(l => lines.push({ level: level + 1, text: l }))
      lines.push({ level, text: close })
    }
    addComment(node, tag, level, lines, opts)
    return
  }

  // 子元素全部可内联时压成一行
  const parentInlineContent = INLINE_CONTENT_TAGS.has(lower) || INLINE_TAGS.has(lower)
  let allInline = textLines.length <= 1 && parentInlineContent
  const inlineParts = []
  if (allInline) {
    for (const child of node.children) {
      const s = tryInline(child, ctx, opts, 0)
      if (s == null) {
        allInline = false
        break
      }
      inlineParts.push(s)
    }
  }
  if (allInline && inlineParts.length) {
    lines.push({ level, text: open + (textLines[0] || '') + inlineParts.join('') + close })
    addComment(node, tag, level, lines, opts)
    return
  }

  lines.push({ level, text: textLines.length === 1 ? open + textLines[0] : open })
  if (textLines.length > 1) textLines.forEach(l => lines.push({ level: level + 1, text: l }))
  node.children.forEach(c => renderNode(c, level + 1, ctx, lines, opts))
  lines.push({ level, text: close })
  addComment(node, tag, level, lines, opts)
}

function addComment(node, tag, level, lines, opts) {
  if (!opts || !opts.comment) return
  const label = node.classes.length
    ? '.' + node.classes.map(c => applyNumbering(c, { index: 0, total: 1 })).join('.')
    : tag
  lines.push({ level, text: '<!-- /' + label + ' -->' })
}

function tryInline(node, ctx, opts, depth = 0) {
  if (depth > 10) return null
  if (node.type === 'text') return textOf(node.text, ctx, opts)
  if (node.type !== 'element') return null
  if ((node.multiply || 1) > 1) return null
  if (isLorem(node.tag)) {
    const m = String(node.tag).match(/^lorem(\d+)?/i)
    return loremText(m && m[1] ? parseInt(m[1], 10) : 30)
  }
  const res = resolveTag(node)
  if (res.rawLines) return null
  const tag = res.tag
  const lower = tag.toLowerCase()
  if (!INLINE_TAGS.has(lower)) return null
  const attrs = buildAttrs(node, res, ctx)
  const open = '<' + tag + attrs + '>'
  if (VOID_TAGS.has(lower)) return open
  let inner = ''
  if (node.text != null) {
    const t = textOf(node.text, ctx, opts)
    if (t.indexOf('\n') !== -1) return null
    inner += t
  }
  for (const child of node.children) {
    const s = tryInline(child, ctx, opts, depth + 1)
    if (s == null) return null
    inner += s
  }
  return open + inner + '</' + tag + '>'
}

function expandHtml(abbr, opts) {
  const nodes = parseAbbreviation(abbr)
  const lines = []
  nodes.forEach(n => renderNode(n, 0, { index: 0, total: 1 }, lines, opts))
  return collapseEmptyBlocks(lines)
}

// 空元素块（如 li*0 后的空 ul）合并为 <ul></ul>
function collapseEmptyBlocks(lines) {
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i]
    const next = lines[i + 1]
    if (
      next &&
      !cur.raw &&
      !next.raw &&
      next.level === cur.level &&
      /^<\/([A-Za-z][\w:-]*)>$/.test(next.text) &&
      /^<[A-Za-z][\w:-]*(\s[^>]*)?>$/.test(cur.text)
    ) {
      out.push({ level: cur.level, text: cur.text + next.text })
      i++
      continue
    }
    out.push(cur)
  }
  return out
}

/* ===================== 生成（CSS） ===================== */

function cssToken(prop, token) {
  if (!token) return ''
  if (/^#[0-9a-fA-F]{3,8}$/.test(token)) return token
  if (/^[+-]?\d*\.?\d+$/.test(token)) {
    if (/^-?0(\.0+)?$/.test(token)) return '0'
    if (CSS_NO_UNIT.has(prop)) return token
    return token + 'px'
  }
  const unit = token.match(/^([+-]?\d*\.?\d+)(p|e|r|x)$/)
  if (unit) {
    const map = { p: '%', e: 'em', r: 'rem', x: 'ex' }
    return unit[1] + map[unit[2]]
  }
  return token
}

function cssValue(prop, raw) {
  const value = (raw || '').trim()
  if (!value) return ''
  const tokens = value.split('-').filter(t => t !== '')
  return tokens.map(t => cssToken(prop, CSS_VALUE_ALIASES[t] || t)).join(' ')
}

function isKnownCssProp(name) {
  return CSS_ALIASES[name] !== undefined ||
    CSS_PROPERTY_SNIPPETS[name] !== undefined ||
    CSS_KNOWN.has(name)
}

function splitCssPart(p) {
  const colon = p.indexOf(':')
  if (colon > 0) return { propRaw: p.slice(0, colon), valueRaw: p.slice(colon + 1) }

  const lower = p.toLowerCase()
  for (let len = lower.length; len > 0; len--) {
    const head = lower.slice(0, len)
    if (!isKnownCssProp(head)) continue
    const rest = p.slice(len)
    if (rest === '' || rest[0] === '-' || rest[0] === ':' || /[\d#$.]/.test(rest[0])) {
      return { propRaw: head, valueRaw: rest.replace(/^[-:]/, '') }
    }
  }
  const m = p.match(/^([A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*?)(?=[\d#$.])(.*)$/)
  if (m) return { propRaw: m[1], valueRaw: m[2] }
  return { propRaw: p, valueRaw: '' }
}

function expandCssPart(part) {
  let p = part.trim()
  if (!p) return []
  let important = false
  if (p.endsWith('!')) {
    important = true
    p = p.slice(0, -1)
  }

  const { propRaw, valueRaw } = splitCssPart(p)

  const key = propRaw.toLowerCase()
  let prop
  let value

  if (!valueRaw && CSS_PROPERTY_SNIPPETS[key]) {
    prop = CSS_PROPERTY_SNIPPETS[key][0]
    value = CSS_PROPERTY_SNIPPETS[key][1]
  } else {
    prop = CSS_ALIASES[key] || key
    if (!CSS_KNOWN.has(prop) && !/^[a-z][a-z0-9]+-[a-z0-9-]+$/.test(prop)) {
      throw new Error('无法识别的 CSS 属性缩写："' + propRaw + '"')
    }
    value = cssValue(prop, valueRaw)
    if (!value) {
      throw new Error('CSS 缩写 "' + propRaw + '" 缺少属性值')
    }
  }

  return [prop + ': ' + value + (important ? ' !important' : '') + ';']
}

function expandCss(abbr) {
  const parts = abbr.split('+').map(s => s.trim()).filter(Boolean)
  if (!parts.length) throw new Error('缩写为空')
  const lines = []
  parts.forEach(p => {
    expandCssPart(p).forEach(text => lines.push({ level: 0, text }))
  })
  return lines
}

/* ===================== 过滤器 / 入口 ===================== */

function splitFilters(src) {
  let body = ''
  const filters = []
  let depth = 0
  let inFilter = false
  for (const ch of src) {
    if (ch === '{' || ch === '[' || ch === '(') depth++
    if (ch === '}' || ch === ']' || ch === ')') depth--
    if (ch === '|' && depth <= 0) {
      inFilter = true
      filters.push('')
      continue
    }
    if (inFilter) filters[filters.length - 1] += ch
    else body += ch
  }
  return { body, filters: filters.map(f => f.trim()).filter(Boolean) }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function expandAbbreviation(abbr, opts) {
  const options = opts || {}
  const indent = options.indent == null ? '  ' : options.indent
  const { body, filters } = splitFilters(abbr)
  const source = body.trim()
  if (!source) return ''

  const genOpts = {
    indent,
    comment: filters.indexOf('c') !== -1,
    escape: filters.indexOf('e') !== -1
  }

  let lines
  if (options.syntax === 'css') {
    lines = expandCss(source)
  } else {
    lines = expandHtml(source, genOpts)
  }

  let out = lines.map(l => indent.repeat(l.level) + l.text).join('\n')
  if (filters.indexOf('t') !== -1) {
    out = out.split('\n').filter(l => l.trim() !== '').map(l => l.replace(/\s+$/, '')).join('\n')
  }
  return out
}

/* ===================== 组件状态 ===================== */

const input = ref('ul>li.item$*3>a[href="#"]{Item $}')
const syntax = ref('html')
const indentKey = ref('2')
const error = ref('')
const success = ref('')

const indentOptions = [
  { value: '2', label: '2 空格' },
  { value: '4', label: '4 空格' },
  { value: 'tab', label: 'Tab' }
]

const indentChar = computed(() => (indentKey.value === 'tab' ? '\t' : ' '.repeat(Number(indentKey.value))))

const result = computed(() => {
  const abbr = input.value
  if (!abbr.trim()) return { text: '', error: '' }
  try {
    return {
      text: expandAbbreviation(abbr, { syntax: syntax.value, indent: indentChar.value }),
      error: ''
    }
  } catch (e) {
    return { text: '', error: e && e.message ? e.message : '展开失败，请检查缩写语法' }
  }
})

const output = computed(() => result.value.text)
const outputLines = computed(() => (output.value ? output.value.split('\n').length : 0))

const examples = computed(() => syntax.value === 'css' ? cssExamples : htmlExamples)

const htmlExamples = [
  { label: 'ul>li.item$*3>a{Item $}', abbr: 'ul>li.item$*3>a{Item $}', desc: '列表 + 编号 + 文本' },
  { label: 'nav>ul>li*3>a[href=#]{Link $}', abbr: 'nav>ul>li*3>a[href=#]{Link $}', desc: '导航菜单结构' },
  { label: '(header>nav)+main+footer', abbr: '(header>nav)+main+(footer>p)', desc: '分组与兄弟节点' },
  { label: 'div.card>h2.title+p.desc', abbr: 'div.card>h2.title+p.desc', desc: 'class 简写' },
  { label: 'a#logo>img[src=logo.png]', abbr: 'a#logo>img[src=logo.png]', desc: 'id / 属性 / 内联元素' },
  { label: 'form>input:email+button', abbr: 'form>label+input:email+button[type=submit]{提交}', desc: '表单片段' },
  { label: 'table>tr*2>td{item $}*2', abbr: 'table>tr*2>td{item $}*2', desc: '表格乘法' },
  { label: 'p>lorem8', abbr: 'p>lorem8', desc: 'lorem 占位文本' },
  { label: 'div>p^span', abbr: 'div>p^span', desc: '上溯到父级' },
  { label: '!', abbr: '!', desc: 'HTML5 文档骨架' },
  { label: 'ul>li.item$@-*3', abbr: 'ul>li.item$@-*3', desc: '倒序编号' },
  { label: 'div>p|c', abbr: 'div>p|c', desc: '注释过滤器' }
]

const cssExamples = [
  { label: 'm10+p20-30', abbr: 'm10+p20-30', desc: 'margin / padding 多值' },
  { label: 'w100+h200', abbr: 'w100+h200', desc: '宽高' },
  { label: 'd:f+jc:c+ai:c', abbr: 'd:f+jc:c+ai:c', desc: 'flex 居中三件套' },
  { label: 'bd1-solid-#9dff6b', abbr: 'bd1-solid-#9dff6b', desc: '边框复合值' },
  { label: 'bgc#0d0d0d+c#9dff6b', abbr: 'bgc#0d0d0d+c#9dff6b', desc: '颜色缩写' },
  { label: 'fz16+fw700+lh1.5', abbr: 'fz16+fw700+lh1.5', desc: '字体相关' },
  { label: 'posa+t0+l0+z10', abbr: 'posa+t0+l0+z10', desc: '定位' },
  { label: 'p10p+m10e', abbr: 'p10p+m10e', desc: '% / em 单位后缀' },
  { label: 'li:none+td:none', abbr: 'li:none+td:none', desc: '冒号取值别名' },
  { label: 'bdrs4+bxsh0-2-4-#000', abbr: 'bdrs4+bxsh0-2-4-#000', desc: '圆角 / 阴影' }
]

function applyExample(ex) {
  input.value = ex.abbr
  syntax.value = cssExamples.indexOf(ex) !== -1 ? 'css' : 'html'
  error.value = ''
  success.value = ''
}

async function copyOutput() {
  if (!output.value) return
  if (await copyText(output.value)) {
    success.value = '结果已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动选择文本复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyInput() {
  if (!input.value.trim()) return
  if (await copyText(input.value)) {
    success.value = '缩写已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动选择文本复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  syntax.value = 'html'
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.label-row .tool-label {
  margin-top: 0;
  margin-bottom: 0.75rem;
}

.icon-copy {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 3px 7px;
  margin-bottom: 0.75rem;
  transition: all 0.15s;
}

.icon-copy:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
}

.icon-copy:disabled {
  color: var(--dim);
  border-color: var(--line);
  cursor: not-allowed;
  opacity: 0.5;
}

.stats-line {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.hint {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
}

.hint code {
  font-family: var(--mono);
  color: var(--green);
  background: var(--green-soft);
  padding: 0 3px;
}

.example-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.example-chip {
  padding: 8px 6px;
  font-family: var(--mono);
  font-size: 12px;
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--line);
  cursor: pointer;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.15s;
}

.example-chip:hover {
  border-color: var(--green);
  color: var(--green);
  background: var(--green-soft);
}

@media (max-width: 900px) {
  .example-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .example-chip {
    font-size: 11px;
    padding: 9px 4px;
  }

  .hint {
    font-size: 11px;
  }
}
</style>
