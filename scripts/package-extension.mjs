import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

// MV3 rejects inline executable JavaScript. Move Next's generated inline
// scripts into packaged files; non-executable __NEXT_DATA__ JSON stays inline.
async function processDirectory(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await processDirectory(file);
    else if (file.endsWith(".html")) {
      let html = await readFile(file, "utf8");
      const scripts = [
        ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g),
      ];
      for (const [whole, attributes, body] of scripts) {
        if (
          !body.trim() ||
          /\bsrc\s*=/.test(attributes) ||
          /type=["']application\/json["']/.test(attributes)
        )
          continue;
        const filename = `inline-${createHash("sha256").update(body).digest("hex").slice(0, 16)}.js`;
        await writeFile(path.join("out", filename), body);
        html = html.replace(
          whole,
          `<script${attributes} src="/${filename}"></script>`,
        );
      }
      await writeFile(file, html);
    }
  }
}
await processDirectory("out");
console.log(
  "Chrome extension packaged in out/. Load this directory as an unpacked extension.",
);
