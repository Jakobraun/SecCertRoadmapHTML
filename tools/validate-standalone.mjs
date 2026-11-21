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
assert(originalAnchors.every((m,i)=>m[1]===renderedAnchors[i][1].replace(" audit-two-line","")),"Original tile class/span order changed");
const longTiles=renderedAnchors.filter(m=>m[1].includes("audit-two-line"));
assert.equal(longTiles.length,10,"Expected 10 targeted long-label tiles");
for(const label of ["PECB 27005RM","PECB 27032CM"]){
  assert(longTiles.some(m=>m[3].replace(/<[^>]*>/g," ").trim().replace(/\s+/g," ")===label),
    "Two-line label missing: "+label);
}
assert(html.includes(".certcontainer a.audit-two-line > .audit-label-tail") && html.includes("font-size: .43vmax;"),
  "Small second-line font CSS missing");
assert.equal(canon.length,487,"Canonical record total changed");
assert.equal(new Set(canon.map(x=>x.id)).size,487);
assert.equal((html.match(/class="tier-break"/g)||[]).length,3);

/* Every source row must preserve the original sequence of certification tile
   spans and spacers: no attempt to repack or shift the foreground grid. */
function sourceGridRows(source){
  const fg=source.slice(source.indexOf('<div class="certcontainer">'),source.indexOf('<!-- Find # of certs'));
  const markers=[...fg.matchAll(/<!-- Row (\d+)[^\r\n]*?-->/g)];
  return markers.map((m,i)=>{
    const chunk=fg.slice(m.index,markers[i+1]?.index??fg.length);
    const sequence=[...chunk.matchAll(/<(?:div|a)\s+class="([^"]+)"/g)]
      .map(x=>x[1].split(" ")[0])
      .filter(x=>x==="skilllevelitem"||/^spacer(?:5|10)?$/.test(x)||/^(?:network|iam|engineer|asset|mgmt|test|software|blueops|redops)item/.test(x))
      .map(x=>x==="skilllevelitem"?"spacer":x);
    return {row:Number(m[1]),sequence};
  });
}
const origRows=sourceGridRows(orig),actualRows=sourceGridRows(html);
assert.equal(origRows.length,27,"Source row marker count changed");
assert.equal(actualRows.length,27,"Generated row marker count changed");
for(let i=0;i<origRows.length;i++){
  assert.equal(origRows[i].row,actualRows[i].row);
  assert.deepEqual(actualRows[i].sequence,origRows[i].sequence,
    "Original tiles/spacers were rearranged in row "+origRows[i].row);
}
assert(html.includes("font-size: .72vmax;")&&html.includes("line-height: 1.06;"),"Compact domain headings missing");
assert(html.includes("font-size: .58vmax;"),"Enlarged subtitle typography missing");
assert(html.includes("background-color: #e1e4e9;"),"Darker neutral subdomain shading missing");
assert(html.includes("margin-left: -.8vmax;")&&html.includes("width: calc(100% + .8vmax);"),
  "Network domain left-border-only extension missing");

assert.equal((html.match(/class="difficulty-axis"/g)||[]).length,1,"Difficulty-axis overlay missing");
assert.equal((html.match(/class="difficulty-band difficulty-/g)||[]).length,4,"Four difficulty bands required");
assert.equal((html.match(/class="skilllevelitem"/g)||[]).length,0,"Old row-positioned difficulty labels must be replaced");
for(const [label,row] of [["expert","1 / span 6"],["advanced","8 / span 7"],["intermediate","16 / span 8"],["foundation","25 / span 6"]])
  assert(html.includes(".difficulty-axis .difficulty-"+label+" { grid-row: "+row+"; }"),"Wrong difficulty band placement: "+label);
assert(html.includes(".certcontainer { top: 5.15vmax; }"),"Top title clearance missing");
assert(html.includes(".certbg .domaintitle,") && html.includes("color: #39424c !important;"),"Neutral headings missing");
assert(html.includes(".certbg .engsubdomain1,") && html.includes("background-color: #e1e4e9;"),"Neutral subdomain fill missing");
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
console.log("PASS: original 482 tile positions/domains preserved, original tile/spacer placement restored, Network left border extended, compact headings, larger subtitles, centered 4-tier scale, 9 archived/duplicate hidden, no visible prices, standalone offline HTML.");
