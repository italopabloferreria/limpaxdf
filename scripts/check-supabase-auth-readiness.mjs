import {readFileSync} from "node:fs";

const baselinePath="supabase/migrations/202609230001_limpax_crm_baseline.sql";
const readinessPath="docs/supabase/AUTH_RLS_READINESS.sql";
const baseline=readFileSync(baselinePath,"utf8").toLowerCase();
const readiness=readFileSync(readinessPath,"utf8").toLowerCase();

const checks=[
  {
    name:"baseline enables RLS on public.leads",
    ok:/alter\s+table\s+public\.leads\s+enable\s+row\s+level\s+security/.test(baseline)
  },
  {
    name:"baseline enables RLS on public.crm_user_profiles",
    ok:/alter\s+table\s+public\.crm_user_profiles\s+enable\s+row\s+level\s+security/.test(baseline)
  },
  {
    name:"baseline has leads member select policy for authenticated",
    ok:/create\s+policy\s+leads_member_select\s+on\s+public\.leads\s+for\s+select\s+to\s+authenticated/.test(baseline)
  },
  {
    name:"baseline has CRM profile read policy for authenticated",
    ok:/create\s+policy\s+crm_user_profiles_read_own_or_admin\s+on\s+public\.crm_user_profiles\s+for\s+select\s+to\s+authenticated/.test(baseline)
  },
  {
    name:"baseline grants private helper execution to authenticated",
    ok:/grant\s+execute\s+on\s+function\s+app_private\.is_crm_member\(\)\s+to\s+authenticated/.test(baseline)
  },
  {
    name:"readiness SQL grants SELECT on public.leads to authenticated",
    ok:/grant\s+select\s+on\s+public\.leads\s+to\s+authenticated/.test(readiness)
  },
  {
    name:"readiness SQL grants SELECT on public.crm_user_profiles to authenticated",
    ok:/grant\s+select\s+on\s+public\.crm_user_profiles\s+to\s+authenticated/.test(readiness)
  },
  {
    name:"readiness SQL includes adapter smoke query",
    ok:/from\s+public\.leads[\s\S]+order\s+by\s+updated_at\s+desc\s+nulls\s+last,\s+created_at\s+desc,\s+id\s+desc[\s\S]+limit\s+1/.test(readiness)
  }
];

let failed=false;
for(const check of checks){
  console.log(`${check.ok?"PASS":"FAIL"} ${check.name}`);
  if(!check.ok)failed=true;
}

if(failed){
  console.error("Supabase Auth/RLS readiness plan is incomplete.");
  process.exitCode=1;
}else{
  console.log("Supabase Auth/RLS readiness plan: PASS");
}
