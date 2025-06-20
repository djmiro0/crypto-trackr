  <template>
    <div class="wrapper">
      <h1>{{ t('title') }}</h1>

      <NuxtLink class="link" to="/">{{ t('back') }}</NuxtLink>

      <ModalChart v-if="showModal" :visible="showModal" :coin="selectedCoin" :portfolioHistory="portfolio"
        @close="showModal = false" />

      <form @submit.prevent="saveEntry" class="form">
        <select v-model="newEntry.currency" @change="handleAmountChange" required>
          <option disabled value="">{{ t('currency') }}</option>
          <option v-for="currency in popularCurrencies" :key="currency" :value="currency">
            {{ currency }}
          </option>
        </select>

        <input v-model.number="newEntry.amount" type="number" @input="handleAmountChange" :placeholder="t('amount')"
          required />
        <input :value="`${newEntry.purchasePrice} €`" disabled :placeholder="t('price')" />
        <button type="submit">{{ isEditing ? t('update') : t('add') }}</button>
        <button type="button" v-if="isEditing" @click="resetForm">{{ t('reset') }}</button>
      </form>

      <table class="crypto-table" v-if="portfolio.length">
        <thead>
          <tr>
            <th>{{ t('currency') }}</th>
            <th>{{ t('amount') }}</th>
            <th>{{ t('price') }}</th>
            <th>{{ t('time') }}</th>
            <th>{{ t('actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in portfolio" :key="entry.id">
            <td @click="openModal(entry.currency.toLowerCase())">
              <Icon :name="`cryptocurrency:${coinSymbolMap[entry.currency.toLowerCase()]}`" size="17"
                style="margin-right: 8px;" />{{
                  entry.currency }}
            </td>
            <td>{{ entry.amount }}</td>
            <td>{{ entry.purchasePrice }}</td>
            <td>{{ entry.purchaseTime }}</td>
            <td>
              <button @click="deleteEntry(entry.id)"
                :class="['deleteButton', { disabled: isEditing && editingId !== entry.id }]"
                :disabled="isEditing && editingId !== entry.id">
                <Icon name="uil:trash" color="white" size="15" />
                {{ t('delete') }}
              </button>
              <button @click="editEntry(entry)" :disabled="isEditing && editingId !== entry.id">
                <Icon name="uil:edit" color="white" size="15" />
                {{ isEditing && editingId === entry.id ? t('editing') : t('edit') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="isLoading">{{ t('loading') }}</p>
      <p v-if="!isLoading && !portfolio.length">{{ t('noEntries') }}</p>

      <div class="total">
        <strong>{{ t('total') }}: </strong>{{ totalValue }} €
      </div>
    </div>
  </template>


<script setup>
import { ref, onMounted } from 'vue'
import ModalChart from '@/components/Modal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()


const API_URL = 'http://localhost:3001/portfolio'

const portfolio = ref([])
const totalValue = ref(0)
const showModal = ref(false)
const selectedCoin = ref('')
const isLoading = ref(true)
const isEditing = ref(false)
const editingId = ref(null)

const newEntry = ref({
  currency: '',
  amount: null,
  purchasePrice: 0,
  purchaseTime: ''
})

//for the icons
const coinSymbolMap = {
  bitcoin: 'btc',
  ethereum: 'eth',
  ripple: 'xrp',
  cardano: 'ada'
}

const popularCurrencies = ['Bitcoin', 'Ethereum', 'Ripple', 'Cardano']

const currencyValues = ref({
  Bitcoin: 91310.44,
  Ethereum: 2193.31,
  Ripple: 1.93,
  Cardano: 0.55
})

const openModal = (coin) => {
  selectedCoin.value = coin
  showModal.value = true
}

const handleAmountChange = () => {
  const { currency, amount } = newEntry.value
  const price = currencyValues.value[currency]
  newEntry.value.purchasePrice = (amount * price).toFixed(2)
}

const fetchPortfolio = async () => {
  isLoading.value = true
  const res = await fetch(API_URL)
  portfolio.value = await res.json()

  totalValue.value = portfolio.value
    .reduce((acc, entry) => acc + entry.amount * entry.purchasePrice, 0)
    .toFixed(2)

  isLoading.value = false
}

const saveEntry = async () => {
  if (!newEntry.value.currency || !newEntry.value.amount) return

  if (isEditing.value && editingId.value !== null) {
    // Update existing entry
    await fetch(`${API_URL}/${editingId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry.value)
    })
  } else {
    // Add new entry
    newEntry.value.purchaseTime = new Date().toLocaleString()

    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry.value)
    })
  }

  resetForm()
  await fetchPortfolio()
}

const editEntry = (entry) => {
  isEditing.value = true
  editingId.value = entry.id
  newEntry.value = { ...entry }
}

const resetForm = () => {
  isEditing.value = false
  editingId.value = null
  newEntry.value = {
    currency: '',
    amount: null,
    purchasePrice: 0,
    purchaseTime: ''
  }
}

const deleteEntry = async (id) => {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
  await fetchPortfolio()
  resetForm()
}

onMounted(fetchPortfolio)
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
  font-size: 14px;
  align-items: center;
}

button:hover {
  background-color: #004a99;
}

button:disabled,
button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.deleteButton {
  background-color: crimson;
}

.deleteButton:hover {
  background-color: rgb(163, 16, 45);
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
