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
          
          <!-- Game Over Message -->
          <div v-if="gameOver" class="game-over">
            <p>页面找不到，但游戏可以继续！</p>
            <button @click="resetGame" class="restart-btn">再玩一次</button>
          </div>
          
          <!-- Score -->
          <div class="score">
            <span>玩家：{{ playerScore }}</span>
            <span>AI: {{ aiScore }}</span>
          </div>
        </div>
        
        <div class="content" v-if="!gameStarted">
          <h2>404 乒乓球游戏</h2>
          <p>拖动左边的 "4" 控制球拍，别让 "0" 掉下去！</p>
          <button @click="startGame" class="start-btn">开始游戏</button>
        </div>
        
        <div class="content" v-if="gameStarted && !gameOver" style="display: none;">
          <h2>404 乒乓球游戏</h2>
          <p>拖动左边的 "4" 控制球拍，别让 "0" 掉下去！</p>
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
      isDragging: false
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
          this.ballSpeedX = -this.ballSpeedX * 1.05 // Slight speed increase
          // Add angle based on where ball hits paddle
          const hitPos = (ballTop + ballBottom) / 2 - (playerTop + playerBottom) / 2
          this.ballSpeedY += hitPos * 0.02
        }
        
        // AI paddle collision (right side, around 85-90%)
        if (ballRight >= 85 && ballRight <= 90 && 
            ballBottom >= aiTop && ballTop <= aiBottom &&
            this.ballSpeedX > 0) {
          this.ballSpeedX = -this.ballSpeedX * 1.05
          const hitPos = (ballTop + ballBottom) / 2 - (aiTop + aiBottom) / 2
          this.ballSpeedY += hitPos * 0.02
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
      this.isDragging = true
      this.handleDrag(e)
      
      document.addEventListener('mousemove', this.handleDrag)
      document.addEventListener('mouseup', this.endDrag)
      document.addEventListener('touchmove', this.handleDrag, { passive: false })
      document.addEventListener('touchend', this.endDrag)
    },
    handleDrag(e) {
      if (!this.isDragging || !this.$refs.gameContainer) return
      e.preventDefault()
      
      const containerRect = this.$refs.gameContainer.getBoundingClientRect()
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const relativeY = ((clientY - containerRect.top) / containerRect.height) * 100
      
      this.playerY = Math.max(0, Math.min(100 - this.paddleHeight, relativeY - this.paddleHeight / 2))
      this.updatePositions()
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

.content {
  text-align: center;
  padding: 0 1rem;
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
  
  .content {
    padding: 0;
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
  
  .footer {
    font-size: 11px;
  }
}
</style>
