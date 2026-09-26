<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>像素头像生成器</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <div class="canvas-wrapper">
                <canvas
                  id="avatarCanvas"
                  ref="avatarCanvas"
                  :width="canvasSize"
                  :height="canvasSize"
                ></canvas>
              </div>
            </div>
            <div class="tool-col">
              <div class="controls-section">
            <!-- 网格大小 -->
            <label class="tool-label">网格大小 ({{ gridSize }}x{{ gridSize }}):</label>
            <div class="slider-wrapper">
              <input 
                type="range" 
                v-model.number="gridSize" 
                min="4" 
                max="20" 
                class="range-input"
                @input="generatePattern"
              />
              <span class="range-value">{{ gridSize }}</span>
            </div>

            <!-- 背景色选择 -->
            <label class="tool-label">背景色:</label>
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
            <label class="tool-label">色调:</label>
            <div class="hue-slider-wrapper">
              <input 
                type="range" 
                v-model.number="hue" 
                min="0" 
                max="360" 
                class="range-input hue-input"
                @input="renderAvatar"
              />
              <div class="hue-preview" :style="{ backgroundColor: `hsl(${hue}, 80%, 60%)` }"></div>
            </div>
          </div>
            </div>
          </div>

          <!-- 按钮组 -->
          <div class="button-group button-group-2">
            <button class="tool-button primary" @click="generatePattern">
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
</template>

<script>

export default {
  name: 'AvatarTool',
  components: {},
  data() {
    return {
      canvasSize: 320,
      gridSize: 10,
      bgColor: '#1a1a1a',
      hue: Math.floor(Math.random() * 360),
      status: '',
      bgColors: ['#000000', '#1a1a1a', '#2d2d2d', '#0a0a0a', '#1e1e2e'],
      pattern: [] // 保存每个格子的状态 [x][y] = true/false
    }
  },
  computed: {
    pixelSize() {
      return this.canvasSize / this.gridSize
    }
  },
  mounted() {
    this.generatePattern()
  },
  methods: {
    setBgColor(color) {
      this.bgColor = color
      this.renderAvatar()
    },
    generatePattern() {
      // 生成新的随机图案数据
      this.pattern = []
      const halfGrid = Math.ceil(this.gridSize / 2)
      
      for (let x = 0; x < halfGrid; x++) {
        this.pattern[x] = []
        for (let y = 0; y < this.gridSize; y++) {
          // 50% 概率该格子被填充
          this.pattern[x][y] = Math.random() > 0.5
        }
      }
      
      // 重新渲染
      this.renderAvatar()
    },
    renderAvatar() {
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
      
      // 根据保存的 pattern 数据绘制
      for (let x = 0; x < halfGrid; x++) {
        for (let y = 0; y < this.gridSize; y++) {
          // 如果格子被填充
          if (this.pattern[x] && this.pattern[x][y]) {
            // 使用整数坐标避免亚像素缝隙
            const x1 = Math.floor(x * pixelSize)
            const y1 = Math.floor(y * pixelSize)
            const x2 = Math.floor((this.gridSize - 1 - x) * pixelSize)
            const size = Math.ceil(pixelSize)
            
            // 绘制左半边
            ctx.fillRect(x1, y1, size, size)
            // 绘制右半边（镜像对称）
            ctx.fillRect(x2, y1, size, size)
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
  background: var(--panel);
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

/* === 色相滑动条特殊背景 (组件特有) === */
.hue-input::-webkit-slider-runnable-track {
  background: linear-gradient(to right, 
    #ff0000, #ffff00, #00ff00, 
    #00ffff, #0000ff, #ff00ff, #ff0000);
}

.hue-input::-moz-range-track {
  background: linear-gradient(to right, 
    #ff0000, #ffff00, #00ff00, 
    #00ffff, #0000ff, #ff00ff, #ff0000);
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

.hue-preview {
  width: 32px; height: 32px;
  border: 2px solid var(--line);
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