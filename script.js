async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile");
  const explanationBox = document.getElementById("explanation");
  const audioPlayer = document.getElementById("audioPlayer");

  if (!fileInput || fileInput.files.length === 0) {
    alert("Please select a PDF file");
    return;
  }

  explanationBox.innerText = "⏳ AI teacher samjha raha hai...";

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const response = await fetch(
      "https://pdf-ai-teacher.onrender.com/upload-pdf",
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    explanationBox.innerText = data.explanation;

    audioPlayer.src =
      "https://pdf-ai-teacher.onrender.com" + data.audio_url;

    audioPlayer.load();
    audioPlayer.play();

  } catch (error) {
    console.error(error);
    explanationBox.innerText = "❌ Backend error or server sleeping";
  }
}
