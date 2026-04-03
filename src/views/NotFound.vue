<template>
  <div class="not-found">
    <!-- Topbar -->
    <Topbar toolCount="0" />

    <!-- 404 Pong Game -->
    <section class="pane">
      <div class="pane-body">
        <!-- 初始 404 视图（游戏开始前显示） -->
        <div v-if="!gameStarted" class="fake-404">
          <span class="digit digit-4 fake-left" ref="dragFour" @mousedown="initDrag" @touchstart="initDrag">4</span>
          <span class="digit fake-zero">0</span>
          <span class="digit fake-right">4</span>
        </div>
        
        <!-- 游戏容器（一直存在，但初始隐藏） -->
        <div class="game-container" ref="gameContainer" :style="{ opacity: gameStarted ? 1 : 0, pointerEvents: gameStarted ? 'auto' : 'none' }">
          <div class="pong-game">
            <div 
              class="paddle player" 
              ref="playerPaddle"
              @mousedown="startDrag"
              @touchstart="startDrag"
            >4</div>
            <div class="ball" ref="ball">0</div>
            <div class="paddle ai" ref="aiPaddle">4</div>
          </div>
          
          <!-- Score -->
          <div class="score" v-if="gameStarted && !gameOver">
            <span>玩家：{{ playerScore }}</span>
            <span>AI: {{ aiScore }}</span>
          </div>
          
          <!-- Game Over Message -->
          <div v-if="gameOver" class="game-over">
            <p>页面找不到，但游戏可以继续！</p>
            <a href="/" class="restart-btn">← 返回首页</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // 中文终端工具站</span>
      <span>纯前端 · 无追踪 · 开源</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../components/Topbar.vue'

export default {
  name: 'NotFound',
  components: {
    Topbar
  },
  data() {
    return {
      gameStarted: false,
      gameOver: false,
      playerScore: 0,
      aiScore: 0,
      // 使用像素坐标（参考 GPT 样例）
      ballX: 0,
      ballY: 0,
      vx: 5.2,
      vy: 3.3,
      playerY: 0,
      aiY: 0,
      paddleHeight: 180,
      paddleWidth: 72,
      ballRadius: 27,
      animationId: null,
      isDragging: false,
      gameTriggered: false,
      dragStartY: 0,
      containerHeight: 400,
      containerWidth: 800,
      playerDragging: false,
      playerTargetY: 0
    }
  },
  mounted() {
    this.updateContainerSize()
    window.addEventListener('resize', this.updateContainerSize)
  },
  beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    window.removeEventListener('resize', this.updateContainerSize)
  },
  methods: {
    updateContainerSize() {
      if (this.$refs.gameContainer) {
        const rect = this.$refs.gameContainer.getBoundingClientRect()
        this.containerHeight = rect.height
        this.containerWidth = rect.width
        // 初始化位置
        if (!this.gameStarted) {
          this.playerY = this.containerHeight / 2
          this.aiY = this.containerHeight / 2
          this.ballX = this.containerWidth / 2
          this.ballY = this.containerHeight / 2
          this.updatePositions()
        }
      }
    },
    resetBall() {
      this.ballX = this.containerWidth / 2
      this.ballY = this.containerHeight / 2
      this.vx = Math.random() > 0.5 ? 5.2 : -5.2
      this.vy = (Math.random() * 2 - 1) * 3.6
    },
    clamp(v, min, max) {
      return Math.max(min, Math.min(max, v))
    },
    bounceOffPaddle(paddleX, paddleY, isLeft) {
      const hit =
        this.ballY + this.ballRadius > paddleY - this.paddleHeight / 2 &&
        this.ballY - this.ballRadius < paddleY + this.paddleHeight / 2
      if (!hit) return false

      if (isLeft && this.ballX - this.ballRadius <= paddleX + this.paddleWidth) {
        this.ballX = paddleX + this.paddleWidth + this.ballRadius + 1
        this.vx = Math.abs(this.vx) + 0.35
        this.playerScore += 1
      } else if (!isLeft && this.ballX + this.ballRadius >= paddleX) {
        this.ballX = paddleX - this.ballRadius - 1
        this.vx = -Math.abs(this.vx) - 0.35
        this.playerScore += 1
      } else {
        return false
      }

      const offset = (this.ballY - paddleY) / (this.paddleHeight / 2)
      this.vy += offset * 1.4
      return true
    },
    gameLoop() {
      if (this.gameOver) return
      
      // 更新场地尺寸
      this.updateContainerSize()
      
      // 玩家球拍跟随
      if (this.playerDragging) {
        this.playerY = this.clamp(this.playerTargetY, 90, this.containerHeight - 90)
      }
      
      // AI 跟随球
      this.aiY += (this.ballY - this.aiY) * 0.075
      this.aiY = this.clamp(this.aiY, 90, this.containerHeight - 90)
      
      // 更新球位置
      this.ballX += this.vx
      this.ballY += this.vy
      
      // 边界反弹（上下）
      if (this.ballY <= this.ballRadius) {
        this.ballY = this.ballRadius
        this.vy = Math.abs(this.vy)
      }
      if (this.ballY >= this.containerHeight - this.ballRadius) {
        this.ballY = this.containerHeight - this.ballRadius
        this.vy = -Math.abs(this.vy)
      }
      
      // 球拍碰撞检测
      const leftPaddleX = 28
      const rightPaddleX = this.containerWidth - 28 - this.paddleWidth
      this.bounceOffPaddle(leftPaddleX, this.playerY, true)
      this.bounceOffPaddle(rightPaddleX, this.aiY, false)
      
      // 出界检测 - 重置回合
      if (this.ballX < -80 || this.ballX > this.containerWidth + 80) {
        this.ballX = this.containerWidth / 2
        this.ballY = this.containerHeight / 2
        this.vx = (this.ballX < 0 ? 1 : -1) * (4.6 + Math.random() * 1.2)
        this.vy = (Math.random() * 2 - 1) * 3.2
      }
      
      // 更新 DOM 位置
      this.updatePositions()
      
      // 下一帧
      this.animationId = requestAnimationFrame(() => this.gameLoop())
    },
    updatePositions() {
      if (this.$refs.playerPaddle) {
        this.$refs.playerPaddle.style.top = this.playerY + 'px'
      }
      if (this.$refs.aiPaddle) {
        this.$refs.aiPaddle.style.top = this.aiY + 'px'
      }
      if (this.$refs.ball) {
        this.$refs.ball.style.left = this.ballX + 'px'
        this.$refs.ball.style.top = this.ballY + 'px'
      }
    },
    startDrag(e) {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      
      if (!this.gameStarted && !this.gameTriggered) {
        // 拖动触发游戏
        this.gameTriggered = true
        this.gameStarted = true
        this.isDragging = true
        this.playerDragging = true
        this.dragStartY = clientY
        this.playerTargetY = clientY
        
        document.addEventListener('mousemove', this.handleDrag)
        document.addEventListener('mouseup', this.endDrag)
        document.addEventListener('touchmove', this.handleDrag, { passive: false })
        document.addEventListener('touchend', this.endDrag)
        e.preventDefault()
        
        this.resetBall()
        this.gameLoop()
      } else if (this.gameStarted && !this.gameOver) {
        // 游戏中拖动球拍
        this.playerDragging = true
        const container = this.$refs.gameContainer
        if (container) {
          const rect = container.getBoundingClientRect()
          this.playerTargetY = clientY - rect.top
        }
        
        document.addEventListener('mousemove', this.handleDrag)
        document.addEventListener('mouseup', this.endDrag)
        document.addEventListener('touchmove', this.handleDrag, { passive: false })
        document.addEventListener('touchend', this.endDrag)
        e.preventDefault()
      }
    },
    initDrag(e) {
      // 初始 404 页面的 "4" 拖动触发
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      
      if (!this.gameStarted && !this.gameTriggered) {
        this.gameTriggered = true
        this.gameStarted = true
        this.dragStartY = clientY
        this.isDragging = true
        this.playerDragging = true
        this.playerTargetY = clientY
        
        document.addEventListener('mousemove', this.handleDrag)
        document.addEventListener('mouseup', this.endDrag)
        document.addEventListener('touchmove', this.handleDrag, { passive: false })
        document.addEventListener('touchend', this.endDrag)
        e.preventDefault()
        
        this.resetBall()
        this.gameLoop()
      }
    },
    handleDrag(e) {
      if (!this.isDragging) return
      e.preventDefault()
      
      if (this.gameStarted && !this.gameOver) {
        const container = this.$refs.gameContainer
        if (container) {
          const rect = container.getBoundingClientRect()
          const clientY = e.touches ? e.touches[0].clientY : e.clientY
          this.playerTargetY = clientY - rect.top
        }
      }
    },
    endDrag() {
      this.isDragging = false
      this.playerDragging = false
      document.removeEventListener('mousemove', this.handleDrag)
      document.removeEventListener('mouseup', this.endDrag)
      document.removeEventListener('touchmove', this.handleDrag)
      document.removeEventListener('touchend', this.endDrag)
    }
  }
}
</script>

<style scoped>
@import '../assets/styles.css';

.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* === Pane === */
.pane {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: var(--card-bg-gradient), var(--card-bg);
  box-shadow: var(--card-shadow);
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.pane-body {
  padding: 2rem;
  width: 100%;
  max-width: 100%;
  position: relative;
}

/* === Fake 404 Display === */
.fake-404 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 8rem;
  font-weight: 900;
  margin-bottom: 2rem;
  user-select: none;
}

.digit {
  display: inline-grid;
  place-items: center;
  width: 1em;
  height: 1em;
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05));
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}

.fake-left {
  cursor: grab;
  touch-action: none;
  transform-origin: center;
  transition: transform .18s ease, box-shadow .18s ease;
}
.fake-left:active { cursor: grabbing; }
.fake-left.dragging {
  transform: scale(1.08) rotate(-8deg);
  box-shadow: 0 12px 28px rgba(138,180,255,0.25);
}

/* === Game Container === */
.game-container {
  width: 100%;
  height: 400px;
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  transition: opacity 0.3s ease;
}

/* === Pong Game === */
.pong-game {
  width: 100%;
  height: 100%;
  position: relative;
}

.paddle {
  position: absolute;
  font-family: var(--mono);
  font-size: 3rem;
  font-weight: 700;
  color: var(--accent);
  width: 72px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  left: 28px;
  top: 200px;
  transform: translateY(-50%);
  will-change: top;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08));
  border: 1px solid rgba(255,255,255,0.16);
}

.paddle:active {
  cursor: grabbing;
}

.paddle.ai {
  left: auto;
  right: 28px;
  color: var(--text-dim);
  cursor: default;
}

.ball {
  position: absolute;
  font-family: var(--mono);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--green);
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  left: 400px;
  top: 200px;
  transform: translate(-50%, -50%);
  text-shadow: 0 0 10px var(--green-glow);
  will-change: left, top;
  border-radius: 50%;
  background: radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), #dfe7ff 48%, #a8b7ef 100%);
  box-shadow: 0 10px 30px rgba(0,0,0,0.28);
}

/* === Score === */
.score {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 40px;
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text-dim);
  z-index: 10;
}

/* === Game Over === */
.game-over {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(0, 0, 0, 0.9);
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid var(--line);
  z-index: 20;
}

.game-over p {
  font-family: var(--mono);
  font-size: 16px;
  color: var(--text);
  margin-bottom: 1.5rem;
}

.restart-btn {
  display: inline-block;
  border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.02);
  color: var(--accent);
  padding: 12px 24px;
  font-family: var(--mono);
  font-size: 13px;
  text-decoration: none;
  text-transform: uppercase;
  transition: all 0.2s;
}

.restart-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 20px var(--green-glow);
  color: var(--green);
}

/* === Responsive === */
@media (max-width: 640px) {
  .pane-body {
    padding: 1rem;
  }
  
  .game-container {
    height: 300px;
  }
  
  .fake-404 {
    font-size: 5rem;
  }
  
  .paddle {
    font-size: 2rem;
    width: 58px;
    height: 150px;
  }
  
  .ball {
    font-size: 2rem;
    width: 42px;
    height: 42px;
  }
}

@media (max-width: 375px) {
  .game-container {
    height: 250px;
  }
  
  .fake-404 {
    font-size: 4rem;
  }
  
  .paddle {
    font-size: 1.5rem;
    width: 50px;
    height: 120px;
  }
  
  .ball {
    font-size: 1.5rem;
    width: 35px;
    height: 35px;
  }
}
</style>
