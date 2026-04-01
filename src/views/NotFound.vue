<template>
  <div class="not-found">
    <!-- Topbar -->
    <Topbar toolCount="0" />

    <!-- Main Content -->
    <section class="pane">
      <div class="pane-body">
        <!-- Initial State: Static 404 -->
        <div v-if="!gameMode" class="static-404">
          <div class="error-code">
            <span 
              class="digit digit-4 left-4" 
              ref="left4"
              @mousedown="startDrag"
              @touchstart="startDrag"
            >4</span>
            <span class="digit digit-0">0</span>
            <span 
              class="digit digit-4 right-4" 
              ref="right4"
              @mousedown="startDrag"
              @touchstart="startDrag"
            >4</span>
          </div>
          <p class="error-message">页面未找到</p>
          <a href="/" class="home-btn">返回首页</a>
          <p class="hint">拖动 "4" 试试？</p>
        </div>

        <!-- Game Mode -->
        <div v-else class="game-container" ref="gameContainer">
          <div class="pong-game">
            <!-- Player Paddle -->
            <div 
              class="paddle player" 
              ref="playerPaddle"
              :style="{ left: playerPaddleLeft + '%' }"
            >4</div>
            
            <!-- Ball -->
            <div class="ball" ref="ball">0</div>
            
            <!-- AI Paddle -->
            <div class="paddle ai" ref="aiPaddle">4</div>
          </div>
          
          <!-- Score Board -->
          <div class="score-board">
            <span>玩家：{{ playerScore }}</span>
            <span>AI: {{ aiScore }}</span>
          </div>
          
          <!-- Game Over Message -->
          <div v-if="gameOver" class="game-over">
            <p>页面找不到，但游戏可以继续！</p>
            <button @click="resetTo404" class="reset-btn">返回 404</button>
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
      gameMode: false,
      gameOver: false,
      playerScore: 0,
      aiScore: 0,
      
      // Ball physics
      ballX: 50,
      ballY: 50,
      ballSpeedX: 0.4,
      ballSpeedY: 0.3,
      
      // Speed limits
      initialSpeedX: 0.4,
      initialSpeedY: 0.3,
      maxSpeedX: 0.8,
      maxSpeedY: 0.6,
      
      // Paddle positions
      playerY: 50,
      aiY: 50,
      playerPaddleLeft: 10, // Player paddle fixed X position (%)
      paddleHeight: 12, // percentage
      
      // Drag state
      isDragging: false,
      draggedElement: null,
      dragStartX: 0,
      
      // Animation
      animationId: null
    }
  },
  methods: {
    startDrag(e) {
      this.isDragging = true
      this.draggedElement = e.target
      this.dragStartX = e.touches ? e.touches[0].clientX : e.clientX
      
      document.addEventListener('mousemove', this.handleDrag)
      document.addEventListener('mouseup', this.endDrag)
      document.addEventListener('touchmove', this.handleDrag, { passive: false })
      document.addEventListener('touchend', this.endDrag)
      
      // Prevent text selection
      e.preventDefault()
    },
    
    handleDrag(e) {
      if (!this.isDragging || !this.draggedElement) return
      e.preventDefault()
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      
      // Calculate drag distance from start
      const deltaX = clientX - this.dragStartX
      const element = this.draggedElement
      
      // Move the digit with drag
      element.style.transform = `translate(${deltaX}px, 0)`
      
      // Check if dragged past center (trigger game)
      const elementRect = element.getBoundingClientRect()
      const elementCenterX = elementRect.left + elementRect.width / 2
      const screenCenterX = screenWidth / 2
      
      // If dragged past center horizontally, trigger game
      if (Math.abs(deltaX) > screenWidth * 0.2) {
        this.triggerGame(element, clientY, screenHeight)
      }
    },
    
    triggerGame(draggedElement, clientY, screenHeight) {
      this.gameMode = true
      this.gameOver = false
      this.playerScore = 0
      this.aiScore = 0
      
      // Determine which side was dragged
      const isLeft4 = draggedElement.classList.contains('left-4')
      
      // Set player paddle side
      this.playerPaddleLeft = isLeft4 ? 10 : 85
      
      // Initialize player position based on drag Y
      const container = this.$refs.gameContainer
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const relativeY = ((clientY - containerRect.top) / containerRect.height) * 100
        this.playerY = Math.max(0, Math.min(100 - this.paddleHeight, relativeY - this.paddleHeight / 2))
      } else {
        this.playerY = 50 - this.paddleHeight / 2
      }
      
      this.aiY = 50 - this.paddleHeight / 2
      
      // Reset ball
      this.resetBall()
      
      // Start game loop
      this.$nextTick(() => {
        this.gameLoop()
      })
    },
    
    resetTo404() {
      this.gameMode = false
      this.gameOver = false
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
      }
      
      // Reset drag styles
      if (this.$refs.left4) {
        this.$refs.left4.style.transform = ''
      }
      if (this.$refs.right4) {
        this.$refs.right4.style.transform = ''
      }
    },
    
    resetBall() {
      this.ballX = 50
      this.ballY = 50
      // 重置为初始速度，防止多轮后球速过快
      const direction = Math.random() > 0.5 ? 1 : -1
      this.ballSpeedX = direction * this.initialSpeedX
      this.ballSpeedY = (Math.random() - 0.5) * this.initialSpeedY
    },
    
    gameLoop() {
      if (this.gameOver) return
      
      // Update ball position
      this.ballX += this.ballSpeedX
      this.ballY += this.ballSpeedY
      
      // Wall collision (top/bottom)
      if (this.ballY <= 2 || this.ballY >= 98) {
        this.ballSpeedY = -this.ballSpeedY
        this.ballY = this.ballY <= 2 ? 2 : 98
      }
      
      // Paddle collision
      const ballLeft = this.ballX
      const ballRight = this.ballX + 3 // Ball width approx
      const ballTop = this.ballY
      const ballBottom = this.ballY + 3
      
      const playerTop = this.playerY
      const playerBottom = this.playerY + this.paddleHeight
      const aiTop = this.aiY
      const aiBottom = this.aiY + this.paddleHeight
      
      // Player paddle collision
      const playerPaddleRight = this.playerPaddleLeft + 5
      if (ballLeft <= playerPaddleRight && 
          ballRight >= this.playerPaddleLeft &&
          ballBottom >= playerTop && 
          ballTop <= playerBottom) {
        // 反弹向右，限制最大速度
        const newSpeedX = Math.min(Math.abs(this.ballSpeedX) * 1.02, this.maxSpeedX)
        this.ballSpeedX = newSpeedX
        // 优化碰撞检测：基于击球位置调整角度，但限制 Y 速度
        const hitPos = (ballTop + ballBottom) / 2 - (playerTop + playerBottom) / 2
        this.ballSpeedY = Math.max(Math.min(this.ballSpeedY + hitPos * 0.02, this.maxSpeedY), -this.maxSpeedY)
        // 确保球不会穿过球拍
        this.ballX = playerPaddleRight + 0.1
      }
      
      // AI paddle collision
      const aiPaddleLeft = this.playerPaddleLeft < 50 ? 85 : 10
      if (ballRight >= aiPaddleLeft && 
          ballLeft <= aiPaddleLeft + 5 &&
          ballBottom >= aiTop && 
          ballTop <= aiBottom) {
        // 反弹向左，限制最大速度
        const newSpeedX = Math.min(Math.abs(this.ballSpeedX) * 1.02, this.maxSpeedX)
        this.ballSpeedX = -newSpeedX
        const hitPos = (ballTop + ballBottom) / 2 - (aiTop + aiBottom) / 2
        this.ballSpeedY = Math.max(Math.min(this.ballSpeedY + hitPos * 0.02, this.maxSpeedY), -this.maxSpeedY)
        // 确保球不会穿过球拍
        this.ballX = aiPaddleLeft - 0.1
      }
      
      // Score detection (ball out of bounds horizontally)
      if (this.ballX < -5) {
        this.aiScore++
        this.resetBall()
      } else if (this.ballX > 105) {
        this.playerScore++
        this.resetBall()
      }
      
      // Game over (ball falls vertically)
      if (this.ballY < -10 || this.ballY > 110) {
        this.gameOver = true
        if (this.animationId) {
          cancelAnimationFrame(this.animationId)
        }
        return
      }
      
      // AI movement (follows ball with delay)
      const aiTarget = this.ballY - this.paddleHeight / 2
      // AI 速度根据球速动态调整，能跟上球但不会太完美
      const baseAiSpeed = 0.08
      const aiSpeed = baseAiSpeed + Math.abs(this.ballSpeedX) * 0.05
      // 添加反应延迟：只有当球向 AI 移动时才快速响应
      const ballMovingToAI = (this.playerPaddleLeft < 50 && this.ballSpeedX > 0) || 
                             (this.playerPaddleLeft > 50 && this.ballSpeedX < 0)
      const effectiveAiSpeed = ballMovingToAI ? aiSpeed : aiSpeed * 0.5
      if (this.aiY < aiTarget) {
        this.aiY = Math.min(this.aiY + effectiveAiSpeed, aiTarget)
      } else if (this.aiY > aiTarget) {
        this.aiY = Math.max(this.aiY - effectiveAiSpeed, aiTarget)
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
    
    endDrag() {
      if (!this.gameMode) {
        // Reset digit position if game not triggered
        if (this.draggedElement) {
          this.draggedElement.style.transform = ''
        }
      }
      
      this.isDragging = false
      this.draggedElement = null
      document.removeEventListener('mousemove', this.handleDrag)
      document.removeEventListener('mouseup', this.endDrag)
      document.removeEventListener('touchmove', this.handleDrag)
      document.removeEventListener('touchend', this.endDrag)
    }
  },
  
  mounted() {
    // Add grab cursor to 4s
    if (this.$refs.left4) {
      this.$refs.left4.style.cursor = 'grab'
    }
    if (this.$refs.right4) {
      this.$refs.right4.style.cursor = 'grab'
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

/* === Static 404 Display === */
.static-404 {
  text-align: center;
  padding: 2rem 1rem;
}

.error-code {
  font-family: var(--mono);
  font-size: clamp(4rem, 15vw, 10rem);
  font-weight: 900;
  color: var(--accent);
  letter-spacing: -10px;
  margin-bottom: 1rem;
  user-select: none;
  display: inline-block;
}

.digit {
  display: inline-block;
  transition: transform 0.1s ease-out;
}

.digit-4:hover {
  transform: scale(1.05);
}

.digit-0 {
  color: var(--text);
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

.hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-dim);
  margin-top: 2rem;
  opacity: 0.6;
}

/* === Game Container === */
.game-container {
  width: 100%;
  height: 400px;
  position: relative;
  background: rgba(0, 0, 0, 0.4);
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
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 900;
  color: var(--accent);
  width: clamp(40px, 8vw, 60px);
  height: clamp(50px, 10vw, 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 255, 136, 0.1);
  border: 2px solid var(--green);
  border-radius: 4px;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
  transition: background 0.2s;
}

.paddle.player {
  color: var(--green);
  border-color: var(--green);
  background: rgba(0, 255, 136, 0.15);
}

.paddle.ai {
  color: var(--text-dim);
  border-color: var(--text-dim);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: none;
}

.ball {
  position: absolute;
  font-family: var(--mono);
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 900;
  color: var(--green);
  width: clamp(30px, 6vw, 45px);
  height: clamp(30px, 6vw, 45px);
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0 0 15px var(--green-glow), 0 0 30px rgba(0, 255, 136, 0.5);
  border-radius: 50%;
  background: rgba(0, 255, 136, 0.1);
}

/* === Score Board === */
.score-board {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 50px;
  font-family: var(--mono);
  font-size: clamp(12px, 2.5vw, 16px);
  color: var(--text-dim);
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid var(--line);
}

/* === Game Over === */
.game-over {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(0, 0, 0, 0.95);
  padding: 2.5rem;
  border-radius: 8px;
  border: 2px solid var(--line);
  z-index: 20;
  min-width: 280px;
}

.game-over p {
  font-family: var(--mono);
  font-size: clamp(14px, 3vw, 18px);
  color: var(--text);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.reset-btn {
  background: var(--accent);
  color: var(--bg);
  border: none;
  padding: 12px 28px;
  font-family: var(--mono);
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.reset-btn:hover {
  background: var(--green);
  box-shadow: 0 0 25px var(--green-glow);
  transform: translateY(-2px);
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
    height: 320px;
  }
  
  .pane-body {
    padding: 1rem;
  }
  
  .static-404 {
    padding: 1rem 0.5rem;
  }
  
  .error-code {
    letter-spacing: -5px;
  }
  
  .footer {
    font-size: 12px;
    padding: 8px 10px;
  }
}

@media (max-width: 375px) {
  .game-container {
    height: 280px;
  }
  
  .error-code {
    letter-spacing: 0;
  }
  
  .footer {
    font-size: 11px;
  }
}
</style>
