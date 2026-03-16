<template>
  <footer class="footer">
    <div class="terminal-window">
      <div class="terminal-body" style="padding: 0.5rem 1rem; min-height: auto;">
        <p class="flicker">
          <span class="prompt">root@403:~$</span>
          <span>echo "403.li - Terminal Tools © 2026"</span>
        </p>
        <p style="color: var(--text-dim); font-size: 0.8em; margin-top: 0.5rem;">
          🖥️ 系统状态：<span style="color: var(--text-success);">●</span> 在线 | 
          🛡️ 纯前端 | 无追踪 | 开源
        </p>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
}
</script>
