let currentUtterance = null;

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

    // 🔥 voice automatically start NAHI karega
    document.getElementById("speakBtn").disabled = false;

  } catch (err) {
    console.error(err);
    explanationBox.innerText = "❌ Backend error (server waking up?)";
  }
}

// =========================
// VOICE CONTROLS
// =========================
function playVoice() {
  stopVoice();

  const text = document.getElementById("explanation").innerText;
  currentUtterance = new SpeechSynthesisUtterance(text);

  currentUtterance.lang = "en-IN";
  currentUtterance.rate = 0.95;
  currentUtterance.pitch = 1;

  speechSynthesis.speak(currentUtterance);
}

function pauseVoice() {
  if (speechSynthesis.speaking) {
    speechSynthesis.pause();
  }
}

function resumeVoice() {
  if (speechSynthesis.paused) {
    speechSynthesis.resume();
  }
}

function stopVoice() {
  speechSynthesis.cancel();
}
