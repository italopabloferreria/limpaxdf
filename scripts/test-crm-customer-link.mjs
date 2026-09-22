import {build} from "esbuild";
import {spawnSync} from "node:child_process";
import path from "node:path";
await build({
  entryPoints:["tests/crm-customer-link.test.tsx"],
  outfile:".sites-runtime/crm-customer-link.test.mjs",
  bundle:true,platform:"node",format:"esm",jsx:"automatic",
  external:["react","react-dom"],
  banner:{js:'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);'},
  alias:{"next/link":path.resolve("tests/next-link-stub.tsx")}
});
const result=spawnSync(process.execPath,["--test",".sites-runtime/crm-customer-link.test.mjs"],{stdio:"inherit"});
process.exitCode=result.status??1;
