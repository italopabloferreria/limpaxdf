import {existsSync} from "node:fs";
import {readFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import path from "node:path";

const root=process.cwd();
const requiredFiles=[
  "AGENTS.md",
  ".openai/hosting.json",
  ".icbai/ARTIFACT_INDEX.md",
  ".icbai/PROJECT_STATE.json",
  ".icbai/artifacts/RELEASE_MATRIX.md",
  ".icbai/artifacts/QUALITY_GATE_PROGRESS.md",
  ".icbai/artifacts/REMOTE_G13_RUNBOOK.md",
  ".icbai/artifacts/REMOTE_G13_EVIDENCE_TEMPLATE.md",
  "docs/AI_HANDOFF.md",
  "docs/CURRENT_TASK.md",
  "drizzle/meta/_journal.json"
];

const checks=[];
const add=(name,status,detail)=>checks.push({name,status,detail});
const filePath=file=>path.join(root,file);

for(const file of requiredFiles){
  add(`file:${file}`,existsSync(filePath(file))?"PASS":"FAIL");
}

let hosting=null;
try{
  hosting=JSON.parse(await readFile(filePath(".openai/hosting.json"),"utf8"));
  add("hosting.project_id",hosting.project_id?"PASS":"FAIL");
  add("hosting.d1",hosting.d1?"PASS":"FAIL");
  add("hosting.r2",hosting.r2?"PASS":"FAIL");
}catch(error){
  add("hosting.parse","FAIL",error.message);
}

let journal=null;
try{
  journal=JSON.parse(await readFile(filePath("drizzle/meta/_journal.json"),"utf8"));
  const entries=Array.isArray(journal.entries)?journal.entries:[];
  add("migration.journal",entries.length>0?"PASS":"FAIL",`${entries.length} entries`);
  for(const entry of entries){
    const sqlFile=`drizzle/${entry.tag}.sql`;
    add(`migration.sql:${entry.tag}`,existsSync(filePath(sqlFile))?"PASS":"FAIL",sqlFile);
  }
}catch(error){
  add("migration.journal.parse","FAIL",error.message);
}

function run(command,args){
  try{
    return execFileSync(command,args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","ignore"]}).trim();
  }catch{
    return null;
  }
}

add("tool:node","PASS",process.version);
add("tool:npm",process.env.npm_execpath||process.env.npm_config_user_agent?"PASS":"WARNING",process.env.npm_config_user_agent||process.env.npm_execpath||"unavailable outside npm");
add("tool:wrangler",existsSync(filePath("node_modules/wrangler/bin/wrangler.js"))?"PASS":"WARNING","node_modules/wrangler/bin/wrangler.js");
const gitVersion=run("git",["--version"]);
add("tool:git",gitVersion?"PASS":"WARNING",gitVersion||"Git subprocess may be blocked by sandbox; run outside sandbox for exact version.");

const head=run("git",["rev-parse","HEAD"]);
const upstream=run("git",["rev-parse","--abbrev-ref","--symbolic-full-name","@{upstream}"]);
const status=run("git",["status","--porcelain"]);
add("git.head",head?"PASS":"WARNING",head||"unavailable");
add("git.clean",status===""?"PASS":"WARNING",status===null?"unavailable":"working tree has local changes");

if(upstream&&head){
  const counts=run("git",["rev-list","--left-right","--count",`${upstream}...HEAD`]);
  add("git.upstream",counts?"PASS":"WARNING",counts?`${upstream} ${counts}`:"unable to compare");
}else{
  add("git.upstream","WARNING","upstream unavailable");
}

const envChecks=[
  ["CF_API_TOKEN","Cloudflare API token for wrangler/Sites operations"],
  ["CLOUDFLARE_ACCOUNT_ID","Cloudflare account id for remote D1/R2 checks"],
  ["LIMPAX_REMOTE_ENV","Explicit remote environment label, for example staging or production"],
  ["LIMPAX_RELEASE_OPERATOR","Person accountable for the remote validation"],
  ["LIMPAX_ROLLBACK_PLAN_CONFIRMED","Set to yes only after backup and rollback path are reviewed"]
];

for(const [key,detail] of envChecks){
  const value=process.env[key]?.trim();
  if(key==="LIMPAX_ROLLBACK_PLAN_CONFIRMED"&&value){
    add(`env:${key}`,value==="yes"?"PASS":"FAIL",value==="yes"?"confirmed":"Expected yes after reviewing backup and rollback.");
  }else{
    add(`env:${key}`,value?"PASS":"WARNING",value?"set":detail);
  }
}

const remoteChecklist=[
  "Confirm deployed commit before any change.",
  "Export D1 backup and record where it is stored outside the repository.",
  "Verify remote migration state before applying local migrations 0003-0005.",
  "Test restore in an isolated environment before changing the live database.",
  "Run authenticated CRM smoke with synthetic records and both roles.",
  "Measure production Core Web Vitals on the final domain.",
  "Record rollback command, owner and deadline before deploy.",
  "Update RELEASE_MATRIX and PROJECT_STATE with PASS, FAIL or WARNING evidence."
];

const result={
  scope:"remote-release-readiness-local-only",
  generatedAt:new Date().toISOString(),
  projectId:hosting?.project_id||null,
  bindings:{d1:hosting?.d1||null,r2:hosting?.r2||null},
  checks,
  remoteChecklist,
  blockedActions:[
    "No remote migration executed.",
    "No deploy executed.",
    "No DNS or domain change executed.",
    "No real customer data read or imported."
  ]
};

console.log(JSON.stringify(result,null,2));

if(checks.some(check=>check.status==="FAIL")){
  process.exitCode=1;
}
