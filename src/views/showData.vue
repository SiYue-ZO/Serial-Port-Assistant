<script setup>
import { ref, computed } from 'vue'

// 响应式数据
const receivedData = ref('')
const autoScroll = ref(true)

// 方法
const clearReceivedData = () => {
    receivedData.value = '';
};

const scrollToBottom = () => {
    const container = document.querySelector('.received-data-container');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
};

const copyReceivedData = () => {
    navigator.clipboard.writeText(receivedData.value).then(() => {
        // 可以在这里添加复制成功的提示
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
};

// 处理接收到的数据
const handleDataReceived = (data) => {
    receivedData.value += data;
    if (autoScroll.value) {
        scrollToBottom();
    }
};

// 定义事件
const emit = defineEmits(['data-received']);

// 监听数据接收
defineExpose({
    handleDataReceived
});
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
                    <label class="auto-scroll-label">
                        <input type="checkbox" v-model="autoScroll">
                        自动滚动
                    </label>
                    <button class="control-btn" @click="clearReceivedData" title="清空数据">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="control-btn" @click="copyReceivedData" title="复制数据">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            
            <div class="received-data-container">
                <pre class="received-data">{{ receivedData }}</pre>
            </div>
        </div>
    </div>
</template>

<style scoped>
.main-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: #f0f2f5;
    margin-left: 320px; /* 为侧边栏留出空间 */
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
