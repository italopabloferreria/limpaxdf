import {createHash} from "node:crypto";
import {cp,mkdir,readdir,readFile,stat} from "node:fs/promises";
import path from "node:path";
import {DatabaseSync} from "node:sqlite";

const root=process.cwd();
const source=path.join(root,".wrangler","state");
const stamp=new Date().toISOString().replace(/[:.]/g,"-");
const runRoot=path.join(root,".sites-runtime","qa-recovery",stamp);
const backup=path.join(runRoot,"backup");
const restored=path.join(runRoot,"restored");

await stat(source).catch(()=>{throw new Error("Estado local .wrangler/state não encontrado.")});
await mkdir(runRoot,{recursive:true});
await cp(source,backup,{recursive:true,errorOnExist:true,force:false});
await cp(backup,restored,{recursive:true,errorOnExist:true,force:false});

const sourceFiles=await fileHashes(source);
const restoredFiles=await fileHashes(restored);
if(JSON.stringify(sourceFiles)!==JSON.stringify(restoredFiles))throw new Error("A restauração não corresponde ao backup.");

const databaseFile=Object.keys(restoredFiles).find(file=>file.includes("miniflare-D1DatabaseObject/")&&file.endsWith(".sqlite")&&!file.endsWith("metadata.sqlite"));
if(!databaseFile)throw new Error("Banco D1 restaurado não encontrado.");

const database=new DatabaseSync(path.join(restored,databaseFile));
try{
  const integrity=database.prepare("PRAGMA integrity_check").get()?.integrity_check;
  if(integrity!=="ok")throw new Error("Falha no PRAGMA integrity_check do banco restaurado.");
  const tables=Number(database.prepare("SELECT COUNT(*) AS total FROM sqlite_master WHERE type='table'").get()?.total||0);
  const counts={
    leads:tableCount(database,"leads"),
    customers:tableCount(database,"customers"),
    activities:tableCount(database,"lead_activities")
  };
  console.log(JSON.stringify({status:"PASS",files:Object.keys(restoredFiles).length,tables,counts,artifact:path.relative(root,runRoot).replaceAll("\\","/")},null,2));
}finally{
  database.close();
}

async function fileHashes(directory){
  const result={};
  for(const file of await walk(directory)){
    const relative=path.relative(directory,file).replaceAll("\\","/");
    result[relative]=createHash("sha256").update(await readFile(file)).digest("hex");
  }
  return Object.fromEntries(Object.entries(result).sort(([a],[b])=>a.localeCompare(b)));
}

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const target=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(target));
    else if(entry.isFile())files.push(target);
  }
  return files;
}

function tableCount(database,table){
  const exists=database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table);
  return exists?Number(database.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get()?.total||0):null;
}
