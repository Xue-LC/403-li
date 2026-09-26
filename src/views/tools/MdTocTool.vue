<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📑 Markdown 目录生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：输入 + 选项 -->
          <div class="tool-col">
            <label class="tool-label">Markdown 文本：</label>
            <textarea
              class="code-input"
              v-model="input"
              rows="16"
              placeholder="粘贴 Markdown 文本，自动提取标题生成目录..."
            ></textarea>

            <label class="tool-label">起始层级：</label>
            <div class="radio-group">
              <label class="radio-label" v-for="lvl in 6" :key="'lvl' + lvl">
                <input type="radio" v-model="minLevel" :value="lvl" />
                <span>H{{ lvl }}</span>
              </label>
            </div>

            <label class="tool-label">编号方式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="numbering" value="bullet" />
                <span>无序列表</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="numbering" value="ordered" />
                <span>有序（1. / 1.1.）</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="numbering" value="none" />
                <span>纯链接</span>
              </label>
            </div>
          </div>

          <!-- 右侧：输出 -->
          <div class="tool-col">
            <label class="tool-label">生成的目录：</label>
            <textarea
              class="code-input output"
              :value="toc"
              readonly
              rows="16"
              placeholder="点击「生成目录」按钮生成..."
            ></textarea>

            <div v-if="toc" class="toc-preview-section">
              <label class="tool-label">预览：</label>
              <div class="toc-preview" v-html="renderedToc"></div>
            </div>

            <div v-if="headings.length > 0" class="stats-section">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">标题数</span>
                  <span class="stat-value">{{ headings.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">最大层级</span>
                  <span class="stat-value">H{{ maxHeadingLevel }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="generate">⚡ 生成目录</button>
          <button class="tool-button" @click="copyToc" :disabled="!toc">📋 复制</button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const toc = ref('')
const headings = ref([])
const maxHeadingLevel = ref(0)
const error = ref('')
const success = ref(false)
const minLevel = ref(1)
const numbering = ref('bullet')

/**
 * 生成 GitHub 风格锚点
 */
function generateAnchor(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '')  // 保留字母数字中文空格连字符
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * 解析 Markdown 标题
 */
function parseHeadings(md) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const results = []
  const anchorCount = new Map()
  let match

  while ((match = headingRegex.exec(md)) !== null) {
    const level = match[1].length
    // 跳过代码块内的标题（简单启发式：检查前面是否有 ``` 未闭合）
    const beforeMatch = md.substring(0, match.index)
    const fenceCount = (beforeMatch.match(/^```/gm) || []).length
    if (fenceCount % 2 !== 0) continue

    let raw = match[2].trim()
    // 去除行内代码和链接语法
    raw = raw.replace(/`[^`]*`/g, (m) => m.slice(1, -1))
    raw = raw.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    raw = raw.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    raw = raw.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    raw = raw.replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    raw = raw.replace(/~~([^~]+)~~/g, '$1')
    raw = raw.replace(/<[^>]+>/g, '')
    raw = raw.trim()

    let anchor = generateAnchor(raw)
    // 处理重名锚点
    const count = anchorCount.get(anchor) || 0
    if (count > 0) {
      anchor = anchor + '-' + (count + 1)
    }
    anchorCount.set(anchor, count + 1)

    results.push({ level, raw, anchor })
  }

  return results
}

/**
 * 生成编号字符串
 *   counters: 各层级计数器数组
 *   depth: 当前标题的映射深度（0-based）
 */
function buildNumber(counters, depth) {
  return counters.slice(0, depth + 1).join('.') + '.'
}

function generate() {
  error.value = ''
  success.value = false
  headings.value = []
  maxHeadingLevel.value = 0
  toc.value = ''

  const md = input.value.trim()
  if (!md) {
    error.value = '请输入 Markdown 文本'
    return
  }

  const allHeadings = parseHeadings(md)
  if (allHeadings.length === 0) {
    error.value = '未找到任何标题（# 开头行）'
    return
  }

  // 过滤低于 minLevel 的标题
  const filtered = allHeadings.filter(h => h.level >= minLevel.value)
  if (filtered.length === 0) {
    error.value = `未找到 H${minLevel.value} 及以上的标题`
    return
  }

  headings.value = filtered
  maxHeadingLevel.value = Math.max(...filtered.map(h => h.level))

  const indent = '  '
  const lines = []
  const counters = []

  for (const h of filtered) {
    const depth = h.level - minLevel.value   // 0-based depth in TOC

    // 维护计数器
    if (counters.length <= depth) {
      while (counters.length <= depth) counters.push(1)
    } else {
      counters[depth] = (counters[depth] || 0) + 1
      // 重置更深层的计数器
      counters.length = depth + 1
      // 填充到当前深度
      for (let i = 0; i <= depth; i++) {
        if (!counters[i]) counters[i] = 1
      }
    }

    const prefix = indent.repeat(depth)
    const link = `[${h.raw}](#${h.anchor})`

    let line
    if (numbering.value === 'ordered') {
      const num = buildNumber(counters, depth)
      line = `${prefix}${num} ${link}`
    } else if (numbering.value === 'bullet') {
      line = `${prefix}- ${link}`
    } else {
      // none: pure link
      line = `${prefix}${link}`
    }

    lines.push(line)
  }

  toc.value = lines.join('\n')
  success.value = '生成成功'
  setTimeout(() => { success.value = false }, 2000)
}

const renderedToc = computed(() => {
  if (!toc.value) return ''
  try {
    return DOMPurify.sanitize(marked.parse(toc.value, { breaks: false }))
  } catch {
    return DOMPurify.sanitize(toc.value)
  }
})

async function copyToc() {
  if (!toc.value) return
  if (await copyText(toc.value)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  toc.value = ''
  headings.value = []
  maxHeadingLevel.value = 0
  error.value = ''
  success.value = false
}
</script>

<style scoped>
.toc-preview-section {
  margin-top: 12px;
}

.toc-preview {
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 12px 14px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  max-height: 300px;
  overflow-y: auto;
}

.toc-preview :deep(a) {
  color: var(--green);
  text-decoration: none;
}

.toc-preview :deep(a:hover) {
  text-decoration: underline;
}

.toc-preview :deep(ul),
.toc-preview :deep(ol) {
  margin: 0;
  padding-left: 1.5em;
}

.toc-preview :deep(li) {
  margin: 3px 0;
  line-height: 1.6;
}

.toc-preview :deep(p) {
  margin: 4px 0;
}

@media (max-width: 640px) {
  .toc-preview {
    font-size: 12px;
    padding: 10px;
  }
}
</style>
