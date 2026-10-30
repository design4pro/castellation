import { createAuth } from './auth.js';
import { handleProgress } from './progress.js';
import { privateCors } from './private-cors.js';
import { d1Repository } from './repository.js';

export async function privateRequest(request,env,context) {
  const cors=privateCors(request,env.WEB_ORIGIN);
  if(!env.WEB_ORIGIN||!cors.allowed)return new Response('Forbidden',{status:403});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors.headers});
  if(!env.BETTER_AUTH_SECRET||!env.BETTER_AUTH_URL)return new Response('Authentication unavailable',{status:503,headers:cors.headers});
  if(new URL(request.url).pathname.startsWith('/api/auth/') && (!env.EMAIL || !env.EMAIL_FROM)) return new Response('Authentication unavailable',{status:503,headers:cors.headers});
  const auth=createAuth(env,context);
  const result=new URL(request.url).pathname.startsWith('/api/auth/')?await auth.handler(request):await handleProgress(request,d1Repository(env.DB),auth);
  const headers=new Headers(result.headers);cors.headers.forEach((value,key)=>headers.set(key,value));
  return new Response(result.body,{status:result.status,headers});
}
