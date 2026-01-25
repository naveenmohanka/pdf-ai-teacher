const BACKEND_URL = https://pdf-ai-teacher.onrender.com;

async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile");
  const explanationBox = document.getElementById("explanation");
  const audioPlayer = document.getElementById("audioPlayer");

  if (!fileInput.files.length) {
    alert("Please select a PDF");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  explanationBox.innerText = "Processing...";

  const response = await fetch(`${BACKEND_URL}/upload-pdf`, {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  explanationBox.innerText = data.explanation;
  audioPlayer.src = `${BACKEND_URL}${data.audio_url}`;
}
