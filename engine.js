// --- 1. GLOBAL VARIABLES ---
let calOscillator = null;
let isCalibrating = true;
let audioCtx = null;
let masterGainNode = null;
let tinnitusGain = null;
let pannerNode = null;
let activeOscillators = [];
let envAudio = null;
let envSource = null;
let envGain = null;
let tinnitusType;
let pitchSlider;
let clickInterval = null; 
let currentHeartbeatInterval = null;
let sharedClickBuffer = null;
let pulseGain = null;

//Translation titles
const tinnitusNames = {
    "sine": "Ringing",
    "sawtooth": "Buzzing",
    "pulsatile": "Pulsatile",
    "clicking": "Clicking",
    "hissing": "Hissing",
    "humming": "Humming",
    "fullness": "Aural Fullness"
};

const environmentNames = {
    "traffic": "City Traffic",
    "sleeping": "Bedroom",
    "crowded": "Crowded Cafe",
    "nature": "Nature",
    "none": "Pure Tinnitus"
};

const environmentFiles = {
    "traffic": "urban traffic.mp3",
    "sleeping": "television.mp3", 
    "crowded": "indoor people talking.mp3",
    "nature": "forest nature.mp3"
};

// --- 2. THE AUDIO PIPES ---
function ensureAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (!tinnitusGain) {
        // This is your "Severity" / Volume control
        tinnitusGain = audioCtx.createGain();
        tinnitusGain.gain.value = 0.5; 

        // This is your "Ear Balance" control
        pannerNode = audioCtx.createStereoPanner();

        // Connect them exactly like your original logic
        tinnitusGain.connect(pannerNode);
        pannerNode.connect(audioCtx.destination);
    }
}

window.onload = () => {
    document.getElementById('testToneBtn').addEventListener('click', startCalibrationTone);

document.getElementById('finishCalibration').addEventListener('click', () => {
    stopCalibrationTone();
    
    // Hide calibration, show the main experience
    document.getElementById('calibrationLayer').style.display = 'none';
    
    // Now trigger the actual simulation
    const type = localStorage.getItem("tinnitusType");
    const env = localStorage.getItem("environmentName");
    startTinnitus(type);
    if (env && env !== "none") changeEnvironment(env);
    
    isCalibrating = false;
});
    tinnitusType = localStorage.getItem("tinnitusType");
    const env = localStorage.getItem("environmentName");
    const envImg = localStorage.getItem("environmentImage");

    // Update Background Image
    if (envImg) {
        document.querySelector(".simulation-page").style.backgroundImage = `url('${envImg}')`;
    }

    // --- FIXING THE TITLE LOGIC ---
    const niceTinnitus = tinnitusNames[tinnitusType] || "Tinnitus";
    const niceEnv = environmentNames[env] || "Unknown Environment";
    
    const titleElement = document.getElementById("combinationTitle");
    if (titleElement) {
        titleElement.innerText = `${niceEnv} + ${niceTinnitus}`;
    }

    // Configure Sliders
    pitchSlider = document.getElementById('pitch');
    if (pitchSlider && tinnitusType) {
        configureSliderRanges(tinnitusType, pitchSlider);
        setupSliderListeners(pitchSlider, tinnitusType);
    }
    pitchSlider = document.getElementById('pitch');
    const testBtn = document.getElementById('testToneBtn');
    const readyBtn = document.getElementById('finishCalibration');

    // --- PASTE THE NEW LOGIC BELOW ---

    // 1. Logic for the "Listen to Tone" button
   testBtn.addEventListener('click', () => {
    if (!calOscillator) {
        startCalibrationTone();
        // Use a shorter word so it stays inside the circle!
        testBtn.innerText = "Playing"; 
        readyBtn.classList.remove('hidden');
    }
});

    // 2. Logic for the "I'm Ready" button (The Master Switch)
    readyBtn.addEventListener('click', () => {
        // A. Stop the calibration beep
        stopCalibrationTone();
        
        // B. Activate the actual simulation
        ensureAudioContext(); 
        const type = localStorage.getItem("tinnitusType");
        const env = localStorage.getItem("environmentName");

        startTinnitus(type);
        if (env && env !== "none") {
            changeEnvironment(env);
        }

        // C. Hide the calibration screen
        const overlay = document.getElementById('calibrationLayer');
        overlay.style.opacity = "0";
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 800);
    });
};

function configureSliderRanges(type, slider) {
    const freqDisplay = document.getElementById('freqValue');
    
    if (type === 'ringing' || type === 'sine') {
       slider.min = 4000; 
        slider.max = 15000; 
        slider.value = 9500;
        freqDisplay.innerText = "9500 Hz";
    } 
    else if (type === 'buzzing' || type === 'sawtooth') {
        slider.min = 7000;
        slider.max = 9000;
        slider.value = 8000;
        freqDisplay.innerText = "8000 Hz";
    } 
    else if (type === 'hissing' || type === 'static') {
        slider.min = 2000;
        slider.max = 8000;
        slider.value = 5000;
        freqDisplay.innerText = "5000 Hz";
    } 
    else if (type === 'humming') {
        slider.min = 40;
        slider.max = 250;
        slider.value = 100;
        freqDisplay.innerText = "100 Hz";
    } 
    else if (type === 'clicking') {
        slider.min = 1;
        slider.max = 15;
        slider.value = 5;
        freqDisplay.innerText = "5 clicks/sec";
    } 
    else if (type === 'pulsatile') {
        slider.min = 40;
        slider.max = 180;
        slider.value = 70;
        freqDisplay.innerText = "70 BPM";
    }
    else if (type === 'humming') {
    slider.min = 40; slider.max = 250; slider.value = 60;
    } else if (type === 'fullness') {
    slider.min = 20; slider.max = 500; slider.value = 100;
}
}

function startTinnitus(type) {
    if (!audioCtx) return;

    // 1. CLEANUP: Stop everything before starting something new
    activeOscillators.forEach(osc => { try { osc.stop(); } catch(e){} });
    activeOscillators = [];
    if (clickInterval) clearInterval(clickInterval);
    if (currentHeartbeatInterval) clearInterval(currentHeartbeatInterval);

    const val = parseFloat(document.getElementById('pitch').value);

    // --- SINE / RINGING SECTION ---
    if (type === 'sine' || type === 'ringing') {
        oscA = audioCtx.createOscillator();
        oscB = audioCtx.createOscillator();
        oscA.type = 'sine';
        oscB.type = 'sine';

        const freq = parseFloat(document.getElementById('pitch').value) || 6000;
        oscA.frequency.value = freq;
        oscB.frequency.value = freq + 2; // Your signature offset

        // "PLUGGING THEM IN"
        oscA.connect(tinnitusGain);
        oscB.connect(tinnitusGain);

        oscA.start();
        oscB.start();
        activeOscillators.push(oscA, oscB);
    }

    // --- BUZZING (Sawtooth) ---
    if (type === 'sawtooth' || type === 'buzzing') {
        oscA = audioCtx.createOscillator();
        oscA.type = 'sawtooth';
        oscA.frequency.value = val;
        oscA.connect(tinnitusGain);
        oscA.start();
        activeOscillators.push(oscA);
    } 
    // --- CLICKING ---
    else if (type === 'clicking') {
        if (!sharedClickBuffer) sharedClickBuffer = createNoiseBuffer();
        triggerSingleClick();
        clickInterval = setInterval(triggerSingleClick, 1000 / val);
    }
    // --- PULSATILE (Heartbeat) ---
   else if (type === 'pulsatile') {
    // 1. Create the dedicated pulse gain if it doesn't exist
    if (!pulseGain) {
        pulseGain = audioCtx.createGain();
        pulseGain.connect(tinnitusGain); // Connect it to the main volume
    }

    // 2. Start the rhythm
    playHeartbeat();
    const bpm = parseFloat(pitchSlider.value);
    currentHeartbeatInterval = setInterval(playHeartbeat, (60 / bpm) * 1000);
}
    // --- HISSING (Static) ---
    else if (type === 'hissing' || type === 'static') {
    const hissSource = audioCtx.createBufferSource();
    hissSource.buffer = sharedClickBuffer || createNoiseBuffer();
    hissSource.loop = true;

    // Create the "Frequency Filter"
    hissFilter = audioCtx.createBiquadFilter();
    hissFilter.type = "bandpass"; // This isolates a specific "band" of hiss
    
    const val = parseFloat(document.getElementById('pitch').value) || 5000;
    hissFilter.frequency.value = val;
    hissFilter.Q.value = 2.0; // Higher = sharper hiss, Lower = smoother static

    // Connect: Noise -> Filter -> Volume -> Speakers
    hissSource.connect(hissFilter);
    hissFilter.connect(tinnitusGain);

    hissSource.start();
    
    // Store both so we can stop the sound and move the filter later
    activeOscillators.push(hissSource, hissFilter); 
}
// --- HUMMING (Tone + Low Rumble) ---
else if (type === 'humming') {
    const humTone = audioCtx.createOscillator();
    humTone.type = 'sine';
    humTone.frequency.value = parseFloat(pitchSlider.value) || 60;

    const humNoise = audioCtx.createBufferSource();
    humNoise.buffer = createBrownNoiseBuffer();
    humNoise.loop = true;

    const humFilter = audioCtx.createBiquadFilter();
    humFilter.type = "lowpass";
    humFilter.frequency.value = 150; // Keep only the deep rumble

    humTone.connect(tinnitusGain);
    humNoise.connect(humFilter);
    humFilter.connect(tinnitusGain);

    humTone.start();
    humNoise.start();
    activeOscillators.push(humTone, humNoise, humFilter);
}

// --- FULLNESS (Pure Pressure) ---
else if (type === 'fullness') {
    const pressureSource = audioCtx.createBufferSource();
    pressureSource.buffer = createBrownNoiseBuffer();
    pressureSource.loop = true;

    const pressureFilter = audioCtx.createBiquadFilter();
    pressureFilter.type = "lowpass";
    // Slider controls how "stuffy" the ear feels
    pressureFilter.frequency.value = parseFloat(pitchSlider.value) || 100;

    pressureSource.connect(pressureFilter);
    pressureFilter.connect(tinnitusGain);

    pressureSource.start();
    activeOscillators.push(pressureSource, pressureFilter);
}
}

// --- STEP 3: THE SLIDER CONTROLLER ---
function setupSliderListeners(pitchSlider, type) {
    const pannerSlider = document.getElementById('panner');
    const severitySlider = document.getElementById('env-volume');
    const freqDisplay = document.getElementById('freqValue');

    // 1. PITCH / FREQUENCY CONTROL
pitchSlider.addEventListener('input', () => {
    let val = parseFloat(pitchSlider.value);
    const freqDisplay = document.getElementById('freqValue');
    
 //Update the text display in real-time
        if (type === 'pulsatile') {
            freqDisplay.innerText = val + " BPM";
        } else if (type === 'clicking') {
            freqDisplay.innerText = val + " clicks/sec";
        } else {
            // For Ringing, Buzzing, Hissing, Humming
            freqDisplay.innerText = val + " Hz";
        }

    // --- REFRESH CLICKING RHYTHM ---
    if (type === 'clicking') {
        // 1. Clear the old "metronome"
        if (clickInterval) {
            clearInterval(clickInterval);
        }
        
        // 2. Play one click immediately for instant feedback
        triggerSingleClick();
        
        // 3. Start a new timer with the new speed (1000ms / clicks per second)
        clickInterval = setInterval(triggerSingleClick, 1000 / val);
    }


    // 2. THE FIX: Update the Heartbeat rhythm in real-time
    if (type === 'pulsatile') {
        // Stop the current "clock"
        if (currentHeartbeatInterval) {
            clearInterval(currentHeartbeatInterval);
        }
        
        // Immediately trigger one beat so it feels responsive
        playHeartbeat();
        
        // Start a new "clock" with the new BPM value
        // Formula: (60 seconds / beats per minute) * 1000 milliseconds
        currentHeartbeatInterval = setInterval(playHeartbeat, (60 / val) * 1000);
    }

    activeOscillators.forEach((node) => {
    // If it's the Oscillator (Sine/Buzzing)
    if (node instanceof OscillatorNode) {
        node.frequency.setTargetAtTime(val, audioCtx.currentTime, 0.05);
    } 
    // If it's the Hissing Filter (Static)
    else if (node instanceof BiquadFilterNode) {
        node.frequency.setTargetAtTime(val, audioCtx.currentTime, 0.05);
    }
});
    
    // (Keep your existing logic for oscillators/clicking below this)
});

    // 2. PANNER CONTROL (Left/Right)
    pannerSlider.addEventListener('input', (e) => {
        if (pannerNode) {
            // value is between -1 (Left) and 1 (Right)
            pannerNode.pan.setTargetAtTime(parseFloat(e.target.value), audioCtx.currentTime, 0.05);
        }
    });
}
// 1. Tinnitus Volume Listener
const tinnitusVolSlider = document.getElementById('tinnitus-volume');
tinnitusVolSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (tinnitusGain) {
        tinnitusGain.gain.setTargetAtTime(val, audioCtx.currentTime, 0.05);
    }
    // Update the specific text for Tinnitus
    updateLabelText('tinnitusSeverityValue', val);
});

// 2. Environment Volume Listener
const envVolSlider = document.getElementById('env-volume');
envVolSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (envGain) {
        envGain.gain.setTargetAtTime(val, audioCtx.currentTime, 0.05);
    }
    // Update the specific text for Environment
    updateLabelText('envVolumeValue', val);
});

// Helper function to update the "Moderate/Severe" text
function updateLabelText(elementId, val) {
    const display = document.getElementById(elementId);
    if (!display) return; 
    
    if (val === 0) display.textContent = "Silent";
    else if (val < 0.2) display.textContent = "Very Mild";
    else if (val < 0.5) display.textContent = "Moderate";
    else if (val < 0.8) display.textContent = "Severe";
    else display.textContent = "Very Severe";
}

// --- STEP 4: THE START TRIGGER (Place this at the very bottom) ---
window.addEventListener('click', () => {
    if (!audioCtx || audioCtx.state === 'suspended') {
        ensureAudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const type = localStorage.getItem("tinnitusType");
        startTinnitus(type);
        
        // Visual feedback that it's running
        document.getElementById("combinationTitle").style.opacity = "0.4";
    }
}, { once: true });

window.addEventListener('click', () => {
    if (!audioCtx || audioCtx.state === 'suspended') {
        ensureAudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const type = localStorage.getItem("tinnitusType");
        startTinnitus(type);
        
        // Dim the title to show the simulation is active
        document.getElementById("combinationTitle").style.opacity = "0.4";
    }
}, { once: true });

//Noise engine
function createNoiseBuffer() {
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

function playHeartbeat() {
    if (!pulseGain || !audioCtx) return;
    
    const now = audioCtx.currentTime;
    const bpm = parseFloat(pitchSlider.value) || 70;
    
    // We want a slightly longer whoosh for a natural feel
    const whooshDuration = 20 / bpm; 

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = sharedClickBuffer || createNoiseBuffer();
    
    const heartFilter = audioCtx.createBiquadFilter();
    heartFilter.type = "lowpass";
    // LOWER THIS: 200Hz - 300Hz is the "sweet spot" for muffled thumps
    heartFilter.frequency.value = 150; 

    noiseSource.connect(heartFilter);
    heartFilter.connect(pulseGain);

    pulseGain.gain.cancelScheduledValues(now);
    pulseGain.gain.setValueAtTime(0.0001, now);
    
    // SLOWER ATTACK: Changed from 0.01 to 0.04 to remove the "knock"
    pulseGain.gain.exponentialRampToValueAtTime(2.0, now + 0.04); 
    
    // SMOOTHER DECAY: Using linearRamp for the tail end feels more organic
    pulseGain.gain.linearRampToValueAtTime(0.0001, now + whooshDuration);

    noiseSource.start(now);
    noiseSource.stop(now + whooshDuration + 0.1);
}

function triggerSingleClick() {
    if (!tinnitusGain || !audioCtx) return;

    const clickSource = audioCtx.createBufferSource();
    clickSource.buffer = sharedClickBuffer || createNoiseBuffer();

    const clickGain = audioCtx.createGain();
    const clickFilter = audioCtx.createBiquadFilter();

    // BANDPASS filter is best for clicks because it isolates a specific frequency
    clickFilter.type = "bandpass";
    // 2500Hz - 3500Hz is the "sweet spot" for a sharp but natural click
    clickFilter.frequency.value = 3000; 
    // Q (Quality factor) makes the click "tighter"
    clickFilter.Q.value = 10; 

    const now = audioCtx.currentTime;
    
    // ENVELOPE: This is the secret to a natural click
    clickGain.gain.setValueAtTime(0, now);
    // Instant attack
    clickGain.gain.linearRampToValueAtTime(0.3, now + 0.001); 
    // Quick fade: 0.03 is very crisp; 0.06 is a bit "thicker"
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(tinnitusGain);

    clickSource.start(now);
    clickSource.stop(now + 0.05);
}



function createBrownNoiseBuffer() {
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        // The "Brownian" filter math
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Bring back the volume
    }
    return buffer;
}

function changeEnvironment(type) {
    // 1. Stop any current background sound
    if (envAudio) {
        envAudio.pause();
        envAudio.src = "";
    }

    if (type === 'none' || !type) return;

    // 2. Setup the Audio Element
    const fileName = environmentFiles[type];
    if (!fileName) return;

    envAudio = new Audio(`assets/${fileName}`);
    envAudio.loop = true;

    // 3. Create the Volume Control (envGain)
    if (!envGain) {
        envGain = audioCtx.createGain();
        // Connect environment to the same panner/output as the tinnitus
        envGain.connect(audioCtx.destination); 
    }

    // 4. Link the Audio to the Web Audio API
    envSource = audioCtx.createMediaElementSource(envAudio);
    envSource.connect(envGain);

    envAudio.play().catch(e => console.log("Playback blocked until click:", e));
}
function updateSeverityText(val) {
    const severityDisplay = document.getElementById('severityValue');
    if (!severityDisplay) return;

    if (val === 0) severityDisplay.textContent = "Silent";
    else if (val < 0.2) severityDisplay.textContent = "Very Mild (Barely noticeable)";
    else if (val < 0.5) severityDisplay.textContent = "Moderate (Distracting)";
    else if (val < 0.8) severityDisplay.textContent = "Severe (Intrusive)";
    else severityDisplay.textContent = "Very Severe (Overpowering)";
}
function startCalibrationTone() {
    ensureAudioContext();
    if (calOscillator) return; // Don't start twice

    calOscillator = audioCtx.createOscillator();
    const calGain = audioCtx.createGain();

    calOscillator.frequency.value = 1000; // A standard neutral tone
    calGain.gain.value = 0.1; // Very quiet baseline

    calOscillator.connect(calGain);
    calGain.connect(audioCtx.destination);

    calOscillator.start();
    document.getElementById('testToneBtn').innerText = "Tone Playing...";
}

function stopCalibrationTone() {
    if (calOscillator) {
        calOscillator.stop();
        calOscillator = null;
    }}