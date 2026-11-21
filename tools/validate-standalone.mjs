#!/usr/bin/env node
/** Verify the local original-layout roadmap did not reintroduce a custom tile renderer. */
import {readFileSync} from "node:fs";
import {strict as assert} from "node:assert";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=read("index.html"),orig=read("Security-Certification-Roadmap9.html");
const canon=JSON.parse(read("data/certifications.json")).certifications;
const anchor=/<a\s+class="([^"]+)"([\s\S]*?)>([\s\S]*?)<\/a>/g;
const originalAnchors=[...orig.matchAll(anchor)],renderedAnchors=[...html.matchAll(anchor)];
assert.equal(originalAnchors.length,482,"Original anchor inventory changed");
assert.equal(renderedAnchors.length,482,"Original grid tiles lost or added");
assert(originalAnchors.every((m,i)=>m[1]===renderedAnchors[i][1]),"Original tile class/span order changed");
assert.equal(canon.length,487,"Canonical record total changed");
assert.equal(new Set(canon.map(x=>x.id)).size,487);
assert.equal((html.match(/class="tier-break"/g)||[]).length,3);
assert.equal((html.match(/class="difficulty-axis"/g)||[]).length,1,"Difficulty-axis overlay missing");
assert.equal((html.match(/class="difficulty-band difficulty-/g)||[]).length,4,"Four difficulty bands required");
assert.equal((html.match(/class="skilllevelitem"/g)||[]).length,0,"Old row-positioned difficulty labels must be replaced");
for(const [label,row] of [["expert","1 / span 6"],["advanced","8 / span 7"],["intermediate","16 / span 8"],["foundation","25 / span 6"]])
  assert(html.includes(".difficulty-axis .difficulty-"+label+" { grid-row: "+row+"; }"),"Wrong difficulty band placement: "+label);
assert(html.includes(".certcontainer { top: 5.15vmax; }"),"Top title clearance missing");
assert(html.includes(".certbg .domaintitle,") && html.includes("color: #39424c !important;"),"Neutral headings missing");
assert(html.includes(".certbg .engsubdomain1,") && html.includes("background-color: #f2f3f5;"),"Neutral subdomain fill missing");
assert(html.includes(".certbg .networkcontainer,") && html.includes("border-color: #b8bdc5;"),"Neutral domain outlines missing");
assert(html.includes(".certcontainer a[data-credential-id] {") && html.includes("border-color: #aeb4bd;"),"Neutral certification tile borders missing");
for(const t of ["Expert","Advanced","Intermediate","Foundation"])
  assert(html.includes(">"+t+"</span>"),"Missing tier label "+t);
for(const t of ["Cloud/SysOps","*nix","ICS/IoT","GRC","Forensics","Incident Handling","Penetration Testing","Exploitation"])
  assert(html.includes(t),"Missing original domain/subdomain title "+t);
assert.equal(renderedAnchors.filter(m=>/\$\s*\d/.test(m[3])).length,0,"Price leaked onto tile faces");
assert.equal(renderedAnchors.filter(m=>/visibility:hidden/.test(m[2])).length,9,"Unexpected retired/duplicate visibility");
assert.equal(renderedAnchors.filter(m=>/data-credential-id="/.test(m[2])).length,482);
assert(renderedAnchors.some(m=>m[3].trim()==="SC-500") && !renderedAnchors.some(m=>m[3].trim()==="AZ-500"));
assert(renderedAnchors.some(m=>m[3].trim()==="SC-401") && !renderedAnchors.some(m=>m[3].trim()==="SC-400"));
const originalDomainBlock=orig.split('<div class="certbg">')[1].split("<!-- Begin Foreground Grid -->")[0];
const outputDomainBlock=html.split('<div class="certbg">')[1].split("<!-- Begin Foreground Grid -->")[0];
assert.equal(originalDomainBlock,outputDomainBlock,"Original domain/subdomain markup changed");
assert(!/<script\s+[^>]*src=/.test(html));
assert(!/fetch\(/.test(html));
assert(!html.includes('class="controls"'),"Custom layout controls reintroduced");
console.log("PASS: original 482 tile positions/domains preserved, grayscale domains, centered 4-tier scale, 9 archived/duplicate hidden, no visible prices, standalone offline HTML.");
