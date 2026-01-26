/* =========================
   🌐 GLOBAL STATE
========================= */
let currentPage = 0;
let totalPages = null;
let isLoading = false;

let lastExplanation = "";
let utterance = null;

const backendUrl = "https://pdf-ai-teacher.onrender.com";

// DOM
const explanationBox = document.getElementById("explanation");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressContainer = document.getElementById("progressContainer");

/* =========================
   🔊 VOICE SETUP
========================= */
let selectedVoice = null;

function loadVoices() {
  const voices = speechSynthesis.getVoices();
  selectedVoice =
    voices.find(v => v.lang === "en-IN") ||
    voices.find(v => v.lang.includes("en")) ||
    voices[0];
}
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

/* =========================
   🔊 VOICE CONTROLS
========================= */
function playVoice() {
  if (!lastExplanation) return;

  speechSynthesis.cancel();

  utterance = new SpeechSynthesisUtterance(lastExplanation);
  utterance.voice = selectedVoice;
  utterance.rate = 0.9;
  utterance.pitch = 1;

  speechSynthesis.speak(utterance);
}

function pauseSpeech() {
  speechSynthesis.pause();
}
function resumeSpeech() {
  speechSynthesis.resume();
}
function stopSpeech() {
  speechSynthesis.cancel();
}

/* =========================
   📄 PDF FLOW
========================= */
async function uploadPDF() {
  currentPage = 0;
  totalPages = null;
  explanationBox.innerText = "";
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

  explanationBox.innerText += "\n\n⏳ AI teacher samjha raha hai...";

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch(
      `${backendUrl}/upload-pdf?start_page=${currentPage}`,
      { method: "POST", body: formData }
    );
    const data = await res.json();

    if (data.status === "done") {
      explanationBox.innerText += "\n\n✅ Poora PDF explain ho gaya.";
      return;
    }

    if (data.status === "error") {
      explanationBox.innerText += "\n\n❌ " + data.explanation;
      return;
    }

    // ✅ SHOW PAGE
    explanationBox.innerText += `\n\n📄 Page ${currentPage + 1}\n`;
    explanationBox.innerText += data.explanation;

    lastExplanation = data.explanation;

    currentPage = data.next_page;
    totalPages = data.total_pages;
    updateProgress();
    progressContainer.style.display = "block";

    // 🔊 AUTO VOICE
    playVoice();

    // 🔥 AUTO NEXT (FIXED — TIMER BASED)
    setTimeout(() => {
      loadNextPage();
    }, 4000); // 4 sec buffer per page

  } catch (e) {
    explanationBox.innerText += "\n\n❌ Backend error";
  }

  isLoading = false;
}

/* =========================
   📊 PROGRESS
========================= */
function updateProgress() {
  if (!totalPages) return;
  const percent = Math.round((currentPage / totalPages) * 100);
  progressBar.style.width = percent + "%";
  progressText.innerText = percent + "%";
}
