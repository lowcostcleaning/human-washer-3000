// --- SELECTIONS & CONSTANTS ---
const startBtn = document.getElementById('start-btn');
const audioToggleBtn = document.getElementById('audio-toggle-btn');
const audioIcon = document.getElementById('audio-icon');
const emergencyBtn = document.getElementById('emergency-btn');

const tempSlider = document.getElementById('slider-temp');
const spinSlider = document.getElementById('slider-spin');
const valTempDisplay = document.getElementById('val-temp');
const valSpinDisplay = document.getElementById('val-spin');

const rpmDisplay = document.getElementById('disp-rpm');
const timeDisplay = document.getElementById('disp-time');
const statusBadge = document.getElementById('drum-status-badge');
const headerStatusLight = document.getElementById('header-status-light');
const headerStatusText = document.getElementById('header-status-text');

const drumRotator = document.getElementById('drum-rotator');
const bubblesContainer = document.getElementById('bubbles-container');
const waterOverlay = document.getElementById('water-overlay');
const washerBody = document.querySelector('.washer-body');
const terminalLogs = document.getElementById('terminal-logs');

// Telemetry
const telGforce = document.getElementById('tel-gforce');
const telHappiness = document.getElementById('tel-happiness');
const telKarma = document.getElementById('tel-karma');
const telSocks = document.getElementById('tel-socks');

// State Variables
let currentState = 'IDLE'; // IDLE, FILLING, WASHING, SPINNING, DRAINING, COMPLETED, EMERGENCY
let cycleTimer = null;
let bubbleTimer = null;
let telemetryTimer = null;
let currentProgram = 'detox';
let timeRemaining = 0; // in seconds
let isAudioEnabled = false;

// Program Presets
const programs = {
    detox: {
        temp: 35,
        spin: 400,
        time: 15, // short for fun simulation speed!
        name: "Деликатный детокс",
        waterLevel: "55%",
        logs: [
            "Инициализация детокс-потока...",
            "Наполнение ванны тёплым зелёным чаем...",
            "Фильтрация уведомлений и спама...",
            "Стирание кэша беспокойных мыслей...",
            "Полоскание в режиме 'Полная тишина'...",
            "Сушка тёплым воздухом умиротворения..."
        ]
    },
    friday: {
        temp: 10,
        spin: 1000,
        time: 20,
        name: "Пятничный отжим",
        waterLevel: "40%",
        logs: [
            "Подготовка коктейльного раствора...",
            "Впрыск жидкого конфетти...",
            "Шейкер-эффект активирован!",
            "Удаление отпечатков рабочих чатов...",
            "Вытряхивание дедлайнов на высокой скорости...",
            "Сушка под неоновыми лучами..."
        ]
    },
    turbo: {
        temp: 75,
        spin: 1400,
        time: 18,
        name: "Турбо-Креатив",
        waterLevel: "30%",
        logs: [
            "Разогрев мозгового процессора до 75°C...",
            "Подача жидкого эспрессо...",
            "Разгон синапсов до максимальных частот...",
            "Генерация безумных идей...",
            "Отжим лени и прокрастинации...",
            "Сверхзвуковое разглаживание извилин..."
        ]
    },
    portal: {
        temp: 0,
        spin: 1600,
        time: 25,
        name: "Сингулярность",
        waterLevel: "80%",
        logs: [
            "Искривление пространства-времени барабана...",
            "Наполнение антиматерией...",
            "Переход в квантовое состояние...",
            "Поиск пропавших носков в параллельных мирах...",
            "Запутывание кармических петель...",
            "Мягкое приземление обратно в реальность..."
        ]
    }
};

// --- AUDIO SYNTH ENGINE (Web Audio API) ---
class WebAudioSynth {
    constructor() {
        this.ctx = null;
        this.motorOsc = null;
        this.motorGain = null;
        this.waterGain = null;
        this.waterBufferNode = null;
    }

    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
    }

    playClick() {
        if (!isAudioEnabled) return;
        this.init();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playChime() {
        if (!isAudioEnabled) return;
        this.init();

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
            const time = this.ctx.currentTime + index * 0.15;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
            
            osc.start(time);
            osc.stop(time + 0.5);
        });
    }

    playAlarm() {
        if (!isAudioEnabled) return;
        this.init();

        const duration = 1.5;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        
        // Siren effect
        for (let i = 0; i < duration * 4; i++) {
            const t = this.ctx.currentTime + i * 0.25;
            osc.frequency.linearRampToValueAtTime(i % 2 === 0 ? 800 : 400, t + 0.2);
        }

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    startWaterSound() {
        if (!isAudioEnabled) return;
        this.init();
        if (this.waterGain) return; // Already running

        // Generate pink-like noise for water rushing
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Simple low pass filter
            data[i] = lastOut * 0.9 + white * 0.1;
            lastOut = data[i];
        }

        this.waterBufferNode = this.ctx.createBufferSource();
        this.waterBufferNode.buffer = buffer;
        this.waterBufferNode.loop = true;

        // Bandpass filter to make it sound sloshy
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 350;
        filter.Q.value = 1.0;

        // An LFO to modulate filter to sound like waves
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.5; // 0.5 Hz sloshing
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 150;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        this.waterGain = this.ctx.createGain();
        this.waterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.waterGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 1.0);

        this.waterBufferNode.connect(filter);
        filter.connect(this.waterGain);
        this.waterGain.connect(this.ctx.destination);

        lfo.start();
        this.waterBufferNode.start();
    }

    stopWaterSound() {
        if (!this.waterGain) return;
        const currentGain = this.waterGain;
        const currentSource = this.waterBufferNode;
        
        currentGain.gain.setValueAtTime(currentGain.gain.value, this.ctx.currentTime);
        currentGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
        
        setTimeout(() => {
            try { currentSource.stop(); } catch(e) {}
        }, 1000);

        this.waterGain = null;
        this.waterBufferNode = null;
    }

    startMotorSound() {
        if (!isAudioEnabled) return;
        this.init();
        if (this.motorOsc) return;

        this.motorOsc = this.ctx.createOscillator();
        this.motorOsc.type = 'sawtooth';
        this.motorOsc.frequency.setValueAtTime(45, this.ctx.currentTime); // Low growl

        // Filter out high sizzle
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 180;

        this.motorGain = this.ctx.createGain();
        this.motorGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.motorGain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.5);

        this.motorOsc.connect(lowpass);
        lowpass.connect(this.motorGain);
        this.motorGain.connect(this.ctx.destination);

        this.motorOsc.start();
    }

    setMotorPitch(freq, transitionTime = 0.1) {
        if (!this.motorOsc || !isAudioEnabled) return;
        this.motorOsc.frequency.setValueAtTime(this.motorOsc.frequency.value, this.ctx.currentTime);
        this.motorOsc.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + transitionTime);
    }

    stopMotorSound() {
        if (!this.motorGain) return;
        const currentGain = this.motorGain;
        const currentOsc = this.motorOsc;

        currentGain.gain.setValueAtTime(currentGain.gain.value, this.ctx.currentTime);
        currentGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

        setTimeout(() => {
            try { currentOsc.stop(); } catch(e) {}
        }, 600);

        this.motorOsc = null;
        this.motorGain = null;
    }
}

const synth = new WebAudioSynth();

// --- TERMINAL LOGGER UTILITY ---
function addLog(text, type = 'system') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.innerText = `[${new Date().toLocaleTimeString()}] ${text}`;
    terminalLogs.appendChild(line);
    terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

// --- BUBBLE PARTICLE SYSTEM ---
function spawnBubble() {
    if (currentState !== 'WASHING' && currentState !== 'SPINNING') return;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    // Randomize bubble size and horizontal positioning
    const size = Math.random() * 12 + 6;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${Math.random() * 200 + 40}px`;
    
    // Randomized animation variables passed as CSS properties
    bubble.style.setProperty('--bubble-duration', `${Math.random() * 1.5 + 1.2}s`);
    bubble.style.setProperty('--bubble-end-y', `${Math.random() * -180 - 40}px`);
    bubble.style.setProperty('--bubble-drift', `${Math.random() * 60 - 30}px`);
    
    bubblesContainer.appendChild(bubble);
    
    // Remove bubble once animation completes
    setTimeout(() => {
        bubble.remove();
    }, 3000);
}

// --- UI INTERACTIONS & EVENT HANDLERS ---

// Mute/Unmute Audio
audioToggleBtn.addEventListener('click', () => {
    isAudioEnabled = !isAudioEnabled;
    synth.playClick();
    if (isAudioEnabled) {
        audioIcon.innerText = '🔊';
        audioToggleBtn.style.background = 'rgba(0, 243, 255, 0.15)';
        audioToggleBtn.style.borderColor = 'var(--neon-cyan)';
        addLog("Звуковое сопровождение активировано.", "info");
        
        // If we are currently in middle of wash, start corresponding sound
        if (currentState === 'FILLING') synth.startWaterSound();
        if (currentState === 'WASHING') { synth.startWaterSound(); synth.startMotorSound(); synth.setMotorPitch(60); }
        if (currentState === 'SPINNING') { synth.startMotorSound(); synth.setMotorPitch(120 + spinSlider.value / 10); }
    } else {
        audioIcon.innerText = '🔇';
        audioToggleBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        audioToggleBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        addLog("Звуковое сопровождение отключено.", "info");
        synth.stopWaterSound();
        synth.stopMotorSound();
    }
});

// Program Selection
document.querySelectorAll('.btn-program').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (currentState !== 'IDLE') return; // Locked during cycle
        
        synth.playClick();
        
        document.querySelectorAll('.btn-program').forEach(b => b.classList.remove('active'));
        const programBtn = e.currentTarget;
        programBtn.classList.add('active');
        
        currentProgram = programBtn.dataset.program;
        const config = programs[currentProgram];
        
        // Apply presets
        tempSlider.value = config.temp;
        spinSlider.value = config.spin;
        updateControlsDisplay();
        
        addLog(`Выбран режим: "${config.name}". Температура: ${config.temp}°C, Отжим: ${config.spin} об/мин.`, "info");
    });
});

// Adjust Sliders
tempSlider.addEventListener('input', () => {
    valTempDisplay.innerText = `${tempSlider.value}°C`;
    if (currentState === 'IDLE') {
        // Switch off pre-selected program highlighted if sliders modified
        document.querySelectorAll('.btn-program').forEach(b => b.classList.remove('active'));
    }
});
spinSlider.addEventListener('input', () => {
    valSpinDisplay.innerText = `${spinSlider.value} об/мин`;
    if (currentState === 'IDLE') {
        document.querySelectorAll('.btn-program').forEach(b => b.classList.remove('active'));
    }
});

function updateControlsDisplay() {
    valTempDisplay.innerText = `${tempSlider.value}°C`;
    valSpinDisplay.innerText = `${spinSlider.value} об/мин`;
}

// Additive pod triggers
document.querySelectorAll('.additive-card').forEach(card => {
    card.addEventListener('click', () => {
        synth.playClick();
        card.classList.toggle('active');
        const isActive = card.classList.contains('active');
        const addName = card.querySelector('.add-name').innerText;
        addLog(`Добавка "${addName}" ${isActive ? 'добавлена в лоток' : 'извлечена'}.`, "info");
    });
});

// Emergency Stop
emergencyBtn.addEventListener('click', () => {
    if (currentState === 'IDLE') {
        synth.playClick();
        addLog("Аварийная кнопка проверена. Работает исправно.", "warn");
        return;
    }
    triggerEmergency();
});

function triggerEmergency() {
    currentState = 'EMERGENCY';
    synth.playAlarm();
    synth.stopWaterSound();
    synth.stopMotorSound();
    
    // Clear all tickers
    clearInterval(cycleTimer);
    clearInterval(bubbleTimer);
    clearInterval(telemetryTimer);
    
    // Dynamic resets
    drumRotator.className = 'drum-rotate-wrapper';
    drumRotator.style.setProperty('--spin-speed', '0s');
    washerBody.className = 'washer-body';
    waterOverlay.style.setProperty('--water-level', '0%');
    
    statusBadge.innerText = 'АВАРИЯ';
    statusBadge.style.color = 'var(--neon-pink)';
    
    headerStatusLight.className = 'status-light-indicator warn';
    headerStatusText.innerText = 'АВАРИЙНЫЙ СБРОС';
    
    rpmDisplay.innerText = 'ERR!';
    timeDisplay.innerText = '--:--';
    
    // Telemetry resets
    telGforce.innerText = '0.0 G';
    telHappiness.innerText = '20% (Испуг)';
    telKarma.innerText = '10%';
    
    startBtn.innerText = 'СБРОСИТЬ ОШИБКУ';
    startBtn.className = 'btn-start running'; // keeps it red
    
    addLog("[!!!] АВАРИЙНАЯ ОСТАНОВКА АКТИВИРОВАНА! Сброс давления, экстренный слив кофе и чая.", "error");
    addLog("[!] Субъект спасен. Волосы растрепаны, но улыбка на месте.", "success");
}

// --- MAIN RUN CYCLE CONTROLLER ---

startBtn.addEventListener('click', () => {
    synth.playClick();
    
    if (currentState === 'EMERGENCY') {
        // Reset from emergency back to idle
        currentState = 'IDLE';
        statusBadge.innerText = 'Ожидание';
        statusBadge.style.color = '';
        headerStatusLight.className = 'status-light-indicator idle';
        headerStatusText.innerText = 'СИСТЕМА ГОТОВА';
        rpmDisplay.innerText = '0000';
        timeDisplay.innerText = '00:00';
        updateTelemetry();
        startBtn.innerText = 'ЗАПУСТИТЬ СТИРКУ';
        startBtn.className = 'btn-start';
        addLog("Система разблокирована. Ошибки очищены.", "info");
        return;
    }
    
    if (currentState !== 'IDLE') {
        // Stop current running cycle
        stopWashCycle("Стирка прервана пользователем.");
        return;
    }
    
    startWashCycle();
});

function startWashCycle() {
    currentState = 'FILLING';
    startBtn.innerText = 'ОСТАНОВИТЬ';
    startBtn.className = 'btn-start running';
    
    headerStatusLight.className = 'status-light-indicator active';
    headerStatusText.innerText = 'СТИРКА В ПРОЦЕССЕ';
    
    // Read parameters
    const preset = programs[currentProgram] || { logs: ["Инициализация кастомного цикла..."] };
    const tempVal = parseInt(tempSlider.value);
    const spinVal = parseInt(spinSlider.value);
    
    // Calculate total phase times based on slider value (seconds)
    const fillTime = 4;
    const washTime = 8;
    const spinTime = 6;
    const drainTime = 4;
    timeRemaining = fillTime + washTime + spinTime + drainTime;
    
    updateTimeDisplay();
    
    // Diagnostic messages list
    const stepLogs = [
        ...preset.logs,
        `Параметры стирки: Нагрев воды до ${tempVal}°C. Скорость отжима: ${spinVal} об/мин.`,
        "Впрыск активированных добавок...",
    ];
    
    // Include additives in logs if active
    document.querySelectorAll('.additive-card.active').forEach(card => {
        stepLogs.push(`Добавлена сыворотка: ${card.querySelector('.add-name').innerText}.`);
    });
    
    addLog(`== ЗАПУСК ПРОГРАММЫ: ${preset.name || 'КАСТОМНАЯ'} ==`, "success");
    addLog("Блокировка люка барабана [OK]. Ремень безопасности затянут.", "info");
    
    // Start sound if enabled
    synth.startWaterSound();
    
    // Ticker timers
    let logIndex = 0;
    let timerElapsed = 0;
    
    // 1-second interval cycle loop
    cycleTimer = setInterval(() => {
        timerElapsed++;
        timeRemaining--;
        updateTimeDisplay();
        
        // Push telemetry changes
        updateTelemetry(timerElapsed);
        
        if (timeRemaining <= 0) {
            completeWashCycle();
            return;
        }
        
        // Print logs incrementally
        if (logIndex < stepLogs.length && timerElapsed % 2 === 0) {
            addLog(stepLogs[logIndex], "system");
            logIndex++;
        }
        
        // State Machine transitions based on elapsed time
        if (currentState === 'FILLING' && timerElapsed >= fillTime) {
            // Transition to WASHING
            currentState = 'WASHING';
            statusBadge.innerText = 'СТИРКА';
            addLog("[ЭТАП: СТИРКА] Запуск реверсивного вращения био-барабана.", "info");
            
            // Visuals: update water, start spin osc
            waterOverlay.style.setProperty('--water-level', preset.waterLevel || "50%");
            drumRotator.className = 'drum-rotate-wrapper washing';
            
            // Audio
            synth.startMotorSound();
            synth.setMotorPitch(55, 1.5);
            
            // Start bubble spawns
            bubbleTimer = setInterval(spawnBubble, 120);
        }
        else if (currentState === 'WASHING' && timerElapsed >= (fillTime + washTime)) {
            // Transition to SPINNING
            currentState = 'SPINNING';
            statusBadge.innerText = 'ОТЖИМ';
            addLog(`[ЭТАП: ОТЖИМ] Разгон барабана до ${spinVal} об/мин. Внимание: повышенная перегрузка!`, "warn");
            
            // Visuals: fast spinning, lower water slightly (centrifuging)
            waterOverlay.style.setProperty('--water-level', '15%');
            drumRotator.className = 'drum-rotate-wrapper spinning';
            
            // Speed up rotation
            const rotationPeriod = spinVal > 0 ? (1600 / spinVal) * 0.4 : 0;
            if (rotationPeriod > 0) {
                drumRotator.style.setProperty('--spin-speed', `${rotationPeriod}s`);
                
                // Vibrate the machine body based on spin rate
                if (spinVal >= 1200) {
                    washerBody.className = 'washer-body shaking-wild';
                } else if (spinVal >= 400) {
                    washerBody.className = 'washer-body shaking-gentle';
                }
            } else {
                drumRotator.style.setProperty('--spin-speed', '0s');
            }
            
            // Audio pitch rise
            synth.stopWaterSound();
            if (spinVal > 0) {
                synth.setMotorPitch(120 + spinVal / 8, 3.0);
            } else {
                synth.stopMotorSound();
            }
        }
        else if (currentState === 'SPINNING' && timerElapsed >= (fillTime + washTime + spinTime)) {
            // Transition to DRAINING
            currentState = 'DRAINING';
            statusBadge.innerText = 'СЛИВ И СУШКА';
            addLog("[ЭТАП: СЛИВ] Откачка жидкости. Финальная вентиляция.", "info");
            
            // Visuals
            waterOverlay.style.setProperty('--water-level', '0%');
            drumRotator.className = 'drum-rotate-wrapper';
            drumRotator.style.setProperty('--spin-speed', '0s');
            washerBody.className = 'washer-body';
            
            // Stop bubble spawns
            clearInterval(bubbleTimer);
            
            // Audio pitch drop
            synth.setMotorPitch(40, 2.0);
            setTimeout(() => synth.stopMotorSound(), 2000);
        }
        
    }, 1000);
    
    // Faster telemetry updates
    telemetryTimer = setInterval(() => {
        updateRpmDisplay(spinVal);
    }, 100);
}

function stopWashCycle(reason = "Стирка остановлена.") {
    clearInterval(cycleTimer);
    clearInterval(bubbleTimer);
    clearInterval(telemetryTimer);
    
    synth.stopWaterSound();
    synth.stopMotorSound();
    
    currentState = 'IDLE';
    startBtn.innerText = 'ЗАПУСТИТЬ СТИРКУ';
    startBtn.className = 'btn-start';
    
    headerStatusLight.className = 'status-light-indicator idle';
    headerStatusText.innerText = 'СИСТЕМА ГОТОВА';
    
    statusBadge.innerText = 'Ожидание';
    
    drumRotator.className = 'drum-rotate-wrapper';
    drumRotator.style.setProperty('--spin-speed', '0s');
    washerBody.className = 'washer-body';
    waterOverlay.style.setProperty('--water-level', '0%');
    
    rpmDisplay.innerText = '0000';
    timeDisplay.innerText = '00:00';
    updateTelemetry();
    
    addLog(`[SYSTEM] ${reason}`, "warn");
}

function completeWashCycle() {
    clearInterval(cycleTimer);
    clearInterval(bubbleTimer);
    clearInterval(telemetryTimer);
    
    synth.stopWaterSound();
    synth.stopMotorSound();
    synth.playChime();
    
    currentState = 'COMPLETED';
    startBtn.innerText = 'ЗАПУСТИТЬ ЕЩЕ РАЗ';
    startBtn.className = 'btn-start';
    
    headerStatusLight.className = 'status-light-indicator idle';
    headerStatusText.innerText = 'СИСТЕМА ГОТОВА';
    
    statusBadge.innerText = 'ГОТОВО';
    statusBadge.style.color = 'var(--neon-green)';
    
    rpmDisplay.innerText = '0000';
    timeDisplay.innerText = '00:00';
    
    // Complete Telemetry values
    telGforce.innerText = '1.0 G';
    telHappiness.innerText = '100% (Блестит!)';
    telKarma.innerText = '100% (Святая)';
    
    // Check if socks are lost (funny math!)
    const hasPeace = document.querySelector('[data-additive="peace"]').classList.contains('active');
    const sockLoss = hasPeace ? 0 : Math.floor(Math.random() * 2); // 0 or 1 sock lost
    if (sockLoss > 0) {
        telSocks.innerText = `-${sockLoss} шт. (Квантовый скачок)`;
        addLog(`[WARN] Обнаружено исчезновение ${sockLoss} носка. Вероятно, он ушел в четвертое измерение.`, "warn");
    } else {
        telSocks.innerText = '0% (Рекорд!)';
        addLog("Все носки на месте! Невероятный триумф гравитации.", "success");
    }
    
    addLog("== СТИРКА УСПЕШНО ЗАВЕРШЕНА! ==", "success");
    addLog("Субъект абсолютно свеж, заряжен позитивом и готов покорять мир.", "success");
}

// --- COMPONENT HELPERS ---

function updateTimeDisplay() {
    const minutes = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const seconds = (timeRemaining % 60).toString().padStart(2, '0');
    timeDisplay.innerText = `${minutes}:${seconds}`;
}

function updateRpmDisplay(maxRpm) {
    if (currentState === 'IDLE' || currentState === 'COMPLETED') {
        rpmDisplay.innerText = '0000';
        return;
    }
    if (currentState === 'FILLING') {
        rpmDisplay.innerText = '0000';
        return;
    }
    if (currentState === 'WASHING') {
        // Slow back and forth speeds (50 to 90 rpm)
        const wobble = Math.sin(Date.now() / 300);
        const rpm = Math.floor(wobble * 30 + 60);
        rpmDisplay.innerText = Math.abs(rpm).toString().padStart(4, '0');
        return;
    }
    if (currentState === 'SPINNING') {
        // Fluctuating around max speed
        const jitter = Math.floor(Math.random() * 20 - 10);
        rpmDisplay.innerText = Math.max(0, maxRpm + jitter).toString().padStart(4, '0');
        return;
    }
    if (currentState === 'DRAINING') {
        // Spindown
        rpmDisplay.innerText = '0000';
    }
}

function updateTelemetry(secondsElapsed = 0) {
    if (currentState === 'IDLE') {
        telGforce.innerText = '1.0 G';
        telHappiness.innerText = '85%';
        telKarma.innerText = '42%';
        telSocks.innerText = '0%';
        return;
    }
    
    const spinVal = parseInt(spinSlider.value);
    
    // GForce: increases during spin
    if (currentState === 'SPINNING') {
        const maxG = 1 + (spinVal / 200); // e.g. 1600 rpm = 9G
        const jitter = (Math.random() * 0.4 - 0.2);
        telGforce.innerText = `${(maxG + jitter).toFixed(1)} G`;
    } else {
        telGforce.innerText = '1.0 G';
    }
    
    // Happiness
    let happiness = 85 + (secondsElapsed * 0.8);
    if (currentState === 'SPINNING') {
        happiness += 10; // extra adrenaline!
    }
    telHappiness.innerText = `${Math.min(100, Math.floor(happiness))}%`;
    
    // Karma
    let karma = 42 + (secondsElapsed * 2.5);
    telKarma.innerText = `${Math.min(100, Math.floor(karma))}%`;
}
