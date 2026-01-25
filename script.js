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

  try {
    const response = await fetch(`${BACKEND_URL}/upload-pdf`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Backend error");
    }

    const data = await response.json();

    explanationDiv.innerText = data.explanation || "No explanation received";

    if (data.audio_url) {
      audioPlayer.src = data.audio_url;
      audioPlayer.style.display = "block";
    }

  } catch (err) {
    console.error(err);
    explanationDiv.innerText = "❌ Error connecting to backend";
  }
}
