<script setup>
import { ref, computed } from 'vue'

// 检查浏览器是否支持 Web Serial API
if (!("serial" in navigator)) {
    console.error("Web Serial API is not supported in this browser.");
}

// 响应式数据
const port = ref(null);
const isConnected = ref(false);
const reader = ref(null);
const keepReading = ref(false);
const baudRate = ref('115200')
const dataBits = ref('8')
const parity = ref('none')
const stopBits = ref('1')

// 计算属性
const statusMessage = computed(() => {
    return isConnected.value ? '串口已连接' : '未连接'
})

// 方法
const connectSerialPort = async () => {
    try {
        // 请求用户选择一个串口
        port.value = await navigator.serial.requestPort();
        
        // 准备串口配置
        const options = {
            baudRate: parseInt(baudRate.value),
            dataBits: parseInt(dataBits.value),
            parity: parity.value,
            stopBits: parseInt(stopBits.value)
        };
        
        // 打开串口
        await port.value.open(options);
        isConnected.value = true;
        
        // 触发父组件事件
        emit('connection-change', {
            connected: true,
            port: port.value,
            ...options
        });
        
        // 成功连接后，启动数据读取循环
        keepReading.value = true;
        readSerialData();
    } catch (error) {
        isConnected.value = false;
    }
};

const disconnectSerialPort = async () => {
    if (port.value) {
        try {
            // 停止读取循环
            keepReading.value = false;
            if (reader.value) {
                await reader.value.cancel();
                await reader.value.releaseLock();
            }
            
            // 关闭串口
            await port.value.close();
            port.value = null;
            isConnected.value = false;
            
            // 触发父组件事件
            emit('connection-change', {
                connected: false
            });
        } catch (error) {
            // 静默处理断开连接错误
        }
    }
};

const readSerialData = async () => {
    if (!port.value || !keepReading.value) return;
    
    try {
        while (port.value.readable && keepReading.value) {
            reader.value = port.value.readable.getReader();
            try {
                while (keepReading.value) {
                    const { value, done } = await reader.value.read();
                    if (done) break;
                    
                    // 将接收到的数据转换为文本并发送到 showData 组件
                    const text = new TextDecoder().decode(value);
                    emit('data-received', text);
                }
            } catch (error) {
                // 静默处理读取错误
            } finally {
                if (reader.value) {
                    await reader.value.releaseLock();
                }
            }
        }
    } catch (error) {
        // 静默处理循环错误
    }
};

// 定义事件
const emit = defineEmits(['connection-change', 'data-received']);

// 连接/断开处理
const handleConnection = () => {
    if (isConnected.value) {
        disconnectSerialPort();
    } else {
        connectSerialPort();
    }
};
</script>

<template>
    <div class="sidebar">
        <div class="card component-container">
            <h2 class="card-title">
                <i class="fas fa-cog"></i> 
                串口连接配置
            </h2>
            
            <div class="form-group">
                <label for="baud-rate">波特率</label>
                <select id="baud-rate" v-model="baudRate" :disabled="isConnected">
                    <option value="9600">9600</option>
                    <option value="19200">19200</option>
                    <option value="38400">38400</option>
                    <option value="57600">57600</option>
                    <option value="115200">115200</option>
                </select>
            </div>

            <div class="form-group">
                <label for="data-bits">数据位</label>
                <select id="data-bits" v-model="dataBits" :disabled="isConnected">
                    <option value="7">7</option>
                    <option value="8" selected>8</option>
                </select>
            </div>

            <div class="form-group">
                <label for="parity">校验位</label>
                <select id="parity" v-model="parity" :disabled="isConnected">
                    <option value="none" selected>无校验</option>
                    <option value="even">偶校验</option>
                    <option value="odd">奇校验</option>
                </select>
            </div>

            <div class="form-group">
                <label for="stop-bits">停止位</label>
                <select id="stop-bits" v-model="stopBits" :disabled="isConnected">
                    <option value="1" selected>1</option>
                    <option value="2">2</option>
                </select>
            </div>
            
            <div class="button-container">
                <button @click="handleConnection" :class="{ connected: isConnected }">
                    <i class="fas" :class="isConnected ? 'fa-plug-circle-xmark' : 'fa-plug-circle-plus'"></i>
                    {{ isConnected ? '断开连接' : '连接串口' }}
                </button>
            </div>
            
            <div class="status">
                <div class="status-indicator" :class="{ connected: isConnected }"></div>
                <span>{{ statusMessage }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: 320px;
    background: #f5f5f5;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    z-index: 1000;
}

.component-container {
    background: #fff;
    border-radius: 0;
    box-shadow: none;
    padding: 20px;
    margin: 0;
    min-height: 100vh;
    box-sizing: border-box;
}

.card-title {
    margin: 0 0 20px 0;
    font-size: 1.2rem;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    color: #666;
    font-size: 0.9rem;
}

.form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #fff;
    font-size: 0.9rem;
}

.form-group select:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
}

.button-container {
    margin: 20px 0;
    position: sticky;
    bottom: 0;
    background: #fff;
    padding: 10px 0;
    border-top: 1px solid #eee;
}

button {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 4px;
    background-color: #4CAF50;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #45a049;
}

button.connected {
    background-color: #f44336;
}

button.connected:hover {
    background-color: #da190b;
}

.status {
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 0.9rem;
    color: #666;
    background: #fff;
    padding: 10px 0;
}

.status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #ccc;
}

.status-indicator.connected {
    background-color: #4CAF50;
}

/* 响应式布局 */
@media (max-width: 768px) {
    .sidebar {
        width: 100%;
        height: auto;
        position: relative;
    }
    
    .component-container {
        min-height: auto;
        padding: 15px;
    }

    .button-container {
        position: relative;
        margin-top: 15px;
    }

    .status {
        position: relative;
        bottom: auto;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .sidebar {
        width: 280px;
    }
}

@media (min-width: 1025px) {
    .sidebar {
        width: 320px;
    }
}

/* 滚动条样式 */
.sidebar::-webkit-scrollbar {
    width: 6px;
}

.sidebar::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.sidebar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
    background: #555;
}
</style>
