import fs from "node:fs";
import path from "node:path";

const projectRoot=process.cwd();
const envPath=path.join(projectRoot,".env.local");
const content=fs.existsSync(envPath)?fs.readFileSync(envPath,"utf8"):"";
const values=Object.fromEntries(content.split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith("#")&&line.includes("=")).map(line=>{
  const index=line.indexOf("=");
  return [line.slice(0,index),line.slice(index+1)];
}));

const required=["SUPABASE_PROJECT_REF","SUPABASE_REGION","SUPABASE_URL","SUPABASE_PUBLISHABLE_KEY"];
const missing=required.filter(key=>!values[key]);
const failures=[];
if(missing.length)failures.push(`missing ${missing.join(", ")}`);
if(values.SUPABASE_PROJECT_REF&&values.SUPABASE_PROJECT_REF!=="lkamarbpjqlibxlmcico")failures.push("project ref is not the Sao Paulo project");
if(values.SUPABASE_REGION&&values.SUPABASE_REGION!=="sa-east-1")failures.push("region is not sa-east-1");
if(values.SUPABASE_URL&&!/^https:\/\/lkamarbpjqlibxlmcico\.supabase\.co$/.test(values.SUPABASE_URL))failures.push("URL does not match the Sao Paulo Supabase project");
if(Object.entries(values).some(([key,value])=>/service[_-]?role/i.test(key)||/service[_-]?role/i.test(value)))failures.push("service_role must not be present locally for this homologation step");
if(fs.existsSync(path.join(projectRoot,".git"))){
  const gitignore=fs.readFileSync(path.join(projectRoot,".gitignore"),"utf8");
  if(!gitignore.includes(".env*"))failures.push(".env files are not ignored");
}
if(failures.length){
  console.error("Supabase local config: FAIL");
  for(const failure of failures)console.error("- "+failure);
  process.exit(1);
}
console.log("Supabase local config: PASS");
console.log(`project=${values.SUPABASE_PROJECT_REF} region=${values.SUPABASE_REGION}`);
