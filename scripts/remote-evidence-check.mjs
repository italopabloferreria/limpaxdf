import {readFile} from "node:fs/promises";
import path from "node:path";

const root=process.cwd();
const evidencePath=process.argv[2]||".icbai/artifacts/REMOTE_G13_EVIDENCE_TEMPLATE.md";
const absolutePath=path.resolve(root,evidencePath);
const text=await readFile(absolutePath,"utf8");

const patterns=[
  {
    name:"Cloudflare token",
    pattern:/\b(CF_API_TOKEN|CLOUDFLARE_API_TOKEN)\b["']?\s*[:=]\s*["']?[A-Za-z0-9_\-.]{12,}/i
  },
  {
    name:"generic bearer token",
    pattern:/\bBearer\s+[A-Za-z0-9_\-.]{20,}/i
  },
  {
    name:"JWT-like token",
    pattern:/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
  },
  {
    name:"private key block",
    pattern:/-----BEGIN [A-Z ]*PRIVATE KEY-----/
  },
  {
    name:"email address",
    pattern:/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  },
  {
    name:"Brazilian CPF formatted",
    pattern:/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/
  },
  {
    name:"Brazilian CNPJ formatted",
    pattern:/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/
  },
  {
    name:"SQL dump marker",
    pattern:/\b(CREATE\s+TABLE|INSERT\s+INTO|BEGIN\s+TRANSACTION)\b|\bCOMMIT\s*;/i
  }
];

const findings=[];
for(const {name,pattern} of patterns){
  const match=text.match(pattern);
  if(match){
    const before=text.slice(0,match.index);
    const line=before.split(/\r?\n/).length;
    findings.push({name,line});
  }
}

const result={
  scope:"remote-evidence-local-scan",
  file:evidencePath,
  status:findings.length>0?"FAIL":"PASS",
  findings,
  note:"This scan is a guardrail only; it does not prove the evidence is complete or free of all sensitive data."
};

console.log(JSON.stringify(result,null,2));
if(findings.length>0)process.exitCode=1;
