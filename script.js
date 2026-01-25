let currentPage = 0;
const backendUrl = "https://pdf-ai-teacher.onrender.com";

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

    if (data.status === "done") {
      explanationBox.innerText += "\n\n✅ PDF complete ho gaya";
      return;
    }

    explanationBox.innerText += "\n\n" + data.explanation;
    currentPage = data.next_page;

  } catch (e) {
    explanationBox.innerText =
      "❌ Backend error (server sleeping ya PDF zyada bada)";
  }
}
