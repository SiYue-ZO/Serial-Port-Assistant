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
const writer = ref(null);  // 添加这行
// 计算属性
const statusMessage = computed(() => {
    return isConnected.value ? '串口已连接' : '未连接'
})

// 方法
const connectSerialPort = async () => {
    try {
        // 检查是否已经连接
        if (port.value && isConnected.value) {
            console.log('Port already connected');
            return;
        }
        
        port.value = await navigator.serial.requestPort();
        
        //创建一个配置对象
        const options = {
            baudRate: parseInt(baudRate.value),
            dataBits: parseInt(dataBits.value),
            parity: parity.value,
            stopBits: parseInt(stopBits.value),
            flowControl: 'none'  // 添加流控制设置
        };
        
        console.log('Opening port with options:', options);
        //等待用户确认连接
        await port.value.open(options);
        isConnected.value = true;
        
        // 获取并显示串口详细信息
        const portInfo = port.value.getInfo();
        console.log('Port info:', portInfo);
        
        // 获取信号状态
        const signals = await port.value.getSignals();
        console.log('Initial signals:', signals);
        
        emit('connection-change', {
            connected: true,
            port: port.value,
            ...options
        });
        
        keepReading.value = true;
        readSerialData();
    } catch (error) {
        console.error('Connection error:', error);
        isConnected.value = false;
        // 清理可能的部分连接状态
        if (port.value) {
            try {
                await port.value.close();
            } catch (closeError) {
                console.error('Error closing port:', closeError);
            }
            port.value = null;
        }
    }
};

const disconnectSerialPort = async () => {
    if (!port.value) {
        console.log('No port to disconnect');
        return;
    }
    
    try {
        // 停止读取循环
        keepReading.value = false;
        
        // 关闭读取器
        if (reader.value) {
            try {
                await reader.value.cancel();
                await reader.value.releaseLock();
            } catch (error) {
                console.error('Error closing reader:', error);
            }
            reader.value = null;
        }
        
        // 关闭写入器
        if (writer.value) {
            try {
                await writer.value.close();
            } catch (error) {
                console.error('Error closing writer:', error);
            }
            writer.value = null;
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
        console.error('Error disconnecting port:', error);
        // 即使出错也尝试清理状态
        port.value = null;
        isConnected.value = false;
        emit('connection-change', {
            connected: false,
            error: error.message
        });
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
                    
                    if (value && value.length > 0) {
                        console.log('Received data:', value);
                        emit('data-received', value);
                    }
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error reading serial data:', error);
                }
                // 发生错误时等待一小段时间后重试
                await new Promise(resolve => setTimeout(resolve, 100));
            } finally {
                if (reader.value) {
                    await reader.value.releaseLock();
                    reader.value = null;
                }
            }
            // 在重新获取reader之前稍作等待
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    } catch (error) {
        console.error('Error in readSerialData:', error);
        // 发生严重错误时等待更长时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (keepReading.value) {
            readSerialData();
        }
    }
}




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




const sendData = async (data) => {
    if (!port.value || !port.value.writable) {
        console.error('Port not available for writing');
        return;
    }
    
    try {
        const writer = port.value.writable.getWriter();
        
        try {
            let bytes;
            if (data.format === 'hex') {
                // 处理十六进制格式
                const cleanHex = data.data.replace(/\s+/g, '');
                if (!/^[0-9A-Fa-f]+$/.test(cleanHex)) {
                    throw new Error('Invalid hex format');
                }
                bytes = new Uint8Array(cleanHex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
            } else {
                // 处理ASCII格式
                bytes = new TextEncoder().encode(data.data);
            }
            
            // 发送数据
            await writer.write(bytes);
            console.log('Data sent successfully:', bytes);
            
            // 等待一小段时间确保数据发送完成
            await new Promise(resolve => setTimeout(resolve, 50));
            
        } finally {
            await writer.close();
        }
        
    } catch (error) {
        console.error('Error sending data:', error);
        throw error;
    }
}







// 暴露发送方法给父组件
defineExpose({
    sendData
});


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
    background: #ffffff;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    z-index: 1000;
    transition: all 0.3s ease;
}

.component-container {
    background: #ffffff;
    padding: 24px;
    margin: 0;
    min-height: 100vh;
    box-sizing: border-box;
}

.card-title {
    margin: 0 0 24px 0;
    font-size: 1.2rem;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 16px;
    border-bottom: 2px solid #ebeef5;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #606266;
    font-size: 0.9rem;
    font-weight: 500;
}

.form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: #ffffff;
    font-size: 0.9rem;
    transition: all 0.3s;
}

.form-group select:hover {
    border-color: #c0c4cc;
}

.form-group select:focus {
    border-color: #409eff;
    outline: none;
}

.button-container {
    margin: 24px 0;
}

button {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 4px;
    background-color: #409eff;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s;
    font-weight: 500;
}

button:hover {
    background-color: #66b1ff;
    transform: translateY(-2px);
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
}

button.connected {
    background-color: #f56c6c;
}

button.connected:hover {
    background-color: #f78989;
    box-shadow: 0 2px 12px rgba(245, 108, 108, 0.3);
}

.status {
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 0.9rem;
    color: #606266;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
}

.status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #909399;
    transition: all 0.3s;
}

.status-indicator.connected {
    background-color: #67c23a;
    box-shadow: 0 0 8px rgba(103, 194, 58, 0.4);
}

@media (max-width: 768px) {
    .sidebar {
        width: 25%;
        height: auto;
        position: relative;
    }
}
</style>
