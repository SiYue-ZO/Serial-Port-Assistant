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

const handleDataSent = (data) => {
    console.log('Data sent in index:', data);
    if (dataDisplay.value) {
        console.log('Passing sent data to showData:', data);
        dataDisplay.value.handleDataSent(data);
    } else {
        console.log('dataDisplay ref is not set');
    }
}

const portSetBarRef = ref(null);

const handleSendData = (data) => {
    if (portSetBarRef.value) {
        // 在发送数据前，先显示在发送数据区域
        handleDataSent(data);
        // 然后发送数据
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
    height: 97vh;
    padding: 10px;
    box-sizing: border-box;
    gap: 10px; /* 添加组件之间的间距 */
}


@media (max-width: 768px) {
    .main-window {
        margin-left: 0;
    }
}
</style>
