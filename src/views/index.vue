<script setup>
import { ref } from 'vue';
import portSetBar from './portSetBar.vue';
import showData from './showData.vue';

const dataDisplay = ref(null);

const handleDataFromPort = (data) => {
    console.log('Data received in index:', data);
    if (dataDisplay.value) {
        console.log('Passing data to showData:', data);
        dataDisplay.value.handleDataReceived(data);
    } else {
        console.log('dataDisplay ref is not set');
    }
}
</script>




<template>
    
    <portSetBar @data-received="handleDataFromPort" />
    <showData ref="dataDisplay" />
</template>

<style scoped>

</style>