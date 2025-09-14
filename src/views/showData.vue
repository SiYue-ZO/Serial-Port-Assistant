<script setup>
import { ref } from 'vue'

//缓冲区
const dataBuffer = ref(new Uint8Array());

// 响应式数据
const receivedData = ref('')
const autoScroll = ref(true)





// 响应式数据
const dataFormat = ref('hex') // 默认使用hex格式
const showTimestamp = ref(true) // 是否显示时间戳
const lineBreak = ref(true) // 是否在每条数据后添加换行

// 格式化数据的函数
const formatData = (data) => {
    console.log("Formatting data:", data);
    
    // 确保数据是Uint8Array格式
    let uint8Array;
    if (data instanceof Uint8Array) {
        uint8Array = data;
    } else if (data instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(data);
    } else if (ArrayBuffer.isView(data)) {
        uint8Array = new Uint8Array(data.buffer);
    } else {
        console.error('Invalid data type:', typeof data);
        return '[数据类型错误]';
    }

    console.log("Converted to Uint8Array:", uint8Array);

    // 根据选择的格式处理数据
    switch (dataFormat.value) {
        case 'hex':
            return Array.from(uint8Array)
                .map(b => b.toString(16).padStart(2, '0').toUpperCase())
                .join(' ');
        case 'ascii':
            return Array.from(uint8Array)
                .map(b => {
                    const char = String.fromCharCode(b);
                    return (b >= 32 && b <= 126) ? char : `[${b.toString(16).padStart(2, '0').toUpperCase()}]`;
                })
                .join('');
        case 'decimal':
            return Array.from(uint8Array)
                .map(b => b.toString())
                .join(' ');
        case 'binary':
            return Array.from(uint8Array)
                .map(b => b.toString(2).padStart(8, '0'))
                .join(' ');
        default:
            return Array.from(uint8Array)
                .map(b => b.toString(16).padStart(2, '0').toUpperCase())
                .join(' ');
    }
}











// 清空接收到的数据
const clearReceivedData = () => {
    receivedData.value = '';
    dataBuffer.value = new Uint8Array();
}


// 滚动到底部
const scrollToBottom = () => {
    const container = document.querySelector('.received-data-container')
    if (container) {
        container.scrollTop = container.scrollHeight
    }
}

// 复制接收到的数据到剪贴板
const copyReceivedData = () => {
    navigator.clipboard.writeText(receivedData.value)
        .then(() => {
            // 复制成功时的提示（可以改进为弹窗等交互）
        })
        .catch(err => console.error('Failed to copy text:', err))
}



// 处理接收到的数据
const handleDataReceived = (data) => {
    if (!data) return;
    
    console.log("Data received in showData:", data);
    
    // 确保数据是Uint8Array格式
    let uint8Array;
    if (data instanceof Uint8Array) {
        uint8Array = data;
    } else if (data instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(data);
    } else if (ArrayBuffer.isView(data)) {
        uint8Array = new Uint8Array(data.buffer);
    } else {
        console.error('Invalid data type:', typeof data);
        return;
    }
    
    // 根据选择的格式处理数据
    const formattedData = formatBasedOnType(uint8Array);
    
    // 添加时间戳并显示
    const timestamp = new Date().toLocaleTimeString();
    receivedData.value += `\n[${timestamp}] ${formattedData}`;
    
    // 自动滚动到底部
    if (autoScroll.value) {
        scrollToBottom();
    }
}

// 根据选择的格式返回数据
const formatBasedOnType = (uint8Array) => {
    switch (dataFormat.value) {
        case 'hex':
            return Array.from(uint8Array)
                .map(b => b.toString(16).padStart(2, '0').toUpperCase())
                .join(' ');
        case 'ascii':
            return Array.from(uint8Array)
                .map(b => {
                    // 只显示可打印ASCII字符（32-126），其他显示为十六进制
                    const char = String.fromCharCode(b);
                    return (b >= 32 && b <= 126) ? char : `[${b.toString(16).padStart(2, '0').toUpperCase()}]`;
                })
                .join('');
        default:
            return Array.from(uint8Array)
                .map(b => b.toString(16).padStart(2, '0').toUpperCase())
                .join(' ');
    }
}









// 定义事件
const emit = defineEmits(['data-received'])

// 监听数据接收
defineExpose({
    handleDataReceived
})
</script>

<template>
    <div class="main-content">
        <div class="card data-container">
            <div class="data-header">
                <h2 class="card-title">
                    <i class="fas fa-inbox"></i> 
                    接收数据
                </h2>
                    <div class="data-controls">
                        <select v-model="dataFormat" class="format-select">
                            <option value="hex">HEX</option>
                            <option value="ascii">ASCII</option>
                            <option value="decimal">DECIMAL</option>
                            <option value="binary">BINARY</option>
                        </select>
                        <label class="auto-scroll-label">
                            <input type="checkbox" v-model="autoScroll">
                            自动滚动
                        </label>
                        <label class="timestamp-label">
                            <input type="checkbox" v-model="showTimestamp">
                            显示时间戳
                        </label>
                        <button class="control-btn" @click="clearReceivedData" title="清空数据">
                            <i class="fas fa-trash">清空数据</i>
                        </button>
                        <button class="control-btn" @click="copyReceivedData" title="复制数据">
                            <i class="fas fa-copy">复制数据</i>
                        </button>
                    </div>
            </div>
            <!-- 接收数据展示区域 -->
            <div class="received-data-container">
                <pre class="received-data">{{ receivedData }}</pre>
            </div>
        </div>
    </div>
</template>

<style scoped>
.main-content {
    flex: 1;
    overflow: hidden;
    background: #f5f7fa;
    display: flex;
    flex-direction: column;
    padding: 0px;
    min-height: 0; /* 防止flex子项溢出 */
}

.data-container {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    min-height: 0; /* 防止flex子项溢出 */
    flex: 1; /* 填充可用空间 */
}

.data-header {
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fafbfc;
    border-radius: 8px 8px 0 0;
}

.card-title {
    margin: 0;
    font-size: 1.2rem;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 8px;
}

.data-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

.format-select {
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: white;
    color: #606266;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s;
}

.format-select:hover {
    border-color: #409eff;
}

.control-btn {
    padding: 8px 16px;
    background: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 6px;
}

.control-btn:hover {
    background: #66b1ff;
    transform: translateY(-1px);
}

.received-data-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: #ffffff;
    border-radius: 0 0 8px 8px;
    min-height: 0; /* 防止flex子项溢出 */
}

.received-data {
    margin: 0;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: #2c3e50;
}

/* 添加滚动条美化 */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f5f7fa;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: #909399;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #606266;
}
</style>

