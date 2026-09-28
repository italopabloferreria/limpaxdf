import {notFound} from "next/navigation";
import {CustomerPreview} from "@/components/customer-preview";

export default function CustomerPreviewPage(){
  if(process.env.NODE_ENV!=="development")notFound();
  return <CustomerPreview/>;
}
