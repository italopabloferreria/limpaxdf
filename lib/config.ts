import {env} from "cloudflare:workers";
export type Settings={CAPTURE_MODE?:string;SITE_ORIGIN?:string;CRM_API_TOKEN?:string;CRM_WEBHOOK_URL?:string;CRM_WEBHOOK_SECRET?:string;PRIVACY_CONTACT?:string;LEGAL_NAME?:string;RETENTION_DAYS?:string;ANALYTICS_ENABLED?:string;RATE_LIMIT_SECRET?:string;DB?:D1Database;BUCKET?:R2Bucket};
export function settings():Settings{return env as Settings}
export function captureMode(s:Settings){return s.CAPTURE_MODE==="live"&&s.PRIVACY_CONTACT&&s.LEGAL_NAME&&Number.isInteger(Number(s.RETENTION_DAYS))&&Number(s.RETENTION_DAYS)>0&&Number(s.RETENTION_DAYS)<=3650&&s.RATE_LIMIT_SECRET&&s.RATE_LIMIT_SECRET.length>=32?"live":s.CAPTURE_MODE==="disabled"?"disabled":"review"}


