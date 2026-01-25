const backendUrl = "https://pdf-ai-teacher.onrender.com";

async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile");
  const explanationBox = document.getElementById("explanation");
  const audioPlayer = document.getElementById("audioPlayer");
  const loader = document.getElementById("loader");

  // safety reset
  explanationBox.innerText = "";
  audioPlayer.pause();
  audioPlayer.src = "";

  if (!fileInput || fileInput.files.length === 0) {
    alert("Please select a PDF file");
    return;
  }

  // show loader
  if (loader) loader.classList.remove("hidden");
  explanationBox.innerText = "⏳ AI teacher samjha raha hai...";

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const response = await fetch(`${backendUrl}/upload-pdf`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    // hide loader
    if (loader) loader.classList.add("hidden");

    // explanation
    explanationBox.innerText = data.explanation || "❌ Explanation nahi aa paya";

    // audio (IMPORTANT PART)
    if (data.audio_url) {
      audioPlayer.src = backendUrl + data.audio_url;
      audioPlayer.load(); 
      // ⚠️ auto play nahi — user play karega
    }

  } catch (error) {
    console.error(error);
    if (loader) loader.classList.add("hidden");
    explanationBox.innerText = "❌ Backend error (server sleeping ya PDF bahut bada ho sakta hai)";
  }
}
