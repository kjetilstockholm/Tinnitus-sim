// --- CALIBRATION LOGIC ---
const calibrateBtn = document.getElementById("calibrateBtn");
const calOverlay = document.getElementById("calOverlay");
const closeCal = document.getElementById("closeCal");
const finishCalBtn = document.getElementById("finishCalBtn");
const testToneBtn = document.getElementById("testToneBtn");

let audioCtx = null;
let calOscillator = null;

// Open Calibration
calibrateBtn.addEventListener("click", () => {
    calOverlay.classList.add("active");
});

// Close Calibration & Stop Tone
function stopToneAndClose() {
    calOverlay.classList.remove("active");
    if (calOscillator) {
        calOscillator.stop();
        calOscillator = null;
        testToneBtn.innerText = "Play Test Tone";
    }
}

closeCal.addEventListener("click", stopToneAndClose);
finishCalBtn.addEventListener("click", stopToneAndClose);

// Tone Generator
testToneBtn.addEventListener("click", () => {
    // Initialize audio context on first click
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (calOscillator) {
        // If playing, stop it
        calOscillator.stop();
        calOscillator = null;
        testToneBtn.innerText = "Play Test Tone";
    } else {
        // If stopped, play it
        calOscillator = audioCtx.createOscillator();
        const calGain = audioCtx.createGain();
        calOscillator.frequency.value = 1000;
        calGain.gain.value = 0.1; 
        
        calOscillator.connect(calGain);
        calGain.connect(audioCtx.destination);
        calOscillator.start();
        testToneBtn.innerText = "Stop Tone";
    }
});

// 1. Grab the buttons and carousels
const playButton = document.getElementById("playButton");
const envCarousel = document.getElementById("envCarousel");
const tinnitusCarousel = document.getElementById("tinnitusCarousel");

// 2. THE BRIDGE: Save data and move to the next page
playButton.addEventListener("click", () => {
    // Find which cards are in the horizontal middle of the screen
    const selectedEnv = getCenteredCard(envCarousel);
    const selectedTinnitus = getCenteredCard(tinnitusCarousel);

    // Write the "Order Slip" to LocalStorage
    localStorage.setItem("environmentName", selectedEnv.dataset.name);
    localStorage.setItem("environmentImage", selectedEnv.dataset.image);
    localStorage.setItem("tinnitusType", selectedTinnitus.dataset.tinnitus.toLowerCase());

    // Redirect to the simulation page
    window.location.href = "simulation.html";
});

// HORIZONTAL HELPER: Finds the card closest to the horizontal center
function getCenteredCard(carousel) {
    const cards = carousel.querySelectorAll('.env-card, .tinnitus-card');
    // Calculate the horizontal center of the carousel container
    const carouselCenter = carousel.getBoundingClientRect().left + carousel.offsetWidth / 2;
    
    let closestCard = cards[0];
    let minDistance = Infinity;

    cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        // Calculate the horizontal center of the current card
        const cardCenter = cardRect.left + cardRect.width / 2;
        // Measure horizontal distance
        const distance = Math.abs(carouselCenter - cardCenter);

        if (distance < minDistance) {
            minDistance = distance;
            closestCard = card;
        }
    });

    return closestCard;
}

// =====================================
// TINNITUS INFORMATION
// =====================================

const tinnitusInfo = {

  sine: {
    title: "Ringing",
    description: `
    Ringing tinnitus is the most common type of tinnitus generally caused by ear wax accumalation, inner ear damage and hearing loss due to loud sounds etc. It's the most stressful type of tinnitus creating discomfort and anxiety due to the continous ringing in the ears.<br>
• Can be constant or intermittent, high-pitched or low-pitched, and in one or both ears. <br>
• Most common tinnitus type.<br>
• Often worse in quiet environments
`
  },

  sawtooth: {
    title: "Buzzing",
    description: `
   Buzzing tinnitus is a common, often chronic form of subjective tinnitus characterized by hearing persistent low-voltage electrical, vibrating, or cicada-like noises, often linked to hearing loss or inner ear damage. It is a phantom sound created by the brain and is most noticeable in quiet environments. Generally buzzing, hissing, ringing are subjective types of tinnitus. Subjective tinnitus is the most common type of tinnitus. It can be heard by only the person experiencing it. <br>
• Electrical buzzing or mechanical tone <br>
• Sharp and grainy sensation <br>
• Can feel intrusive
`
  },

  pulsatile: {
    title: "Pulsatile",
    description: `
    Pulsatile tinnitus is a rare form of tinnitus characterized by a rhythmic thumping, whooshing, or beating sound in the ears, matching the body's heartbeat. Unlike constant ringing, this often indicates an underlying vascular issue—such as blood flow changes, high blood pressure, or venous narrowing—that can typically be diagnosed and treated. <br>
   Pulsatile Tinnitus is generally objective type of tinnitus. Objective tinnitus is a less common type that can be captured using a stethoscope of sensitive microphone (Maybe we can find a sample as reference) This type can also be found by doctors during close examination, mostly caused by chronic circulatory problems. <br>
• Rhythmic heartbeat-like sound <br>
• Syncs with pulse or blood flow <br>
• Often stress-sensitive
`
  },

  clicking: {
    title: "Clicking",
    description: `
    Clicking tinnitus is the perception of sharp, rhythmic, or irregular clicking sounds in the ear, often caused by muscle contractions in the middle ear or jaw (TMJ). It is a symptom of an underlying condition rather than a disease, typically originating from physical issues like spasms, eustachian tube dysfunction, or vascular issues. <br>
• Repetitive clicking or ticking<br>
• Intermittent in nature<br>
• May relate to muscle movement- Stops, reduces or worsens after muscle movement such as head, back, jaw movements or neck.
`
  },

  hissing: {
    title: "Hissing",
    description: `
    Hissing tinnitus is a common form of subjective tinnitus characterized by a phantom, rushing, or steam-like sound, often linked to high-frequency hearing loss, stress, or inner ear damage. While generally not curable, it is manageable through sound masking, stress reduction, and hearing aids, and is most noticeable in quiet environments. <br>
• Air/steam-like sound <br>
• Continuous static sensation <br>
• Similar to radio noise
`
  },

  humming: {
    title: "Humming",
    description: `
    Humming tinnitus is a form of subjective tinnitus, often described as a low-pitched roar, hum, or buzzing sound heard only by the individual. It is frequently linked to underlying issues like hearing loss, stress, earwax blockage, or [TMJ disorders]. Management includes [sound therapy], reducing stress, and avoiding caffeine or nicotine. <br>
• It can sound like a distant engine, a hum, a low roar, or buzzing. <br>
• Deep vibrating sensation <br>
• Often constant background tone

`
  },

 fullness: {
  title: "Fullness of Ear",
  description: `
  A full or blocked ear sensation (aural fullness) often feels like pressure, congestion, or water in the ear, frequently causing muffled hearing or cracking. It is a symptom, not a diagnosis, typically caused by Eustachian tube dysfunction (from colds/allergies), earwax buildup, or pressure changes, which can usually be relieved by yawning, chewing, or OTC medications. <br>
<ul>
  <li>Pressure or blocked sensation</li>
  <li>Muffled hearing feeling</li>
  <li>Often discomfort in ear canal</li>
</ul>
`
}

};


// POPUP ELEMENTS
const popupOverlay =
  document.getElementById("popupOverlay");

const popupTitle =
  document.getElementById("popupTitle");

const popupDescription =
  document.getElementById("popupDescription");

const closePopup =
  document.getElementById("closePopup");

// ALL INFO BUTTONS
const infoButtons =
  document.querySelectorAll(".info-btn");

// OPEN POPUP
// ALL INFO BUTTONS
document.querySelectorAll(".info-btn").forEach(button => {

  button.addEventListener("click", (e) => {

    e.stopPropagation();

    const card = button.closest(".tinnitus-card");

    const type = card.getAttribute("data-tinnitus");

    const data = tinnitusInfo[type];

    if (!data) {
      console.log("No data found for:", type);
      return;
    }

    popupTitle.textContent = data.title;
    popupDescription.innerHTML = data.description;
    popupOverlay.classList.add("active");

  });

});

// CLOSE POPUP
closePopup.addEventListener("click", () => {

  popupOverlay.classList.remove("active");

});

// CLOSE WHEN CLICKING OUTSIDE
popupOverlay.addEventListener("click", (e) => {

  if (e.target === popupOverlay) {

    popupOverlay.classList.remove("active");

  }

});