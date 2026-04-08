<template>
  <div class="avatar-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>像素头像生成器</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <!-- Canvas 预览 -->
          <div class="canvas-wrapper">
            <canvas 
              id="avatarCanvas" 
              ref="avatarCanvas"
              :width="canvasSize" 
              :height="canvasSize"
            ></canvas>
          </div>

          <!-- 控制面板 -->
          <div class="controls-section">
            <!-- 网格大小 -->
            <label class="input-label">网格大小 ({{ gridSize }}x{{ gridSize }}):</label>
            <div class="slider-wrapper">
              <input 
                type="range" 
                v-model.number="gridSize" 
                min="4" 
                max="20" 
                class="range-slider"
                @input="generateAvatar"
              />
              <span class="range-value">{{ gridSize }}</span>
            </div>

            <!-- 背景色选择 -->
            <label class="input-label">背景色:</label>
            <div class="color-options">
              <button 
                v-for="color in bgColors" 
                :key="color"
                :class="['color-btn', { active: bgColor === color }]"
                :style="{ backgroundColor: color }"
                @click="setBgColor(color)"
              ></button>
            </div>

            <!-- 前景色调 -->
            <label class="input-label">色调:</label>
            <div class="hue-slider-wrapper">
              <input 
                type="range" 
                v-model.number="hue" 
                min="0" 
                max="360" 
                class="hue-range"
                @input="generateAvatar"
              />
              <div class="hue-preview" :style="{ backgroundColor: `hsl(${hue}, 80%, 60%)` }"></div>
            </div>
          </div>

          <!-- 按钮组 -->
          <div class="button-group button-group-2">
            <button class="tool-button primary" @click="generateAvatar">
              [ 生成 / GENERATE ]
            </button>
            <button class="tool-button" @click="downloadAvatar">
              [ 下载 / DOWNLOAD ]
            </button>
          </div>

          <div v-if="status" class="status-success">{{ status }}</div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // 像素头像生成器</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../../components/Topbar.vue'

export default {
  name: 'AvatarTool',
  components: {
    Topbar
  },
  data() {
    return {
      canvasSize: 320,
      gridSize: 10,
      bgColor: '#1a1a1a',
      hue: Math.floor(Math.random() * 360),
      status: '',
      bgColors: ['#000000', '#1a1a1a', '#2d2d2d', '#0a0a0a', '#1e1e2e']
    }
  },
  computed: {
    pixelSize() {
      return this.canvasSize / this.gridSize
    }
  },
  mounted() {
    this.generateAvatar()
  },
  methods: {
    setBgColor(color) {
      this.bgColor = color
      this.generateAvatar()
    },
    generateAvatar() {
      const canvas = this.$refs.avatarCanvas
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      
      // 清空画布并填充背景
      ctx.fillStyle = this.bgColor
      ctx.fillRect(0, 0, this.canvasSize, this.canvasSize)
      
      // 使用当前色调
      const color = `hsl(${this.hue}, 80%, 60%)`
      ctx.fillStyle = color
      
      const pixelSize = this.pixelSize
      const halfGrid = Math.ceil(this.gridSize / 2)
      
      // 生成左半边并镜像到右半边
      for (let x = 0; x < halfGrid; x++) {
        for (let y = 0; y < this.gridSize; y++) {
          // 50% 概率绘制该像素块
          if (Math.random() > 0.5) {
            // 绘制左半边
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
            // 绘制右半边（镜像对称）
            const mirrorX = this.gridSize - 1 - x
            ctx.fillRect(mirrorX * pixelSize, y * pixelSize, pixelSize, pixelSize)
          }
        }
      }
      
      this.status = ''
    },
    downloadAvatar() {
      const canvas = this.$refs.avatarCanvas
      if (!canvas) return
      
      const dataURL = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `avatar_${Date.now()}.png`
      link.href = dataURL
      link.click()
      
      this.status = '头像已下载'
      setTimeout(() => {
        this.status = ''
      }, 2000)
    }
  }
}
</script>

<style scoped>
@import '../../assets/styles/index.css';
@import '../../assets/styles/tools.css';

.avatar-tool {
  width: min(var(--max), calc(100vw - 16px));
  margin: 0 auto;
  padding: 12px 0 20px;
}

.pane {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: var(--card-bg-gradient), var(--card-bg);
  box-shadow: var(--card-shadow);
  position: relative;
}

.pane::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: var(--card-top-line);
  opacity: 0.5;
}

.pane-head {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  background: rgba(18,22,27,0.94);
}

.pane-body { padding: 12px; }
.tool-body { margin-top: 1.5rem; }

.canvas-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

canvas {
  background-color: #1a1a1a;
  border: 2px solid var(--line);
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);
  max-width: 100%;
}

.controls-section { margin-bottom: 1.5rem; }

.input-label {
  color: var(--green);
  display: block;
  margin-bottom: 0.75rem;
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
}

.range-slider {
  flex: 1;
  height: 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px; height: 18px;
  background: var(--green);
  border: 2px solid var(--text);
  cursor: pointer;
}

.range-slider::-moz-range-thumb {
  width: 18px; height: 18px;
  background: var(--green);
  border: 2px solid var(--text);
  cursor: pointer;
}

.range-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  min-width: 24px;
  text-align: center;
}

.color-options {
  display: flex;
  gap: 10px;
  margin-bottom: 1rem;
}

.color-btn {
  width: 32px; height: 32px;
  border: 2px solid var(--line);
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
  border-color: var(--green);
}

.color-btn.active {
  border-color: var(--green);
  box-shadow: 0 0 10px var(--green-glow);
}

.hue-slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hue-range {
  flex: 1;
  height: 12px;
  background: linear-gradient(to right, 
    #ff0000, #ffff00, #00ff00, 
    #00ffff, #0000ff, #ff00ff, #ff0000);
  border: 1px solid var(--line);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.hue-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px; height: 20px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
}

.hue-range::-moz-range-thumb {
  width: 20px; height: 20px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
}

.hue-preview {
  width: 32px; height: 32px;
  border: 2px solid var(--line);
}

.footer {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--dim);
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .avatar-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  .pane-body { padding: 10px; }
  canvas { width: 280px; height: 280px; }
  .color-options { flex-wrap: wrap; }
}

@media (max-width: 375px) {
  canvas { width: 260px; height: 260px; }
  .input-label { font-size: 12px; }
}
</style>