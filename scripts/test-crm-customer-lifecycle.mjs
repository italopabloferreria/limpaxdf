import {build} from "esbuild";
import {spawnSync} from "node:child_process";
await build({entryPoints:["tests/crm-customer-lifecycle.test.ts"],outfile:".sites-runtime/crm-customer-lifecycle.test.mjs",bundle:true,platform:"node",format:"esm"});
const result=spawnSync(process.execPath,["--test",".sites-runtime/crm-customer-lifecycle.test.mjs"],{stdio:"inherit"});
process.exitCode=result.status??1;
