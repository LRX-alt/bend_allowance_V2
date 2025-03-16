<template>
  <div id="app">
    <header class="app-header">
      <h1>Calcolatore Sviluppo Lamiera</h1>
      <nav>
        <router-link to="/">Home</router-link> |
        <router-link to="/calculator">Calcolatore</router-link>
      </nav>
    </header>
    
    <main>
      <router-view/>
    </main>
    
    <footer class="app-footer">
      <p>© 2025 Calcolatore Sviluppo Lamiera</p>
    </footer>
  </div>
</template>

<style>
#app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

nav {
  padding: 15px 0;
}

nav a {
  margin: 0 10px;
  color: #2c3e50;
  text-decoration: none;
}

nav a.router-link-active {
  color: #42b983;
  font-weight: bold;
}

.app-footer {
  text-align: center;
  margin-top: 50px;
  padding: 20px 0;
  border-top: 1px solid #eee;
  color: #666;
}
</style>