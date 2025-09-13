<script setup>
import { ref } from 'vue'

//缓冲区
const dataBuffer = ref(new Uint8Array());

// 响应式数据
const receivedData = ref('')
const autoScroll = ref(true)
const dataFormat = ref('hex') // 默认使用hex格式

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
        default:
            return Array.from(uint8Array)
                .map(b => b.toString(16).padStart(2, '0').toUpperCase())
                .join(' ');
    }
}




// 解析十六进制字符串数据
const parseHexString = (data) => {
    try {
        const cleanedData = data.replace(/\s+/g, '').toUpperCase() // 去除空格并转换为大写
        console.log("Cleaned Hex Data:", cleanedData); // 调试输出清理后的数据
        
        // 如果数据为空或含有非法字符，则返回空数组
        if (!cleanedData || !/^[0-9A-Fa-f]+$/.test(cleanedData)) {
            console.error('Invalid hex string format:', cleanedData)
            return new Uint8Array()
        }
        
        // 将十六进制字符串转换为字节数组
        return new Uint8Array(cleanedData.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)))
    } catch (e) {
        console.error('Error parsing hex string:', e)
        return new Uint8Array()
    }
}

// 根据选择的格式返回数据
const formatBasedOnType = (uint8Array) => {
    switch (dataFormat.value) {
        case 'hex':
            return uint8Array.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
        case 'ascii':
            return uint8Array.map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : `[${b.toString(16).padStart(2, '0').toUpperCase()}]`).join('')
        default:
            return uint8Array.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
    }
}

// 处理接收到的数据
const handleDataReceived = (data) => {
    if (!data) return;
    
    console.log("Data received in showData:", data);
    
    // 将新数据添加到缓冲区
    const newData = data instanceof Uint8Array ? data : new Uint8Array(data);
    const combinedData = new Uint8Array(dataBuffer.value.length + newData.length);
    combinedData.set(dataBuffer.value);
    combinedData.set(newData, dataBuffer.value.length);
    
    // 查找完整的数据帧（假设以AA开头，AF结尾）
    let startIndex = 0;
    while (startIndex < combinedData.length) {
        // 查找帧头AA
        if (combinedData[startIndex] === 0xAA) {
            // 查找帧尾AF
            let endIndex = startIndex + 1;
            while (endIndex < combinedData.length) {
                if (combinedData[endIndex] === 0xAF) {
                    // 找到完整帧，提取并显示
                    const frame = combinedData.slice(startIndex, endIndex + 1);
                    const formattedData = formatData(frame);
                    const timestamp = new Date().toLocaleTimeString();
                    receivedData.value += `\n[${timestamp}] ${formattedData}`;
                    
                    // 更新缓冲区，移除已处理的数据
                    dataBuffer.value = combinedData.slice(endIndex + 1);
                    startIndex = endIndex + 1;
                    break;
                }
                endIndex++;
            }
            
            // 如果没找到帧尾，保留当前帧头位置的数据在缓冲区
            if (endIndex >= combinedData.length) {
                dataBuffer.value = combinedData.slice(startIndex);
                break;
            }
        } else {
            // 不是帧头，跳过
            startIndex++;
        }
    }
    
    // 自动滚动到底部
    if (autoScroll.value) {
        scrollToBottom();
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
                    <!-- 只保留 HEX 和 ASCII 数据格式选择 -->
                    <select v-model="dataFormat" class="format-select">
                        <option value="hex">HEX</option>
                        <option value="ascii">ASCII</option>
                    </select>
                    <label class="auto-scroll-label">
                        <input type="checkbox" v-model="autoScroll">
                        自动滚动
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
/* 保持原有样式不变 */
.main-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: #f0f2f5;
    margin-left: 320px;
}

.data-container {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    height: calc(100vh - 40px);
    display: flex;
    flex-direction: column;
}

.card-title {
    margin: 0 0 20px 0;
    font-size: 1.2rem;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
}

.data-header {
    padding: 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.data-controls {
    display: flex;
    align-items: center;
}

.format-select {
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    color: #666;
    font-size: 0.9rem;
    margin-right: 10px;
    cursor: pointer;
}

.format-select:hover {
    border-color: #999;
}

.auto-scroll-label {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #666;
    font-size: 0.9rem;
    cursor: pointer;
}

.control-btn {
    padding: 8px;
    background: #f0f2f5;
    color: #666;
    margin-left: 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.control-btn:hover {
    background: #e4e6eb;
}

.received-data-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: #fafafa;
}

.received-data {
    margin: 0;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: #333;
}

/* 响应式布局 */
@media (max-width: 768px) {
    .main-content {
        margin-left: 0;
        padding: 10px;
    }

    .data-container {
        height: 60vh;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .main-content {
        margin-left: 280px;
    }
}

@media (min-width: 1025px) {
    .main-content {
        margin-left: 320px;
    }
}

/* 滚动条样式 */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #555;
}
</style>
