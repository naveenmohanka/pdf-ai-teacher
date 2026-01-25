async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile");
  const explanationBox = document.getElementById("explanation");
  const audioPlayer = document.getElementById("audioPlayer");
  const loader = document.getElementById("loader");
  const wave = document.getElementById("voiceWave");

  if (!fileInput.files.length) {
    alert("Please select a PDF");
    return;
  }

  loader.classList.remove("hidden");
  wave.classList.add("hidden");
  explanationBox.innerText = "";

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch(
      "https://pdf-ai-teacher.onrender.com/upload-pdf",
      { method: "POST", body: formData }
    );

    const data = await res.json();

    loader.classList.add("hidden");
    explanationBox.innerText = data.explanation;

    audioPlayer.src =
      "https://pdf-ai-teacher.onrender.com" + data.audio_url;

    wave.classList.remove("hidden");
    audioPlayer.play();

  } catch (err) {
    loader.classList.add("hidden");
    explanationBox.innerText = "❌ Backend error (server waking up?)";
    console.error(err);
  }
}
