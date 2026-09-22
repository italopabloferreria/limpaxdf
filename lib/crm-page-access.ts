import {requireCrmUser, type CrmActor} from "./crm";
import {ApiError} from "./http";

type PageAccess =
  | {actor: CrmActor; status: null}
  | {actor: null; status: 401 | 403 | 503};

// Presentation adapter only: API and SSR authorization share requireCrmUser.
export async function crmPageAccess(): Promise<PageAccess> {
  try {
    return {actor: await requireCrmUser(), status: null};
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 503)) {
      return {actor: null, status: error.status};
    }
    throw error;
  }
}
