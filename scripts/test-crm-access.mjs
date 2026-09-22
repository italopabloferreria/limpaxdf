import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import path from "node:path";
await build({
  entryPoints: ["tests/crm-access.test.tsx"],
  outfile: ".sites-runtime/crm-access.test.mjs",
  bundle: true, platform: "node", format: "esm", jsx: "automatic",
  external: ["react", "react-dom"],
  banner: {js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);'},
  alias: {
    "cloudflare:workers": path.resolve("tests/cloudflare-mock.ts"),
    "next/headers": path.resolve("tests/request-headers-mock.ts"),
    "@/components/crm-workspace": path.resolve("tests/crm-workspace-stub.tsx"),
    "@/components/customer-workspace": path.resolve("tests/crm-workspace-stub.tsx"),
  },
});
const result = spawnSync(process.execPath, ["--test", ".sites-runtime/crm-access.test.mjs"], {stdio: "inherit"});
process.exitCode = result.status ?? 1;
