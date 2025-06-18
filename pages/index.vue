<template>
    <div class="wrapper">
        <h1 class="greeting">CryptoTrackr</h1>
        <NuxtLink class="link" to="/portfolio">{{ $t("viewPortfolio") }}</NuxtLink>

        <select class="language-select" @change="changeLang($event)">
            <option value="en">English</option>
            <option value="de">German</option>
        </select>


        <ModalChart v-if="showModal" :visible="showModal" :coin="selectedCoin" :fullHistory="priceHistory"
            :startDate="startDate" :endDate="endDate" @close="showModal = false" />

        <div class="filters">
            <input type="date" v-model="startDate" />
            <input type="date" v-model="endDate" />
            <button @click="filterByDate">{{ $t("search") }}</button>
            <button @click="reset" class="resetButton">{{ $t("reset") }}</button>
        </div>

        <div v-if="filteredHistory.length">
            <table class="crypto-table" v-if="showCurrentTable">
                <thead>
                    <tr>
                        <th>
                            {{ $t("coin") }}
                        </th>
                        <th>{{ $t("date") }}</th>
                        <th>{{ $t("last24h") }}</th>
                        <th>{{ $t("lastWeek") }}</th>
                        <th>{{ $t("priceEuro") }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="coin in trackedCoins" :key="coin" @click="openModal(coin)">
                        <td class="currencyColumn">
                            <Icon :name="`cryptocurrency:${coinSymbolMap[coin]}`" size="17"
                                style="margin-right: 8px;" />
                            {{ coinLabels[coin] }}
                        </td>
                        <td>{{ currentValue[0]?.date }}</td>
                        <td :class="getChangeClass(changes[coin]?.oneDay)">
                            {{ changes[coin]?.oneDay }}%
                        </td>
                        <td :class="getChangeClass(changes[coin]?.week)">
                            {{ changes[coin]?.week }}%
                        </td>
                        <td><b>{{ currentValue[0]?.[coin] }} €</b></td>
                    </tr>
                </tbody>
            </table>

            <button @click="toggleHistory">
                {{ showHistory ? $t("hideHistory") : $t("loadHistory") }}
            </button>

            <table class="crypto-table" v-if="showHistory">
                <thead>
                    <tr>
                        <th>{{ $t("date") }}</th>
                        <th v-for="coin in trackedCoins" :key="coin">{{ coinLabels[coin] }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(entry, index) in filteredHistory" :key="index">
                        <td>{{ entry.date }}</td>
                        <td v-for="coin in trackedCoins" :key="coin">{{ entry[coin] }} €</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="isLoading">{{ $t("loading") }}</div>
        <div v-else-if="!filteredHistory.length">{{ $t("failedToLoad") }}</div>
    </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import ModalChart from '@/components/Modal.vue'
import { useState } from '#app'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const changeLang = (event) => {
    locale.value = event.target.value
}


const trackedCoins = ['bitcoin', 'ethereum', 'ripple', 'cardano']

//for the icons
const coinSymbolMap = {
    bitcoin: 'btc',
    ethereum: 'eth',
    ripple: 'xrp',
    cardano: 'ada'
}

const coinLabels = {
    bitcoin: 'Bitcoin (BTC)',
    ethereum: 'Ethereum (ETH)',
    ripple: 'Ripple (XRP)',
    cardano: 'Cardano (ADA)'
}

const priceHistory = useState('priceHistory', () => [])
const filteredHistory = ref([])
const startDate = ref(null)
const endDate = ref(null)
const selectedCoin = ref('')
const showModal = ref(false)
const showHistory = ref(false)
const showCurrentTable = ref(true)
const isLoading = ref(true)
const currentValue = ref([])
const changes = ref({})

const getChangeClass = (val) => (val >= 0 ? 'increase' : 'decrease')
const sortByDateDesc = (arr) => arr.sort((a, b) => new Date(b.date) - new Date(a.date))

const openModal = (coin) => {
    selectedCoin.value = coin
    showModal.value = true
}

const fetchData = async () => {
    const responses = await Promise.all(
        trackedCoins.map(async (coin) => {
            try {
                const res = await fetch(
                    `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=eur&days=90`
                )
                return await res.json()
            } catch (err) {
                console.error(`Failed to fetch data for ${coin}:`, err)
                return null
            }
        })
    )

    const dateMap = new Map()
    trackedCoins.forEach((coin, i) => {
        responses[i]?.prices?.forEach(([timestamp, price]) => {
            const date = new Date(timestamp).toISOString().split('T')[0]
            if (!dateMap.has(date)) dateMap.set(date, { date })
            dateMap.get(date)[coin] = price.toFixed(2)
        })
    })

    priceHistory.value = sortByDateDesc([...dateMap.values()])
}

const calculateChanges = () => {
    const sorted = priceHistory.value
    if (!sorted.length) return

    const current = sorted[0]
    const getPastDate = (offset) =>
        sorted.find((e) => new Date(e.date) <= new Date(new Date(current.date).setDate(new Date(current.date).getDate() - offset)))

    const pastDay = getPastDate(1)
    const pastWeek = getPastDate(7)

    trackedCoins.forEach((coin) => {
        const now = parseFloat(current[coin])
        const day = pastDay ? parseFloat(pastDay[coin]) : null
        const week = pastWeek ? parseFloat(pastWeek[coin]) : null
        changes.value[coin] = {
            oneDay: day ? ((now - day) / day * 100).toFixed(2) : 'N/A',
            week: week ? ((now - week) / week * 100).toFixed(2) : 'N/A'
        }
    })
}

const filterByDate = () => {
    if (!startDate.value || !endDate.value) {
        reset()
        return
    }

    const start = new Date(startDate.value)
    const end = new Date(endDate.value)

    filteredHistory.value = sortByDateDesc(
        priceHistory.value.filter((entry) => {
            const date = new Date(entry.date)
            return date >= start && date <= end
        })
    ).slice(0, 20)

    showCurrentTable.value = false
    showHistory.value = true
}

const toggleHistory = () => {
    showHistory.value = !showHistory.value
    showCurrentTable.value = true
}

const reset = () => {
    filteredHistory.value = sortByDateDesc([...priceHistory.value]).slice(0, 20)
    startDate.value = endDate.value = null
    showCurrentTable.value = true
    showHistory.value = false
}

onMounted(async () => {
    if (!priceHistory.value.length) {
        await fetchData()
        console.log('fetched fresh')
    } else {
        console.log('using cached')
    }

    filteredHistory.value = priceHistory.value.slice(0, 20)
    currentValue.value = [filteredHistory.value[0]]
    calculateChanges()
    isLoading.value = false
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap');

body {
    margin: 0;
    padding: 0;
    background: #f9f9f9;
    font-family: 'Inter', sans-serif;
    color: #1f1f1f;
}

.wrapper {
    margin: 0 auto;
    padding: 2rem;
    background-color: #fff;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
}

.greeting {
    font-size: 3rem;
    font-weight: 600;
    margin-bottom: 3rem;
    text-align: center;
    font-family: "Rubik Glitch", system-ui;
    font-weight: 400;
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

.filters {
    margin-bottom: 1rem;
}

input[type='date'],
button {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border-radius: 6px;
    border: 1px solid #ccc;
}

input[type='date'] {
    margin-right: 0.5rem;
}

button {
    background-color: #0066cc;
    margin-left: 0.5rem;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

button:hover {
    background-color: #004a99;
}

.resetButton {
    background-color: #888;
}

.resetButton:hover {
    background-color: #5f5f5f;
}

.crypto-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
    font-size: 0.95rem;
}

.crypto-table th,
.crypto-table td {
    padding: 0.75rem 1rem;
    text-align: center;
    border: 1px solid #e0e0e0;
}

.crypto-table th {
    background-color: #cccccc;
    font-weight: 600;
    color: #333;
}

.crypto-table tbody tr:hover {
    background-color: #f0f0f0;
}

.currencyColumn {
    display: flex;
    align-items: flex-start;
}

.increase {
    color: green;
}

.decrease {
    color: crimson;
}

.language-select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    border: 1px solid #cccccc;
    border-radius: 6px;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    font-size: 1rem;
    font-family: 'Inter', sans-serif;
    color: #333;
    position: relative;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 12px;
    transition: border-color 0.3s, box-shadow 0.3s;
    cursor: pointer;
    margin-left: 1rem;
}

.language-select:hover {
    border-color: #888;
}

.language-select:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
}
</style>
