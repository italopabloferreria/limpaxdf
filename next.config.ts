import type {NextConfig} from "next";
import {resolve} from "node:path";
// Response security headers live in proxy.ts, verified on the compiled Worker.
const vercelPreviewBuild=process.env.LIMPAX_VERCEL_PREVIEW_BUILD==="1";
const nextConfig:NextConfig={
  ...(vercelPreviewBuild?{env:{LIMPAX_DEPLOYMENT_TARGET:"vercel-preview"}}:{}),
  webpack(config,{webpack}){
    if(vercelPreviewBuild){
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /^cloudflare:workers$/,
        resolve(process.cwd(),"build/vercel-cloudflare-shim.ts"),
      ));
    }
    return config;
  },
};
export default nextConfig;
