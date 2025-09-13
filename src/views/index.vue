<script setup>

    import { ref } from 'vue';
    import portSetBar from './portSetBar.vue';
    import showData from './showData.vue';


   const dataDisplay = ref(null)

    const handleDataFromPort = (data) => {
    if (dataDisplay.value) {
        dataDisplay.value.handleDataReceived(data)
    }
    }


	


</script>

<template>
    
    <portSetBar @data-received="handleDataFromPort" />
    <showData ref="dataDisplay" />
</template>

<style scoped>

</style>