import {build} from "esbuild";
import {spawnSync} from "node:child_process";
import path from "node:path";

await build({
  entryPoints:["./tests/supabase-leads-adapter.test.ts"],
  outfile:".sites-runtime/supabase-leads-adapter.test.mjs",
  bundle:true,
  platform:"node",
  format:"esm",
  alias:{"cloudflare:workers":path.resolve("tests/cloudflare-mock.ts")}
});

const result=spawnSync(process.execPath,["--test",".sites-runtime/supabase-leads-adapter.test.mjs"],{stdio:"inherit"});
process.exitCode=result.status??1;
