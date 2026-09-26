<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎬 CSS 动画生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：控制面板 -->
          <div class="tool-col">
            <label class="tool-label">动画类型：</label>
            <div class="radio-group anim-type-group">
              <label class="radio-label">
                <input type="radio" v-model="animType" value="translate" />
                <span>平移</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="animType" value="rotate" />
                <span>旋转</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="animType" value="scale" />
                <span>缩放</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="animType" value="opacity" />
                <span>透明度</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="animType" value="color" />
                <span>颜色变化</span>
              </label>
            </div>

            <!-- 平移参数 -->
            <template v-if="animType === 'translate'">
              <label class="tool-label">X 轴位移：{{ translateX }}px</label>
              <input type="range" v-model.number="translateX" min="-200" max="200" class="range-input" />
              <div class="length-display"><span>{{ translateX }}px</span></div>

              <label class="tool-label">Y 轴位移：{{ translateY }}px</label>
              <input type="range" v-model.number="translateY" min="-200" max="200" class="range-input" />
              <div class="length-display"><span>{{ translateY }}px</span></div>
            </template>

            <!-- 旋转参数 -->
            <template v-if="animType === 'rotate'">
              <label class="tool-label">旋转角度：{{ rotateDeg }}deg</label>
              <input type="range" v-model.number="rotateDeg" min="0" max="720" class="range-input" />
              <div class="length-display"><span>{{ rotateDeg }}deg</span></div>

              <label class="checkbox-label" style="margin-top:10px">
                <input type="checkbox" v-model="rotate3d" />
                <span>3D 旋转 (X/Y/Z 轴独立)</span>
              </label>
              <template v-if="rotate3d">
                <label class="tool-label">X 轴：{{ rotateX }}deg</label>
                <input type="range" v-model.number="rotateX" min="0" max="360" class="range-input" />
                <div class="length-display"><span>{{ rotateX }}deg</span></div>

                <label class="tool-label">Y 轴：{{ rotateY }}deg</label>
                <input type="range" v-model.number="rotateY" min="0" max="360" class="range-input" />
                <div class="length-display"><span>{{ rotateY }}deg</span></div>

                <label class="tool-label">Z 轴：{{ rotateZ }}deg</label>
                <input type="range" v-model.number="rotateZ" min="0" max="360" class="range-input" />
                <div class="length-display"><span>{{ rotateZ }}deg</span></div>
              </template>
            </template>

            <!-- 缩放参数 -->
            <template v-if="animType === 'scale'">
              <label class="tool-label">缩放倍数：{{ scaleTo.toFixed(1) }}</label>
              <input type="range" v-model.number="scaleTo" min="0" max="3" step="0.1" class="range-input" />
              <div class="length-display"><span>{{ scaleTo.toFixed(1) }}x</span></div>
            </template>

            <!-- 透明度参数 -->
            <template v-if="animType === 'opacity'">
              <label class="tool-label">目标透明度：{{ opacityTo.toFixed(2) }}</label>
              <input type="range" v-model.number="opacityTo" min="0" max="1" step="0.05" class="range-input" />
              <div class="length-display"><span>{{ opacityTo.toFixed(2) }}</span></div>

              <label class="checkbox-label" style="margin-top:10px">
                <input type="checkbox" v-model="opacityPulse" />
                <span>脉冲模式（闪烁）</span>
              </label>
            </template>

            <!-- 颜色变化参数 -->
            <template v-if="animType === 'color'">
              <label class="tool-label">起始颜色：</label>
              <div class="color-row">
                <input type="color" v-model="colorFrom" class="color-picker" />
                <span class="color-hex">{{ colorFrom }}</span>
              </div>

              <label class="tool-label">目标颜色：</label>
              <div class="color-row">
                <input type="color" v-model="colorTo" class="color-picker" />
                <span class="color-hex">{{ colorTo }}</span>
              </div>
            </template>

            <div class="section-divider"></div>

            <!-- 时间控制 -->
            <label class="tool-label">持续时间：{{ duration }}s</label>
            <input type="range" v-model.number="duration" min="0.1" max="10" step="0.1" class="range-input" />
            <div class="length-display"><span>{{ duration }}s</span></div>

            <label class="tool-label">延迟时间：{{ delay }}s</label>
            <input type="range" v-model.number="delay" min="0" max="5" step="0.1" class="range-input" />
            <div class="length-display"><span>{{ delay }}s</span></div>

            <label class="tool-label">缓动函数：</label>
            <select v-model="easing" class="tool-select">
              <option value="ease">ease</option>
              <option value="linear">linear</option>
              <option value="ease-in">ease-in</option>
              <option value="ease-out">ease-out</option>
              <option value="ease-in-out">ease-in-out</option>
              <option value="cubic-bezier">cubic-bezier（自定义）</option>
            </select>

            <template v-if="easing === 'cubic-bezier'">
              <div class="bezier-inputs">
                <div class="bezier-field">
                  <label>p1.x</label>
                  <input type="number" v-model.number="cubicP1x" min="0" max="1" step="0.01" class="bezier-num" />
                </div>
                <div class="bezier-field">
                  <label>p1.y</label>
                  <input type="number" v-model.number="cubicP1y" min="-1" max="2" step="0.01" class="bezier-num" />
                </div>
                <div class="bezier-field">
                  <label>p2.x</label>
                  <input type="number" v-model.number="cubicP2x" min="0" max="1" step="0.01" class="bezier-num" />
                </div>
                <div class="bezier-field">
                  <label>p2.y</label>
                  <input type="number" v-model.number="cubicP2y" min="-1" max="2" step="0.01" class="bezier-num" />
                </div>
              </div>
            </template>

            <label class="tool-label">循环次数：</label>
            <div class="iteration-row">
              <label class="radio-label">
                <input type="radio" v-model="iterationMode" value="finite" />
                <span>次数</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="iterationMode" value="infinite" />
                <span>无限</span>
              </label>
              <input
                v-if="iterationMode === 'finite'"
                type="number"
                v-model.number="iterations"
                min="1"
                max="100"
                class="iteration-num"
              />
            </div>

            <label class="tool-label">方向：</label>
            <select v-model="direction" class="tool-select">
              <option value="normal">normal</option>
              <option value="reverse">reverse</option>
              <option value="alternate">alternate</option>
              <option value="alternate-reverse">alternate-reverse</option>
            </select>

            <label class="tool-label">填充模式：</label>
            <select v-model="fillMode" class="tool-select">
              <option value="none">none</option>
              <option value="forwards">forwards</option>
              <option value="backwards">backwards</option>
              <option value="both">both</option>
            </select>
          </div>

          <!-- 右栏：预览 + CSS 代码 -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="preview-wrapper">
              <div class="preview-element" :class="{ 'anim-running': isPlaying }" :style="previewStyle"></div>
              <div class="preview-label">{{ animTypeLabel }}</div>
            </div>

            <div class="button-group button-group-3" style="margin-top:8px">
              <button class="tool-button primary" @click="togglePlay">
                {{ isPlaying ? '⏸️ 暂停' : '▶️ 播放' }}
              </button>
              <button class="tool-button" @click="restartAnim">🔄 重播</button>
              <button class="tool-button" @click="randomAnim">🎲 随机</button>
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
              <button class="tool-button" @click="copyKeyframes">📋 仅复制 @keyframes</button>
            </div>

            <div v-if="copyMsg" class="status-success" style="margin-top:8px">{{ copyMsg }}</div>
            <div v-if="error" class="status-error" style="margin-top:8px">{{ error }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { copyText } from '../../utils/clipboard'

// Animation type
const animType = ref('translate')

// Translate params
const translateX = ref(50)
const translateY = ref(0)

// Rotate params
const rotateDeg = ref(360)
const rotate3d = ref(false)
const rotateX = ref(360)
const rotateY = ref(180)
const rotateZ = ref(0)

// Scale params
const scaleTo = ref(1.5)

// Opacity params
const opacityTo = ref(0.2)
const opacityPulse = ref(false)

// Color params
const colorFrom = ref('#ff6b6b')
const colorTo = ref('#4ecdc4')

// Timing
const duration = ref(1)
const delay = ref(0)
const easing = ref('ease')
const cubicP1x = ref(0.25)
const cubicP1y = ref(0.1)
const cubicP2x = ref(0.25)
const cubicP2y = ref(1)
const iterationMode = ref('infinite')
const iterations = ref(1)
const direction = ref('normal')
const fillMode = ref('none')

// Playback
const isPlaying = ref(true)
const animKey = ref(0)
const copyMsg = ref('')
const error = ref('')

// Keyframes animation name (unique per key change)
const animName = computed(() => `kf-${animType.value}-${animKey.value}`)

const animTypeLabel = computed(() => {
  const labels = {
    translate: '平移',
    rotate: '旋转',
    scale: '缩放',
    opacity: '透明度',
    color: '颜色变化'
  }
  return labels[animType.value] || animType.value
})

const easingValue = computed(() => {
  if (easing.value === 'cubic-bezier') {
    return `cubic-bezier(${cubicP1x.value}, ${cubicP1y.value}, ${cubicP2x.value}, ${cubicP2y.value})`
  }
  return easing.value
})

const iterationValue = computed(() => {
  return iterationMode.value === 'infinite' ? 'infinite' : iterations.value
})

const keyframesCSS = computed(() => {
  const name = `kf-${animType.value}-${animKey.value}`
  switch (animType.value) {
    case 'translate':
      return `@keyframes ${name} {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(${translateX.value}px, ${translateY.value}px);
  }
}`
    case 'rotate':
      if (rotate3d.value) {
        return `@keyframes ${name} {
  from {
    transform: rotate3d(0, 0, 0, 0deg);
  }
  to {
    transform: rotate3d(1, 1, 1, 360deg);
  }
}`
      }
      return `@keyframes ${name} {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(${rotateDeg.value}deg);
  }
}`
    case 'scale':
      return `@keyframes ${name} {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(${scaleTo.value});
  }
}`
    case 'opacity':
      if (opacityPulse.value) {
        return `@keyframes ${name} {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: ${opacityTo.value};
  }
}`
      }
      return `@keyframes ${name} {
  from {
    opacity: 1;
  }
  to {
    opacity: ${opacityTo.value};
  }
}`
    case 'color':
      return `@keyframes ${name} {
  from {
    background-color: ${colorFrom.value};
  }
  to {
    background-color: ${colorTo.value};
  }
}`
    default:
      return ''
  }
})

const animationCSS = computed(() => {
  if (!keyframesCSS.value) return ''
  return `  animation: ${animName.value} ${duration.value}s ${easingValue.value} ${delay.value}s ${iterationValue.value} ${direction.value} ${fillMode.value};`
})

const generatedCSS = computed(() => {
  let css = ''
  css += `.element {\n`
  if (animType.value === 'color') {
    css += `  background-color: ${colorFrom.value};\n`
  }
  css += animationCSS.value
  css += `\n}\n\n`
  css += keyframesCSS.value
  return css
})

// Preview element inline style
const previewStyle = computed(() => {
  const style = {
    animation: `${animName.value} ${duration.value}s ${easingValue.value} ${delay.value}s ${iterationValue.value} ${direction.value} ${fillMode.value}`
  }
  if (animType.value === 'color') {
    style.backgroundColor = colorFrom.value
  }
  return style
})

// Style element ref for injecting keyframes
let styleEl = null

function injectKeyframes() {
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.setAttribute('id', 'css-animation-keyframes')
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = keyframesCSS.value
}

function removeKeyframes() {
  if (styleEl) {
    styleEl.remove()
    styleEl = null
  }
}

function restartAnim() {
  animKey.value++
  nextTick(() => {
    injectKeyframes()
    isPlaying.value = true
  })
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
}

function randomAnim() {
  const types = ['translate', 'rotate', 'scale', 'opacity', 'color']
  animType.value = types[Math.floor(Math.random() * types.length)]
  translateX.value = Math.floor(Math.random() * 200) - 100
  translateY.value = Math.floor(Math.random() * 200) - 100
  rotateDeg.value = Math.floor(Math.random() * 720)
  scaleTo.value = +(0.5 + Math.random() * 2.5).toFixed(1)
  opacityTo.value = +(Math.random() * 0.8 + 0.1).toFixed(2)
  colorFrom.value = randomHex()
  colorTo.value = randomHex()
  duration.value = +(0.3 + Math.random() * 3).toFixed(1)
  delay.value = Math.floor(Math.random() * 2)
  const easings = ['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out']
  easing.value = easings[Math.floor(Math.random() * easings.length)]
  iterationMode.value = Math.random() > 0.5 ? 'infinite' : 'finite'
  iterations.value = Math.floor(Math.random() * 5) + 1
  direction.value = Math.random() > 0.5 ? 'alternate' : 'normal'
  restartAnim()
}

function randomHex() {
  const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
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

async function copyKeyframes() {
  try {
    await copyText(keyframesCSS.value)
    copyMsg.value = '✅ @keyframes 已复制到剪贴板'
    setTimeout(() => { copyMsg.value = '' }, 2000)
  } catch {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 3000)
  }
}

// Watch for changes to update keyframes
watch([keyframesCSS, animKey], () => {
  injectKeyframes()
})

// Pause/resume animation
watch(isPlaying, (playing) => {
  if (styleEl) {
    if (playing) {
      // Re-inject to restart
      injectKeyframes()
    }
  }
})

onMounted(() => {
  injectKeyframes()
})

onUnmounted(() => {
  removeKeyframes()
})
</script>

<style scoped>
.anim-type-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.section-divider {
  border-top: 1px solid var(--line);
  margin: 16px 0;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker {
  width: 36px;
  height: 30px;
  border: 1px solid var(--green);
  background: transparent;
  cursor: pointer;
  padding: 0;
  border-radius: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 0;
}

.color-hex {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  color: var(--text-dim, var(--muted));
}

.tool-select {
  width: 100%;
  padding: 8px 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  border-radius: 0;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239dff6b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.tool-select:focus {
  border-color: var(--green);
  box-shadow: 0 0 8px var(--green-glow);
}

.length-display {
  margin-top: 4px;
}

.length-display span {
  font-family: 'MapleMono NF CN', monospace;
  color: var(--green);
  font-size: 13px;
}

.preview-wrapper {
  width: 100%;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--panel-2);
  border: 2px solid var(--line);
  border-radius: 0;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.preview-element {
  width: 100px;
  height: 100px;
  background: var(--green);
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 11px;
  font-weight: bold;
}

.anim-running .preview-element {
  animation-play-state: running;
}

.preview-wrapper:not(:has(.anim-running)) .preview-element,
.preview-element:not([style*="animation"]) {
  animation-play-state: paused;
}

.preview-label {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.iteration-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.iteration-num {
  width: 64px;
  padding: 4px 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  border-radius: 0;
  outline: none;
}

.iteration-num:focus {
  border-color: var(--green);
}

.bezier-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 6px;
}

.bezier-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bezier-field label {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
}

.bezier-num {
  width: 100%;
  padding: 4px 6px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 12px;
  border-radius: 0;
  outline: none;
}

.bezier-num:focus {
  border-color: var(--green);
}

@media (max-width: 900px) {
  .preview-wrapper {
    min-height: 180px;
    padding: 20px;
  }
  .preview-element {
    width: 80px;
    height: 80px;
  }
  .anim-type-group {
    gap: 4px;
  }
}

@media (max-width: 640px) {
  .bezier-inputs {
    grid-template-columns: 1fr;
  }
}
</style>
