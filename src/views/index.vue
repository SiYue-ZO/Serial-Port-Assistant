<script setup>
import { ref } from 'vue';
import portSetBar from './portSetBar.vue';
import showData from './showData.vue';
import sendbar from './sendbar.vue';

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

const portSetBarRef = ref(null);

const handleSendData = (data) => {
    if (portSetBarRef.value) {
        portSetBarRef.value.sendData(data)
    }
}

</script>

<template>
    <div class="app-container">
        <portSetBar ref="portSetBarRef" @data-received="handleDataFromPort" />


        <div class="main-window">
            <showData ref="dataDisplay" />
            <sendbar @send-data="handleSendData" />
        </div>
    </div>
</template>


<style scoped>
.app-container {
    display: flex;
    height: 97vh;
    background: #f5f7fa;
    
}

.main-window {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-left: 310px;
    overflow: hidden;
    min-width: 0; /* 防止flex子项溢出 */
}

@media (max-width: 768px) {
    .main-window {
        margin-left: 0;
    }
}
</style>