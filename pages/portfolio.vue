<template>
  <div class="wrapper">
    <h1>💼 My Portfolio</h1>

    <NuxtLink class="link" to="/">
      Back
    </NuxtLink>

    <form @submit.prevent="addEntry" class="form">
      <select v-model="newEntry.currency" @change="handleAmountChange" required>
        <option disabled value="">Select currency</option>
        <option v-for="currency in popularCurrencies" :key="currency" :value="currency">
          {{ currency }}
        </option>
      </select>
      <input v-model.number="newEntry.amount" type="number" @input="handleAmountChange" placeholder="Amount" required />
      <input :value="`${newEntry.purchasePrice} €`" disabled placeholder="Auto-calculated price (€)" />
      <button type="submit"> + Add</button>
    </form>

    <table class="crypto-table" v-if="portfolio.length">
      <thead>
        <tr>
          <th>Currency</th>
          <th>Amount</th>
          <th>Buy Price (€)</th>
          <th>Purchase Time</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in portfolio" :key="entry.id">
          <td>{{ entry.currency }}</td>
          <td>{{ entry.amount }}</td>
          <td>{{ entry.purchasePrice }}</td>
          <td>{{ entry.purchaseTime }}</td>
          <td><button @click="deleteEntry(entry.id)">🗑 Delete</button></td>
        </tr>
      </tbody>
    </table>


    <p v-else>No entries..</p>

    <!-- Total Value -->
    <div class="total">
      <strong>Total Portfolio Value: </strong>{{ totalValue }} €
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const API_URL = 'http://localhost:3001/portfolio'

const portfolio = ref([])
const totalValue = ref(0)

const newEntry = ref({
  currency: '',
  amount: null,
  purchasePrice: 0,
  purchaseTime: ''
})

const popularCurrencies = [
  'Bitcoin',
  'Ethereum',
  'Binance Coin',
  'Cardano',
  'Solana'
]


const currencyValues = computed(() => ({
  Bitcoin: 91310.44,
  Ethereum: 2193.31,
  'Binance Coin': 562,
  Cardano: 0.54,
  Solana: 126.67
}))


const handleAmountChange = () => {
  const currency = newEntry.value.currency
  const amount = newEntry.value.amount
  const price = currencyValues.value[currency]

  newEntry.value.purchasePrice = (amount * price).toFixed(2)
}


const fetchPortfolio = async () => {
  const res = await fetch(API_URL)
  portfolio.value = await res.json()
  totalValue.value = portfolio.value.reduce((acc, entry) => acc + entry.amount * entry.purchasePrice, 0).toFixed(2)
}

const addEntry = async () => {
  newEntry.value.purchaseTime = new Date().toLocaleString()
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newEntry.value)
  })

  newEntry.value = { currency: '', amount: null, purchasePrice: null, purchaseTime: '' }
  await fetchPortfolio()
}


const deleteEntry = async (id) => {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
  await fetchPortfolio()
}

onMounted(() => {
  fetchPortfolio()
})
</script>



<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

body {
  margin: 0;
  padding: 0;
  background: #f9f9f9;
  font-family: 'Inter', sans-serif;
  color: #1f1f1f;
}

.wrapper {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.form {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  flex: 1;
  min-width: 150px;
}

button {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

button:hover {
  background-color: #004a99;
}

.crypto-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.crypto-table th,
.crypto-table td {
  padding: 0.75rem 1rem;
  border: 1px solid #eee;
  text-align: center;
}

.total {
  font-size: 1.2rem;
  font-weight: bold;
  text-align: right;
}

.link {
  display: inline-block;
  margin-bottom: 2rem;
  text-decoration: none;
  color: #0066cc;
  font-weight: 600;
  border: 1px solid #0066cc;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.link:hover {
  background-color: #0066cc;
  color: #fff;
}
</style>
