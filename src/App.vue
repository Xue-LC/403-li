<template>
  <div class="terminal-app">
    <Header />
    
    <main class="terminal-main">
      <router-view />
    </main>
    
    <Footer />
  </div>
</template>

<script>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'

export default {
  name: 'App',
  components: {
    Header,
    Footer
  },
  mounted() {
    // 确保页面加载时应用正确的主题
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }
}
</script>

<style>
.terminal-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.terminal-main {
  flex: 1;
  padding: 1rem 0;
}
</style>
