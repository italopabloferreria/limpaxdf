import {build} from "esbuild";
import {spawnSync} from "node:child_process";
await build({
  entryPoints:["tests/crm-selection-state.test.ts"],
  outfile:".sites-runtime/crm-selection-state.test.mjs",
  bundle:true,platform:"node",format:"esm"
});
const result=spawnSync(process.execPath,["--test",".sites-runtime/crm-selection-state.test.mjs"],{stdio:"inherit"});
process.exitCode=result.status??1;
