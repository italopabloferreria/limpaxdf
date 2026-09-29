import {build} from "esbuild";
import {spawnSync} from "node:child_process";

const mock=`
export const settings=()=>({});
export const homologationOrigin=()=>globalThis.__leadWriteMock.origin;
export const supabaseCrmWriteEnabled=()=>globalThis.__leadWriteMock.enabled;
export const supabaseCrmPageAccess=async()=>globalThis.__leadWriteMock.actor?{
  actor:globalThis.__leadWriteMock.actor,
  client:{rpc:async(name,args)=>{const state=globalThis.__leadWriteMock;state.calls.push({name,args});return state.rpcError?{data:null,error:state.rpcError}:{data:args.p_id,error:null}}}
}:null;
export const NextResponse={json:(body,init={})=>Response.json(body,init)};
`;

await build({
  entryPoints:["./tests/supabase-lead-write.test.ts"],
  outfile:".sites-runtime/supabase-lead-write.test.mjs",
  bundle:true,platform:"node",format:"esm",
  plugins:[{name:"lead-write-mocks",setup(build){
    build.onResolve({filter:/^(next\/server|@\/lib\/(config|supabase-crm-access|supabase-homologation))$/},args=>({path:args.path,namespace:"lead-write-mock"}));
    build.onLoad({filter:/.*/,namespace:"lead-write-mock"},()=>({contents:mock,loader:"js"}));
  }}]
});

const result=spawnSync(process.execPath,["--test",".sites-runtime/supabase-lead-write.test.mjs"],{stdio:"inherit"});
process.exitCode=result.status??1;
