<template>
  <div class="not-found">
    <!-- Topbar -->
    <Topbar toolCount="0" />

    <!-- 404 Pong Game -->
    <section class="pane">
      <div class="pane-body">
        <!-- 初始 404 视图 -->
        <div v-if="!gameStarted" class="static-404">
          <div class="error-code">
            <span class="digit digit-4" ref="dragFour" @mousedown="initDrag" @touchstart="initDrag">4</span>
            <span class="digit">0</span>
            <span class="digit">4</span>
          </div>
          <p class="error-message">页面未找到</p>
          <a href="/" class="home-btn">← 返回首页</a>
        </div>
        
        <!-- 游戏视图 -->
        <div v-else class="game-container" ref="gameContainer">
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
          <div class="score">
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
      ballX: 50,
      ballY: 50,
      ballSpeedX: 0.5,
      ballSpeedY: 0.3,
      playerY: 50,
      aiY: 50,
      paddleHeight: 15,
      animationId: null,
      isDragging: false,
      gameTriggered: false,
      dragStartY: 0
    }
  },
  methods: {
    startGame() {
      this.gameStarted = true
      this.resetBall()
      this.gameLoop()
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
      this.ballSpeedX = Math.random() > 0.5 ? 0.5 : -0.5
      this.ballSpeedY = (Math.random() - 0.5) * 0.6
    },
    gameLoop() {
      if (this.gameOver) return
      
      // Update ball position
      this.ballX += this.ballSpeedX
      this.ballY += this.ballSpeedY
      
      // Wall collision (top/bottom)
      if (this.ballY <= 5 || this.ballY >= 95) {
        this.ballSpeedY = -this.ballSpeedY
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
          this.ballSpeedX = -this.ballSpeedX // 只反转方向，不加速
          // Add angle based on where ball hits paddle
          const hitPos = (ballTop + ballBottom) / 2 - (playerTop + playerBottom) / 2
          this.ballSpeedY = hitPos * 0.02 // 设置角度，不是累加
        }
        
        // AI paddle collision (right side, around 85-90%)
        if (ballRight >= 85 && ballRight <= 90 && 
            ballBottom >= aiTop && ballTop <= aiBottom &&
            this.ballSpeedX > 0) {
          this.ballSpeedX = -this.ballSpeedX // 只反转方向，不加速
          const hitPos = (ballTop + ballBottom) / 2 - (aiTop + aiBottom) / 2
          this.ballSpeedY = hitPos * 0.02 // 设置角度，不是累加
        }
      }
      
      // Score detection
      if (this.ballX < 0) {
        this.aiScore++
        this.resetBall()
      } else if (this.ballX > 100) {
        this.playerScore++
        this.resetBall()
      }
      
      // Ball falls down (game over)
      if (this.ballY < -10 || this.ballY > 110) {
        this.gameOver = true
        if (this.animationId) {
          cancelAnimationFrame(this.animationId)
        }
        return
      }
      
      // AI movement (follows ball with delay)
      const aiTarget = this.ballY - this.paddleHeight / 2
      const aiSpeed = 0.08
      if (this.aiY < aiTarget) {
        this.aiY = Math.min(this.aiY + aiSpeed, aiTarget)
      } else {
        this.aiY = Math.max(this.aiY - aiSpeed, aiTarget)
      }
      
      // Keep paddles in bounds
      this.playerY = Math.max(0, Math.min(100 - this.paddleHeight, this.playerY))
      this.aiY = Math.max(0, Math.min(100 - this.paddleHeight, this.aiY))
      
      // Update DOM positions
      this.updatePositions()
      
      this.animationId = requestAnimationFrame(() => this.gameLoop())
    },
    updatePositions() {
      if (this.$refs.playerPaddle) {
        this.$refs.playerPaddle.style.top = this.playerY + '%'
      }
      if (this.$refs.aiPaddle) {
        this.$refs.aiPaddle.style.top = this.aiY + '%'
      }
      if (this.$refs.ball) {
        this.$refs.ball.style.left = this.ballX + '%'
        this.$refs.ball.style.top = this.ballY + '%'
      }
    },
    startDrag(e) {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      
      if (!this.gameStarted && !this.gameTriggered) {
        // 拖动触发游戏
        this.gameTriggered = true
        this.gameStarted = true
        this.dragStartY = clientY
        this.isDragging = true
        
        document.addEventListener('mousemove', this.handleDrag)
        document.addEventListener('mouseup', this.endDrag)
        document.addEventListener('touchmove', this.handleDrag, { passive: false })
        document.addEventListener('touchend', this.endDrag)
        e.preventDefault()
        
        this.resetBall()
        this.gameLoop()
      } else if (this.gameStarted && !this.gameOver) {
        // 游戏中拖动球拍
        this.isDragging = true
        this.dragStartY = clientY
        
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
        // 游戏中移动球拍
        const container = this.$refs.gameContainer
        if (container) {
          const rect = container.getBoundingClientRect()
          const relativeY = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) / rect.height * 100
          this.playerY = Math.max(0, Math.min(100 - this.paddleHeight, relativeY - this.paddleHeight / 2))
          this.updatePositions()
        }
      }
    },
    endDrag() {
      this.isDragging = false
      document.removeEventListener('mousemove', this.handleDrag)
      document.removeEventListener('mouseup', this.endDrag)
      document.removeEventListener('touchmove', this.handleDrag)
      document.removeEventListener('touchend', this.endDrag)
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

.pane::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--card-top-line);
  opacity: 0.5;
}

.pane-body {
  padding: 2rem;
  width: 100%;
  max-width: 100%;
  position: relative;
}

/* === Static 404 View === */
.static-404 {
  text-align: center;
  padding: 2rem 1rem;
}

.error-code {
  font-family: var(--mono);
  font-size: clamp(4rem, 15vw, 10rem);
  font-weight: 900;
  letter-spacing: -10px;
  margin-bottom: 1rem;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.digit {
  display: inline-block;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: var(--green);
}

.digit-4 {
  cursor: grab;
  touch-action: none;
}

.digit-4:active {
  cursor: grabbing;
}

.error-message {
  font-family: var(--mono);
  font-size: clamp(14px, 3vw, 18px);
  color: var(--text-dim);
  margin: 1rem 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.home-btn {
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
  margin-top: 1rem;
}

.home-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 20px var(--green-glow);
  color: var(--green);
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
  transition: transform 0.1s;
  left: 10%;
  top: 50%;
  transform: translateY(-50%);
}

.paddle:active {
  cursor: grabbing;
  transform: translateY(-50%) scale(1.1);
}

.paddle.ai {
  left: auto;
  right: 10%;
  color: var(--text-dim);
  cursor: default;
}

.paddle.ai:active {
  transform: none;
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
  background: var(--accent);
  color: var(--bg);
  border: none;
  padding: 12px 24px;
  font-family: var(--mono);
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.restart-btn:hover {
  background: var(--green);
  box-shadow: 0 0 20px var(--green-glow);
}

/* === Start Button === */
.start-btn {
  display: inline-block;
  border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.02);
  color: var(--accent);
  padding: 10px 20px;
  font-family: var(--mono);
  font-size: 13px;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s;
  min-height: 44px;
  margin-top: 1rem;
}

.start-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 20px var(--green-glow);
  color: var(--green);
}

h2 {
  font-size: 18px;
  margin: 1.5rem 0 0.5rem;
  color: var(--text);
  font-family: var(--mono);
}

p {
  color: var(--text-dim);
  margin: 0.5rem 0 2rem;
  font-size: 15px;
}

/* === Footer === */
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

/* === Responsive === */
@media (max-width: 640px) {
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
  
  .pane-body {
    padding: 1rem;
  }
  
  .pane {
    min-height: auto;
    margin-top: 8px;
  }
  
  .static-404 {
    padding: 1rem;
  }
  
  .error-code {
    font-size: 5rem;
  }
  
  .error-message {
    font-size: 16px;
  }
  
  .footer {
    font-size: 12px;
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
  
  .pane-body {
    padding: 0.75rem;
  }
  
  .static-404 {
    padding: 0.5rem;
  }
  
  .error-code {
    font-size: 4rem;
  }
  
  .error-message {
    font-size: 14px;
  }
  
  .footer {
    font-size: 11px;
  }
}
</style>
