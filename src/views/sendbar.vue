<script setup>
import { ref, watch} from 'vue'

// 响应式数据
const sendData = ref('')
const dataFormat = ref('hex') // 默认使用hex格式
const autoSend = ref(false)
const autoSendInterval = ref(1000) // 默认1秒
let autoSendTimer = null

// 清空发送数据
const clearSendData = () => {
    sendData.value = ''
}



// 发送数据
const handleSend = () => {
    if (!sendData.value) return
    
    // 直接发送原始数据，不做额外格式化
    emit('send-data', {
        data: sendData.value,
        format: dataFormat.value
    })
}


// 处理自动发送
const handleAutoSend = () => {
    if (autoSend.value) {
        // 验证发送间隔
        if (autoSendInterval.value < 100) {
            autoSendInterval.value = 100;
            console.warn('Auto send interval too short, set to minimum 100ms');
        }
        
        // 清除现有定时器
        if (autoSendTimer) {
            clearInterval(autoSendTimer);
        }
        
        // 设置新的定时器
        autoSendTimer = setInterval(() => {
            if (sendData.value) {
                handleSend();
            }
        }, autoSendInterval.value);
        
        console.log('Auto send enabled with interval:', autoSendInterval.value, 'ms');
    } else {
        // 停止自动发送
        if (autoSendTimer) {
            clearInterval(autoSendTimer);
            autoSendTimer = null;
        }
        console.log('Auto send disabled');
    }
}

// 监听自动发送状态变化
watch(autoSend, (newValue, oldValue) => {
    if (newValue !== oldValue) {
        handleAutoSend();
    }
})

// 监听自动发送间隔变化
watch(autoSendInterval, (newValue, oldValue) => {
    if (newValue !== oldValue && autoSend.value) {
        handleAutoSend();
    }
})


// 定义事件
const emit = defineEmits(['send-data'])
</script>

<template>
    <div class="send-container">
        <div class="send-header">
            <h2 class="card-title">
                <i class="fas fa-paper-plane"></i> 
                发送数据
            </h2>
            <div class="send-controls">
                <select v-model="dataFormat" class="format-select">
                    <option value="hex">HEX</option>
                    <option value="ascii">ASCII</option>
                </select>
                <label class="auto-send-label">
                    <input type="checkbox" v-model="autoSend">
                    自动发送
                </label>
                <input 
                    v-if="autoSend"
                    type="number" 
                    v-model="autoSendInterval" 
                    class="interval-input"
                    min="100"
                    step="100"
                >
                <span v-if="autoSend" class="interval-unit">ms</span>
                <button class="control-btn" @click="clearSendData" title="清空数据">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="control-btn send-btn" @click="handleSend" title="发送数据">
                    <i class="fas fa-paper-plane"></i>
                    发送
                </button>
            </div>
        </div>
        <div class="send-input-container">
            <textarea
                v-model="sendData"
                class="send-input"
                placeholder="输入要发送的数据..."
                rows="3"
            ></textarea>
        </div>
    </div>
</template>

<style scoped>
.send-container {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin: 0px;
    margin-top: 0;
}

.send-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
}

.card-title {
    margin: 0;
    font-size: 1.2rem;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 8px;
}

.send-controls {
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

.auto-send-label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #606266;
    font-size: 0.9rem;
    cursor: pointer;
}

.interval-input {
    width: 80px;
    padding: 6px 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 0.9rem;
    transition: all 0.3s;
}

.interval-input:focus {
    border-color: #409eff;
    outline: none;
}

.control-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
}

.control-btn:hover {
    transform: translateY(-1px);
}

.send-btn {
    background: #409eff;
    color: white;
}

.send-btn:hover {
    background: #66b1ff;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
}

.send-input-container {
    margin-right: 20px;
}

.send-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    resize: vertical;
    min-height: 80px;
    transition: all 0.3s;
}

.send-input:focus {
    outline: none;
    border-color: #409eff;
    box-shadow: 0 0 8px rgba(64, 158, 255, 0.2);
}

@media (max-width: 768px) {
    .send-container {
        margin: 10px;
    }
    
    .send-controls {
        flex-direction: column;
        align-items: stretch;
    }
    
    .format-select,
    .interval-input {
        width: 100%;
    }
}
</style>
