<template>
  <div>
    <Navbar />
    <div class="dashboard-container">
      <!-- Tabs -->
      <div class="tabs">
        <button @click="activeTab = 'utama'" :class="{ active: activeTab === 'utama' }">UTAMA</button>
        <button @click="activeTab = 'laporan'" :class="{ active: activeTab === 'laporan' }">LAPORAN</button>
        <button @click="activeTab = 'setelan'" :class="{ active: activeTab === 'setelan' }">SETELAN</button>
      </div>

      <!-- ================= TAB UTAMA ================= -->
      <div v-if="activeTab === 'utama'">
        <div class="header">
          <h2>Catatan Keuangan</h2>
          <div class="today-summary">
            <div>Hari Ini, {{ today }}</div>
            <div class="amounts">
              <span>Rp{{ formatNumber(totalIncomeToday) }}</span>
              <span>Rp{{ formatNumber(totalExpenseToday) }}</span>
            </div>
          </div>
          <button @click="showAddModal = true" class="btn-add">Tambah</button>
        </div>

        <div class="transaction-list">
          <div v-for="item in dailyData" :key="item.date" class="day-group">
            <div class="day-header" @click="toggleDetails(item.date)">
              <div class="date">{{ formatDate(item.date) }}</div>
              <div class="day-summary">
                <span class="expense">Pengeluaran Rp{{ formatNumber(item.total_expense) }}</span>
                <span class="income">Pemasukan Rp{{ formatNumber(item.total_income) }}</span>
              </div>
            </div>
            <div v-if="expandedDate === item.date" class="day-details">
              <div v-for="detail in getDetailsForDate(item.date)" :key="detail.id" class="detail-row">
                <div class="detail-info">
                  <span class="detail-name">{{ detail.category_name }}</span>
                  <span class="detail-note">{{ detail.note || '-' }}</span>
                </div>
                <div class="detail-amount" :class="detail.category_type">
                  {{ detail.category_type === 'expense' ? 'Pengeluaran' : 'Pemasukan' }}
                  Rp{{ formatNumber(detail.category_type === 'expense' ? detail.total_expense : detail.total_income) }}
                </div>
              </div>
              <div v-if="getDetailsForDate(item.date).length === 0" class="no-detail">Tidak ada transaksi detail</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= TAB LAPORAN ================= -->
      <div v-if="activeTab === 'laporan'">
        <div class="report-header">
          <div class="filter-bar">
            <button @click="setFilter('7days')" :class="{ active: activeFilter === '7days' }">7 hari terakhir</button>
            <button @click="setFilter('30days')" :class="{ active: activeFilter === '30days' }">30 hari terakhir</button>
            <button @click="setFilter('custom')" :class="{ active: activeFilter === 'custom' }">Rentang Tanggal</button>
          </div>
          <div class="export-buttons">
            <button @click="exportToCSV" class="btn-export">📄 Export CSV</button>
            <button @click="exportToPDF" class="btn-export">📑 Export PDF</button>
          </div>
        </div>

        <div v-if="activeFilter === 'custom'" class="date-range">
          <label>Dari: <input type="date" v-model="customFrom" @change="fetchReport" /></label>
          <label>Sampai: <input type="date" v-model="customTo" @change="fetchReport" /></label>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in reportData" :key="idx">
              <td>{{ formatDate(item.date) }}</td>
              <td>{{ item.note || '-' }}</td>
              <td class="amount" :class="{ 'expense': item.total_expense > 0, 'income': item.total_income > 0 }">
                {{ formatRupiah(item.total_expense > 0 ? item.total_expense : item.total_income) }}
              </td>
            </tr>
            <tr v-if="reportData.length === 0">
              <td colspan="3" class="empty">Tidak ada data</td>
            </tr>
          </tbody>
          <tfoot v-if="reportData.length > 0">
            <tr>
              <th colspan="2">Total (Pemasukan - Pengeluaran)</th>
              <th class="total-amount">{{ formatRupiah(totalReportAmount) }}</th>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- ================= TAB SETELAN ================= -->
      <div v-if="activeTab === 'setelan'" class="settings-placeholder">
        <p>Halaman pengaturan (coming soon)</p>
      </div>
    </div>

    <!-- ================= MODAL TAMBAH TRANSAKSI ================= -->
    <div v-if="showAddModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <h3>Tambah Transaksi</h3>
        <div class="form-group">
          <label>Tipe</label>
          <select v-model="newTransaction.type" @change="filterCategories">
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </div>
        <div class="form-group">
          <label>Kategori</label>
          <select v-model="newTransaction.category_id">
            <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Jumlah</label>
          <input type="number" v-model="newTransaction.amount" />
        </div>
        <div class="form-group">
          <label>Judul</label>
          <input type="text" v-model="newTransaction.note" />
        </div>
        <div class="form-group">
          <label>Tanggal</label>
          <input type="date" v-model="newTransaction.date" />
        </div>
        <div class="modal-buttons">
          <button @click="closeModal">Batal</button>
          <button @click="saveTransaction">Simpan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';
import Navbar from '../components/Navbar.vue';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ================= DATA REAKTIF =================
const activeTab = ref('utama');

// Data untuk tab UTAMA
const dailyData = ref([]);
const detailsData = ref([]);
const expandedDate = ref(null);
const categories = ref([]);
const showAddModal = ref(false);
const newTransaction = ref({
  type: 'expense',
  category_id: null,
  amount: 0,
  note: '',
  date: new Date().toISOString().slice(0, 10)
});

// Data untuk tab LAPORAN
const activeFilter = ref('7days');
const customFrom = ref('');
const customTo = ref('');
const reportData = ref([]);

// ================= HELPERS =================
const today = new Date().toISOString().slice(0, 10);

const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
};

const formatRupiah = (num) => {
  if (num === undefined || num === null || isNaN(num)) return 'Rp0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

// ================= TAB UTAMA =================
const totalIncomeToday = computed(() => {
  const todayData = dailyData.value.find(d => d.date === today);
  return todayData ? todayData.total_income : 0;
});

const totalExpenseToday = computed(() => {
  const todayData = dailyData.value.find(d => d.date === today);
  return todayData ? todayData.total_expense : 0;
});

const filteredCategories = computed(() => 
  categories.value.filter(c => c.type === newTransaction.value.type)
);

const fetchSummary = async () => {
  try {
    const res = await api.get('/api/v1/reports/main-summary');
    dailyData.value = res.data;
  } catch (err) {
    console.error('Gagal ambil ringkasan:', err);
  }
};

const fetchDetails = async () => {
  try {
    const res = await api.get('/api/v1/reports/details-by-date');
    detailsData.value = res.data;
  } catch (err) {
    console.error('Gagal ambil detail transaksi:', err);
  }
};

const fetchCategories = async () => {
  try {
    const res = await api.get('/api/v1/categories');
    categories.value = res.data;
    if (categories.value.length) {
      const defaultCat = categories.value.find(c => c.type === newTransaction.value.type);
      newTransaction.value.category_id = defaultCat ? defaultCat.id : null;
    }
  } catch (err) {
    console.error('Gagal ambil kategori:', err);
  }
};

const getDetailsForDate = (date) => detailsData.value.filter(item => item.date === date);
const toggleDetails = (date) => {
  expandedDate.value = expandedDate.value === date ? null : date;
};

const closeModal = () => {
  showAddModal.value = false;
  newTransaction.value = {
    type: 'expense',
    category_id: categories.value.find(c => c.type === 'expense')?.id || null,
    amount: 0,
    note: '',
    date: new Date().toISOString().slice(0, 10)
  };
};

const filterCategories = () => {
  const firstCat = categories.value.find(c => c.type === newTransaction.value.type);
  newTransaction.value.category_id = firstCat ? firstCat.id : null;
};

const saveTransaction = async () => {
  if (!newTransaction.value.category_id || newTransaction.value.amount <= 0) {
    alert('Lengkapi data transaksi');
    return;
  }
  try {
    await api.post('/api/v1/transactions', {
      category_id: newTransaction.value.category_id,
      amount: newTransaction.value.amount,
      date: newTransaction.value.date,
      note: newTransaction.value.note
    });
    closeModal();
    await fetchSummary();
    await fetchDetails();
  } catch (err) {
    alert(err.response?.data?.error || 'Gagal simpan transaksi');
  }
};

// ================= TAB LAPORAN =================
const setFilter = (filter) => {
  activeFilter.value = filter;
  fetchReport();
};

const totalReportAmount = computed(() => {
  let totalIncome = 0;
  let totalExpense = 0;
  for (const item of reportData.value) {
    totalIncome += item.total_income || 0;
    totalExpense += item.total_expense || 0;
  }
  return totalIncome - totalExpense;
});

const fetchReport = async () => {
  let url = '';
  if (activeFilter.value === '7days') {
    url = '/api/v1/reports/last7days';
  } else if (activeFilter.value === '30days') {
    url = '/api/v1/reports/last30days';
  } else if (activeFilter.value === 'custom') {
    if (!customFrom.value || !customTo.value) {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30);
      customFrom.value = from.toISOString().slice(0, 10);
      customTo.value = to.toISOString().slice(0, 10);
    }
    url = `/api/v1/reports/date-range?from=${customFrom.value}&to=${customTo.value}`;
  }

  try {
    const res = await api.get(url);
    reportData.value = res.data;
  } catch (err) {
    alert('Gagal memuat laporan');
  }
};

// ================= EXPORT =================
const getExportFilename = (extension) => {
  let name = 'laporan';
  if (activeFilter.value === '7days') {
    name = 'laporan_7_hari_terakhir';
  } else if (activeFilter.value === '30days') {
    name = 'laporan_30_hari_terakhir';
  } else if (activeFilter.value === 'custom') {
    const from = customFrom.value || 'tgl_awal';
    const to = customTo.value || 'tgl_akhir';
    name = `laporan_${from}_sampai_${to}`;
  }
  return `${name}.${extension}`;
};

const getTableData = () => {
  return reportData.value.map(item => [
    formatDate(item.date),
    item.note || '-',
    formatRupiah(item.total_expense > 0 ? item.total_expense : item.total_income)
  ]);
};

const exportToCSV = () => {
  if (!reportData.value.length) {
    alert('Tidak ada data untuk diekspor');
    return;
  }
  const sheetData = [
    ['Tanggal', 'Keterangan', 'Jumlah (Rp)'],
    ...getTableData(),
    ['', 'Total', formatRupiah(totalReportAmount.value)]
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
  XLSX.writeFile(wb, getExportFilename('csv'), { bookType: 'csv' });
};

const exportToPDF = () => {
  if (!reportData.value.length) {
    alert('Tidak ada data untuk diekspor');
    return;
  }
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Laporan Keuangan - Monelog', 14, 22);
  doc.setFontSize(11);
  doc.text(`Periode: ${getExportFilename('').replace('.', '')}`, 14, 32);

  const tableData = getTableData();
  tableData.push(['', 'Total', formatRupiah(totalReportAmount.value)]);
  autoTable(doc, {
    startY: 40,
    head: [['Tanggal', 'Keterangan', 'Jumlah (Rp)']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [66, 185, 131] }
  });
  doc.save(getExportFilename('pdf'));
};

// ================= INISIALISASI =================
onMounted(async () => {
  await fetchSummary();
  await fetchDetails();
  await fetchCategories();
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);
  customFrom.value = from.toISOString().slice(0, 10);
  customTo.value = to.toISOString().slice(0, 10);
  await fetchReport();
});
</script>

<style scoped>
.dashboard-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 2px solid #eee;
  margin-bottom: 1rem;
}
.tabs button {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  color: gray;
  font-weight: bold;
}
.tabs button.active {
  color: #42b983;
  border-bottom: 2px solid #42b983;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}
.today-summary {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 12px;
  margin: 1rem 0;
}
.amounts {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
}
.btn-add {
  background: #42b983;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  cursor: pointer;
}

.transaction-list {
  margin-top: 1rem;
}
.day-group {
  margin-bottom: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #fafafa;
  cursor: pointer;
}
.day-summary {
  display: flex;
  gap: 1rem;
}
.expense {
  color: #e74c3c;
}
.income {
  color: #2ecc71;
}
.day-details {
  background: white;
  border-top: 1px solid #eee;
  padding: 0.5rem 1rem;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}
.detail-name {
  font-weight: 500;
}
.detail-note {
  font-size: 0.8rem;
  color: #666;
}
.detail-amount {
  font-weight: bold;
}
.no-detail {
  padding: 1rem;
  text-align: center;
  color: #999;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  gap: 1rem;
}
.filter-bar {
  display: flex;
  gap: 0.5rem;
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
.export-buttons {
  display: flex;
  gap: 0.5rem;
}
.btn-export {
  background: #4a90e2;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}
.btn-export:hover {
  background: #357abd;
}
.date-range {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.date-range label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.date-range input {
  padding: 0.4rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: auto;
  display: block;
}
.report-table th,
.report-table td {
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
.amount.expense {
  color: #e74c3c;
}
.amount.income {
  color: #2ecc71;
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
.settings-placeholder {
  text-align: center;
  padding: 2rem;
  color: gray;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.modal-buttons button:first-child {
  background: #ccc;
}
.modal-buttons button:last-child {
  background: #42b983;
  color: white;
}
</style>