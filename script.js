let currentPage = 0;
let totalPages = null;
let isLoading = false;

const backendUrl = "https://pdf-ai-teacher.onrender.com";

const explanationBox = document.getElementById("explanation");
const nextBtn = document.getElementById("nextBtn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

/* =========================
   📄 Upload / Load Page
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

  explanationBox.innerText += "\n\n⏳ AI teacher samjha raha hai...";

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

    // 🔚 PDF complete
    if (data.status === "done") {
      explanationBox.innerText += "\n\n✅ Poora PDF explain ho gaya.";
      nextBtn.style.display = "none";
      isLoading = false;
      return;
    }

    // ❌ error
    if (data.status === "error") {
      explanationBox.innerText += "\n\n❌ " + data.explanation;
      isLoading = false;
      return;
    }

    // ✅ explanation append
    explanationBox.innerText += "\n\n" + data.explanation;

    // pagination
    currentPage = data.next_page;
    totalPages = data.total_pages;

    // progress update
    updateProgress();

    // next button show
    nextBtn.style.display = "inline-block";
    progressContainer.style.display = "block";

  } catch (e) {
    explanationBox.innerText +=
      "\n\n❌ Backend error (server sleeping ya PDF zyada bada)";
  }

  isLoading = false;
}

/* =========================
   📊 Progress Bar
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
let utterance;
let selectedVoice = null;
let lastExplanation = "";

function loadVoices() {
  const voices = window.speechSynthesis.getVoices();
  selectedVoice =
    voices.find(v => v.lang === "en-IN") ||
    voices.find(v => v.lang.includes("en")) ||
    voices[0];
}

window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices(); // 🔥 MUST

function playVoice() {
  if (!lastExplanation) return;

  window.speechSynthesis.cancel();
  utterance = new SpeechSynthesisUtterance(lastExplanation);
  utterance.voice = selectedVoice;
  utterance.rate = 0.85;
  utterance.pitch = 1;

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
