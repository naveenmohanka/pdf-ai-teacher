const BACKEND_URL = "https://pdf-ai-teacher.onrender.com";

async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile");
  const explanationBox = document.getElementById("explanation");
  const audioPlayer = document.getElementById("audioPlayer");

  if (!fileInput.files.length) {
    alert("Please select a PDF file");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  explanationBox.innerText = "⏳ Processing... please wait";

  try {
    const response = await fetch(BACKEND_URL + "/upload-pdf", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Backend error");
    }

    const data = await response.json();

    explanationBox.innerText = data.explanation || "No explanation received";
    audioPlayer.src = BACKEND_URL + data.audio_url;
    audioPlayer.load();

  } catch (error) {
    explanationBox.innerText = "❌ Error connecting to backend";
    console.error(error);
  }
}
