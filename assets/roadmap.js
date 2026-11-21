"use strict";
/* Canonical data is produced from the Google Sheets master audit. This file deliberately
 * contains no certification inventory or domain-specific credibility colors. */
const DOMAINS = [
  "Communication and Network Security",
  "IAM",
  "Security Architecture and Engineering",
  "Asset Security",
  "Security and Risk Management",
  "Security Assessment and Testing",
  "Software Security",
  "Security Operations",
  "Penetration Testing / Exploitation",
  "AI / ML / LLM Security",
  "Cloud/SysOps"
];
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
  if(domainsFor(c).length>1)button.append(textNode("span","+"+(domainsFor(c).length-1),"multi"));
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
function render(){
  if(!state.records.length)return;
  const subset=filtered(),domain=el("domain-filter").value;
  const cols=domain?[domain]:[...DOMAINS,...new Set(state.records.map(c=>domainName(c.primaryDomain)))].filter((x,i,a)=>a.indexOf(x)===i);
  const chart=el("roadmap");chart.replaceChildren();chart.style.setProperty("--domain-count",cols.length);
  chart.append(textNode("div","PROFICIENCY","domain-heading axis-title"));
  for(const name of cols)chart.append(textNode("div",name,"domain-heading"));
  const order=(a,b)=>(Number(a.sourceIds?.[0]?.replace(/\D/g,""))||9999)-(Number(b.sourceIds?.[0]?.replace(/\D/g,""))||9999);
  for(const tier of TIERS){
    const label=document.createElement("div");label.className="level-label";
    label.append(textNode("span",tier.title),textNode("small",String(tier.id)+" / 4"));chart.append(label);
    for(const col of cols){
      const cell=document.createElement("div");cell.className="domain-cell";
      const matches=subset.filter(c=>c.proficiency===tier.id&&(domain?domainsFor(c).includes(col):domainName(c.primaryDomain)===col)).sort(order);
      if(!matches.length)cell.append(textNode("span","—","empty"));
      else{const fragment=document.createDocumentFragment();for(const c of matches)fragment.append(createTile(c));cell.append(fragment);}
      chart.append(cell);
    }
  }
  el("count-visible").textContent=subset.length.toLocaleString()+" unique credentials displayed";
  el("count-total").textContent=state.records.length+" canonical records ("+state.records.filter(isArchived).length+" archived)";
  el("count-rated").textContent=subset.filter(c=>credibilityBand(c.credibilityScore)!=="unrated").length+" provisionally rated";
}
function setupFilters(){
 const values=[...new Set(state.records.flatMap(domainsFor))].sort((a,b)=>a.localeCompare(b));
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
   const response=await fetch("./data/certifications.json",{cache:"no-store"});
   if(!response.ok)throw new Error("Cannot load data/certifications.json (HTTP "+response.status+")");
   const data=await response.json();
   if(!Array.isArray(data.certifications)||!data.certifications.length)throw new Error("Missing canonical certification array");
   const seen=new Set();for(const c of data.certifications){
     if(!c.id||seen.has(c.id))throw new Error("Missing or duplicate canonical ID: "+c.id);seen.add(c.id);
     if(!Array.isArray(c.domains)||![1,2,3,4].includes(c.proficiency))throw new Error("Invalid canonical record "+c.id);
   }
   state.records=data.certifications;state.metadata=data.metadata||{};
   setupFilters();render();
 }catch(error){
   el("roadmap").replaceChildren();
   el("error").hidden=false;
   el("error").textContent=error.message+". If opened via file://, serve this repository using a local HTTP server (python -m http.server).";
 }
}
document.addEventListener("DOMContentLoaded",init);
