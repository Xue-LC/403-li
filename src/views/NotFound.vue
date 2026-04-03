<template>
  <div class="not-found">
    <!-- Topbar -->
    <Topbar toolCount="0" />

    <!-- 404 Pong Game -->
    <section class="pane">
      <div class="pane-body">
        <!-- Game Container -->
        <div class="game-container" ref="gameContainer">
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
          
          <!-- Score (hidden before game starts) -->
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
        
        <!-- Bottom Info -->
        <div class="bottom-info">
          <p class="error-text">页面不存在</p>
          <button @click="goBack" class="back-btn">← 返回上页</button>
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
      dragStartY: 0,
      gameTriggered: false,
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
        }
      }
    },
    goBack() {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.location.href = '/'
      }
    },
    startDrag(e) {
      if (!this.gameStarted && !this.gameTriggered) {
        // 拖动触发游戏
        this.gameTriggered = true
        this.gameStarted = true
        this.isDragging = true
        this.playerDragging = true
        this.dragStartY = e.touches ? e.touches[0].clientY : e.clientY
        this.playerTargetY = this.dragStartY
        
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
        const clientY = e.touches ? e.touches[0].clientY : e.clientY
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
    handleDrag(e) {
      if (!this.playerDragging) return
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
      this.playerDragging = false
      document.removeEventListener('mousemove', this.handleDrag)
      document.removeEventListener('mouseup', this.endDrag)
      document.removeEventListener('touchmove', this.handleDrag)
      document.removeEventListener('touchend', this.endDrag)
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
      } else if (!isLeft && this.ballX + this.ballRadius >= paddleX) {
        this.ballX = paddleX - this.ballRadius - 1
        this.vx = -Math.abs(this.vx) - 0.35
      } else {
        return false
      }

      const offset = (this.ballY - paddleY) / (this.paddleHeight / 2)
      this.vy += offset * 1.4
      this.playerScore += 1
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
      const container = this.$refs.gameContainer
      if (container) {
        container.style.setProperty('--player-y-px', `${this.playerY}px`)
        container.style.setProperty('--ai-y-px', `${this.aiY}px`)
        container.style.setProperty('--ball-x-px', `${this.ballX}px`)
        container.style.setProperty('--ball-y-px', `${this.ballY}px`)
      }
    }
  }
}
</script>

<style scoped>
@import '../assets/styles.css';

.pane {
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
  width: 50px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  left: 28px;
  top: var(--player-y-px, 200px);
  transform: translateY(-50%);
  will-change: top;
}

.paddle:active {
  cursor: grabbing;
}

.paddle.ai {
  left: auto;
  right: 28px;
  color: var(--text-dim);
  cursor: default;
  top: var(--ai-y-px, 200px);
}

.ball {
  position: absolute;
  font-family: var(--mono);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--green);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  left: var(--ball-x-px, 400px);
  top: var(--ball-y-px, 200px);
  transform: translate(-50%, -50%);
  text-shadow: 0 0 10px var(--green-glow);
  will-change: left, top;
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

/* === Bottom Info === */
.bottom-info {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-text {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text-dim);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.back-btn {
  display: inline-block;
  border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.02);
  color: var(--accent);
  padding: 10px 20px;
  font-family: var(--mono);
  font-size: 13px;
  text-decoration: none;
  text-transform: uppercase;
  transition: all 0.2s;
  cursor: pointer;
}

.back-btn:hover {
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
  
  .paddle {
    font-size: 2rem;
    width: 40px;
    height: 50px;
  }
  
  .ball {
    font-size: 2rem;
    width: 35px;
    height: 35px;
  }
}

@media (max-width: 375px) {
  .game-container {
    height: 250px;
  }
  
  .paddle {
    font-size: 1.5rem;
    width: 35px;
    height: 45px;
  }
  
  .ball {
    font-size: 1.5rem;
    width: 30px;
    height: 30px;
  }
}
</style>
