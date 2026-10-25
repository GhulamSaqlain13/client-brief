// Text-based PDFs only; the text is extracted locally and never uploaded.
export async function readPdf(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Choose a PDF smaller than 10 MB.");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    disableFontFace: true,
  });
  const pages: string[] = [];
  try {
    const doc = await task.promise;
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      let text = "";
      for (const item of content.items)
        if ("str" in item) text += item.str + (item.hasEOL ? "\n" : "");
      pages.push(text.replace(/[ \t]+\n/g, "\n").trim());
    }
  } finally {
    await task.destroy();
  }
  const text = pages.filter(Boolean).join("\n\n");
  if (!text.trim())
    throw new Error(
      "No text found in this PDF. Scanned PDFs (images of text) are not supported.",
    );
  return text;
}
