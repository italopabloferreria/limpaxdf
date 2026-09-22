import {build} from "esbuild";
import {spawnSync} from "node:child_process";
await build({entryPoints:["tests/crm-lifecycle.test.ts"],outfile:".sites-runtime/crm-lifecycle.test.mjs",bundle:true,platform:"node",format:"esm"});
const result=spawnSync(process.execPath,["--test",".sites-runtime/crm-lifecycle.test.mjs"],{stdio:"inherit"});
process.exitCode=result.status??1;
