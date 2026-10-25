import { copyFile } from "node:fs/promises";

// pdf.js parses PDFs in a worker that must be a packaged file under MV3 CSP.
await copyFile(
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  "public/pdf.worker.min.js",
);
