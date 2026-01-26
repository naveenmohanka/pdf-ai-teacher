/* =========================
   🌐 GLOBAL STATE
========================= */
let currentPage = 0;
let totalPages = null;
let isLoading = false;

const backendUrl = "https://pdf-ai-teacher.onrender.com";

// DOM
const explanationBox = document.getElementById("explanation");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressContainer = document.getElementById("progressContainer");

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

  // loader (page-wise)
  const loader = document.createElement("div");
  loader.innerText = "⏳ AI teacher samjha raha hai...";
  explanationBox.appendChild(loader);

  try {
    const res = await fetch(
      `${backendUrl}/upload-pdf?start_page=${currentPage}`,
      { method: "POST", body: formData }
    );
    const data = await res.json();

    loader.remove();

    // PDF done
    if (data.status === "done") {
      const done = document.createElement("div");
      done.innerText = "✅ Poora PDF explain ho gaya.";
      explanationBox.appendChild(done);
      return;
    }

    // Error
    if (data.status === "error") {
      const err = document.createElement("div");
      err.innerText = "❌ " + data.explanation;
      explanationBox.appendChild(err);
      return;
    }

    /* =========================
       📄 PAGE BLOCK (KEY PART)
    ========================= */
    const pageBlock = document.createElement("div");
    pageBlock.className = "page-block";

    // heading
    const heading = document.createElement("h3");
    heading.innerText = `📄 Page ${currentPage + 1}`;
    pageBlock.appendChild(heading);

    // explanation text
    const para = document.createElement("p");
    para.innerText = data.explanation;
    pageBlock.appendChild(para);

    // audio (MANUAL ONLY)
    if (data.audio_url) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = backendUrl + data.audio_url;
      audio.preload = "metadata";
      pageBlock.appendChild(audio);
    } else {
      const noAudio = document.createElement("p");
      noAudio.innerText = "🔇 Audio available nahi hai";
      pageBlock.appendChild(noAudio);
    }

    explanationBox.appendChild(pageBlock);

    // pagination update
    currentPage = data.next_page;
    totalPages = data.total_pages;

    updateProgress();
    progressContainer.style.display = "block";

  } catch (e) {
    const err = document.createElement("div");
    err.innerText = "❌ Backend error";
    explanationBox.appendChild(err);
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
