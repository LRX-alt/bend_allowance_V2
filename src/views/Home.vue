<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              Calcola con precisione professionale i
              <span class="highlight">parametri di piegatura</span>
            </h1>
            <p class="hero-description">
              Strumento avanzato sviluppato da un professionista con oltre 20 anni di esperienza nella piegatura lamiera, per la determinazione dello sviluppo lamiera tramite Bend Allowance, Bend Deduction, Setback e compensazioni di piegatura. <span class="highlight">Ottimizzato per l'industria metalmeccanica moderna.</span>
            </p>
            <div class="hero-actions">
          <router-link to="/calcolatore-sviluppo-lamiera" class="btn btn-primary btn-lg">
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
          <h2 class="section-title">Calcolatore Piegatura Lamiera Professionale</h2>
          <p class="section-description">
            Strumenti avanzati per calcolo sviluppo lamiera, bend allowance calculator, bend deduction e setback lamiera
          </p>
        </div>

        <div class="features-grid">
          <!-- Feature 1 -->
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3 class="feature-title">Calcolo Bend Allowance Lamiera</h3>
            <p class="feature-description">
              Algoritmi avanzati per calcolo bend allowance lamiera, bend deduction calculator e setback lamiera con precisione al centesimo di millimetro.
            </p>
            <ul class="feature-list">
              <li>Formula piegatura DIN 6935 e ANSI standard</li>
              <li>Fattore K dinamico per materiale</li>
              <li>Compensazione springback automatica</li>
              <li>Calcolo sviluppo lamiera accurato</li>
            </ul>
          </div>

          <!-- Feature 2 -->
          <div class="feature-card">
            <div class="feature-icon">🔧</div>
            <h3 class="feature-title">Calcolo Piegatura Lamiera Avanzata</h3>
            <p class="feature-description">
              Parametri avanzati per processi piegatura lamiera professionali con calcolo automatico matrice V-die ottimale e forza pressa.
            </p>
            <ul class="feature-list">
              <li>Processi: air bending, bottoming, coining</li>
              <li>Calcolo forza piegatura pressopiegatrice</li>
              <li>Ottimizzazione apertura matrice V-die</li>
              <li>Raggio effettivo calcolato dalla matrice</li>
            </ul>
          </div>

          <!-- Feature 3 -->
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3 class="feature-title">Database Materiali Lamiera</h3>
            <p class="feature-description">
              Database completo proprietà materiali lamiera per calcolo piegatura accurato. Supporto acciaio, alluminio, inox, rame, ottone e titanio.
            </p>
            <ul class="feature-list">
              <li>Materiali: acciaio S235, alluminio 1100/5052/6061, inox AISI 304, rame, ottone, titanio</li>
              <li>Fattori K specifici per ogni materiale lamiera</li>
              <li>Valori springback e raggi minimi di piegatura</li>
              <li>Raggi consigliati per direzione grana</li>
            </ul>
          </div>

          <!-- Feature 4 -->
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3 class="feature-title">Calcolatore Lamiera Mobile</h3>
            <p class="feature-description">
              Calcolatore piegatura lamiera responsive e ottimizzato per tutti i dispositivi. Calcola bend allowance online su desktop, tablet e smartphone.
            </p>
            <ul class="feature-list">
              <li>Interfaccia touch-friendly per dispositivi mobili</li>
              <li>Layout adattivo per ogni risoluzione schermo</li>
              <li>Tema chiaro/scuro per comfort visivo</li>
              <li>Accessibile da qualsiasi dispositivo connesso</li>
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

    <!-- Experience Section -->
    <section class="experience">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Frutto di 20 Anni di Esperienza</h2>
          <p class="section-description">
            Sviluppato da un professionista con oltre ventennale esperienza nella lavorazione lamiera e piegatura industriale.
          </p>
        </div>

        <div class="experience-grid">
          <div class="experience-card">
            <div class="experience-icon">🏭</div>
            <h3 class="experience-title">Esperti Industriali</h3>
            <p class="experience-description">
              Ho lavorato per anni nell'industria metalmeccanica, sviluppando competenze pratiche nella piegatura di lamiera
              per diversi settori: automotive, arredamento, edilizia e meccanica di precisione.
            </p>
          </div>

          <div class="experience-card">
            <div class="experience-icon">💻</div>
            <h3 class="experience-title">Tecnologia Moderna</h3>
            <p class="experience-description">
              Combino la mia esperienza sul campo con le più moderne tecnologie digitali per offrire uno strumento
              che risponda alle esigenze reali dell'officina e del progettista.
            </p>
          </div>

          <div class="experience-card">
            <div class="experience-icon">🎯</div>
            <h3 class="experience-title">Precisione Garantita</h3>
            <p class="experience-description">
              Ogni formula e algoritmo è stato testato e validato attraverso anni di applicazione pratica,
              garantendo risultati affidabili per qualsiasi tipo di lavorazione lamiera.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- SEO Content Section -->
    <section class="seo-content">
      <div class="container">
        <div class="seo-content-grid">
          <div class="seo-content-block">
            <h2>Calcolo Bend Allowance Lamiera</h2>
            <p>
              Il mio calcolatore bend allowance online permette di calcolare con precisione il bend allowance per qualsiasi tipo di lamiera.
              Utilizziamo formule standard DIN 6935 e ANSI per garantire risultati accurati nel calcolo dello sviluppo lamiera.
            </p>
            <p>
              Il bend allowance rappresenta la lunghezza aggiuntiva necessaria per ottenere l'angolo desiderato dopo la piegatura.
              Il mio strumento calcola automaticamente il bend allowance in base al materiale selezionato, allo spessore della lamiera,
              al raggio di piegatura e all'angolo richiesto.
            </p>
          </div>

          <div class="seo-content-block">
            <h3>Bend Deduction Calculator</h3>
            <p>
              Oltre al bend allowance, il calcolatore determina automaticamente il bend deduction necessario per il taglio preciso della lamiera.
              Il bend deduction è la differenza tra la lunghezza sviluppata e la lunghezza finale del pezzo piegato.
            </p>
            <p>
              Utilizziamo la formula standard: <strong>Bend Deduction = 2 × Setback - Bend Allowance</strong> per calcoli precisi
              e affidabili nel calcolo sviluppo lamiera professionale.
            </p>
          </div>

          <div class="seo-content-block">
            <h3>Calcolo Setback Lamiera</h3>
            <p>
              Il setback lamiera è calcolato automaticamente dal mio strumento utilizzando la formula:
              <strong>Setback = (R + T) × tan(α/2)</strong> dove R è il raggio interno, T lo spessore e α l'angolo di piegatura.
            </p>
            <p>
              Questa misura è fondamentale per determinare con precisione le posizioni delle flange nel progetto CAD
              e garantire un assemblaggio perfetto dei componenti in lamiera.
            </p>
          </div>

          <div class="seo-content-block">
            <h3>Calcolatore Piegatura Online Gratuito</h3>
            <p>
              Il mio calcolatore piegatura lamiera è completamente gratuito e accessibile online da qualsiasi dispositivo.
              Non richiede installazione di software e funziona direttamente nel browser web.
            </p>
            <p>
              Ottimizzato per l'industria metalmeccanica, supporta tutti i principali materiali da costruzione:
              acciaio S235, alluminio 1100/5052/6061, acciaio inox AISI 304, rame, ottone e titanio.
            </p>
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
          <router-link to="/calcolatore-sviluppo-lamiera" class="btn btn-primary btn-lg">
            🚀 Calcola Bend Allowance Online
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



.preview-card {
  padding: 0;
}

.preview-header {
  background: var(--gray-50);
  padding: var(--space-4);
  border-bottom: 1px solid var(--gray-200);
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



.input-field {
  background: var(--gray-50);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
}



.mock-result {
  background: var(--success-50);
  border: 1px solid var(--success-200);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-top: var(--space-6);
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



/* === FEATURES SECTION === */
.features {
  padding: var(--space-12) 0;
  background: white;
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



.section-description {
  font-size: var(--text-lg);
  color: var(--gray-600);
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
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



.feature-description {
  color: var(--gray-600);
  margin: 0 0 var(--space-4) 0;
  line-height: var(--leading-relaxed);
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



/* === EXPERIENCE SECTION === */
.experience {
  padding: var(--space-12) 0;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative;
}

.experience::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.05'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E") repeat;
  opacity: 0.3;
}

.experience-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-8);
  position: relative;
  z-index: 1;
}

.experience-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.experience-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--success-500), var(--success-600));
  transform: scaleX(0);
  transition: transform var(--transition-fast);
}

.experience-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--success-200);
}

.experience-card:hover::before {
  transform: scaleX(1);
}

.experience-icon {
  font-size: 2.5rem;
  margin-bottom: var(--space-4);
  display: block;
}

.experience-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-3) 0;
  color: var(--gray-900);
}

.experience-description {
  color: var(--gray-600);
  margin: 0;
  line-height: var(--leading-relaxed);
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

  .seo-content {
    padding: var(--space-12) 0;
  }

  .seo-content-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .seo-content-block {
    padding: var(--space-4);
  }
}

/* SEO Content Section */
.seo-content {
  background: #f8f9fa;
  padding: 60px 0;
  margin: 40px 0;
}

.seo-content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.seo-content-block {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.seo-content-block h2 {
  color: #1976d2;
  font-size: 1.5rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.seo-content-block h3 {
  color: #424242;
  font-size: 1.25rem;
  margin-bottom: 12px;
  font-weight: 500;
}

.seo-content-block p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.seo-content-block strong {
  color: #1976d2;
  font-weight: 600;
}
</style>
