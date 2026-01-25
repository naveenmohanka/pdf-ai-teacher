const BACKEND_URL = "https://pdf-ai-teacher.onrender.com";
function typeEffect(element, text, speed = 20) {
  element.innerHTML = "";
  let i = 0;

  const interval = setInterval(() => {
    element.innerHTML += text.charAt(i);
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile");
  const explanationBox = document.getElementById("explanation");
  const audioPlayer = document.getElementById("audioPlayer");

  if (!fileInput.files.length) {
    alert("Please select a file first");
    return;
  }

  explanationBox.innerText = "⏳ Teacher is reading your PDF...";
  audioPlayer.src = "";
  audioPlayer.style.display = "none";

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const response = await fetch(`${BACKEND_URL}/upload-pdf`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    // ✅ TEXT
    typeEffect(explanationBox, data.explanation);

    // ✅ AUDIO
    if (data.audio_url) {
     audioPlayer.src = backendUrl + data.audio_url;
audioPlayer.load();

setTimeout(() => {
  audioPlayer.play().catch(() => {});
}, 500);
  
    }

   catch (err) {
    explanationBox.innerText = "❌ Error connecting to backend";
    console.error(err);
  }
}
