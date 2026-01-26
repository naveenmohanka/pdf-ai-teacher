let currentPage = 0;
let totalPages = null;
let isLoading = false;

const backendUrl = "https://pdf-ai-teacher.onrender.com";

const explanationBox = document.getElementById("explanation");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressContainer = document.getElementById("progressContainer");
const audioPlayer = document.getElementById("audioPlayer");

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
      return;
    }

    if (data.status === "error") {
      explanationBox.innerText += "\n\n❌ " + data.explanation;
      return;
    }

    explanationBox.innerText += `\n\n📄 Page ${currentPage + 1} Explanation:\n`;
    explanationBox.innerText += data.explanation;

    // 🔊 MP3 AUDIO
    audioPlayer.src = backendUrl + data.audio_url;
    audioPlayer.load();
    audioPlayer.play();

    audioPlayer.onended = () => {
      currentPage = data.next_page;
      loadNextPage();
      const gender = document.getElementById("voiceGender").value;

const response = await fetch(
  `${backendUrl}/upload-pdf?start_page=${currentPage}&gender=${gender}`,
  { method: "POST", body: formData }
);

    };

    totalPages = data.total_pages;
    updateProgress();

    progressContainer.style.display = "block";

  } catch {
    explanationBox.innerText += "\n\n❌ Backend error";
  }

  isLoading = false;
}

function updateProgress() {
  if (!totalPages) return;
  const percent = Math.round((currentPage / totalPages) * 100);
  progressBar.style.width = percent + "%";
  progressText.innerText = percent + "%";
}
