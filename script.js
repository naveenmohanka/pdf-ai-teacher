const BACKEND_URL = "https://pdf-ai-teacher.onrender.com";

async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile");
  const explanationBox = document.getElementById("explanation");
  const loader = document.getElementById("loader");
  const audioPlayer = document.getElementById("audioPlayer");
  const wave = document.getElementById("voiceWave");

  if (!fileInput.files.length) {
    alert("PDF select karo pehle");
    return;
  }

  explanationBox.textContent = "";
  audioPlayer.src = "";
  wave.classList.add("hidden");

  loader.classList.remove("hidden");

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch(`${BACKEND_URL}/upload-pdf`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    loader.classList.add("hidden");

    typeWriterEffect(data.explanation, explanationBox);

    audioPlayer.src = BACKEND_URL + data.audio_url;

    audioPlayer.onplay = () => wave.classList.remove("hidden");
    audioPlayer.onpause = () => wave.classList.add("hidden");

  } catch (err) {
    loader.classList.add("hidden");
    explanationBox.textContent = "❌ Error connecting to backend";
  }
}

function typeWriterEffect(text, element) {
  let i = 0;
  element.textContent = "";

  const interval = setInterval(() => {
    element.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 20);
}
