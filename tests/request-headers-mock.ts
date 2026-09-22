import {AsyncLocalStorage} from "node:async_hooks";

const requestIdentity = new AsyncLocalStorage<Headers>();
let current = new Headers();

function identityHeaders(email: string | null) {
  const value = new Headers();
  if (email) {
    value.set("oai-authenticated-user-id", "synthetic-user");
    value.set("oai-authenticated-user-email", email);
  }
  return value;
}

export function setRequestIdentity(email: string | null) {
  current = identityHeaders(email);
}

export function withRequestIdentity<T>(email: string, operation: () => Promise<T>) {
  return requestIdentity.run(identityHeaders(email), operation);
}

export async function headers() {
  return requestIdentity.getStore() ?? current;
}
