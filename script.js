const BACKEND_URL = "https://pdf-ai-teacher.onrender.com";

async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile");
  const explanationDiv = document.getElementById("explanation");
  const audioPlayer = document.getElementById("audioPlayer");

  if (!fileInput.files.length) {
    alert("Please select a PDF file");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  explanationDiv.innerText = "⏳ Explaining PDF...";
  audioPlayer.style.display = "none";

  try {
    const response = await fetch(`${BACKEND_URL}/upload-pdf`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    explanationDiv.innerText = data.explanation || "No explanation received";

    if (data.audio_file) {
      audioPlayer.src = `${BACKEND_URL}/audio/${data.audio_file}`;
      audioPlayer.style.display = "block";
    }

  } catch (err) {
    console.error(err);
    explanationDiv.innerText = "❌ Error connecting to backend";
  }
}
