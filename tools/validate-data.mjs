import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
const { metadata, certifications } = JSON.parse(readFileSync(new URL("../data/certifications.json", import.meta.url),"utf8"));
assert.equal(metadata.schemaVersion,1);
assert.equal(metadata.rawRecordCount,482);
assert.equal(certifications.length,metadata.canonicalCount);
assert.equal(new Set(certifications.map(c=>c.id)).size,certifications.length);
assert.equal(metadata.canonicalCount,certifications.length,"stale canonical count");
assert.equal(metadata.visibleCount,certifications.filter(c=>c.displayOnRoadmap).length,"stale eligible count");
assert.equal(metadata.archivedCount,certifications.filter(c=>!c.displayOnRoadmap).length,"stale archive count");
if(metadata.lifecycleReviewedCount!==undefined){
 const reviewed=certifications.filter(c=>c.lifecycleCheckedAt);
 assert.equal(metadata.lifecycleReviewedCount,reviewed.length,"incomplete lifecycle audit coverage");
 assert.equal(metadata.lifecycleResolvedCount,reviewed.filter(c=>!/unverified/i.test(c.status)).length,"stale resolved count");
 assert.equal(metadata.lifecycleUnverifiedCount,certifications.filter(c=>/unverified/i.test(c.status)).length,"stale unresolved count");
}
const valid=new Set([1,2,3,4]);
for(const c of certifications){
 assert(c.id && c.name && c.label, "missing identity");
 assert(valid.has(c.proficiency), "invalid proficiency: "+c.id);
 assert(Array.isArray(c.domains) && c.domains.includes(c.primaryDomain),"missing primary domain: "+c.id);
 assert.equal(new Set(c.domains).size,c.domains.length,"duplicate domain: "+c.id);
 assert(c.credibilityScore===null || (c.credibilityScore>=0 && c.credibilityScore<=100),"invalid credibility: "+c.id);
 assert(c.priceUSD===null || (Number.isFinite(c.priceUSD)&&c.priceUSD>=0),"invalid price: "+c.id);
 if(/retired|abeyance/i.test(c.status))assert.equal(c.displayOnRoadmap,false,"retired visible: "+c.id);
 if(c.status==="Not a certification")assert.equal(c.displayOnRoadmap,false,"non-credential visible: "+c.id);
 if(c.lifecycleCheckedAt){
  assert(/^\d{4}-\d{2}-\d{2}$/.test(c.lifecycleCheckedAt),"invalid lifecycle check date: "+c.id);
  assert(c.lifecycleEvidence&&/^https:\/\//.test(c.lifecycleEvidenceURL),"missing lifecycle evidence: "+c.id);
  if(/unverified/i.test(c.status))assert(!c.lifecycleVerifiedAt,"unresolved lifecycle marked verified: "+c.id);
  else assert.equal(c.lifecycleVerifiedAt,c.lifecycleCheckedAt,"missing lifecycle verification date: "+c.id);
  if(c.status==="Active (renamed)"){
   assert(c.label!==c.originalLabel&&c.name,"rename lacks current label: "+c.id);
   assert(/^https:\/\//.test(c.lifecycleCurrentURL),"rename lacks current issuer link: "+c.id);
  }
 }
}
assert.equal(certifications.reduce((n,c)=>n+c.sourceIds.length,0),488);
assert.equal(certifications.filter(c=>c.label==="CIMP").length,1);
assert.equal(certifications.find(c=>c.label==="CIMP").sourceIds.length,2);
assert.equal(certifications.filter(c=>c.label==="CCSE").length,2);
assert.equal(certifications.filter(c=>c.label==="CCSA").length,2);
assert.equal(certifications.filter(c=>c.recordType==="Proposed addition").length,6);
console.log("PASS: "+certifications.length+" canonical records, "+certifications.filter(c=>c.displayOnRoadmap&&!c.plannedOnly).length+" displayed, lifecycle evidence/counts valid; 482 originals accounted for.");
