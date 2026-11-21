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
assert.equal(canon.length,487,"Canonical record total changed");
assert.equal(new Set(canon.map(x=>x.id)).size,487);
assert.equal((html.match(/class="tier-break"/g)||[]).length,3);
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
console.log("PASS: original 482 tile positions/domains preserved, 4 tier labels, 9 archived/duplicate hidden, no visible prices, standalone offline HTML.");
