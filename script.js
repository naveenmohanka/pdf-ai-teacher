let currentPage = 0;
const backendUrl = "https://pdf-ai-teacher.onrender.com";

/* =========================
   🔊 VOICE (Browser Speech)
========================= */
let speechUtterance = null;
let isSpeaking = false;

function speakText(text) {
  if (!("speechSynthesis" in window)) {
    alert("Browser speech support nahi karta");
    return;
  }

  window.speechSynthesis.cancel(); // purani voice band
  speechUtterance = new SpeechSynthesisUtterance(text);

  speechUtterance.lang = "en-IN";   // Hinglish best
  speechUtterance.rate = 0.9;       // natural speed
  speechUtterance.pitch = 1;

  isSpeaking = true;
  window.speechSynthesis.speak(speechUtterance);
}

function pauseSpeech() {
  if (isSpeaking) window.speechSynthesis.pause();
}

function resumeSpeech() {
  if (isSpeaking) window.speechSynthesis.resume();
}

function stopSpeech() {
  window.speechSynthesis.cancel();
  isSpeaking = false;
}

/* =========================
   📄 PDF UPLOAD + EXPLAIN
========================= */
async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile");
  const explanationBox = document.getElementById("explanation");

  if (!fileInput.files.length) {
    alert("PDF select karo");
    return;
  }

  explanationBox.innerText = "⏳ AI teacher samjha raha hai...";

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const response = await fetch(
      `${backendUrl}/upload-pdf?start_page=${currentPage}`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (data.status === "error") {
      explanationBox.innerText = "❌ " + data.explanation;
      return;
    }

    // 🧠 explanation append
    explanationBox.innerText += "\n\n" + data.explanation;

    // 🔊 AUTO SPEAK (best part)
   

    // pagination (future ready)
    if (data.next_page !== undefined) {
      currentPage = data.next_page;
    }

  } catch (e) {
    explanationBox.innerText =
      "❌ Backend error (server sleeping ya PDF zyada bada)";
  }
}
let utterance;

function playVoice() {
  const text = document.getElementById("explanation").innerText;
  if (!text) return;

  window.speechSynthesis.cancel();
  utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}

function pauseSpeech() {
  window.speechSynthesis.pause();
}

function resumeSpeech() {
  window.speechSynthesis.resume();
}

function stopSpeech() {
  window.speechSynthesis.cancel();
}
