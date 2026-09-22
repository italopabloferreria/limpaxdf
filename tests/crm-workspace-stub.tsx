// Only client rendering is stubbed: real server pages, guards, queries and handlers run.
export function CrmWorkspace({role,initialSelected}: {role: string;initialSelected?:string|null}) {
  return <div data-workspace="leads" data-role={role} data-selected={initialSelected??"none"}>Synthetic workspace</div>;
}
export function CustomerWorkspace({role}: {role: string}) {
  return <div data-workspace="customers" data-role={role}>Synthetic workspace</div>;
}
