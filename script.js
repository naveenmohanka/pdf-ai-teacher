/* =========================
   🌐 GLOBAL STATE
========================= */
let currentPage = 0;
let totalPages = null;
let isLoading = false;

let lastExplanation = "";
let utterance = null;
let selectedVoice = null;

// 🔥 AUTO FEATURES
let autoNextEnabled = true;
let autoVoiceEnabled = true;

const backendUrl = "https://pdf-ai-teacher.onrender.com";

// DOM
const explanationBox = document.getElementById("explanation");
const nextBtn = document.getElementById("nextBtn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

/* =========================
   🔊 VOICE SETUP (BEST HINGLISH)
========================= */
function loadVoices() {
  const voices = window.speechSynthesis.getVoices();
  selectedVoice =
    voices.find(v => v.lang === "en-IN") ||
    voices.find(v => v.lang.includes("en")) ||
    voices[0];
}

window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

/* =========================
   🔊 VOICE CONTROLS
========================= */
function playVoice() {
  if (!lastExplanation) return;

  window.speechSynthesis.cancel();

  utterance = new SpeechSynthesisUtterance(lastExplanation);
  utterance.voice = selectedVoice;
  utterance.rate = 0.85;   // 🧑‍🏫 teacher style
  utterance.pitch = 1;

  // 🔄 AUTO NEXT PAGE AFTER VOICE
  utterance.onend = () => {
    if (autoNextEnabled) {
      setTimeout(() => {
        loadNextPage();
      }, 800);
    }
  };

  window.speechSynthesis.speak(utterance);
}

function pauseSpeech() {
  window.speechSynthesis.pause();
}

function resumeSpeech() {
  window.speechSynthesis.resume();
}

function stopSpeech() {
  window.speechSynthesis.cancel();
}

/* =========================
   📄 PDF FLOW
========================= */
async function uploadPDF() {
  currentPage = 0;
  totalPages = null;
  explanationBox.innerText = "";
  nextBtn.style.display = "none";
  progressContainer.style.display = "none";

  await loadNextPage();
}

async function loadNextPage() {
  if (isLoading) return;
  isLoading = true;

  const fileInput = document.getElementById("pdfFile");

  if (!fileInput.files.length) {
    alert("PDF select karo");
    isLoading = false;
    return;
  }

  explanationBox.innerText += "\n\n⏳ Next page explain ho raha hai...";

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const response = await fetch(
      `${backendUrl}/upload-pdf?start_page=${currentPage}`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    // 🔚 PDF COMPLETE
    if (data.status === "done") {
      explanationBox.innerText += "\n\n✅ Poora PDF explain ho gaya.";
      nextBtn.style.display = "none";
      isLoading = false;
      return;
    }

    // ❌ ERROR
    if (data.status === "error") {
      explanationBox.innerText += "\n\n❌ " + data.explanation;
      isLoading = false;
      return;
    }

    // ✅ SUCCESS
    lastExplanation = data.explanation;               // 🔥 VERY IMPORTANT
    explanationBox.innerText += "\n\n" + data.explanation;

    currentPage = data.next_page;
    totalPages = data.total_pages;

    updateProgress();

    progressContainer.style.display = "block";

    // Manual button sirf backup ke liye
    if (!autoNextEnabled) {
      nextBtn.style.display = "inline-block";
    } else {
      nextBtn.style.display = "none";
    }

    // 🔊 AUTO VOICE
    if (autoVoiceEnabled) {
      playVoice();
    }

  } catch (e) {
    explanationBox.innerText +=
      "\n\n❌ Backend error (server sleeping ya PDF zyada bada)";
  }

  isLoading = false;
}

/* =========================
   📊 PROGRESS BAR
========================= */
function updateProgress() {
  if (!totalPages) return;

  const percent = Math.min(
    Math.round((currentPage / totalPages) * 100),
    100
  );

  progressBar.style.width = percent + "%";
  progressText.innerText = percent + "%";
}
