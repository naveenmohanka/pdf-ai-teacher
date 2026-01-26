let currentPage = 0;
let totalPages = null;
let isLoading = false;
let lastExplanation = "";
let utterance = null;

const backendUrl = "https://pdf-ai-teacher.onrender.com";

const explanationBox = document.getElementById("explanation");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressContainer = document.getElementById("progressContainer");

/* =========================
   PDF FLOW
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

    explanationBox.innerText += `\n\n📄 Page ${currentPage + 1}\n`;
    explanationBox.innerText += data.explanation;

    lastExplanation = data.explanation;

    currentPage = data.next_page;
    totalPages = data.total_pages;

    updateProgress();
    progressContainer.style.display = "block";

    playVoice(); // 🔊 AUTO SPEAK
  } catch {
    explanationBox.innerText += "\n\n❌ Backend error";
  }

  isLoading = false;
}

/* =========================
   PROGRESS BAR
========================= */
function updateProgress() {
  if (!totalPages) return;
  const percent = Math.round((currentPage / totalPages) * 100);
  progressBar.style.width = percent + "%";
  progressText.innerText = percent + "%";
}

/* =========================
   BROWSER AUDIO (FINAL)
========================= */
function playVoice() {
  if (!lastExplanation) return;

  window.speechSynthesis.cancel();
  utterance = new SpeechSynthesisUtterance(lastExplanation);
  utterance.lang = "en-IN";
  utterance.rate = 0.85;
  utterance.pitch = 1;

  utterance.onend = () => {
    setTimeout(loadNextPage, 800); // 🔥 AUTO NEXT PAGE
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
