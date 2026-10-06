<template>
  <div class="materials-page">
    <h1>Guida ai materiali</h1>
    <table>
      <thead>
        <tr><th>Materiale</th><th>Fattore K</th><th>Ritorno elastico</th><th>Note</th></tr>
      </thead>
      <tbody>
        <tr v-for="item in materials" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ item.bending.kFactor }}</td>
          <td>{{ Math.round(item.bending.springback * 100) }}%</td>
          <td>{{ item.notes }}</td>
        </tr>
      </tbody>
    </table>
    <router-link to="/calcolatore-sviluppo-lamiera">Torna al calcolatore</router-link>
  </div>
</template>

<script setup>
import { materialsDatabase } from '@sviluppolamiera/bend-core';

const materials = materialsDatabase;
</script>

<style scoped>
.materials-page { padding: 24px; }
table { width: 100%; border-collapse: collapse; }
td, th { border-bottom: 1px solid #d7dee8; text-align: left; padding: 8px; }
</style>
