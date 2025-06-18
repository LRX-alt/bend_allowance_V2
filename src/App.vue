<template>
  <div id="app" :data-theme="isDark ? 'dark' : 'light'">
    <!-- Header moderno -->
    <header class="app-header">
      <div class="container">
        <div class="header-content">
          <!-- Logo e titolo -->
          <div class="brand">
            <div class="brand-icon">📐</div>
            <div class="brand-text">
              <h1 class="brand-title">Bend Allowance</h1>
              <p class="brand-subtitle">Calcolatore Lamiera</p>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="main-nav">
            <router-link to="/" class="nav-link">
              <span class="nav-icon">🏠</span>
              Home
            </router-link>
            <router-link to="/calculator" class="nav-link">
              <span class="nav-icon">🧮</span>
              Calcolatore
            </router-link>
          </nav>

          <!-- Theme toggle -->
          <button @click="toggleTheme" class="theme-toggle" :title="isDark ? 'Modalità chiara' : 'Modalità scura'">
            <span v-if="isDark">☀️</span>
            <span v-else>🌙</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-main">
            <p class="footer-text">© 2025 Bend Allowance Calculator - Ideato e sviluppato da Di Furio Loris</p>
            <p class="footer-subtitle">Calcolatore professionale per bend deduction e sviluppo lamiera</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'App',
  setup() {
    const isDark = ref(false)

    // Load theme preference from localStorage
    onMounted(() => {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        isDark.value = savedTheme === 'dark'
      } else {
        // Check system preference
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
    })

    const toggleTheme = () => {
      isDark.value = !isDark.value
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }

    return {
      isDark,
      toggleTheme
    }
  }
}
</script>

<style>
/* Reset e base */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

#app {
  font-family: var(--font-family-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--gray-900);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--gray-50);
  transition: all var(--transition-fast);
}

/* Dark theme */
[data-theme="dark"] #app {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

/* === HEADER === */
.app-header {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  transition: all var(--transition-fast);
}

[data-theme="dark"] .app-header {
  background: var(--bg-secondary);
  border-bottom-color: var(--gray-700);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  gap: var(--space-6);
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand-icon {
  font-size: var(--text-2xl);
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  margin: 0;
  line-height: var(--leading-tight);
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: var(--text-sm);
  color: var(--gray-600);
  margin: 0;
  line-height: var(--leading-tight);
}

[data-theme="dark"] .brand-subtitle {
  color: var(--text-secondary);
}

/* Navigation */
.main-nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--gray-700);
  text-decoration: none;
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
  position: relative;
}

.nav-link:hover {
  background: var(--gray-100);
  color: var(--primary-600);
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background: var(--primary-100);
  color: var(--primary-700);
  font-weight: var(--font-semibold);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: var(--space-4);
  right: var(--space-4);
  height: 2px;
  background: var(--primary-600);
  border-radius: 1px;
}

.nav-icon {
  font-size: var(--text-lg);
}

[data-theme="dark"] .nav-link {
  color: var(--text-secondary);
}

[data-theme="dark"] .nav-link:hover {
  background: var(--gray-700);
  color: var(--primary-400);
}

[data-theme="dark"] .nav-link.router-link-active {
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary-400);
}

/* Theme toggle */
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--gray-300);
  background: white;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--text-lg);
}

.theme-toggle:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

[data-theme="dark"] .theme-toggle {
  background: var(--bg-tertiary);
  border-color: var(--gray-600);
}

[data-theme="dark"] .theme-toggle:hover {
  background: var(--gray-600);
  border-color: var(--gray-500);
}

/* === MAIN CONTENT === */
.main-content {
  flex: 1;
  padding: var(--space-8) 0;
}

/* === FOOTER === */
.app-footer {
  background: white;
  border-top: 1px solid var(--gray-200);
  margin-top: auto;
  transition: all var(--transition-fast);
}

[data-theme="dark"] .app-footer {
  background: var(--bg-secondary);
  border-top-color: var(--gray-700);
}

.footer-content {
  padding: var(--space-6) 0;
  text-align: center;
}

.footer-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.footer-text {
  margin: 0;
  color: var(--gray-700);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.footer-subtitle {
  margin: 0;
  color: var(--gray-500);
  font-size: var(--text-xs);
  font-style: italic;
}

[data-theme="dark"] .footer-text {
  color: var(--text-primary);
}

[data-theme="dark"] .footer-subtitle {
  color: var(--text-secondary);
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    height: auto;
    padding: var(--space-4) 0;
    gap: var(--space-4);
  }

  .brand {
    order: 1;
  }

  .main-nav {
    order: 2;
    justify-content: center;
    width: 100%;
  }

  .theme-toggle {
    order: 3;
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
  }

  .nav-link {
    flex: 1;
    justify-content: center;
  }

  .container {
    padding: 0 var(--space-4);
  }
}

@media (max-width: 480px) {
  .brand-title {
    font-size: var(--text-lg);
  }

  .brand-subtitle {
    font-size: var(--text-xs);
  }

  .nav-link {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
  }

  .nav-icon {
    font-size: var(--text-base);
  }
}
</style>
