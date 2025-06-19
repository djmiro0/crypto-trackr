<template>
    <select class="language-select" v-model="selected" @change="emit('langChange', selected)">
        <option value="en">English</option>
        <option value="de">Deutsch</option>
    </select>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['langChange'])

const selected = ref('en')

</script>

<style>
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