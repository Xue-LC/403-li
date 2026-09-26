<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📐 Grid 布局可视化</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- ============ 左栏：控制面板 ============ -->
          <div class="tool-col">
            <label class="tool-label">列模板 (grid-template-columns)：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="columnsPreset" value="repeat(3, 1fr)" />
                <span>3 等分</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="columnsPreset" value="repeat(4, 1fr)" />
                <span>4 等分</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="columnsPreset" value="repeat(2, 1fr)" />
                <span>2 等分</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="columnsPreset" value="1fr 2fr 1fr" />
                <span>1fr 2fr 1fr</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="columnsPreset" value="200px 1fr 1fr" />
                <span>200px 1fr 1fr</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="columnsPreset" value="repeat(auto-fill, minmax(150px, 1fr))" />
                <span>auto-fill</span>
              </label>
            </div>

            <label class="tool-label">行模板 (grid-template-rows)：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="rowsPreset" value="auto" />
                <span>auto</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="rowsPreset" value="repeat(2, 120px)" />
                <span>120px × 2</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="rowsPreset" value="100px 1fr auto" />
                <span>100px 1fr auto</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="rowsPreset" value="150px 200px" />
                <span>150px 200px</span>
              </label>
            </div>

            <label class="tool-label">justify-items：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="justifyItems" value="stretch" />
                <span>stretch</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="justifyItems" value="start" />
                <span>start</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="justifyItems" value="center" />
                <span>center</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="justifyItems" value="end" />
                <span>end</span>
              </label>
            </div>

            <label class="tool-label">align-items：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="alignItems" value="stretch" />
                <span>stretch</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignItems" value="start" />
                <span>start</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignItems" value="center" />
                <span>center</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignItems" value="end" />
                <span>end</span>
              </label>
            </div>

            <label class="tool-label">justify-content：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="justifyContent" value="start" />
                <span>start</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="justifyContent" value="center" />
                <span>center</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="justifyContent" value="end" />
                <span>end</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="justifyContent" value="space-between" />
                <span>space-between</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="justifyContent" value="space-around" />
                <span>space-around</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="justifyContent" value="space-evenly" />
                <span>space-evenly</span>
              </label>
            </div>

            <label class="tool-label">align-content：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="start" />
                <span>start</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="center" />
                <span>center</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="end" />
                <span>end</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="stretch" />
                <span>stretch</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="space-between" />
                <span>space-between</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="space-around" />
                <span>space-around</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="space-evenly" />
                <span>space-evenly</span>
              </label>
            </div>

            <label class="tool-label">间距 gap：{{ gap }}px</label>
            <input type="range" v-model.number="gap" min="0" max="60" class="range-input" />
            <div class="length-display"><span>{{ gap }}px</span></div>

            <label class="tool-label">项目数量：{{ itemCount }}</label>
            <input type="range" v-model.number="itemCount" min="1" max="16" class="range-input" />
            <div class="length-display"><span>{{ itemCount }} 个</span></div>

            <label class="tool-label">项目分布（${gridColumn} × ${gridRow} 跨度）：</label>
            <div class="items-list">
              <div v-for="(item, index) in items" :key="index" class="item-control">
                <span class="item-index">{{ index + 1 }}</span>
                <span class="item-color-dot" :style="{ background: itemColors[index % itemColors.length] }"></span>
                <label class="item-prop-label">col</label>
                <select v-model.number="item.colSpan" class="item-select">
                  <option :value="1">1</option>
                  <option :value="2">2</option>
                  <option :value="3">3</option>
                  <option :value="4">4</option>
                </select>
                <label class="item-prop-label">row</label>
                <select v-model.number="item.rowSpan" class="item-select">
                  <option :value="1">1</option>
                  <option :value="2">2</option>
                  <option :value="3">3</option>
                </select>
              </div>
            </div>
          </div>

          <!-- ============ 右栏：预览 + CSS ============ -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="preview-wrapper">
              <div class="grid-container" :style="containerStyle">
                <div
                  v-for="(item, index) in items"
                  :key="index"
                  class="grid-item"
                  :style="getItemStyle(index)"
                >
                  <span class="item-num">{{ index + 1 }}</span>
                  <span v-if="item.colSpan > 1 || item.rowSpan > 1" class="item-span-label">
                    {{ item.colSpan }}×{{ item.rowSpan }}
                  </span>
                </div>
              </div>
            </div>

            <label class="tool-label">CSS 代码：</label>
            <textarea
              class="code-input output"
              :value="generatedCSS"
              readonly
              rows="11"
            ></textarea>

            <div class="button-group button-group-2" style="margin-top:8px">
              <button class="tool-button primary" @click="copyCSS">📋 复制 CSS</button>
              <button class="tool-button" @click="resetAll">↺ 重置</button>
            </div>
          </div>
        </div>

        <div v-if="copyMsg" class="status-success">{{ copyMsg }}</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

// --- Presets ---
const columnsPreset = ref('repeat(3, 1fr)')
const rowsPreset = ref('auto')

// --- Alignment ---
const justifyItems = ref('stretch')
const alignItems = ref('stretch')
const justifyContent = ref('start')
const alignContent = ref('start')

// --- Gap + Items ---
const gap = ref(8)
const itemCount = ref(6)

// --- Colors ---
const itemColors = ['var(--green)', '#6bcdff', '#ff9d6b', '#ff6bcd', '#ffe06b', '#6bffcd', '#cd6bff', '#ff6b6b']

// --- Items ---
const items = reactive([
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
])

// --- Status ---
const copyMsg = ref('')
const error = ref('')

// --- Sync item count ---
watch(itemCount, (n) => {
  while (items.length < n) {
    items.push({ colSpan: 1, rowSpan: 1 })
  }
  while (items.length > n) {
    items.pop()
  }
})

// --- Container style ---
const containerStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: columnsPreset.value,
  gridTemplateRows: rowsPreset.value,
  justifyItems: justifyItems.value,
  alignItems: alignItems.value,
  justifyContent: justifyContent.value,
  alignContent: alignContent.value,
  gap: `${gap.value}px`,
}))

// --- Per-item style ---
function getItemStyle(index) {
  const item = items[index]
  const color = itemColors[index % itemColors.length]
  return {
    gridColumn: item.colSpan > 1 ? `span ${item.colSpan}` : undefined,
    gridRow: item.rowSpan > 1 ? `span ${item.rowSpan}` : undefined,
    borderColor: color,
    background: `${color}18`,
    color: color,
  }
}

// --- Generated CSS ---
const generatedCSS = computed(() => {
  const lines = [`.grid-container {`]
  lines.push(`  display: grid;`)
  lines.push(`  grid-template-columns: ${columnsPreset.value};`)
  lines.push(`  grid-template-rows: ${rowsPreset.value};`)
  if (justifyItems.value !== 'stretch') lines.push(`  justify-items: ${justifyItems.value};`)
  if (alignItems.value !== 'stretch') lines.push(`  align-items: ${alignItems.value};`)
  if (justifyContent.value !== 'start') lines.push(`  justify-content: ${justifyContent.value};`)
  if (alignContent.value !== 'start') lines.push(`  align-content: ${alignContent.value};`)
  lines.push(`  gap: ${gap.value}px;`)
  lines.push(`}`)

  const hasSpans = items.some(i => i.colSpan > 1 || i.rowSpan > 1)
  if (hasSpans) {
    lines.push('')
    items.forEach((item, i) => {
      if (item.colSpan > 1 || item.rowSpan > 1) {
        const parts = []
        if (item.colSpan > 1) parts.push(`grid-column: span ${item.colSpan}`)
        if (item.rowSpan > 1) parts.push(`grid-row: span ${item.rowSpan}`)
        lines.push(`.grid-item:nth-child(${i + 1}) {`)
        lines.push(`  ${parts.join('; ')};`)
        lines.push(`}`)
      }
    })
  }

  return lines.join('\n')
})

// --- Actions ---
function resetAll() {
  columnsPreset.value = 'repeat(3, 1fr)'
  rowsPreset.value = 'auto'
  justifyItems.value = 'stretch'
  alignItems.value = 'stretch'
  justifyContent.value = 'start'
  alignContent.value = 'start'
  gap.value = 8
  itemCount.value = 6
  items.splice(0, items.length)
  for (let i = 0; i < 6; i++) {
    items.push({ colSpan: 1, rowSpan: 1 })
  }
  copyMsg.value = ''
  error.value = ''
}

async function copyCSS() {
  try {
    await copyText(generatedCSS.value)
    copyMsg.value = '✅ CSS 已复制到剪贴板'
    setTimeout(() => { copyMsg.value = '' }, 2000)
  } catch {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 3000)
  }
}
</script>

<style scoped>
/* === Preview === */
.preview-wrapper {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 4px;
  border-radius: 0;
  min-height: 260px;
  overflow: auto;
}

.grid-container {
  min-height: 250px;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 24px,
    rgba(157, 255, 107, 0.03) 24px,
    rgba(157, 255, 107, 0.03) 25px
  ),
  repeating-linear-gradient(
    90deg,
    transparent,
    transparent 24px,
    rgba(157, 255, 107, 0.03) 24px,
    rgba(157, 255, 107, 0.03) 25px
  );
  border-radius: 0;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 2px solid;
  border-radius: 0;
  padding: 12px 8px;
  min-width: 0;
  min-height: 0;
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  transition: all 0.2s ease;
  cursor: default;
  user-select: none;
}

.item-num {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
}

.item-span-label {
  font-size: 9px;
  opacity: 0.7;
  background: var(--panel);
  padding: 1px 5px;
  border-radius: 0;
}

/* === Items list in controls === */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
  max-height: 260px;
  overflow-y: auto;
}

.item-control {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 5px 7px;
  border-radius: 0;
}

.item-index {
  font-family: 'MapleMono NF CN', monospace;
  color: var(--green);
  font-size: 12px;
  min-width: 18px;
  text-align: center;
}

.item-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 0;
  flex-shrink: 0;
}

.item-prop-label {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
}

.item-select {
  width: 40px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--green);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 12px;
  padding: 2px 4px;
  text-align: center;
  border-radius: 0;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.item-select:focus {
  outline: 0;
  border-color: var(--green);
}

/* === Length display === */
.length-display {
  margin-top: 2px;
  margin-bottom: 6px;
}

.length-display span {
  font-family: 'MapleMono NF CN', monospace;
  color: var(--green);
  font-size: 13px;
}

/* === Mobile === */
@media (max-width: 640px) {
  .grid-container {
    min-height: 200px;
  }

  .preview-wrapper {
    min-height: 210px;
  }

  .grid-item {
    padding: 8px 6px;
    font-size: 11px;
  }

  .item-num {
    font-size: 15px;
  }

  .item-span-label {
    font-size: 8px;
  }

  .item-control {
    flex-wrap: wrap;
    gap: 4px;
  }

  .items-list {
    max-height: 200px;
  }
}
</style>
