import {build} from "esbuild";
import {spawnSync} from "node:child_process";

const mock=`
export const settings=()=>({});
export const homologationOrigin=()=>globalThis.__customerWriteMock.origin;
export const supabaseCrmWriteEnabled=()=>globalThis.__customerWriteMock.enabled;
export const supabaseCrmPageAccess=async()=>globalThis.__customerWriteMock.actor?{
  actor:globalThis.__customerWriteMock.actor,
  client:{rpc:async(_name,args)=>{const state=globalThis.__customerWriteMock;state.calls.push(args);return state.rpcError?{data:null,error:state.rpcError}:{data:args.p_id,error:null}}}
}:null;
export const NextResponse={json:(body,init={})=>Response.json(body,init)};
`;

await build({
  entryPoints:["tests/supabase-customer-write.test.ts"],
  outfile:".sites-runtime/supabase-customer-write.test.mjs",
  bundle:true,platform:"node",format:"esm",
  plugins:[{name:"customer-write-mocks",setup(build){
    build.onResolve({filter:/^(next\/server|@\/lib\/(config|supabase-crm-access|supabase-homologation))$/},args=>({path:args.path,namespace:"customer-write-mock"}));
    build.onLoad({filter:/.*/,namespace:"customer-write-mock"},()=>({contents:mock,loader:"js"}));
  }}]
});

const result=spawnSync(process.execPath,["--test",".sites-runtime/supabase-customer-write.test.mjs"],{stdio:"inherit"});
process.exitCode=result.status??1;
