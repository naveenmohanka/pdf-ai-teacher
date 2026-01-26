/* =========================
   🌐 GLOBAL STATE
========================= */
let currentPage = 0;
let totalPages = null;
let isLoading = false;

let currentUtterance = null;

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
   🔊 VOICE CONTROLS (PER PAGE)
========================= */
function playText(text) {
  speechSynthesis.cancel();
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.voice = selectedVoice;
  currentUtterance.rate = 0.9;
  currentUtterance.pitch = 1;
  speechSynthesis.speak(currentUtterance);
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
  explanationBox.innerHTML = "";
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
    const res = await fetch(
      `${backendUrl}/upload-pdf?start_page=${currentPage}`,
      { method: "POST", body: formData }
    );
    const data = await res.json();

    if (data.status === "done") {
      explanationBox.innerHTML += `<p>✅ Poora PDF explain ho gaya.</p>`;
      return;
    }

    if (data.status === "error") {
      explanationBox.innerHTML += `<p>❌ ${data.explanation}</p>`;
      return;
    }

    // 🔥 PAGE BLOCK (SEPARATE)
    const pageDiv = document.createElement("div");
    pageDiv.className = "page-block";
    pageDiv.innerHTML = `
      <h3>📄 Page ${currentPage + 1}</h3>
      <p>${data.explanation}</p>
      <div class="voice-controls">
        <button onclick="playText(\`${data.explanation}\`)">▶ Play</button>
        <button onclick="pauseSpeech()">⏸ Pause</button>
        <button onclick="resumeSpeech()">▶ Resume</button>
        <button onclick="stopSpeech()">⏹ Stop</button>
      </div>
      <hr/>
    `;
    explanationBox.appendChild(pageDiv);

    currentPage = data.next_page;
    totalPages = data.total_pages;
    updateProgress();
    progressContainer.style.display = "block";

  } catch (e) {
    explanationBox.innerHTML += `<p>❌ Backend error</p>`;
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
