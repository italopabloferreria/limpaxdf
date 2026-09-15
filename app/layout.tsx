import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:{default:"Limpax | Tudo precisa continuar fluindo",template:"%s | Limpax"},description:"Limpax no Distrito Federal, desde 2005. Conheça a operação e prepare sua solicitação pelo Limpax Check.",metadataBase:new URL("https://limpax-fluindo.italopablo.chatgpt.site"),robots:{index:false,follow:false},icons:{icon:"/favicon.svg"},openGraph:{locale:"pt_BR",type:"website",title:"Limpax — Tudo precisa continuar fluindo",description:"Distrito Federal. Desde 2005. Três caminhões, uma operação em movimento."}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><a className="skip" href="#conteudo">Pular para o conteúdo</a>{children}</body></html>}
