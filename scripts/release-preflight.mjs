import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import path from "node:path";

const root=process.cwd();
const readJson=async file=>JSON.parse(await readFile(path.join(root,file),"utf8"));
const hosting=await readJson(".openai/hosting.json");
const journal=await readJson("drizzle/meta/_journal.json");
const checks=[];
const migrationManifest=[];

checks.push({name:"hosting bindings",status:hosting.d1&&hosting.r2&&hosting.project_id?"PASS":"FAIL"});
checks.push({name:"migration journal",status:Array.isArray(journal.entries)&&journal.entries.length>0?"PASS":"FAIL"});

for(const entry of journal.entries||[]){
  const file=`drizzle/${entry.tag}.sql`;
  try{
    const contents=await readFile(path.join(root,file));
    migrationManifest.push({id:entry.idx,name:entry.tag,sha256:createHash("sha256").update(contents).digest("hex")});
  }catch{
    checks.push({name:`migration ${entry.tag}`,status:"FAIL",reason:"SQL file missing"});
  }
}

if(new Set(migrationManifest.map(item=>item.id)).size!==migrationManifest.length||
  migrationManifest.some((item,index)=>item.id!==index)){
  checks.push({name:"migration sequence",status:"FAIL"});
}else{
  checks.push({name:"migration sequence",status:"PASS"});
}

function git(...args){
  return execFileSync("git",args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","ignore"]}).trim();
}

let gitState={head:null,upstream:null,ahead:null,behind:null,dirty:null};
try{
  gitState.head=git("rev-parse","HEAD");
  gitState.dirty=git("status","--porcelain").length>0;
  gitState.upstream=git("rev-parse","--abbrev-ref","--symbolic-full-name","@{upstream}");
  const [behind,ahead]=git("rev-list","--left-right","--count",`${gitState.upstream}...HEAD`).split(/\s+/).map(Number);
  gitState.ahead=ahead;
  gitState.behind=behind;
  checks.push({name:"clean working tree",status:gitState.dirty?"WARNING":"PASS"});
  checks.push({name:"upstream parity",status:ahead===0&&behind===0?"PASS":"WARNING",reason:ahead||behind?"Local and upstream differ; deployed commit remains unverified.":undefined});
}catch(error){
  checks.push({name:"git comparison",status:"WARNING",reason:`Git comparison unavailable (${error.code||"unknown error"}); run outside sandbox or configure an upstream.`});
}

const result={
  scope:"local-read-only",
  projectId:hosting.project_id||null,
  bindings:{d1:hosting.d1||null,r2:hosting.r2||null},
  migrations:migrationManifest,
  git:gitState,
  checks,
  remote:{migrationState:"UNVERIFIED",backup:"UNVERIFIED",restore:"UNVERIFIED",deployment:"UNVERIFIED"}
};
console.log(JSON.stringify(result,null,2));
if(checks.some(check=>check.status==="FAIL"))process.exitCode=1;
