async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile");
  const explanationBox = document.getElementById("explanation");

  if (!fileInput.files.length) {
    alert("Please select a PDF");
    return;
  }

  explanationBox.innerText = "🤖 AI teacher samjha raha hai...";

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

    const data = await response.json();
    explanationBox.innerText = data.explanation;

    // 🔥 BROWSER VOICE
    speakLikeTeacher(data.explanation);

  } catch (err) {
    console.error(err);
    explanationBox.innerText = "❌ Backend error (server waking up?)";
  }
}

// =========================
// VOICE FUNCTION
// =========================
function speakLikeTeacher(text) {
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.95;
  utterance.pitch = 1;

  speechSynthesis.speak(utterance);
}
