<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔤 正则速查表</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- 搜索 + 分类筛选（全宽） -->
        <div class="filter-bar">
          <div class="filter-row">
            <input
              v-model="search"
              class="code-input-sm rxs-search"
              placeholder="🔍 搜索语法：\d、量词、分组、邮箱、手机号…"
            />
            <span class="filter-count">{{ filtered.length }} / {{ allItems.length }} 条</span>
          </div>
          <div class="filter-row">
            <button
              v-for="c in categories"
              :key="c.key"
              class="cat-chip"
              :class="{ active: cat === c.key }"
              type="button"
              @click="cat = c.key"
            >
              {{ c.label }}<span class="cat-num">{{ countOf(c.key) }}</span>
            </button>
          </div>
        </div>

        <!-- 双栏：语法目录 / 详情 + 实时测试 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">
              语法目录：{{ filtered.length }} 条
              <button
                class="copy-btn label-copy-btn"
                title="复制当前语法清单"
                :disabled="!filtered.length"
                @click="copyIndex"
              >📋</button>
            </label>
            <div v-if="!filtered.length" class="code-input output output-empty">
              没有匹配的语法
              <span class="empty-sub">换个关键词试试，或把分类切回「全部」</span>
            </div>
            <div v-else class="rxs-list">
              <div
                v-for="item in filtered"
                :key="item.key"
                class="rxs-item"
                :class="{ active: current && item.key === current.key }"
                @click="selectedKey = item.key"
              >
                <div class="rxs-item-head">
                  <code class="rxs-item-syntax">{{ item.syntax }}</code>
                  <span class="rxs-item-cat">{{ catName(item.cat) }}</span>
                  <button
                    class="copy-btn rxs-copy"
                    title="复制该正则"
                    @click.stop="copyItem(item)"
                  >📋</button>
                </div>
                <div class="rxs-item-desc">{{ item.desc }}</div>
              </div>
            </div>
          </div>

          <div class="tool-col">
            <label class="tool-label">语法详情 / 实时测试</label>

            <template v-if="current">
              <div class="rxs-detail-head">
                <code class="rxs-detail-syntax">{{ current.syntax }}</code>
                <button
                  class="copy-btn"
                  title="复制语法"
                  @click="copyTo(current.syntax, '已复制语法')"
                >📋</button>
              </div>
              <div class="rxs-desc">{{ current.desc }}</div>

              <label class="tool-label">示例正则：</label>
              <div class="result-display rxs-example">
                <code>{{ current.example }}</code>
                <button
                  class="copy-btn"
                  title="复制示例正则"
                  @click="copyTo(current.example, '已复制正则')"
                >📋</button>
              </div>
              <div class="rxs-flags">
                修饰符：<code>{{ current.flags || 'g' }}</code>
                <span class="rxs-flag-hint">{{ flagHint }}</span>
              </div>

              <label class="tool-label">
                测试文本（可编辑，实时高亮）：
                <button
                  class="copy-btn label-copy-btn"
                  title="复制测试文本"
                  :disabled="!testText"
                  @click="copyTo(testText, '已复制测试文本')"
                >📋</button>
              </label>
              <textarea
                v-model="testText"
                class="code-input rxs-test-input"
                rows="4"
                placeholder="输入要测试的文本…"
              ></textarea>

              <label class="tool-label">
                匹配结果：{{ matchCount }} 处
                <button
                  class="copy-btn label-copy-btn"
                  title="复制匹配到的内容"
                  :disabled="!matchCount"
                  @click="copyMatches"
                >📋</button>
              </label>
              <pre class="rxs-preview" v-html="previewHtml"></pre>
            </template>
            <div v-else class="rxs-empty-tip">← 请从左侧选择一条语法</div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!current" @click="copyTo(current && current.example, '已复制示例正则')">📋 复制正则</button>
          <button class="tool-button" :disabled="!filtered.length" @click="copyCheatsheet">📋 复制速查表</button>
          <button class="tool-button danger" @click="reset">🗑️ 重置</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

const search = ref('')
const cat = ref('all')
const selectedKey = ref('')
const testText = ref('')
const error = ref('')
const success = ref('')

const categories = [
  { key: 'all', label: '全部' },
  { key: 'char', label: '字符类' },
  { key: 'anchor', label: '锚点边界' },
  { key: 'quant', label: '量词' },
  { key: 'group', label: '分组引用' },
  { key: 'look', label: '断言' },
  { key: 'escape', label: '转义' },
  { key: 'common', label: '常用模式' }
]

const groups = [
  {
    key: 'char',
    label: '字符类',
    items: [
      { syntax: '.', desc: '匹配任意单个字符（默认不含换行符）', example: 'a.c', sample: 'abc a c axc' },
      { syntax: '\\d', desc: '匹配任意数字，等价于 [0-9]', example: '\\d{3}', sample: '订单号 123 与 4567' },
      { syntax: '\\D', desc: '匹配任意非数字字符', example: '\\D+', sample: 'abc123def456' },
      { syntax: '\\w', desc: '匹配字母、数字或下划线 [A-Za-z0-9_]', example: '\\w+', sample: 'hello_world 123' },
      { syntax: '\\W', desc: '匹配任意非单词字符', example: '\\W+', sample: 'a-b_c d' },
      { syntax: '\\s', desc: '匹配任意空白字符（空格、Tab、换行）', example: '\\s+', sample: 'a  b\tc' },
      { syntax: '\\S', desc: '匹配任意非空白字符', example: '\\S+', sample: 'a  b\tc' },
      { syntax: '[abc]', desc: '匹配方括号中的任意一个字符', example: '[aeiou]', sample: 'hello world' },
      { syntax: '[^abc]', desc: '匹配除括号内字符以外的任意字符', example: '[^0-9]+', sample: 'abc123def456' },
      { syntax: '[a-z]', desc: '匹配指定范围内的任意字符', example: '[A-Za-z]+', sample: 'Hello World 42' }
    ]
  },
  {
    key: 'anchor',
    label: '锚点边界',
    items: [
      { syntax: '^', flags: 'gm', desc: '匹配字符串开头（m 修饰符下为行首）', example: '^\\w+', sample: 'foo bar\nbaz qux' },
      { syntax: '$', flags: 'gm', desc: '匹配字符串结尾（m 修饰符下为行尾）', example: '\\w+$', sample: 'foo bar\nbaz qux' },
      { syntax: '\\b', desc: '匹配单词边界（单词字符与非单词字符之间）', example: '\\bcat\\b', sample: 'cat category concatenate cat.' },
      { syntax: '\\B', desc: '匹配非单词边界', example: '\\Bcat', sample: 'cat category' }
    ]
  },
  {
    key: 'quant',
    label: '量词',
    items: [
      { syntax: '*', desc: '前面的元素出现 0 次或多次', example: 'ab*', sample: 'a ab abb abbb' },
      { syntax: '+', desc: '前面的元素出现 1 次或多次', example: 'ab+', sample: 'a ab abb abbb' },
      { syntax: '?', desc: '前面的元素出现 0 次或 1 次', example: 'colou?r', sample: 'color colour' },
      { syntax: '{n}', desc: '前面的元素恰好出现 n 次', example: 'a{3}', sample: 'a aa aaa aaaa' },
      { syntax: '{n,}', desc: '前面的元素至少出现 n 次', example: 'a{2,}', sample: 'a aa aaa aaaa' },
      { syntax: '{n,m}', desc: '前面的元素出现 n 到 m 次', example: 'a{2,4}', sample: 'a aa aaa aaaa aaaaa' },
      { syntax: '*?', desc: '懒惰匹配：尽可能少地重复', example: '".*?"', sample: '"a" "b" "c"' },
      { syntax: '.*', desc: '贪婪匹配：尽可能多地重复', example: '".*"', sample: '"a" "b" "c"' }
    ]
  },
  {
    key: 'group',
    label: '分组引用',
    items: [
      { syntax: '(abc)', desc: '捕获分组，可被后续引用', example: '(ab)+', sample: 'abab ab ababab' },
      { syntax: '(?:abc)', desc: '非捕获分组，只分组不保存', example: '(?:ab)+', sample: 'abab abab ab' },
      { syntax: '(?<name>abc)', desc: '命名捕获分组', example: '(?<year>\\d{4})-(?<month>\\d{2})', sample: '2026-10 2025-12' },
      { syntax: '\\1', desc: '反向引用第 1 个捕获分组', example: '(\\w)\\1', sample: 'aabbcd eeff' },
      { syntax: '\\k<name>', desc: '反向引用命名分组', example: '(?<c>\\w)\\k<c>', sample: 'aabb cd' },
      { syntax: '|', desc: '或：匹配左右任意一边', example: 'cat|dog', sample: 'I have a cat and a dog' }
    ]
  },
  {
    key: 'look',
    label: '断言',
    items: [
      { syntax: '(?=abc)', desc: '正向前瞻：后面必须匹配指定内容', example: '\\d+(?=元)', sample: '100元 200美元 300元' },
      { syntax: '(?!abc)', desc: '负向前瞻：后面不能匹配指定内容', example: '\\d+(?!元)', sample: '100元 200美元 300元' },
      { syntax: '(?<=abc)', desc: '正向后顾：前面必须匹配指定内容', example: '(?<=\\$)\\d+', sample: '$100 €200 $300' },
      { syntax: '(?<!abc)', desc: '负向后顾：前面不能匹配指定内容', example: '(?<!\\$)\\d+', sample: '$100 200 €300' }
    ]
  },
  {
    key: 'escape',
    label: '转义',
    items: [
      { syntax: '\\.', desc: '转义特殊字符（此处匹配字面量点号）', example: '\\.', sample: 'a.b a-b a+b' },
      { syntax: '\\\\', desc: '匹配字面量反斜杠', example: '\\\\', sample: 'a\\b c\\d' },
      { syntax: '\\n \\t \\r', desc: '匹配换行、制表符、回车', example: '\\t', sample: 'a\tb c\td' },
      { syntax: '\\xhh', desc: '匹配两位十六进制编码的字符', example: '\\x41', sample: 'A B C' },
      { syntax: '\\uhhhh', desc: '匹配四位 Unicode 编码的字符', example: '\\u4e2d', sample: '中文测试' },
      { syntax: '\\u{1F600}', flags: 'gu', desc: '匹配码点大于 U+FFFF 的字符（需 u 修饰符）', example: '\\u{1F600}', sample: '😀 🎉 😀' }
    ]
  },
  {
    key: 'common',
    label: '常用模式',
    items: [
      { syntax: '^[\\w.+-]+@[\\w-]+\\.[\\w.]+$', flags: 'gm', desc: '邮箱地址：基础格式校验', example: '^[\\w.+-]+@[\\w-]+\\.[\\w.]+$', sample: 'user@example.com\nbad@@mail' },
      { syntax: '^1[3-9]\\d{9}$', flags: 'gm', desc: '中国大陆手机号', example: '^1[3-9]\\d{9}$', sample: '13800138000\n12345678901' },
      { syntax: 'https?://[^\\s]+', desc: 'URL 链接（http / https）', example: 'https?://[^\\s]+', sample: '访问 https://403.li 和 http://example.com/path' },
      { syntax: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', desc: 'IPv4 地址', example: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', sample: 'IP: 192.168.1.1 与 10.0.0.256' },
      { syntax: '\\d{4}-\\d{2}-\\d{2}', desc: '日期 YYYY-MM-DD', example: '\\d{4}-\\d{2}-\\d{2}', sample: '2026-10-02 与 2026/12/31' },
      { syntax: '\\d{2}:\\d{2}:\\d{2}', desc: '时间 HH:MM:SS', example: '\\d{2}:\\d{2}:\\d{2}', sample: '12:30:45 与 09:05:03' },
      { syntax: '#[0-9A-Fa-f]{6}\\b', desc: '十六进制颜色值', example: '#[0-9A-Fa-f]{6}\\b', sample: '#9dff6b #E5A50A #fff' },
      { syntax: '[\\u4e00-\\u9fa5]+', desc: '中文字符（常用汉字区间）', example: '[\\u4e00-\\u9fa5]+', sample: 'Hello 你好 World 世界' },
      { syntax: '\\b\\d{6}\\b', desc: '中国大陆邮政编码', example: '\\b\\d{6}\\b', sample: '邮编 100000 与邮编 2000' }
    ]
  }
]

/* 展平为带 key / cat 的条目列表 */
let seq = 0
const allItems = []
groups.forEach(g => {
  g.items.forEach(it => {
    it.cat = g.key
    it.key = g.key + '-' + (seq++)
    allItems.push(it)
  })
})

const catName = (key) => (categories.find(c => c.key === key) || {}).label || key
const countOf = (key) => (key === 'all' ? allItems.length : allItems.filter(i => i.cat === key).length)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return allItems.filter(it => {
    if (cat.value !== 'all' && it.cat !== cat.value) return false
    if (!q) return true
    const hay = `${it.syntax} ${it.desc} ${it.example} ${it.flags || ''} ${catName(it.cat)}`.toLowerCase()
    return hay.includes(q)
  })
})

const current = computed(() => {
  return filtered.value.find(i => i.key === selectedKey.value) || filtered.value[0] || null
})

/* 选中项变化时，用示例文本重置测试区 */
watch(() => (current.value ? current.value.key : ''), () => {
  testText.value = current.value ? current.value.sample || '' : ''
})

const FLAG_HINTS = {
  g: '全局匹配',
  i: '忽略大小写',
  m: '多行模式',
  s: 'dotAll（. 匹配换行）',
  u: 'Unicode 模式',
  y: '粘性匹配'
}

const flagHint = computed(() => {
  const f = (current.value && current.value.flags) || 'g'
  return f.split('').map(x => (FLAG_HINTS[x] ? `${x}=${FLAG_HINTS[x]}` : x)).join('，')
})

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/* 实时匹配：构建高亮 HTML + 匹配结果列表 */
const matchInfo = computed(() => {
  const item = current.value
  const text = testText.value
  if (!item || !text) return { html: '', count: 0, matches: [] }

  const flags = item.flags || 'g'
  const globalFlags = flags.includes('g') ? flags : flags + 'g'
  let re
  try {
    re = new RegExp(item.example, globalFlags)
  } catch (e) {
    return { html: escapeHtml(text), count: 0, matches: [] }
  }

  let html = ''
  let last = 0
  let count = 0
  const matches = []
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index === re.lastIndex) re.lastIndex++
    html += escapeHtml(text.slice(last, m.index))
    html += '<mark>' + escapeHtml(m[0]) + '</mark>'
    last = m.index + m[0].length
    matches.push(m[0])
    count++
    if (count >= 2000) break
  }
  html += escapeHtml(text.slice(last))
  return { html, count, matches }
})

const matchCount = computed(() => matchInfo.value.count)

const previewHtml = computed(() => {
  return matchInfo.value.html || '<span class="rxs-placeholder">无匹配</span>'
})

/* 复制 / 提示 */
let msgTimer = null
function flash(msg, isError = false) {
  if (msgTimer) clearTimeout(msgTimer)
  if (isError) {
    error.value = msg
    success.value = ''
  } else {
    success.value = msg
    error.value = ''
  }
  msgTimer = setTimeout(() => {
    success.value = ''
    error.value = ''
  }, 2200)
}

async function copyTo(text, msg) {
  if (text == null || text === '') {
    flash('没有可复制的内容', true)
    return
  }
  const ok = await copyText(String(text))
  flash(ok ? msg : '复制失败，请手动选择复制', !ok)
}

function copyItem(item) {
  copyTo(item.example, '已复制正则：' + item.example)
}

function copyIndex() {
  copyTo(
    filtered.value.map(i => `${i.syntax}  →  ${i.desc}`).join('\n'),
    '已复制语法清单'
  )
}

function copyMatches() {
  copyTo(matchInfo.value.matches.join('\n'), `已复制 ${matchCount.value} 处匹配内容`)
}

function copyCheatsheet() {
  const lines = ['# 正则表达式速查表', '']
  categories.filter(c => c.key !== 'all').forEach(c => {
    const items = filtered.value.filter(i => i.cat === c.key)
    if (!items.length) return
    lines.push(`## ${c.label}`)
    items.forEach(i => lines.push(`- \`${i.syntax}\`  ${i.desc}  例：\`${i.example}\``))
    lines.push('')
  })
  copyTo(lines.join('\n'), '已复制速查表（Markdown）')
}

function reset() {
  search.value = ''
  cat.value = 'all'
  selectedKey.value = ''
  testText.value = ''
  flash('已重置')
}

onBeforeUnmount(() => {
  if (msgTimer) clearTimeout(msgTimer)
})
</script>

<style scoped>
/* === 搜索 / 筛选栏 === */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.rxs-search {
  flex: 1;
  min-width: 220px;
}

.filter-count {
  font-size: 12px;
  color: var(--muted);
  font-family: var(--mono);
  white-space: nowrap;
}

.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.15s;
}

.cat-chip:hover {
  color: var(--green);
  border-color: var(--green);
}

.cat-chip.active {
  color: var(--bg);
  background: var(--green);
  border-color: var(--green);
}

.cat-num {
  font-size: 11px;
  opacity: 0.75;
}

/* === 左侧语法列表 === */
.rxs-list {
  flex: 1;
  overflow-y: auto;
  max-height: 560px;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.rxs-item {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background 0.15s;
}

.rxs-item:last-child {
  border-bottom: none;
}

.rxs-item:hover {
  background: var(--green-soft);
}

.rxs-item.active {
  background: var(--green-soft);
  box-shadow: inset 3px 0 0 var(--green);
}

.rxs-item-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 30px;
}

.rxs-item-syntax {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  word-break: break-all;
}

.rxs-item-cat {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 1px 6px;
}

.rxs-item-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}

.rxs-copy {
  top: 6px;
  right: 4px;
  font-size: 13px;
}

/* === 右侧详情 === */
.rxs-detail-head {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 12px 44px 12px 14px;
  margin-bottom: 10px;
}

.rxs-detail-syntax {
  font-family: var(--mono);
  font-size: 18px;
  color: var(--green);
  word-break: break-all;
}

.rxs-desc {
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 12px;
}

.rxs-example {
  margin: 0.5rem 0;
  padding-right: 44px;
}

.rxs-example code {
  font-family: var(--mono);
  font-size: 13px;
}

.rxs-flags {
  font-size: 12px;
  color: var(--muted);
  font-family: var(--mono);
  margin-bottom: 12px;
}

.rxs-flags code {
  color: var(--green);
}

.rxs-flag-hint {
  margin-left: 6px;
  color: var(--text-muted);
}

.rxs-test-input {
  margin-bottom: 12px;
  resize: vertical;
}

.rxs-preview {
  margin: 0;
  padding: 12px 14px;
  min-height: 48px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 240px;
  overflow-y: auto;
}

.rxs-preview :deep(mark) {
  background: var(--green);
  color: var(--bg);
  padding: 0 1px;
}

.rxs-placeholder {
  color: var(--text-muted);
}

.rxs-empty-tip {
  color: var(--muted);
  font-size: 13px;
  padding: 20px 0;
  text-align: center;
}

/* 空态 */
.output-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 120px;
  color: var(--muted);
  font-size: 13px;
  text-align: center;
}

.empty-sub {
  font-size: 12px;
  color: var(--text-muted);
}

/* 标签内联复制按钮不吃绝对定位 */
.label-copy-btn {
  position: static;
  margin-left: 6px;
  font-size: 13px;
  vertical-align: middle;
}

@media (max-width: 640px) {
  .rxs-list {
    max-height: 360px;
  }

  .rxs-detail-syntax {
    font-size: 15px;
  }
}
</style>
