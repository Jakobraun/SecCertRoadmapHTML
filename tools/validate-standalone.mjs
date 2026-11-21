#!/usr/bin/env node
/** Validate the generated offline single-file roadmap (no browser/dependencies required). */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { Script } from "node:vm";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const json=html.match(/<script id="roadmap-data" type="application\/json">([\s\S]*?)<\/script>/);
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert(json,"Embedded JSON dataset missing");
const dataset=JSON.parse(json[1]);
assert.equal(dataset.certifications.length,487);
assert.equal(new Set(dataset.certifications.map(x=>x.id)).size,487);
assert(html.includes("<!-- This inline data snapshot"));
assert(/<style>[\s\S]*\.tile \.abbr/.test(html),"CSS not embedded");
assert.equal(scripts.length,1,"Exactly one executable inline script expected");
new Script(scripts[0][1],{filename:"roadmap-inline.js"});
assert(!/<script\s+[^>]*src=|<link\s+[^>]*rel=["']stylesheet["']/.test(html),
  "External CSS/JS runtime dependency found");
assert(scripts[0][1].includes('getElementById("roadmap-data")'),
  "JavaScript must read embedded credential data");
assert(/font-weight:\s*400/.test(html),"Normal-weight tile text missing");
assert(scripts[0][1].includes("const min=9"),"Readable label size floor missing");
console.log("PASS: standalone HTML embeds 487 canonical records, CSS, and valid JavaScript without external runtime assets.");
