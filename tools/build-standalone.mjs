#!/usr/bin/env node
/**
 * Compile the offline-first certification roadmap.
 * No dependencies or web access needed. Node 18+.
 * Edit the HTML template, CSS, JS and JSON source; then run:
 *   node tools/build-standalone.mjs
 *
 * index.html is a generated artifact and works directly with file://.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
const template=read("src/roadmap-template.html");
const css=read("assets/roadmap.css").trimEnd();
const js=read("assets/roadmap.js").trimEnd();
const data=JSON.parse(read("data/certifications.json"));

if(!Array.isArray(data.certifications)||data.certifications.length===0)
  throw new Error("Invalid or empty canonical credential data");
if(!template.includes("<!-- EMBED_STYLES -->")||!template.includes("<!-- EMBED_DATA_AND_SCRIPT -->"))
  throw new Error("Roadmap template is missing embed markers");
if(css.includes("</style>")||js.includes("</script>"))
  throw new Error("Inline asset has an unsafe closing tag");

// Escape HTML script delimiter characters while preserving parsed JSON values.
const safeJSON=JSON.stringify(data).replace(/</g,"\\u003c");
const output=template
  .replace("<!-- EMBED_STYLES -->","<style>\n"+css+"\n</style>")
  .replace("  <!-- EMBED_DATA_AND_SCRIPT -->",
    '  <script id="roadmap-data" type="application/json">'+safeJSON+'</script>\n'+
    '  <script>\n'+js+'\n  </script>');
writeFileSync(resolve(root,"index.html"),output,"utf8");
console.log("Wrote index.html: "+Buffer.byteLength(output,"utf8")+" bytes, "+
  data.certifications.length+" canonical certifications (self-contained).");
