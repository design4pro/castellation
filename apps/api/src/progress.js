const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store'}});
export async function handleProgress(request,repository,auth) {
  const match=/^\/api\/progress\/([a-z0-9-]+)$/.exec(new URL(request.url).pathname);
  if(!match)return json({error:'Not found'},404);
  if(!['GET','PUT'].includes(request.method))return json({error:'Method not allowed'},405);
  const session=await auth.api.getSession({headers:request.headers});
  if(!session?.user?.id)return json({error:'Authentication required'},401);
  if(session.user.emailVerified !== true)return json({error:'Email verification required'},403);
  const book=await repository.getBook(match[1]);
  if(!book)return json({error:'Not found'},404);
  if(request.method==='GET')return json({progress:await repository.getProgress(session.user.id,book.id)});
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return json({error:'Invalid content type'},415);
  if(Number(request.headers.get('content-length')||0)>1024)return json({error:'Invalid progress'},400);
  let input;
  try {
    if (!request.body) throw new Error('Missing body');
    const reader=request.body.getReader(); const chunks=[]; let size=0;
    while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();throw new Error('Body too large');}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    input=JSON.parse(new TextDecoder().decode(bytes));
  } catch { return json({error:'Invalid progress'},400); }
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==2||!Number.isSafeInteger(input.volume)||!Number.isSafeInteger(input.chapter)||!book.chapters.some((p)=>p.volume===input.volume&&p.chapter===input.chapter))return json({error:'Invalid progress'},400);
  const position={volume:input.volume,chapter:input.chapter};
  await repository.setProgress(session.user.id,book.id,position);
  return json({progress:position});
}
