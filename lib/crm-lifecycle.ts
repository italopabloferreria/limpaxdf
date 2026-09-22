import {ApiError} from "./http";

export type DataMode="review"|"live";

export function operationalDataMode(captureMode:string):DataMode{
  return captureMode==="live"?"live":"review";
}

export function assertCompatibleLifecycle(leadMode:unknown,customerMode:unknown):asserts leadMode is DataMode{
  if((leadMode!=="review"&&leadMode!=="live")||(customerMode!=="review"&&customerMode!=="live"))throw new ApiError(409,"Classificação do ambiente de dados inválida.");
  if(leadMode!==customerMode)throw new ApiError(409,"Atendimento e cliente pertencem a ambientes de dados diferentes.");
}
