<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              Calcola il Bend Allowance con
              <span class="highlight">Precisione Professionale</span>
            </h1>
            <p class="hero-description">
              Strumento avanzato per il calcolo dello sviluppo lamiera, bend allowance, setback e
              compensazione di piegatura. Ottimizzato per l'industria metalmeccanica moderna.
            </p>
            <div class="hero-actions">
              <router-link to="/calculator" class="btn btn-primary btn-lg">
                🧮 Inizia Calcolo
              </router-link>
              <button @click="scrollToFeatures" class="btn btn-secondary btn-lg">
                📖 Scopri di più
              </button>
            </div>
          </div>
          <div class="hero-visual">
            <div class="feature-preview">
              <div class="preview-card">
                <div class="preview-header">
                  <div class="preview-tabs">
                    <div class="tab active">Calcolatore</div>
                    <div class="tab">Avanzato</div>
                    <div class="tab">Materiali</div>
                  </div>
                </div>
                <div class="preview-body">
                  <div class="mock-input">
                    <label>Spessore (mm)</label>
                    <div class="input-field">2.0</div>
                  </div>
                  <div class="mock-input">
                    <label>Raggio Piega (mm)</label>
                    <div class="input-field">1.0</div>
                  </div>
                  <div class="mock-result">
                    <div class="result-label">Bend Allowance</div>
                    <div class="result-value">3.14 mm</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section ref="featuresSection" class="features">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Funzionalità Professionali</h2>
          <p class="section-description">
            Tutto quello che serve per calcoli precisi nella lavorazione lamiera
          </p>
        </div>

        <div class="features-grid">
          <!-- Feature 1 -->
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3 class="feature-title">Calcoli Precisi</h3>
            <p class="feature-description">
              Algoritmi avanzati per bend allowance, setback e bend deduction con precisione al centesimo di millimetro.
            </p>
            <ul class="feature-list">
              <li>Formule DIN 6935 e ANSI</li>
              <li>Fattore K dinamico</li>
              <li>Compensazione springback</li>
            </ul>
          </div>

          <!-- Feature 2 -->
          <div class="feature-card">
            <div class="feature-icon">🔧</div>
            <h3 class="feature-title">Calcoli Avanzati</h3>
            <p class="feature-description">
              Parametri avanzati per processi di piegatura professionali con calcolo automatico della matrice ottimale.
            </p>
            <ul class="feature-list">
              <li>Air bending, bottoming, coining</li>
              <li>Calcolo forza di piegatura</li>
              <li>Ottimizzazione apertura matrice</li>
            </ul>
          </div>

          <!-- Feature 3 -->
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3 class="feature-title">Database Materiali</h3>
            <p class="feature-description">
              Database completo con proprietà dei materiali più comuni nell'industria metalmeccanica.
            </p>
            <ul class="feature-list">
              <li>Acciaio, alluminio, inox, rame</li>
              <li>Fattori K specifici per materiale</li>
              <li>Valori di springback</li>
            </ul>
          </div>

          <!-- Feature 4 -->
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3 class="feature-title">Design Responsive</h3>
            <p class="feature-description">
              Interfaccia moderna e responsive, ottimizzata per desktop, tablet e smartphone.
            </p>
            <ul class="feature-list">
              <li>Tema chiaro/scuro</li>
              <li>Layout adattivo</li>
              <li>Touch-friendly</li>
            </ul>
          </div>

          <!-- Feature 5 -->
          <div class="feature-card">
            <div class="feature-icon">💾</div>
            <h3 class="feature-title">Gestione Progetti</h3>
            <p class="feature-description">
              Salva, carica e condividi i tuoi progetti di calcolo con colleghi e clienti.
            </p>
            <ul class="feature-list">
              <li>Salvataggio locale</li>
              <li>Esportazione PDF/DXF</li>
              <li>Link di condivisione</li>
            </ul>
          </div>

          <!-- Feature 6 -->
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3 class="feature-title">Prestazioni Elevate</h3>
            <p class="feature-description">
              Calcoli istantanei con anteprima in tempo reale e interfaccia fluida e reattiva.
            </p>
            <ul class="feature-list">
              <li>Calcolo in tempo reale</li>
              <li>Anteprima grafica</li>
              <li>Confronto modalità</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Pronto a calcolare con precisione?</h2>
          <p class="cta-description">
            Inizia subito con il calcolatore professionale per la lavorazione lamiera
          </p>
          <router-link to="/calculator" class="btn btn-primary btn-lg">
            🚀 Apri Calcolatore
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Home',
  setup() {
    const featuresSection = ref(null)

    const scrollToFeatures = () => {
      if (featuresSection.value) {
        featuresSection.value.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }
    }

    return {
      featuresSection,
      scrollToFeatures
    }
  }
}
</script>

<style scoped>
/* === HERO SECTION === */
.hero {
  background: linear-gradient(135deg, var(--primary-50) 0%, white 100%);
  padding: var(--space-12) 0;
  position: relative;
  overflow: hidden;
}

[data-theme="dark"] .hero {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.03'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  opacity: 0.5;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  margin: 0 0 var(--space-6) 0;
  color: var(--gray-900);
}

[data-theme="dark"] .hero-title {
  color: var(--text-primary);
}

.highlight {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--gray-600);
  margin: 0 0 var(--space-8) 0;
}

[data-theme="dark"] .hero-description {
  color: var(--text-secondary);
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

/* Hero Visual */
.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.feature-preview {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  width: 100%;
  max-width: 400px;
  transform: perspective(1000px) rotateY(-5deg) rotateX(5deg);
  transition: transform var(--transition-slow);
}

.feature-preview:hover {
  transform: perspective(1000px) rotateY(-2deg) rotateX(2deg);
}

[data-theme="dark"] .feature-preview {
  background: var(--bg-tertiary);
}

.preview-card {
  padding: 0;
}

.preview-header {
  background: var(--gray-50);
  padding: var(--space-4);
  border-bottom: 1px solid var(--gray-200);
}

[data-theme="dark"] .preview-header {
  background: var(--bg-secondary);
  border-bottom-color: var(--gray-700);
}

.preview-tabs {
  display: flex;
  gap: var(--space-2);
}

.tab {
  padding: var(--space-2) var(--space-3);
  background: var(--gray-200);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--gray-600);
}

.tab.active {
  background: var(--primary-600);
  color: white;
}

[data-theme="dark"] .tab {
  background: var(--gray-600);
  color: var(--text-secondary);
}

.preview-body {
  padding: var(--space-6);
}

.mock-input {
  margin-bottom: var(--space-4);
}

.mock-input label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-700);
  margin-bottom: var(--space-2);
}

[data-theme="dark"] .mock-input label {
  color: var(--text-secondary);
}

.input-field {
  background: var(--gray-50);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
}

[data-theme="dark"] .input-field {
  background: var(--bg-secondary);
  border-color: var(--gray-600);
  color: var(--text-primary);
}

.mock-result {
  background: var(--success-50);
  border: 1px solid var(--success-200);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-top: var(--space-6);
}

[data-theme="dark"] .mock-result {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
}

.result-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--success-700);
  margin-bottom: var(--space-1);
}

.result-value {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--success-800);
}

[data-theme="dark"] .result-label,
[data-theme="dark"] .result-value {
  color: var(--success-400);
}

/* === FEATURES SECTION === */
.features {
  padding: var(--space-12) 0;
  background: white;
}

[data-theme="dark"] .features {
  background: var(--bg-primary);
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-4) 0;
  color: var(--gray-900);
}

[data-theme="dark"] .section-title {
  color: var(--text-primary);
}

.section-description {
  font-size: var(--text-lg);
  color: var(--gray-600);
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

[data-theme="dark"] .section-description {
  color: var(--text-secondary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--space-8);
}

.feature-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  transform: scaleX(0);
  transition: transform var(--transition-fast);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-200);
}

.feature-card:hover::before {
  transform: scaleX(1);
}

[data-theme="dark"] .feature-card {
  background: var(--bg-secondary);
  border-color: var(--gray-700);
}

[data-theme="dark"] .feature-card:hover {
  border-color: var(--primary-600);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: var(--space-4);
  display: block;
}

.feature-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-3) 0;
  color: var(--gray-900);
}

[data-theme="dark"] .feature-title {
  color: var(--text-primary);
}

.feature-description {
  color: var(--gray-600);
  margin: 0 0 var(--space-4) 0;
  line-height: var(--leading-relaxed);
}

[data-theme="dark"] .feature-description {
  color: var(--text-secondary);
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  position: relative;
  padding-left: var(--space-6);
  margin-bottom: var(--space-2);
  color: var(--gray-700);
  font-size: var(--text-sm);
}

.feature-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--success-600);
  font-weight: var(--font-bold);
}

[data-theme="dark"] .feature-list li {
  color: var(--text-secondary);
}

/* === CTA SECTION === */
.cta {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  padding: var(--space-12) 0;
  text-align: center;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
}

.cta-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: white;
  margin: 0 0 var(--space-4) 0;
}

.cta-description {
  font-size: var(--text-lg);
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 var(--space-8) 0;
  line-height: var(--leading-relaxed);
}

.cta .btn-primary {
  background: white;
  color: var(--primary-600);
  border-color: white;
}

.cta .btn-primary:hover {
  background: var(--gray-100);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* === RESPONSIVE === */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: var(--space-8);
    text-align: center;
  }

  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-6);
  }
}

@media (max-width: 768px) {
  .hero {
    padding: var(--space-8) 0;
  }

  .hero-title {
    font-size: var(--text-2xl);
  }

  .hero-description {
    font-size: var(--text-base);
  }

  .hero-actions {
    justify-content: center;
  }

  .features {
    padding: var(--space-8) 0;
  }

  .section-header {
    margin-bottom: var(--space-8);
  }

  .section-title {
    font-size: var(--text-2xl);
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .feature-card {
    padding: var(--space-6);
  }

  .cta {
    padding: var(--space-8) 0;
  }

  .cta-title {
    font-size: var(--text-2xl);
  }
}

@media (max-width: 480px) {
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .hero-actions .btn {
    width: 100%;
    max-width: 280px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    margin: 0 var(--space-2);
  }
}
</style>
