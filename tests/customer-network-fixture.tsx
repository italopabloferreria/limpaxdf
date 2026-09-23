import {createRoot} from "react-dom/client";
import {CustomerWorkspace} from "../components/customer-workspace";
import type {CustomerSummary} from "../lib/crm-customers";

const customers:CustomerSummary[]=["A","B"].map((label,index)=>({
  id:`10000000-0000-4000-8000-00000000000${index+1}`,
  kind:index?"organization":"person",
  name:`Cliente cadastro ${label}`,
  tradeName:index?`Empresa ${label}`:null,
  taxId:null,
  notes:null,
  sourceMode:"review",
  origin:"synthetic",
  archivedAt:null,
  createdAt:1_800_000_000_000,
  updatedAt:1_800_000_000_000,
  contacts:0,
  locations:0,
  primaryPhone:null,
  primaryEmail:null
}));

const initial={customers,total:2,page:1,pageSize:30,pages:1};

createRoot(document.getElementById("root")!).render(
  <CustomerWorkspace initial={initial} operator="QA sintético" role="admin" dataMode="review"/>
);
