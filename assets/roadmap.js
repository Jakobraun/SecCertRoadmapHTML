"use strict";
/* Canonical data is produced from the Google Sheets master audit. This file deliberately
 * contains no certification inventory or domain-specific credibility colors. */
const DOMAIN_UNITS = [
  ["Communication and Network Security",3],
  ["IAM",1],
  ["Security Architecture and Engineering",7],
  ["Asset Security",2],
  ["Security and Risk Management",9],
  ["Security Assessment and Testing",3],
  ["Software Security",1],
  ["Security Operations",13],
  ["Penetration Testing / Exploitation",4]
];
const DOMAINS = DOMAIN_UNITS.map(x=>x[0]);
const TIERS = [{id:4,title:"Expert",subtitle:"Specialist mastery"},
               {id:3,title:"Advanced",subtitle:"Complex design & analysis"},
               {id:2,title:"Intermediate",subtitle:"Independent operations"},
               {id:1,title:"Foundation",subtitle:"Basic concepts"}];
const DOMAINS_ALIAS = {
  "mgmt_left":"Security Management","mgmt_right":"Security Management",
  "incident_handling":"Incident Handling","exploit":"Exploitation",
  "pen_testing":"Penetration Testing","test":"Security Assessment and Testing"
};
const COLORS = {
  unrated:{background:"#111111",foreground:"#ffffff"},
  green:{background:"#16803c",foreground:"#ffffff"},
  lightgreen:{background:"#9bd66a",foreground:"#172412"},
  yellow:{background:"#f4d35e",foreground:"#26210b"},
  orange:{background:"#e78a40",foreground:"#23180e"},
  red:{background:"#b4232f",foreground:"#ffffff"}
};
const el = id => document.getElementById(id);
const state = {records:[],metadata:{},lastFocus:null};
function domainName(name){return DOMAINS_ALIAS[name] || name;}
function domainsFor(c){return [...new Set((c.domains || [c.primaryDomain]).map(domainName).filter(Boolean))];}
function credibilityBand(score){
  if(score===null || score===undefined || !Number.isFinite(Number(score))) return "unrated";
  const v=Number(score);
  if(v>=80)return "green";
  if(v>=65)return "lightgreen";
  if(v>=50)return "yellow";
  if(v>=35)return "orange";
  return "red";
}
function money(v){return Number.isFinite(v)?"$"+v.toLocaleString("en-US",{maximumFractionDigits:2}):null;}
function isArchived(c){return c.displayOnRoadmap===false;}
function textNode(tag,content,cls){const n=document.createElement(tag);n.textContent=content;if(cls)n.className=cls;return n;}
function addLink(parent,label,href){
  if(!href)return;
  try{const url=new URL(href,window.location.href);if(!["https:","http:"].includes(url.protocol))return;
    const a=document.createElement("a");a.href=url.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent=label;parent.append(a);
  }catch{/* An untrusted or malformed legacy URL should not be clickable. */}
}
function detailLine(container,label,value){
  if(value===null||value===undefined||value==="")return;
  container.append(textNode("dt",label),textNode("dd",String(value)));
}
function openDetails(c,trigger){
  state.lastFocus=trigger;el("details").hidden=false;el("details-title").textContent=c.name;
  const body=el("details-content");body.replaceChildren();
  const band=credibilityBand(c.credibilityScore);
  body.append(textNode("p",c.label+" · "+(isArchived(c)?"Archived / hidden by default":"Active chart candidate"),"pill"));
  const dl=document.createElement("dl");
  detailLine(dl,"Record / source identifier",c.id+" · "+(c.sourceIds||[]).join(", "));
  detailLine(dl,"Original 2024 tile label",c.originalLabel);
  detailLine(dl,"Lifecycle status",c.status);
  detailLine(dl,"Proficiency",({1:"1 — Foundation",2:"2 — Intermediate",3:"3 — Advanced",4:"4 — Expert"})[c.proficiency]);
  detailLine(dl,"Proficiency evidence",c.proficiencyEvidence);
  detailLine(dl,"Credibility",band==="unrated"?"Unrated — black tile":c.credibilityScore+"/100 — "+band+" (provisional)");
  detailLine(dl,"Credibility evidence and limitations",c.credibilityEvidence);
  detailLine(dl,"Lowest independently checked acquisition price",money(c.priceUSD)??"Not verified");
  detailLine(dl,"Legacy chart price",money(c.legacyPriceUSD)?money(c.legacyPriceUSD)+" (unverified; not displayed on tile)":"Not recorded");
  detailLine(dl,"Price verification",c.priceEvidence);
  detailLine(dl,"Renewal",c.renewal);
  detailLine(dl,"Primary domain",domainName(c.primaryDomain));
  detailLine(dl,"Mapped domains",domainsFor(c).join(" • "));
  detailLine(dl,"Disposition",c.disposition);
  detailLine(dl,"Last checked",c.verifiedAt || "Not individually checked");
  body.append(dl);
  if(c.notes)body.append(textNode("p",c.notes,"note"));
  const links=document.createElement("p");addLink(links,"Issuer / status evidence",c.issuerURL);
  if(c.legacyURL && c.legacyURL!==c.issuerURL){links.append(document.createTextNode(" · "));addLink(links,"Original roadmap link",c.legacyURL);}
  body.append(links);
  el("details-close").focus();
}
function createTile(c){
  const button=document.createElement("button");
  button.type="button";button.className="tile"+(isArchived(c)?" archived":"");
  const color=COLORS[credibilityBand(c.credibilityScore)];
  button.style.setProperty("--tile-bg",color.background);
  button.style.setProperty("--tile-fg",color.foreground);
  const price=money(c.priceUSD);
  button.append(textNode("span",c.label,"abbr"));
  if(price)button.append(textNode("span",price,"cost"));
  // Domain coverage is shown in details; compact tiles keep the original visual simplicity.
  const rating=c.credibilityScore===null?"unrated":"credibility "+c.credibilityScore+"/100, provisional";
  button.title=c.name+" | "+rating+" | "+(price||"current price unverified")+" | "+c.status;
  button.setAttribute("aria-label",c.label+": "+c.name+". Proficiency "+c.proficiency+". "+rating+".");
  button.addEventListener("click",()=>openDetails(c,button));
  return button;
}
function filtered(){
 const query=el("search").value.trim().toLowerCase(),domain=el("domain-filter").value,
       cred=el("credibility-filter").value,archived=el("show-archived").checked;
 return state.records.filter(c=>{
   if(!archived&&isArchived(c))return false;
   if(!domain&&c.plannedOnly)return false;
   if(domain&&!domainsFor(c).includes(domain))return false;
   const band=credibilityBand(c.credibilityScore);
   if(cred==="rated"&&band==="unrated")return false;
   if(cred==="unrated"&&band!=="unrated")return false;
   if(cred&&!["rated","unrated"].includes(cred)&&band!==cred)return false;
   if(query){
      const hay=[c.label,c.originalLabel,c.name,c.status,c.disposition,c.id,c.subdomain,
                 ...domainsFor(c),...(c.sourceIds||[])].join(" ").toLowerCase();
      if(!hay.includes(query))return false;
   }
   return true;
 });
}
/**
 * Match the original roadmap's regular text weight and keep labels readable.
 * Reduce the type slightly only where necessary, never below 9px.
 * For unavoidable overflow, show an ellipsis rather than unreadable 1–3px text.
 * Full titles remain accessible through the native tooltip and details panel.
 */
function fitTileLabels(){
  const labels=el("roadmap").querySelectorAll(".tile .abbr");
  for(const label of labels){
    label.style.fontSize="";
    label.classList.remove("label-truncated");
    const available=label.clientWidth-2;
    if(available<=0 || label.scrollWidth<=available)continue;
    const base=parseFloat(getComputedStyle(label).fontSize);
    const min=9;
    const natural=label.scrollWidth;
    const desired=Math.max(min,Math.min(base,base*available/natural*0.985));
    label.style.fontSize=desired.toFixed(2)+"px";
    if(label.scrollWidth>available && desired>min){
      let size=desired;
      for(let attempt=0;attempt<12 && label.scrollWidth>available && size>min;attempt++){
        size=Math.max(min,size-0.2);
        label.style.fontSize=size.toFixed(2)+"px";
      }
    }
    if(label.scrollWidth>available)label.classList.add("label-truncated");
  }
}
function fitViewport(){
  if(!state.records.length)return;
  const list=filtered(),selected=el("domain-filter").value;
  const columns=selected?[[selected,Math.max(4,DOMAIN_UNITS.find(x=>x[0]===selected)?.[1]||6)]]:DOMAIN_UNITS;
  let rows=0;
  for(const tier of TIERS){
    let max=1;
    for(const [name,width] of columns){
      let line=1,used=0;
      const matches=list.filter(x=>x.proficiency===tier.id&&(selected?domainsFor(x).includes(name):domainName(x.primaryDomain)===name));
      for(const c of matches){
        const span=Math.min(width,Math.max(1,c.originalTileSpan||1));
        if(used+span>width){line++;used=0;}
        used+=span;
      }
      max=Math.max(max,line);
    }
    rows+=max;
  }
  const viewport=el("chart-scroll").clientHeight;
  const heading=32;
  const target=Math.floor((viewport-heading-10)/(rows+1));
  const size=Math.max(12,Math.min(22,target));
  el("roadmap").style.setProperty("--tile-height",size+"px");
  el("roadmap").dataset.estimatedRows=String(rows);
  el("roadmap").dataset.fitViewport=viewport>heading+rows*(size+1)?"yes":"constrained";
  fitTileLabels();
}
function render(){
  if(!state.records.length)return;
  const subset=filtered(), selected=el("domain-filter").value;
  // Default reproduces the nine populated original domains. Secondary and planned
  // domains remain accessible through filtering, not empty permanent columns.
  const domains=selected?[[selected,Math.max(4,DOMAIN_UNITS.find(x=>x[0]===selected)?.[1]||6)]]:DOMAIN_UNITS;
  const units=domains.reduce((n,d)=>n+d[1],0);
  const chart=el("roadmap");chart.replaceChildren();
  chart.style.setProperty("--domain-count",units);
  chart.append(textNode("div","PROFICIENCY","domain-heading axis-title"));
  for(const [name,cols] of domains){
    const heading=textNode("div",name,"domain-heading");heading.style.gridColumn="span "+cols;chart.append(heading);
  }
  const order=(a,b)=>(Number(a.sourceIds?.[0]?.replace(/\\D/g,""))||9999)-(Number(b.sourceIds?.[0]?.replace(/\\D/g,""))||9999);
  for(const tier of TIERS){
    const label=document.createElement("div");label.className="level-label";
    label.append(textNode("span",tier.title),textNode("small",tier.id+" / 4"));chart.append(label);
    for(const [name,cols] of domains){
      const cell=document.createElement("div");cell.className="domain-cell";
      cell.style.gridColumn="span "+cols;cell.style.setProperty("--cell-cols",cols);
      const matches=subset.filter(c=>c.proficiency===tier.id && (selected?domainsFor(c).includes(name):domainName(c.primaryDomain)===name)).sort(order);
      if(!matches.length)cell.append(textNode("span","—","empty"));
      else{const frag=document.createDocumentFragment();
        for(const c of matches){const tile=createTile(c);tile.style.gridColumn="span "+Math.min(cols,Math.max(1,c.originalTileSpan||1));frag.append(tile);}
        cell.append(frag);
      }
      chart.append(cell);
    }
  }
  el("count-visible").textContent=subset.filter(c=>selected||DOMAINS.includes(domainName(c.primaryDomain))).length.toLocaleString()+" credentials on roadmap";
  el("count-total").textContent=state.records.length+" canonical / "+state.records.filter(isArchived).length+" archived";
  el("count-rated").textContent=subset.filter(c=>credibilityBand(c.credibilityScore)!=="unrated").length+" provisionally rated";
  fitViewport();
}
function setupFilters(){
 const values=[...new Set(state.records.filter(c=>!c.plannedOnly).flatMap(domainsFor))].sort((a,b)=>a.localeCompare(b));
 const select=el("domain-filter");
 for(const v of values){const option=document.createElement("option");option.value=v;option.textContent=v;select.append(option);}
 for(const id of ["search","domain-filter","credibility-filter","show-archived"]){
   el(id).addEventListener(id==="search"?"input":"change",render);
 }
 el("reset").addEventListener("click",()=>{
   el("search").value="";el("domain-filter").value="";el("credibility-filter").value="";
   el("show-archived").checked=false;render();
 });
 el("details-close").addEventListener("click",closeDetails);
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDetails();});
}
function closeDetails(){el("details").hidden=true;if(state.lastFocus?.isConnected)state.lastFocus.focus();}
async function init(){
 try{
   const embedded=document.getElementById("roadmap-data");
   let data;
   if(embedded){
     data=JSON.parse(embedded.textContent);
   }else{
     // Development fallback for pages intentionally using the modular JSON.
     const response=await fetch("./data/certifications.json",{cache:"no-store"});
     if(!response.ok)throw new Error("Cannot load data/certifications.json (HTTP "+response.status+")");
     data=await response.json();
   }
   if(!Array.isArray(data.certifications)||!data.certifications.length)throw new Error("Missing canonical certification array");
   const seen=new Set();for(const c of data.certifications){
     if(!c.id||seen.has(c.id))throw new Error("Missing or duplicate canonical ID: "+c.id);seen.add(c.id);
     if(!Array.isArray(c.domains)||![1,2,3,4].includes(c.proficiency))throw new Error("Invalid canonical record "+c.id);
   }
   state.records=data.certifications;state.metadata=data.metadata||{};
   setupFilters();render();
   if(document.fonts?.ready)document.fonts.ready.then(fitTileLabels);
 }catch(error){
   el("roadmap").replaceChildren();
   el("error").hidden=false;
   el("error").textContent=error.message+". Open the self-contained index.html or inspect the data integrity.";
 }
}
window.addEventListener("resize",()=>{if(state.records.length)fitViewport();});
document.addEventListener("DOMContentLoaded",init);
