/* =========================
   🌐 GLOBAL STATE
========================= */
let currentPage = 0;
let totalPages = null;
let isLoading = false;

let lastExplanation = "";
let utterance = null;
let selectedVoice = null;

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
   🔊 VOICE SETUP
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
   🔊 VOICE WITH HIGHLIGHT
========================= */
function playVoice() {
  if (!lastExplanation) return;

  window.speechSynthesis.cancel();

  const container = document.createElement("div");
  const words = lastExplanation.split(" ");
  let index = 0;

  words.forEach(word => {
    const span = document.createElement("span");
    span.textContent = word + " ";
    span.className = "word";
    container.appendChild(span);
  });

  explanationBox.appendChild(container);
  const spans = container.querySelectorAll(".word");

  utterance = new SpeechSynthesisUtterance(lastExplanation);
  utterance.voice = selectedVoice;
  utterance.rate = 0.85;
  utterance.pitch = 1;

  utterance.onboundary = (e) => {
    if (e.name === "word" && spans[index]) {
      spans.forEach(s => s.classList.remove("highlight"));
      spans[index].classList.add("highlight");
      index++;
    }
  };

  utterance.onend = () => {
    spans.forEach(s => s.classList.remove("highlight"));
    if (autoNextEnabled) {
      setTimeout(loadNextPage, 800);
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

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const response = await fetch(
      `${backendUrl}/upload-pdf?start_page=${currentPage}`,
      { method: "POST", body: formData }
    );

    const data = await response.json();

    if (data.status === "done") {
      explanationBox.innerText += "\n\n✅ Poora PDF explain ho gaya.";
      isLoading = false;
      return;
    }

    if (data.status === "error") {
      explanationBox.innerText += "\n\n❌ " + data.explanation;
      isLoading = false;
      return;
    }

    // ✅ PAGE HEADER
    explanationBox.innerText += `\n\n📄 Page ${currentPage + 1} Explanation:\n`;

    lastExplanation = data.explanation;
    explanationBox.innerText += data.explanation;

    currentPage = data.next_page;
    totalPages = data.total_pages;

    updateProgress();
    progressContainer.style.display = "block";

    if (autoVoiceEnabled) playVoice();

  } catch {
    explanationBox.innerText += "\n\n❌ Backend error";
  }

  isLoading = false;
}

/* =========================
   📊 PROGRESS BAR
========================= */
function updateProgress() {
  if (!totalPages) return;
  const percent = Math.round((currentPage / totalPages) * 100);
  progressBar.style.width = percent + "%";
  progressText.innerText = percent + "%";
}
