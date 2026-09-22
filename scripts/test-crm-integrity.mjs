import {build} from "esbuild";
import {spawnSync} from "node:child_process";
import path from "node:path";

await build({
  entryPoints:["tests/crm-integrity.test.ts"],
  outfile:".sites-runtime/crm-integrity.test.mjs",
  bundle:true,
  platform:"node",
  format:"esm",
  alias:{"cloudflare:workers":path.resolve("tests/cloudflare-mock.ts")}
});

const result=spawnSync(process.execPath,["--test",".sites-runtime/crm-integrity.test.mjs"],{stdio:"inherit"});
process.exitCode=result.status??1;
