import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtemp, rm, rmdir, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");

function run(script,args=[],env={}){
  const result=spawnSync(process.execPath,[path.join(root,"scripts",script),...args],{
    cwd:root,
    encoding:"utf8",
    env:{...process.env,...env}
  });
  assert.ifError(result.error);
  assert.ok(result.stdout.trim(),`Expected JSON report; exit ${result.status}: ${result.stderr}`);
  return {exitCode:result.status,report:JSON.parse(result.stdout)};
}

test("rollback confirmation requires an explicit yes",()=>{
  for(const [value,expected] of [["no","FAIL"],["false","FAIL"],["   ","WARNING"],["yes","PASS"]]){
    const {exitCode,report}=run("remote-release-readiness.mjs",[],{LIMPAX_ROLLBACK_PLAN_CONFIRMED:value});
    const check=report.checks.find(item=>item.name==="env:LIMPAX_ROLLBACK_PLAN_CONFIRMED");
    assert.equal(check?.status,expected,`Unexpected rollback result for ${JSON.stringify(value)}`);
    if(expected==="FAIL")assert.equal(exitCode,1);
  }
});

test("evidence CLI scans absolute paths, quoted tokens and SQL transaction terminators",async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),"limpax-g13-synthetic-"));
  const file=path.join(directory,"evidence with spaces.md");
  const syntheticToken="synthetic_token_abcdefghijklmnop";
  const fixtures=[
    {text:"Resultado sem dados sensiveis.\n",expected:null},
    {text:`CF_API_TOKEN=${syntheticToken}\n`,expected:"Cloudflare token"},
    {text:`CF_API_TOKEN="${syntheticToken}"\n`,expected:"Cloudflare token"},
    {text:`CLOUDFLARE_API_TOKEN='${syntheticToken}'\n`,expected:"Cloudflare token"},
    {text:JSON.stringify({CF_API_TOKEN:syntheticToken}),expected:"Cloudflare token"},
    {text:"COMMIT;\n",expected:"SQL dump marker"}
  ];
  try{
    for(const {text,expected} of fixtures){
      await writeFile(file,text,"utf8");
      const {exitCode,report}=run("remote-evidence-check.mjs",[file]);
      assert.equal(report.status,expected?"FAIL":"PASS");
      assert.equal(exitCode,expected?1:0);
      assert.equal(report.file,file);
      if(expected)assert.ok(report.findings.some(item=>item.name===expected));
      assert.equal(JSON.stringify(report).includes(syntheticToken),false,"Report must not expose matched content");
    }
  }finally{
    await rm(file,{force:true});
    await rmdir(directory);
  }
});
