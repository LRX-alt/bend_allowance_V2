
<template>
  <div class="calcolatore">
    
    <CalcolatoreLamiera ref="calcolatoreLamiera" />
  </div>
</template>

<script>
import CalcolatoreLamiera from './CalcolatoreLamiera.vue';

export default {
  name: 'CalcolatoreLamieraMain',
  components: {
    CalcolatoreLamiera,
  },
  mounted() {
    console.log("Calcolatore.vue: Componente montato.");
    const refCheck = this.$refs.calcolatoreLamiera;
    if (refCheck) {
      console.log("Calcolatore.vue: Riferimento a CalcolatoreLamiera trovato con successo.");
    } else {
      console.error("Calcolatore.vue: Il riferimento a CalcolatoreLamiera è undefined.");
    }
  },
};
</script>
