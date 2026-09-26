<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📐 Flexbox 可视化</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- ============ 左栏：控制面板 ============ -->
          <div class="tool-col">
            <label class="tool-label">flex-direction：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="flexDirection" value="row" />
                <span>row</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="flexDirection" value="row-reverse" />
                <span>row-reverse</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="flexDirection" value="column" />
                <span>column</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="flexDirection" value="column-reverse" />
                <span>column-reverse</span>
              </label>
            </div>

            <label class="tool-label">flex-wrap：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="flexWrap" value="nowrap" />
                <span>nowrap</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="flexWrap" value="wrap" />
                <span>wrap</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="flexWrap" value="wrap-reverse" />
                <span>wrap-reverse</span>
              </label>
            </div>

            <label class="tool-label">justify-content：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="justifyContent" value="flex-start" />
                <span>flex-start</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="justifyContent" value="center" />
                <span>center</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="justifyContent" value="flex-end" />
                <span>flex-end</span>
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

            <label class="tool-label">align-items：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="alignItems" value="stretch" />
                <span>stretch</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignItems" value="flex-start" />
                <span>flex-start</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignItems" value="center" />
                <span>center</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignItems" value="flex-end" />
                <span>flex-end</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignItems" value="baseline" />
                <span>baseline</span>
              </label>
            </div>

            <label class="tool-label" v-if="flexWrap !== 'nowrap'">align-content：</label>
            <div class="radio-group" v-if="flexWrap !== 'nowrap'">
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="stretch" />
                <span>stretch</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="flex-start" />
                <span>flex-start</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="center" />
                <span>center</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="flex-end" />
                <span>flex-end</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="space-between" />
                <span>space-between</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="alignContent" value="space-around" />
                <span>space-around</span>
              </label>
            </div>

            <label class="tool-label">gap：{{ gap }}px</label>
            <input type="range" v-model.number="gap" min="0" max="60" class="range-input" />
            <div class="length-display"><span>{{ gap }}px</span></div>

            <label class="tool-label">项目（{{ items.length }} 个）：</label>
            <div class="items-list">
              <div v-for="(item, index) in items" :key="index" class="item-control">
                <span class="item-index">{{ index + 1 }}</span>
                <span class="item-color-dot" :style="{ background: itemColors[index % itemColors.length] }"></span>
                <label class="item-prop-label">flex-grow</label>
                <input
                  type="number"
                  v-model.number="item.flexGrow"
                  min="0"
                  max="10"
                  step="0.5"
                  class="item-number-input"
                />
                <button
                  v-if="items.length > 1"
                  class="item-remove-btn"
                  @click="removeItem(index)"
                  title="移除此项目"
                >✕</button>
              </div>
            </div>
            <button class="tool-button" style="margin-top:8px" @click="addItem">+ 添加项目</button>
          </div>

          <!-- ============ 右栏：预览 + CSS ============ -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="preview-wrapper">
              <div class="flex-container" :style="containerStyle">
                <div
                  v-for="(item, index) in items"
                  :key="index"
                  class="flex-item"
                  :style="getItemStyle(index)"
                >
                  <span class="item-num">{{ index + 1 }}</span>
                  <span class="item-grow-label">grow: {{ item.flexGrow }}</span>
                </div>
              </div>
            </div>

            <label class="tool-label">CSS 代码：</label>
            <textarea
              class="code-input output"
              :value="generatedCSS"
              readonly
              rows="10"
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
import { ref, reactive, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

// --- Container properties ---
const flexDirection = ref('row')
const flexWrap = ref('nowrap')
const justifyContent = ref('flex-start')
const alignItems = ref('stretch')
const alignContent = ref('stretch')
const gap = ref(8)

// --- Item colors ---
const itemColors = ['#9dff6b', '#6bcdff', '#ff9d6b', '#ff6bcd', '#ffe06b', '#6bffcd', '#cd6bff', '#ff6b6b']

// --- Items ---
const items = reactive([
  { flexGrow: 0 },
  { flexGrow: 0 },
  { flexGrow: 0 },
  { flexGrow: 0 },
])

// --- Status ---
const copyMsg = ref('')
const error = ref('')

// --- Container style ---
const containerStyle = computed(() => {
  const style = {
    display: 'flex',
    flexDirection: flexDirection.value,
    flexWrap: flexWrap.value,
    justifyContent: justifyContent.value,
    alignItems: alignItems.value,
    gap: `${gap.value}px`,
  }
  if (flexWrap.value !== 'nowrap') {
    style.alignContent = alignContent.value
  }
  return style
})

// --- Per-item style ---
function getItemStyle(index) {
  const item = items[index]
  const color = itemColors[index % itemColors.length]
  const isColumn = flexDirection.value.startsWith('column')
  return {
    flexGrow: item.flexGrow,
    borderColor: color,
    background: `${color}15`,
    color: color,
    minWidth: isColumn ? '100%' : `${40 + index * 15}px`,
    minHeight: isColumn ? `${25 + index * 10}px` : '100%',
  }
}

// --- Generated CSS ---
const generatedCSS = computed(() => {
  const lines = [`.flex-container {`]
  lines.push(`  display: flex;`)
  lines.push(`  flex-direction: ${flexDirection.value};`)
  lines.push(`  flex-wrap: ${flexWrap.value};`)
  lines.push(`  justify-content: ${justifyContent.value};`)
  lines.push(`  align-items: ${alignItems.value};`)
  if (flexWrap.value !== 'nowrap') {
    lines.push(`  align-content: ${alignContent.value};`)
  }
  lines.push(`  gap: ${gap.value}px;`)
  lines.push(`}`)

  // Generate item styles if any have flex-grow
  const growItems = items.filter(i => i.flexGrow > 0)
  if (growItems.length > 0) {
    lines.push('')
    lines.push(`.flex-item {`)
    lines.push(`  flex-grow: ${growItems[0].flexGrow};`)
    lines.push(`}`)
  }

  return lines.join('\n')
})

// --- Actions ---
function addItem() {
  items.push({ flexGrow: 0 })
}

function removeItem(index) {
  if (items.length <= 1) return
  items.splice(index, 1)
}

function resetAll() {
  flexDirection.value = 'row'
  flexWrap.value = 'nowrap'
  justifyContent.value = 'flex-start'
  alignItems.value = 'stretch'
  alignContent.value = 'stretch'
  gap.value = 8
  items.splice(0, items.length,
    { flexGrow: 0 },
    { flexGrow: 0 },
    { flexGrow: 0 },
    { flexGrow: 0 },
  )
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
  min-height: 220px;
  overflow: auto;
}

.flex-container {
  min-height: 210px;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 19px,
    rgba(157, 255, 107, 0.03) 19px,
    rgba(157, 255, 107, 0.03) 20px
  ),
  repeating-linear-gradient(
    90deg,
    transparent,
    transparent 19px,
    rgba(157, 255, 107, 0.03) 19px,
    rgba(157, 255, 107, 0.03) 20px
  );
  border-radius: 0;
}

.flex-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 2px solid;
  border-radius: 0;
  padding: 12px 18px;
  min-width: 40px;
  min-height: 36px;
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

.item-grow-label {
  font-size: 10px;
  opacity: 0.7;
}

/* === Items list in controls === */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.item-control {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 6px 8px;
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
  width: 12px;
  height: 12px;
  border-radius: 0;
  flex-shrink: 0;
}

.item-prop-label {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.item-number-input {
  width: 52px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--green);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  padding: 3px 6px;
  text-align: center;
  border-radius: 0;
}

.item-number-input:focus {
  outline: 0;
  border-color: var(--green);
}

.item-remove-btn {
  background: transparent;
  border: 1px solid var(--red);
  color: var(--red);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 7px;
  border-radius: 0;
  margin-left: auto;
  transition: all 0.15s;
}

.item-remove-btn:hover {
  background: var(--red);
  color: var(--bg);
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
  .flex-container {
    min-height: 180px;
  }

  .preview-wrapper {
    min-height: 190px;
  }

  .flex-item {
    padding: 8px 12px;
    min-width: 32px;
    min-height: 28px;
  }

  .item-num {
    font-size: 15px;
  }

  .item-grow-label {
    font-size: 9px;
  }

  .item-control {
    flex-wrap: wrap;
    gap: 6px;
  }
}
</style>
