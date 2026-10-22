export function download(name: string, data: string, type = "text/markdown") {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const fileName = (name: string) =>
  name.replace(/[^a-z0-9]/gi, "-").slice(0, 100) || "brief";
export async function copy(text: string) {
  if (!navigator.clipboard?.writeText)
    throw new Error("Clipboard is unavailable. Export the text instead.");
  await navigator.clipboard.writeText(text);
}
export async function readTextFile(file: File, backup = false) {
  if (file.size > (backup ? 10 * 1024 * 1024 : 400000))
    throw new Error(
      backup
        ? "Choose a backup smaller than 10 MB."
        : "Choose a text file smaller than 400 KB.",
    );
  if (!backup && !/\.(txt|md|csv)$/i.test(file.name))
    throw new Error(
      "Supported imports: .txt, .md, and .csv. PDF import is not available yet.",
    );
  const text = await file.text();
  if (text.includes("\u0000"))
    throw new Error(
      "This looks like a binary file. Please choose a UTF-8 text file.",
    );
  if (!backup && text.length > 100000)
    throw new Error(
      "Conversation exceeds 100,000 characters. Split it into smaller captures.",
    );
  return text;
}
