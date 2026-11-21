#!/usr/bin/env node
/** Build the offline chart using the unmodified original HTML and the canonical data. */
import {readFileSync,writeFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=filename=>readFileSync(resolve(root,filename),"utf8");
function buildOriginal(source, dataset) {
 const credentials=dataset.certifications, byLabel=new Map(), byURL=new Map();
 const normalize=x=>(x||"").replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").trim().toLowerCase();
 for(const c of credentials){
  const key=normalize(c.originalLabel||c.label);
  if(!byLabel.has(key))byLabel.set(key,[]);
  byLabel.get(key).push(c);
  if(c.legacyURL){if(!byURL.has(c.legacyURL))byURL.set(c.legacyURL,[]);byURL.get(c.legacyURL).push(c);}
 }
 const seen=new Map();
 const escapeAttr=value=>String(value).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
 const scoreColors=score=> {
  if(score===null||score===undefined)return ["#111111","#ffffff"];
  const v=Number(score);
  if(v>=80)return ["#16803c","#ffffff"];
  if(v>=65)return ["#9bd66a","#172412"];
  if(v>=50)return ["#f4d35e","#26210b"];
  if(v>=35)return ["#e78a40","#23180e"];
  return ["#b4232f","#ffffff"];
 };
 const money=n=>Number.isFinite(n)?"$"+n.toLocaleString("en-US",{maximumFractionDigits:2}):null;
 const addStyle=(attrs,s)=>{
  if(/style="[^"]*"/.test(attrs))return attrs.replace(/style="([^"]*)"/,(m,v)=>'style="'+v.trim().replace(/;?$/,";")+s+'"');
  return attrs+' style="'+s+'"';
 };
 let matched=0,unmatched=[],hidden=0,replaced=0,filled=0,dupes=0,rendered=0;
 let s=source.replace(/<a\s+class="([^"]+)"([\s\S]*?)>([\s\S]*?)<\/a>/g,(match,cls,atts,inner)=>{
  const originalLabel=normalize(inner),href=(atts.match(/href="([^"]*)"/)||[])[1]||"";
  const options=byLabel.get(originalLabel)||[];
  let rec=options.length===1?options[0]:options.find(x=>x.legacyURL===href)||null;
  if(!rec){const urlCandidates=byURL.get(href)||[];if(urlCandidates.length===1)rec=urlCandidates[0];}
  if(!rec){unmatched.push(originalLabel);return match;}
  matched++;
  const count=seen.get(rec.id)||0;seen.set(rec.id,count+1);
  const inheritedReplacement=rec.originalLabel==="AZ-500"?"SC-500":rec.originalLabel==="SC-400"?"SC-401":null;
  if(inheritedReplacement){const successor=credentials.find(x=>x.label===inheritedReplacement);if(successor){rec=successor;inner=inheritedReplacement;replaced++;if(rec.issuerURL&&/https?:\/\//.test(rec.issuerURL))atts=atts.replace(/href="[^"]*"/,'href="'+escapeAttr(rec.issuerURL)+'"');}}
  else if(rec.originalLabel==="CASP+")inner=inner.replace(/CASP\+/g,"SecurityX");
  // Preserve source tile widths; typeset long labels on two centered lines.
  // Only the second line is smaller (e.g. PECB 27005RM, PECB 27032CM).
  const labelParts=inner.trim().split(/\s+/);
  const narrow=cls.endsWith("item1");
  const longSecondLine=labelParts.length>=2 &&
    labelParts.slice(1).join(" ").length>=6 &&
    inner.trim().replace(/<[^>]*>/g,"").length>=12;
  if(narrow && longSecondLine && !/<[^>]+>/.test(inner) && !rec.plannedOnly){
    const head=labelParts[0],tail=labelParts.slice(1).join(" ");
    inner='<span class="audit-label-head">'+head+'</span>'+
      '<span class="audit-label-tail">'+tail+'</span>';
    cls+=' audit-two-line';
  }
  // One canonical CIMP with two original anchors: suppress the secondary visual.
  const archive=rec.displayOnRoadmap===false || (count>0 && (rec.originalLabel||rec.label)==="CIMP");
  if(archive){hidden++;atts=addStyle(atts,"visibility:hidden;pointer-events:none;");atts=atts.replace(/tabindex="[^"]*"/,'tabindex="-1"');}
  else rendered++;
  let color=scoreColors(rec.credibilityScore);if(rec.credibilityScore!==null)filled++;
  atts=addStyle(atts,"background-color:"+color[0]+";color:"+color[1]+";");
  const price=money(rec.priceUSD);
  const note=[
   rec.name,
   (rec.credibilityScore===null?"Credibility: not yet assessed":"Credibility: "+rec.credibilityScore+"/100 (provisional)"),
   "Lifecycle: "+(rec.status||"Unverified"),
   price?"Minimum verified acquisition: "+price:"Acquisition price: not verified"
  ].join("\n");
  const tooltipName=(atts.match(/\s(tooltip(?:text|right|left))="/)||[])[1]||"tooltiptext";
  if(/\s(?:tooltiptext|tooltipright|tooltipleft)="[^"]*"/.test(atts))atts=atts.replace(/\s(?:tooltiptext|tooltipright|tooltipleft)="[^"]*"/,' '+tooltipName+'="'+escapeAttr(note)+'"');
  else atts+=' tooltiptext="'+escapeAttr(note)+'"';
  atts+=' data-credential-id="'+escapeAttr(rec.id)+'"';
  return '<a class="'+cls+'"'+atts+'>'+inner+'</a>';
 });
 if(unmatched.length)throw Error("Unmatched source tiles: "+unmatched.join(", "));

 // Repair pre-existing source-grid alignment defects within the Network domain.
 // CCIE Sec and CCIE Ent were preceded by three empty cells, pushing a span-3
 // tile into the IAM gap; moving two of those blanks AFTER each tile places
 // the credential in network columns 2-4 without moving any later domains.
 for(const row of [3,4]){
   const start=s.indexOf('<!-- Row '+row+' -->');
   const end=s.indexOf('<!-- Row '+(row+1)+' -->',start);
   if(start<0||end<0)throw Error("Original network row marker missing: "+row);
   let part=s.slice(start,end);
   const prefix=/(<!-- Row \d+ -->)(\r?\n\s*)<div class="spacer"><\/div>(\r?\n\s*)<div class="spacer"><\/div>(\r?\n\s*)<div class="spacer"><\/div>/;
   if(!prefix.test(part))throw Error("Network CCIE row prefix changed: "+row);
   part=part.replace(prefix,'$1$2<div class="spacer"></div>');
   const anchor=/(<a class="networkitem2"[\s\S]*?<\/a>)/;
   if(!anchor.test(part))throw Error("Network CCIE wide tile missing: "+row);
   part=part.replace(anchor,'$1\r\n                    <div class="spacer"></div>\r\n                    <div class="spacer"></div>');
   s=s.slice(0,start)+part+s.slice(end);
 }
 // Rows 16 and 26 in the original contain only 46/47 grid units.
 // Finish each row explicitly so subsequent network tiles start at column 2,
 // not the difficulty scale column 1.
 for(const nextRow of [17,27]){
   const marker='<!-- Row '+nextRow+' -->';
   if(!s.includes(marker))throw Error("Missing expected row boundary "+nextRow);
   s=s.replace(marker,'<div class="spacer"></div>\r\n                    '+marker);
 }

 // Keep the original domain headers, subdomain containers and all tile grid placements.
 // The only structural insertions are three fractional-height rows separating difficulty tiers.
 const breaks=[7,14,22];
 for(const startRow of breaks){
   const label='<!-- Row '+startRow+' -->';
   if(!s.includes(label))throw Error("Missing row marker "+startRow);
   s=s.replace(label,'<div class="tier-break" aria-hidden="true"></div>\r\n                    '+label);
 }
 const row10=/(<!-- Row 10 -->)(\r?\n\s*)<div class="spacer"><\/div>/;
 if(!row10.test(s))throw Error("Missing original row 10 left spacer");
 s=s.replace(row10,'$1$2<div class="skilllevelitem"><span style="color:var(--orangedk)">Advanced</span></div>');
 s=s.replace(/(<div class="skilllevelitem"><span style="color:var\(--greendk\)">)Beginner(<\/span><\/div>)/,'$1Foundation$2');

 // Replace row-specific rotated difficulty labels with neutral spacers so the
 // underlying source grid stays in exactly the same order and at the same widths.
 const labelPattern=/<div class="skilllevelitem"><span style="color:var\(--(?:reddk|orangedk|greendk)\)">(?:Expert|Advanced|Intermediate|Foundation)<\/span><\/div>/g;
 const replacedLabels=[...s.matchAll(labelPattern)].length;
 if(replacedLabels!==4)throw Error("Expected four original/injected difficulty labels, found "+replacedLabels);
 s=s.replace(labelPattern,'<div class="spacer"></div>');
 const difficultyMarkup="<div class=\"difficulty-axis\" aria-label=\"Difficulty levels\">\n                <div class=\"difficulty-band difficulty-expert\"><span>Expert</span></div>\n                <div class=\"difficulty-band difficulty-advanced\"><span>Advanced</span></div>\n                <div class=\"difficulty-band difficulty-intermediate\"><span>Intermediate</span></div>\n                <div class=\"difficulty-band difficulty-foundation\"><span>Foundation</span></div>\n            </div>";
 s=s.replace('<div class="certcontainer">','<div class="certcontainer">\r\n            '+difficultyMarkup);

 // Retain all domain and subcategory display styles; override only foreground tile fill and tier gap sizing.
 const css=`
    /* Audit edition: original grid and labels, with four visibly separated levels. */
    .certcontainer {
      grid-template-rows:
        repeat(6, 1.455vmax) .4vmax
        repeat(7, 1.455vmax) .4vmax
        repeat(8, 1.455vmax) .4vmax
        repeat(6, 1.455vmax);
    }
    .certcontainer .tier-break {
      grid-column: 1 / -1;
      border-top: .07vmax solid #798492;
      background-color: #f0f2f5;
      min-width: 0;
    }
    /* The 2024 mobile bitmap was an external dependency; show the same actual chart offline. */
    #static { display:none !important; }
    #interactive { display:block !important; }
 
    /* Layout refinement: separation below original subtitle row. */
    .certcontainer { top: 5.15vmax; }

    /* Neutral domain/subdomain presentation. Tile credibility fills remain untouched. */
    .certbg .domaintitle,
    .certbg .subtitle1,
    .certbg .subtitle2,
    .certbg .subtitle3,
    .certbg .subtitle4,
    .certbg .subtitle5 { color: #39424c !important; }
    .certbg .networkcontainer,
    .certbg .iamcontainer,
    .certbg .engineercontainer,
    .certbg .assetcontainer,
    .certbg .mgmtcontainer,
    .certbg .testingcontainer,
    .certbg .softwarecontainer,
    .certbg .operationscontainer { border-color: #b8bdc5; }
    .certbg .engsubdomain1,
    .certbg .engsubdomain4,
    .certbg .mgmtsubdomain4,
    .certbg .bluesubdomain2,
    .certbg .redsubdomain2,
    .certbg .redsubdomain5 { background-color: #e1e4e9; }
    /* More compact domain headings, more legible subcategory labels. */
    .certbg .domaintitle {
      font-size: .72vmax;
      line-height: 1.06;
      margin-bottom: .03vmax;
      padding: 0 .05vmax;
    }
    .certbg .subtitle1,
    .certbg .subtitle2,
    .certbg .subtitle3,
    .certbg .subtitle4,
    .certbg .subtitle5 {
      font-size: .58vmax;
      line-height: 1.14;
    }


    /* Original tile border colors encoded category; use one neutral outline instead.
       Fill and text color remain exclusively tied to the credibility score. */
    .certcontainer a[data-credential-id] {
      border-color: #aeb4bd;
    }

    /* Preserve original tile dimensions; reduce only long second-line text. */
    .certcontainer a.audit-two-line {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: max-content max-content;
      justify-items: center;
      align-content: center;
      row-gap: 0;
      white-space: nowrap;
      line-height: 1;
    }
    .certcontainer a.audit-two-line > .audit-label-head {
      display: block;
      min-width: 0;
      max-width: 100%;
      font-size: 1em;
      white-space: nowrap;
    }
    .certcontainer a.audit-two-line > .audit-label-tail {
      display: block;
      min-width: 0;
      max-width: 100%;
      font-size: .43vmax;
      letter-spacing: -.01vmax;
      white-space: nowrap;
    }

    /* Difficulty labels are vertically centered in the full height of each band. */
    .difficulty-axis {
      position: absolute;
      top: 0;
      left: 0;
      width: 1.7vmax;
      display: grid;
      grid-template-rows:
        repeat(6, 1.455vmax) .4vmax
        repeat(7, 1.455vmax) .4vmax
        repeat(8, 1.455vmax) .4vmax
        repeat(6, 1.455vmax);
      row-gap: .1vmax;
      font-size: .8vmax;
      font-weight: 600;
      color: #39424c;
      pointer-events: none;
      z-index: 1;
    }
    .difficulty-axis .difficulty-band {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .difficulty-axis .difficulty-band span {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      white-space: nowrap;
    }
    .difficulty-axis .difficulty-expert { grid-row: 1 / span 6; }
    .difficulty-axis .difficulty-advanced { grid-row: 8 / span 7; }
    .difficulty-axis .difficulty-intermediate { grid-row: 16 / span 8; }
    .difficulty-axis .difficulty-foundation { grid-row: 25 / span 6; }
`;
 s=s.replace('</style>',css+'\r\n    </style>');
 // Avoid external bitmap requests when opened from disk; the interactive chart is the source.
 s=s.replace(/<div id="static">[\s\S]*?<\/div>/,'<div id="static" hidden></div>');
 s=s.replace(/<div class="key">481 certifications listed \| July 2024<\/div>/,
   '<div class="key">'+rendered+' credentials | 2026 audit draft | black = unrated; green to red = credibility</div>');
 return {html:'<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Security Certification Roadmap</title></head>\n<body>\n'+s+'\n</body>\n</html>\n',
 stats:{anchors:matched,hidden,replaced,scoredTiles:filled,rendered,sourceRecords:credentials.length}};
}
const output=buildOriginal(read("Security-Certification-Roadmap9.html"),JSON.parse(read("data/certifications.json")));
writeFileSync(resolve(root,"index.html"),output.html,"utf8");
console.log(JSON.stringify(output.stats,null,2));
