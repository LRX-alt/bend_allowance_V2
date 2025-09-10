<template>
  <div id="app">
    <!-- Header moderno -->
    <header class="app-header">
      <div class="container">
        <div class="header-content">
          <!-- Logo e titolo -->
          <div class="brand">
            <div class="brand-logo">
              <img src="@/assets/logo.png" alt="Bend Allowance Calculator" class="logo-image" />
            </div>
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
            <router-link to="/calcolatore-sviluppo-lamiera" class="nav-link">
              <span class="nav-icon">🧮</span>
              Calcolatore
            </router-link>
          </nav>


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
export default {
  name: 'App'
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

.brand-logo {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: var(--radius-lg);
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

  .brand-logo {
    width: 40px;
    height: 40px;
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

  .brand-logo {
    width: 36px;
    height: 36px;
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
