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
   🔊 VOICE CONTROLS
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

    // ✅ DONE
    if (data.status === "done") {
      explanationBox.innerHTML += `<p>✅ Poora PDF explain ho gaya.</p>`;
      isLoading = false;
      return;
    }

    // ❌ ERROR (FIXED)
    if (data.status === "error") {
      explanationBox.innerHTML += `<p>❌ ${data.explanation}</p>`;
      isLoading = false;          // 🔥 VERY IMPORTANT
      return;
    }

    // ✅ PAGE BLOCK
    const pageDiv = document.createElement("div");
    pageDiv.className = "page-block";

    const textPara = document.createElement("p");
    textPara.innerText = data.explanation;

    const playBtn = document.createElement("button");
    playBtn.innerText = "▶ Play";
    playBtn.onclick = () => playText(data.explanation);

    pageDiv.innerHTML = `<h3>📄 Page ${currentPage + 1}</h3>`;
    pageDiv.appendChild(textPara);
    pageDiv.appendChild(playBtn);
    pageDiv.innerHTML += `
      <button onclick="pauseSpeech()">⏸ Pause</button>
      <button onclick="resumeSpeech()">▶ Resume</button>
      <button onclick="stopSpeech()">⏹ Stop</button>
      <hr/>
    `;

    explanationBox.appendChild(pageDiv);

    currentPage = data.next_page;
    totalPages = data.total_pages;
    updateProgress();
    progressContainer.style.display = "block";

  } catch (e) {
    explanationBox.innerHTML += `<p>❌ Backend error</p>`;
    isLoading = false;
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
