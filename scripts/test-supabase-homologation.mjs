import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
await build({
  entryPoints:['tests/supabase-homologation.test.tsx'],outfile:'.sites-runtime/supabase-homologation.test.mjs',
  bundle:true,platform:'node',format:'esm',jsx:'automatic',external:['react','react-dom','next/server.js'],
  alias:{'next/server':'next/server.js','cloudflare:workers':path.resolve('tests/cloudflare-mock.ts'),'@supabase/ssr':path.resolve('tests/supabase-ssr-mock.ts')},
});
const result=spawnSync(process.execPath,['--test','.sites-runtime/supabase-homologation.test.mjs'],{stdio:'inherit'});
process.exitCode=result.status??1;
