import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {renderToStaticMarkup} from 'react-dom/server';
import {env} from './cloudflare-mock';
import {authFixture} from './supabase-ssr-mock';
import {GET} from '../app/api/supabase/homologation/session/route';
import {POST} from '../app/api/supabase/homologation/logout/route';
import {HomologationSignIn} from '../components/supabase-homologation-sign-in';
import {proxy} from '../proxy';
const origin='http://localhost:5173';
async function sessionStatus(request:NextRequest){return ((await (await GET(request)).json()) as {status:string}).status}
beforeEach(()=>{
  Object.assign(env,{SUPABASE_HOMOLOGATION_ENABLED:'true',SUPABASE_HOMOLOGATION_ORIGIN:origin,SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'});
  Object.assign(authFixture,{userId:null,profile:null,profileError:false,logoutError:false,logoutCalls:0,queriedUser:null});
});
test('homologation is unavailable outside the configured origin or when disabled',async()=>{
  assert.equal((await GET(new NextRequest('https://other.test/api'))).status,404);
  env.SUPABASE_HOMOLOGATION_ENABLED='false';
  assert.equal((await GET(new NextRequest(origin+'/api'))).status,404);
});
test('session requires its own active profile and known role',async()=>{
  const request=new NextRequest(origin+'/api');
  assert.equal(await sessionStatus(request),'signed_out');
  authFixture.userId='synthetic-user';
  assert.equal(await sessionStatus(request),'no_profile');
  authFixture.profile={active:false,role:'admin'};
  assert.equal(await sessionStatus(request),'inactive');
  authFixture.profile={active:true,role:'unknown'};
  assert.equal(await sessionStatus(request),'no_profile');
  authFixture.profile={active:true,role:'attendant'};
  assert.deepEqual(await (await GET(request)).json(),{status:'authorized',role:'attendant'});
  assert.equal(authFixture.queriedUser,'synthetic-user');
});
test('profile failure preserves refresh cookies and forbids caching',async()=>{
  authFixture.userId='synthetic-user';authFixture.profileError=true;
  const response=await GET(new NextRequest(origin+'/api'));
  assert.equal(response.status,503);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.match(response.headers.get('set-cookie')||'',/test-refresh=synthetic/);
});
test('logout denies cross-origin requests and reports provider failure',async()=>{
  const req=(from:string)=>new NextRequest(origin+'/api',{method:'POST',headers:{origin:from}});
  assert.equal((await POST(req('https://other.test'))).status,403);
  assert.equal(authFixture.logoutCalls,0);
  authFixture.logoutError=true;
  assert.equal((await POST(req(origin))).status,503);
  authFixture.logoutError=false;
  assert.deepEqual(await (await POST(req(origin))).json(),{signedOut:true});
});
test('Google setup pending is visible before attempting OAuth',()=>{
  const html=renderToStaticMarkup(<HomologationSignIn url="https://example.supabase.co" publishableKey="sb_publishable_test"/>);
  assert.match(html,/aguardando a conclusão da configuração/);
});
test('Supabase browser connections are restricted to the isolated homologation page',()=>{
  const header=(path:string)=>proxy(new NextRequest(origin+path)).headers.get('content-security-policy')||'';
  assert.match(header('/supabase/homologacao'),/connect-src 'self' https:\/\/example.supabase.co;/);
  assert.match(header('/crm'),/connect-src 'self';/);
  env.SUPABASE_URL='https://untrusted.test';
  assert.match(header('/supabase/homologacao'),/connect-src 'self';/);
});
