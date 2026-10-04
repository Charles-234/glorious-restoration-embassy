/* Temporary QA viewer: serves .audit/ on http://localhost:8080 so the screenshots
   can be inspected in a normal localhost tab. Zero dependencies. Delete with the
   rest of .audit\ when finished. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const ROOT = __dirname;
const PORT = 8082;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

/* Index every file in .audit/ and .audit/screens/ by name, so the screenshots
   resolve even though the HTML refers to them without the "screens/" prefix. */
const files = new Map();
for (const dir of [ROOT, path.join(ROOT, "screens")]) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    continue;
  }
  for (const entry of entries) {
    if (entry.isFile()) files.set(entry.name.toLowerCase(), path.join(dir, entry.name));
  }
}
fs.writeFileSync(
  path.join(ROOT, "server-files.txt"),
  "indexed " + files.size + " files\n" + [...files.keys()].sort().join("\n") + "\n"
);

http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch (e) {
      pathname = "/";
    }

    const wanted = (pathname === "/" ? "visual-qa.html" : pathname.replace(/^[/\\]+/, "")).toLowerCase();

    if (!files.has(wanted)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("not found: " + wanted + "\nindexed files: " + files.size + "\n");
    }

    const file = files.get(wanted);
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => {
    fs.writeFileSync(path.join(ROOT, "server-started.txt"), "listening on http://localhost:" + PORT + "\n");
  });