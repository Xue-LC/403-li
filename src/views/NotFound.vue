<template>
  <div class="not-found">
    <!-- Topbar -->
    <Topbar toolCount="0" />

    <!-- 404 Pong Game -->
    <section class="pane">
      <div class="pane-body">
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
          <div class="score" v-if="animationId !== null">
            <span>玩家：{{ playerScore }}</span>
            <span>AI: {{ aiScore }}</span>
          </div>
          
          <!-- Game Over Message -->
          <div v-if="gameOver" class="game-over">
            <p>页面找不到，但游戏可以继续！</p>
            <button @click="resetGame" class="restart-btn">再玩一次</button>
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
      gameOver: false,
      playerScore: 0,
      aiScore: 0,
      ballX: 50,
      ballY: 50,
      ballSpeedX: 0.5,
      ballSpeedY: 0.3,
      playerY: 50,
      aiY: 50,
      paddleHeight: 15,
      animationId: null,
      isDragging: false
    }
  },
  methods: {
    goBack() {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.location.href = '/'
      }
    },
    resetGame() {
      this.gameOver = false
      this.playerScore = 0
      this.aiScore = 0
      this.playerY = 50
      this.aiY = 50
      this.resetBall()
      this.gameLoop()
    },
    resetBall() {
      this.ballX = 50
      this.ballY = 50
      this.ballSpeedX = Math.random() > 0.5 ? 0.7 : -0.7
      this.ballSpeedY = (Math.random() - 0.5) * 0.6
    },
    startDrag(e) {
      // 只响应球拍上的触摸
      if (e.target !== this.$refs.playerPaddle) return
      
      this.isDragging = true
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      
      document.addEventListener('mousemove', this.handleDrag)
      document.addEventListener('mouseup', this.endDrag)
      document.addEventListener('touchmove', this.handleDrag, { passive: false })
      document.addEventListener('touchend', this.endDrag)
      
      if (!this.gameOver && this.animationId === null) {
        this.resetBall()
        this.gameLoop()
      }
      e.preventDefault()
      e.stopPropagation()
    },
    handleDrag(e) {
      if (!this.isDragging) return
      e.preventDefault()
      e.stopPropagation()
      
      const container = this.$refs.gameContainer
      if (container) {
        const rect = container.getBoundingClientRect()
        const relativeY = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) / rect.height * 100
        this.playerY = Math.max(0, Math.min(100 - this.paddleHeight, relativeY - this.paddleHeight / 2))
      }
    },
    endDrag() {
      this.isDragging = false
      document.removeEventListener('mousemove', this.handleDrag)
      document.removeEventListener('mouseup', this.endDrag)
      document.removeEventListener('touchmove', this.handleDrag)
      document.removeEventListener('touchend', this.endDrag)
    },
    gameLoop() {
      if (this.gameOver) return
      
      // Update ball position
      this.ballX += this.ballSpeedX
      this.ballY += this.ballSpeedY
      
      // Wall collision (top/bottom)
      if (this.ballY <= 0 || this.ballY >= 100) {
        this.ballSpeedY = -this.ballSpeedY
        this.ballY = this.ballY <= 0 ? 0 : 100
      }
      
      // Paddle collision detection
      const playerPaddle = this.$refs.playerPaddle
      const aiPaddle = this.$refs.aiPaddle
      const ball = this.$refs.ball
      
      if (playerPaddle && aiPaddle && ball) {
        const playerRect = playerPaddle.getBoundingClientRect()
        const aiRect = aiPaddle.getBoundingClientRect()
        const ballRect = ball.getBoundingClientRect()
        const containerRect = this.$refs.gameContainer.getBoundingClientRect()
        
        // Normalize positions to percentage
        const playerTop = ((playerRect.top - containerRect.top) / containerRect.height) * 100
        const playerBottom = ((playerRect.bottom - containerRect.top) / containerRect.height) * 100
        const aiTop = ((aiRect.top - containerRect.top) / containerRect.height) * 100
        const aiBottom = ((aiRect.bottom - containerRect.top) / containerRect.height) * 100
        
        const ballLeft = ((ballRect.left - containerRect.left) / containerRect.width) * 100
        const ballRight = ((ballRect.right - containerRect.left) / containerRect.width) * 100
        const ballTop = ((ballRect.top - containerRect.top) / containerRect.height) * 100
        const ballBottom = ((ballRect.bottom - containerRect.top) / containerRect.height) * 100
        
        // Player paddle collision (left side, around 10-15%)
        if (ballLeft <= 15 && ballLeft >= 10 && 
            ballBottom >= playerTop && ballTop <= playerBottom &&
            this.ballSpeedX < 0) {
          this.ballSpeedX = -this.ballSpeedX
          const hitPos = (ballTop + ballBottom) / 2 - (playerTop + playerBottom) / 2
          this.ballSpeedY = hitPos * 0.08 // 减小反弹角度
        }
        
        // AI paddle collision (right side, around 85-90%)
        if (ballRight >= 85 && ballRight <= 90 && 
            ballBottom >= aiTop && ballTop <= aiBottom &&
            this.ballSpeedX > 0) {
          this.ballSpeedX = -this.ballSpeedX
          const hitPos = (ballTop + ballBottom) / 2 - (aiTop + aiBottom) / 2
          this.ballSpeedY = hitPos * 0.08 // 减小反弹角度
        }
      }
      
      // Score detection
      if (this.ballX < -5) {
        // AI scores
        this.aiScore++
        if (this.aiScore >= 5) {
          this.gameOver = true
        } else {
          this.resetBall()
        }
      } else if (this.ballX > 105) {
        // Player scores
        this.playerScore++
        if (this.playerScore >= 5) {
          this.gameOver = true
        } else {
          this.resetBall()
        }
      }
      
      // Ball falls down (game over)
      if (this.ballY < -10 || this.ballY > 110) {
        this.gameOver = true
        if (this.animationId) {
          cancelAnimationFrame(this.animationId)
        }
        return
      }
      
      // AI movement (with strict speed limit and reaction delay)
      const aiTarget = this.ballY - this.paddleHeight / 2
      const aiSpeed = 0.06 // 进一步降低基础速度
      const aiDelta = (aiTarget - this.aiY) * aiSpeed
      // 严格限制 AI 最大移动速度（每帧最多 0.8 像素）
      const maxAIDelta = 0.8
      this.aiY += Math.max(-maxAIDelta, Math.min(maxAIDelta, aiDelta))
      
      // Keep paddles in bounds
      this.playerY = Math.max(0, Math.min(100 - this.paddleHeight, this.playerY))
      this.aiY = Math.max(0, Math.min(100 - this.paddleHeight, this.aiY))
      
      this.updatePositions()
      
      this.animationId = requestAnimationFrame(() => this.gameLoop())
    },
    updatePositions() {
      const playerPaddle = this.$refs.playerPaddle
      const aiPaddle = this.$refs.aiPaddle
      const ball = this.$refs.ball
      
      if (playerPaddle) {
        playerPaddle.style.top = `${this.playerY + this.paddleHeight / 2}%`
        playerPaddle.style.transform = 'translateY(-50%)'
      }
      if (aiPaddle) {
        aiPaddle.style.top = `${this.aiY + this.paddleHeight / 2}%`
        aiPaddle.style.transform = 'translateY(-50%)'
      }
      if (ball) {
        ball.style.left = `${this.ballX}%`
        ball.style.top = `${this.ballY}%`
        ball.style.transform = 'translate(-50%, -50%)'
      }
    }
  },
  beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
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
  -webkit-touch-callout: none;
  -webkit-user-select: none;
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
  left: 10%;
  top: 50%;
  transform: translateY(-50%);
}

.paddle:active {
  cursor: grabbing;
}

.paddle.ai {
  left: auto;
  right: 10%;
  color: var(--text-dim);
  cursor: default;
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
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-shadow: 0 0 10px var(--green-glow);
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
  cursor: pointer;
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
