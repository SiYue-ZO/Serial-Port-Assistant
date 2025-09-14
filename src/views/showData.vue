<script setup>
import { ref,nextTick } from 'vue'

// 响应式数据
const messages = ref([]);
const autoScroll = ref(true)
const dataFormat = ref('hex') // 默认使用hex格式
const showTimestamp = ref(true) // 是否显示时间戳

// 清空所有消息
const clearMessages = () => {
    messages.value = [];
}


// 滚动到底部
const scrollToBottom = () => {
    const container = document.querySelector('.chat-container')
    if (container) {
        // 使用 requestAnimationFrame 确保在 DOM 更新后执行滚动
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight
        })
    }
}


// 复制所有消息到剪贴板
const copyMessages = () => {
    const text = messages.value.map(msg => 
        `[${msg.timestamp}] ${msg.content}`
    ).join('\n');
    
    navigator.clipboard.writeText(text)
        .then(() => {
            // 复制成功时的提示
        })
        .catch(err => console.error('Failed to copy text:', err))
}

// 处理接收到的数据
const handleDataReceived = (data) => {
    if (!data) return;
    
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
    
    const formattedData = formatBasedOnType(uint8Array);
    const timestamp = new Date().toLocaleTimeString();
    
    // 使用 nextTick 确保 DOM 更新后再滚动
    nextTick(() => {
        messages.value.push({
            type: 'received',
            timestamp,
            content: formattedData
        });
        
        if (autoScroll.value) {
            scrollToBottom();
        }
    });
}


// 处理发送的数据
const handleDataSent = (data) => {
    if (!data) return;
    
    let uint8Array;
    if (data instanceof Uint8Array) {
        uint8Array = data;
    } else if (data instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(data);
    } else if (ArrayBuffer.isView(data)) {
        uint8Array = new Uint8Array(data.buffer);
    } else if (data.data && data.format) {
        if (data.format === 'hex') {
            const cleanHex = data.data.replace(/\s+/g, '');
            if (!/^[0-9A-Fa-f]+$/.test(cleanHex)) {
                console.error('Invalid hex format');
                return;
            }
            uint8Array = new Uint8Array(cleanHex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
        } else {
            uint8Array = new TextEncoder().encode(data.data);
        }
    } else {
        console.error('Invalid data type:', typeof data);
        return;
    }
    
    const formattedData = formatBasedOnType(uint8Array);
    const timestamp = new Date().toLocaleTimeString();
    
    // 使用 nextTick 确保 DOM 更新后再滚动
    nextTick(() => {
        messages.value.push({
            type: 'sent',
            timestamp,
            content: formattedData
        });
        
        if (autoScroll.value) {
            scrollToBottom();
        }
    });
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

// 定义事件
const emit = defineEmits(['data-received'])

// 监听收发数据
defineExpose({
    handleDataReceived,
    handleDataSent
})
</script>

<template>
    <div class="main-content">
        <div class="card data-container">
            <div class="data-header">
                <h2 class="card-title">
                    <i class="fas fa-inbox"></i> 
                    数据显示
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
                        <button class="control-btn" @click="clearMessages" title="清空所有数据">
                            <i class="fas fa-trash">清空</i>
                        </button>
                        <button class="control-btn" @click="copyMessages" title="复制所有数据">
                            <i class="fas fa-copy">复制</i>
                        </button>
                    </div>
            </div>
            <!-- 数据展示区域 -->
            <div class="chat-container">
                <div class="message" :class="message.type" v-for="(message, index) in messages" :key="index">
                    <div class="bubble">
                        <span class="timestamp" v-if="showTimestamp">{{ message.timestamp }}</span>
                        <span class="content">{{ message.content }}</span>
                    </div>
                </div>
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
    min-height: 0;
    height: calc(100% - 10px); /* 减去间距 */
    box-sizing: border-box; /* 确保边框和内边距不会增加总高度 */
}


.data-container {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box; /* 确保边框和内边距不会增加总高度 */
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
    flex-wrap: wrap;
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

.chat-container {
    height: calc(100% - 20px); /* 减去内边距的高度 */
    overflow-y: auto;
    padding: 20px;
    background: #f5f7fa;
    display: flex;
    flex-direction: column;
    box-sizing: border-box; /* 确保内边距不会增加总高度 */
}

.message {
    display: flex;
    margin-bottom: 16px;
    animation: slideIn 0.3s ease-out;
}

.message.received {
    justify-content: flex-start;
}

.message.sent {
    justify-content: flex-end;
}

.bubble {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 12px;
    position: relative;
    word-wrap: break-word;
}

.message.received .bubble {
    background: #ffffff;
    border-top-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message.sent .bubble {
    background: #409eff;
    color: white;
    border-top-right-radius: 4px;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.timestamp {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-bottom: 4px;
    display: block;
}

.content {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 滚动条美化 */
.chat-container::-webkit-scrollbar {
    width: 6px;
}

.chat-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.chat-container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
}

.chat-container::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* 响应式布局 */
@media (max-width: 768px) {
    .data-controls {
        flex-direction: column;
        align-items: stretch;
    }
    
    .control-btn {
        justify-content: center;
    }
}
</style>
