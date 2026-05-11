<template>
  <div>
    <Navbar />
    <div class="report-container">
      <h2>Laporan Keuangan</h2>
      <div class="filter-bar">
        <button @click="setFilter('7days')" :class="{ active: activeFilter === '7days' }">7 hari terakhir</button>
        <button @click="setFilter('30days')" :class="{ active: activeFilter === '30days' }">30 hari terakhir</button>
        <button @click="setFilter('custom')" :class="{ active: activeFilter === 'custom' }">Rentang Tanggal</button>
      </div>

      <div v-if="activeFilter === 'custom'" class="date-range">
        <label>Dari: <input type="date" v-model="customFrom" @change="fetchReport" /></label>
        <label>Sampai: <input type="date" v-model="customTo" @change="fetchReport" /></label>
      </div>

      <table class="report-table">
        <thead><tr><th>Tanggal</th><th>Jumlah (Rp)</th></tr></thead>
        <tbody>
          <tr v-for="item in reportData" :key="item.date + (item.note || '')">
            <td>{{ formatDate(item.date) }}</td>
            <td class="amount">{{ formatRupiah(getAmount(item)) }}</td>
          </tr>
          <tr v-if="reportData.length === 0"><td colspan="2" class="empty">Tidak ada data</td></tr>
        </tbody>
        <tfoot v-if="reportData.length > 0"><tr><th>Total</th><th class="total-amount">{{ formatRupiah(totalAmount) }}</th></tr></tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import Navbar from '../components/Navbar.vue'

const activeFilter = ref('7days')
const customFrom = ref('')
const customTo = ref('')
const reportData = ref([])

const setFilter = (filter) => {
  activeFilter.value = filter
  fetchReport()
}

const getAmount = (item) => {
  if (item.category_type === 'expense') return item.total_expense || 0
  if (item.category_type === 'income') return item.total_income || 0
  return item.total_amount || 0
}

const totalAmount = computed(() => {
  let sum = 0
  for (const item of reportData.value) {
    sum += getAmount(item)
  }
  return sum
})

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatRupiah = (num) => {
  if (num === undefined || num === null || isNaN(num)) return 'Rp0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

const fetchReport = async () => {
  let url = ''
  if (activeFilter.value === '7days') {
    url = '/api/v1/reports/last7days'
  } else if (activeFilter.value === '30days') {
    url = '/api/v1/reports/last30days'
  } else if (activeFilter.value === 'custom') {
    if (!customFrom.value || !customTo.value) {
      const to = new Date()
      const from = new Date()
      from.setDate(to.getDate() - 30)
      customFrom.value = from.toISOString().slice(0, 10)
      customTo.value = to.toISOString().slice(0, 10)
    }
    url = `/api/v1/reports/date-range?from=${customFrom.value}&to=${customTo.value}`
  }

  try {
    const res = await api.get(url)
    reportData.value = res.data
  } catch (err) {
    console.error('Gagal mengambil laporan:', err)
    alert('Gagal memuat laporan')
  }
}

onMounted(() => {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 30)
  customFrom.value = from.toISOString().slice(0, 10)
  customTo.value = to.toISOString().slice(0, 10)
  fetchReport()
})
</script>

<style scoped>
.report-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}
h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}
.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.filter-bar button {
  background: #f0f0f0;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-bar button.active {
  background: #42b983;
  color: white;
}
.date-range {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.report-table th, .report-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  text-align: left;
}
.report-table th {
  background: #f8f9fa;
  font-weight: 600;
}
.amount {
  text-align: right;
  font-family: monospace;
}
.total-amount {
  color: #2c3e50;
  font-weight: bold;
}
.empty {
  text-align: center;
  color: #999;
  padding: 2rem;
}
</style>