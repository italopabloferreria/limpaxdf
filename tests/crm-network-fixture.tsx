import {createRoot} from "react-dom/client";
import {CrmWorkspace} from "../components/crm-workspace";
import type {CrmLead} from "../lib/crm-data";

const leads:CrmLead[]=["A","B"].map((label,index)=>({
  id:`00000000-0000-4000-8000-00000000000${index+1}`,
  seq:index+1,status:"novo",mode:"review",createdAt:1_800_000_000_000,
  updatedAt:1_800_000_000_000,assignedTo:null,nextActionAt:null,
  contact:{name:`Cliente sintético ${label}`,phone:"",email:"",problem:"outro",region:"DF",property:"casa"}
}));
const initial={leads,total:2,page:1,pageSize:50,pages:1,totals:{novo:2}};
createRoot(document.getElementById("root")!).render(
  <CrmWorkspace initial={initial} operator="QA sintético" role="admin"/>
);
