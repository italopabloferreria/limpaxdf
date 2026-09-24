export function createBrowserClient(){throw new Error('OAuth is not executed by the SSR unit tests')}
export const authFixture={
  userId:null as string|null,
  profile:null as {active:boolean;role:string}|null,
  profileError:false,
  logoutError:false,
  logoutCalls:0,
  queriedUser:null as string|null,
};
export function createServerClient(_url:string,_key:string,options:{cookies:{setAll:(items:{name:string;value:string;options:Record<string,unknown>}[])=>void}}){
  return {
    auth:{
      async getUser(){
        options.cookies.setAll([{name:'test-refresh',value:'synthetic',options:{path:'/'}}]);
        return {data:{user:authFixture.userId?{id:authFixture.userId}:null},error:null};
      },
      async signOut(){authFixture.logoutCalls++;return {error:authFixture.logoutError?{message:'synthetic failure'}:null}},
    },
    from(){return {select(){return {eq(_column:string,value:string){authFixture.queriedUser=value;return {async maybeSingle(){return {data:authFixture.profile,error:authFixture.profileError?{message:'synthetic failure'}:null}}}}}}}},
  };
}
