<template>
    <div class="modal-backdrop" @click.self="close">
        <div class="modal-content">
            <h2>Bitcoin Price History</h2>
            <div class="date-filters">
                <label>From:
                    <input type="date" v-model="startDate" />
                </label>
                <label>To:
                    <input type="date" v-model="endDate" />
                </label>
                <button @click="filterChart">Update</button>
            </div>

            <div class="chart-container">
                <highchart :options="chartOptions" />
            </div>
            <button class="close-button" @click="close">Close</button>
        </div>
    </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'

const props = defineProps({
    visible: Boolean,
    onClose: Function,
    fullHistory: Array,
    coin: String
})

const emit = defineEmits(['close'])

const startDate = ref('')
const endDate = ref('')
const chartOptions = ref({})
const coin = ref(props.coin)
const coinColors = ref({
    bitcoin: '#f7931a',
    ethereum: '#3c3c3d',
    solana: '#00ffa3',
    cardano: '#0033ad',
    polkadot: '#e6007a',
    avalanche: '#e84142',
    binancecoin: '#f3ba2f',
    ripple: '#346aa9',
    litecoin: '#bebebe',
    dogecoin: '#c2a633'
})

const close = () => {
    emit('close')
}

const filterChart = () => {
    if (!startDate.value || !endDate.value) return

    const start = new Date(startDate.value)
    const end = new Date(endDate.value)

    const filtered = props.fullHistory.filter(entry => {
        const date = new Date(entry.date)
        return date >= start && date <= end
    })

    updateChart(filtered)
}

const updateChart = (data) => {
    chartOptions.value = {
        chart: {
            type: 'line',
            height: 300,
            backgroundColor: 'transparent'
        },
        title: {
            text: coin.value
        },
        xAxis: {
            categories: data.map(i => i.date).reverse(),
            labels: { rotation: -45, style: { fontSize: '10px' } }
        },
        yAxis: {
            title: { text: 'Price (€)' },
        },
        tooltip: {
            valueSuffix: ' €'
        },
        legend: { enabled: false },
        credits: { enabled: false },
        series: [
            {
                name: coin.value,
                data: data.map(i => parseFloat(i[coin.value])),
                color: coinColors.value[coin.value] || '#000'
            }
        ]

    }
}

watchEffect(() => {
    if (props.visible && props.fullHistory.length) {
        const initialData = props.fullHistory.slice(0, 20)
        updateChart(initialData)
    }
})
</script>

<style scoped>
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    width: 90%;
    max-width: 700px;
    position: relative;
}

.date-filters {
    margin-bottom: 1rem;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.date-filters input[type="date"] {
    padding: 0.4rem;
}

.chart-container {
    margin-top: 1rem;
}

.close-button {
    margin-top: 1.5rem;
    background-color: #0066cc;
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    cursor: pointer;
}

.close-button:hover {
    background-color: #004a99;
}
</style>
