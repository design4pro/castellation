import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createAuth } from '../src/auth.js';
import { d1Repository } from '../src/repository.js';
import { handleProgress } from '../src/progress.js';

function setup(){
  const sql=new DatabaseSync(':memory:');
  for(const name of ['0001_catalog.sql','0002_sources.sql','0003_evidence.sql','0004_withdrawn.sql','0005_accounts.sql','0007_reader_administration.sql','0008_delete_reader_tokens.sql'])sql.exec(readFileSync(new URL(`../migrations/${name}`,import.meta.url),'utf8'));
  sql.exec("INSERT INTO books (id,slug,title,author,published) VALUES ('b','book','Book','Author',1); INSERT INTO chapters VALUES ('b',1,1,'Start'),('b',1,2,'Next');");
  const DB={async exec(query){sql.exec(query);return {}},async batch(statements){return Promise.all(statements.map((statement)=>statement.all()))},prepare(query){return {bind(...args){return {async all(){const stmt=sql.prepare(query);if(stmt.columns().length){return {results:stmt.all(...args),meta:{changes:0}}}const result=stmt.run(...args);return {results:[],meta:{changes:result.changes,last_row_id:result.lastInsertRowid}}},async first(){return sql.prepare(query).get(...args)??null},async run(){const result=sql.prepare(query).run(...args);return {meta:{changes:result.changes}}}}}}}};
  const messages=[]; const EMAIL={async send(message){messages.push(message)}};
  const env={DB,EMAIL,EMAIL_FROM:'sender@example.test',BETTER_AUTH_SECRET:'test-secret-with-at-least-32-random-characters',BETTER_AUTH_URL:'http://localhost:8787',WEB_ORIGIN:'http://localhost:4325'};
  const auth=createAuth(env);
  return {auth,messages,DB,env,repo:d1Repository(DB)};
}
async function register(auth,email,messages){
  const headers={'content-type':'application/json',origin:'http://localhost:4325','cf-connecting-ip':'127.0.0.1'};
  const response=await auth.handler(new Request('http://localhost:8787/api/auth/sign-up/email',{method:'POST',headers,body:JSON.stringify({name:'Reader',email,password:'secure-password-123'})}));
  assert.equal(response.status,200,await response.clone().text());
  const link=messages.at(-1).text.match(/https?:\/\/\S+/)[0];
  const verified=await auth.handler(new Request(link));
  assert.ok(verified.ok || verified.status===302);
  const login=await auth.handler(new Request('http://localhost:8787/api/auth/sign-in/email',{method:'POST',headers,body:JSON.stringify({email,password:'secure-password-123'})}));
  assert.equal(login.status,200,await login.clone().text());
  return login.headers.get('set-cookie').split(';')[0];
}

test('real Better Auth sessions synchronize progress and isolate users',async()=>{
  const {auth,repo,messages}=setup(); const a=await register(auth,'alice@example.test',messages),b=await register(auth,'bob@example.test',messages);
  const request=(cookie,method,body)=>new Request('http://localhost:8787/api/progress/book',{method,headers:{cookie,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  assert.equal((await handleProgress(request(a,'PUT',{volume:1,chapter:2}),repo,auth)).status,200);
  assert.deepEqual(await (await handleProgress(request(a,'GET'),repo,auth)).json(),{progress:{volume:1,chapter:2}});
  assert.deepEqual(await (await handleProgress(request(b,'GET'),repo,auth)).json(),{progress:null});
  assert.equal((await handleProgress(request('bad=session','GET'),repo,auth)).status,401);
});

test('sign-out invalidates the session',async()=>{
  const {auth,repo,messages}=setup(); const cookie=await register(auth,'reader@example.test',messages);
  const response=await auth.handler(new Request('http://localhost:8787/api/auth/sign-out',{method:'POST',headers:{cookie,origin:'http://localhost:4325','cf-connecting-ip':'127.0.0.1'}}));
  assert.equal(response.status,200);
  assert.equal((await handleProgress(new Request('http://localhost:8787/api/progress/book',{headers:{cookie}}),repo,auth)).status,401);
});

test('unverified accounts cannot sign in and receive a verification link',async()=>{
  const {auth,messages}=setup();
  const signup=await auth.handler(new Request('http://localhost:8787/api/auth/sign-up/email',{method:'POST',headers:{'content-type':'application/json',origin:'http://localhost:4325','cf-connecting-ip':'127.0.0.2'},body:JSON.stringify({name:'Reader',email:'unverified@example.test',password:'secure-password-123'})}));
  assert.equal(signup.status,200);
  assert.equal(signup.headers.get('set-cookie'),null);
  assert.equal(messages.length,1);
  const login=await auth.handler(new Request('http://localhost:8787/api/auth/sign-in/email',{method:'POST',headers:{'content-type':'application/json',origin:'http://localhost:4325','cf-connecting-ip':'127.0.0.2'},body:JSON.stringify({email:'unverified@example.test',password:'secure-password-123'})}));
  assert.equal(login.status,403);
});

test('password reset consumes the token and revokes existing sessions',async()=>{
  const {auth,repo,messages}=setup();const cookie=await register(auth,'reset@example.test',messages);
  const headers={'content-type':'application/json',origin:'http://localhost:4325','cf-connecting-ip':'127.0.0.3'};
  const request=await auth.handler(new Request('http://localhost:8787/api/auth/request-password-reset',{method:'POST',headers,body:JSON.stringify({email:'reset@example.test',redirectTo:'http://localhost:4325/reset-password'})}));
  assert.equal(request.status,200);
  const link=messages.at(-1).text.match(/https?:\/\/\S+/)[0];
  const redirected=await auth.handler(new Request(link,{redirect:'manual'}));
  const token=new URL(redirected.headers.get('location')).searchParams.get('token');
  assert.ok(token);
  const reset=()=>auth.handler(new Request('http://localhost:8787/api/auth/reset-password',{method:'POST',headers,body:JSON.stringify({token,newPassword:'new-secure-password-456'})}));
  assert.equal((await reset()).status,200);
  assert.notEqual((await reset()).status,200);
  assert.equal((await handleProgress(new Request('http://localhost:8787/api/progress/book',{headers:{cookie}}),repo,auth)).status,401);
});

test('password reset response does not reveal whether an email exists',async()=>{
  const {auth,messages}=setup();
  const response=await auth.handler(new Request('http://localhost:8787/api/auth/request-password-reset',{method:'POST',headers:{'content-type':'application/json',origin:'http://localhost:4325','cf-connecting-ip':'127.0.0.4'},body:JSON.stringify({email:'missing@example.test',redirectTo:'http://localhost:4325/reset-password'})}));
  assert.equal(response.status,200);assert.equal(messages.length,0);
});

test('CMS session revocation invalidates the selected reader but not another reader',async()=>{
  const {auth,DB,repo,messages}=setup();const one=await register(auth,'one@example.test',messages),two=await register(auth,'two@example.test',messages);
  const session=await auth.api.getSession({headers:new Headers({cookie:one})});
  const {usersAdmin}=await import('../../../packages/cms-plugin/users-admin.js');
  await usersAdmin(DB,{type:'block_action',action_id:'revoke-reader-sessions',value:session.user.id});
  const request=(cookie)=>new Request('http://localhost:8787/api/progress/book',{headers:{cookie}});
  assert.equal((await handleProgress(request(one),repo,auth)).status,401);
  assert.equal((await handleProgress(request(two),repo,auth)).status,200);
});

test('migration revokes legacy sessions for unverified readers only',async()=>{
  const {auth,DB,messages}=setup();const verifiedCookie=await register(auth,'verified@example.test',messages);
  const verified=await auth.api.getSession({headers:new Headers({cookie:verifiedCookie})});
  const unverified=await auth.handler(new Request('http://localhost:8787/api/auth/sign-up/email',{method:'POST',headers:{'content-type':'application/json',origin:'http://localhost:4325','cf-connecting-ip':'127.0.0.8'},body:JSON.stringify({name:'Reader',email:'legacy@example.test',password:'secure-password-123'})}));
  assert.equal(unverified.status,200);
  const user=await DB.prepare('SELECT id FROM user WHERE email = ?').bind('legacy@example.test').first();
  await DB.prepare('INSERT INTO session (id,expiresAt,token,createdAt,updatedAt,userId) VALUES (?, ?, ?, ?, ?, ?)').bind('legacy-session',9999999999999,'legacy-token',1,1,user.id).run();
  await DB.exec(readFileSync(new URL('../migrations/0006_revoke_unverified_sessions.sql',import.meta.url),'utf8'));
  assert.equal(await DB.prepare('SELECT id FROM session WHERE userId = ?').bind(user.id).first(),null);
  assert.ok(await DB.prepare('SELECT id FROM session WHERE userId = ?').bind(verified.user.id).first());
});

test('blocking a reader revokes sessions and prevents login until unblocked',async()=>{
  const {auth,DB,repo,messages}=setup();
  const cookie=await register(auth,'blocked@example.test',messages);
  const user=(await auth.api.getSession({headers:new Headers({cookie})})).user;
  const {usersAdmin}=await import('../../../packages/cms-plugin/users-admin.js');
  await usersAdmin(DB,{type:'block_action',action_id:'reader-block',value:user.id});
  assert.equal((await handleProgress(new Request('http://localhost:8787/api/progress/book',{headers:{cookie}}),repo,auth)).status,401);
  const login=()=>auth.handler(new Request('http://localhost:8787/api/auth/sign-in/email',{method:'POST',headers:{'content-type':'application/json',origin:'http://localhost:4325','cf-connecting-ip':'127.0.0.9'},body:JSON.stringify({email:user.email,password:'secure-password-123'})}));
  assert.equal((await login()).status,403);
  await usersAdmin(DB,{type:'block_action',action_id:'reader-unblock',value:user.id});
  assert.equal((await login()).status,200);
});

test('editing an email revokes sessions and requires verification of the new address',async()=>{
  const {auth,DB,repo,messages}=setup();
  const cookie=await register(auth,'old@example.test',messages);
  const user=(await auth.api.getSession({headers:new Headers({cookie})})).user;
  const {usersAdmin}=await import('../../../packages/cms-plugin/users-admin.js');
  const result=await usersAdmin(DB,{type:'form_submit',action_id:`reader-save_${user.id}`,values:{name:'Updated reader',email:'new@example.test'}});
  assert.equal(result.toast.type,'success');
  assert.equal((await handleProgress(new Request('http://localhost:8787/api/progress/book',{headers:{cookie}}),repo,auth)).status,401);
  const login=await auth.handler(new Request('http://localhost:8787/api/auth/sign-in/email',{method:'POST',headers:{'content-type':'application/json',origin:'http://localhost:4325','cf-connecting-ip':'127.0.0.10'},body:JSON.stringify({email:'new@example.test',password:'secure-password-123'})}));
  assert.equal(login.status,403);
  assert.match(messages.at(-1).to,/new@example\.test/);
});

test('reader accounts cannot use Better Auth admin endpoints',async()=>{
  const {auth,messages}=setup();
  const cookie=await register(auth,'ordinary@example.test',messages);
  const response=await auth.handler(new Request('http://localhost:8787/api/auth/admin/list-users',{headers:{cookie,origin:'http://localhost:4325','cf-connecting-ip':'127.0.0.11'}}));
  assert.equal(response.status,403);
});

test('administrator invitation verifies email and sets a password with a single link',async()=>{
  const {auth,DB,messages,env}=setup();
  const {usersAdmin}=await import('../../../packages/cms-plugin/users-admin.js');
  const {sendReaderInvitation}=await import('../src/invitations.js');
  const created=await usersAdmin(DB,{type:'form_submit',action_id:'reader-create-submit',values:{name:'New Reader',email:'newreader@example.test'}},{send:(id)=>sendReaderInvitation(env,id)});
  assert.equal(created.toast.type,'success');
  assert.equal(messages.length,1);
  const link=messages[0].text.match(/https?:\/\/\S+/)[0];
  const verified=await auth.handler(new Request(link,{redirect:'manual'}));
  assert.equal(verified.status,302);
  const redirect=new URL(verified.headers.get('location'));
  assert.equal(redirect.pathname,'/reset-password');
  const token=redirect.searchParams.get('token');
  const headers={'content-type':'application/json',origin:'http://localhost:4325','cf-connecting-ip':'127.0.0.12'};
  const reset=()=>auth.handler(new Request('http://localhost:8787/api/auth/reset-password',{method:'POST',headers,body:JSON.stringify({token,newPassword:'secure-password-123'})}));
  assert.equal((await reset()).status,200);
  assert.notEqual((await reset()).status,200);
  const login=await auth.handler(new Request('http://localhost:8787/api/auth/sign-in/email',{method:'POST',headers,body:JSON.stringify({email:'newreader@example.test',password:'secure-password-123'})}));
  assert.equal(login.status,200);
});

test('failed invitation keeps the account and allows an administrator to retry',async()=>{
  const {DB,env,messages}=setup();
  const {usersAdmin}=await import('../../../packages/cms-plugin/users-admin.js');
  const {sendReaderInvitation}=await import('../src/invitations.js');
  const broken={...env,EMAIL:{async send(){throw new Error('delivery failure')}}};
  const created=await usersAdmin(DB,{type:'form_submit',action_id:'reader-create-submit',values:{name:'Reader',email:'retry@example.test'}},{send:(id)=>sendReaderInvitation(broken,id)});
  assert.equal(created.toast.type,'error');
  const user=await DB.prepare('SELECT id FROM user WHERE email = ?').bind('retry@example.test').first();
  assert.ok(user);
  assert.equal(await DB.prepare('SELECT id FROM verification WHERE value = ?').bind(user.id).first(),null);
  const resent=await usersAdmin(DB,{type:'block_action',action_id:'reader-invite',value:user.id},{send:(id)=>sendReaderInvitation(env,id)});
  assert.equal(resent.toast.type,'success');
  assert.equal(messages.length,1);
});

test('deleting a reader removes their account, sessions, and reading progress',async()=>{
  const {auth,DB,repo,messages}=setup();
  const cookie=await register(auth,'delete@example.test',messages);
  const user=(await auth.api.getSession({headers:new Headers({cookie})})).user;
  await DB.prepare('INSERT INTO verification (id,identifier,value,expiresAt,createdAt,updatedAt) VALUES (?,?,?,?,?,?)').bind('reset-id','reset-password:test-token',user.id,9999999999999,1,1).run();
  await handleProgress(new Request('http://localhost:8787/api/progress/book',{method:'PUT',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({volume:1,chapter:2})}),repo,auth);
  const {usersAdmin}=await import('../../../packages/cms-plugin/users-admin.js');
  assert.equal((await usersAdmin(DB,{type:'block_action',action_id:'reader-delete',value:user.id})).toast.type,'success');
  for (const table of ['user','session','account','reading_progress']) {
    const column=table==='user'?'id':table==='reading_progress'?'user_id':'userId';
    assert.equal(await DB.prepare(`SELECT ${column} FROM ${table} WHERE ${column} = ?`).bind(user.id).first(),null);
  }
  assert.equal((await handleProgress(new Request('http://localhost:8787/api/progress/book',{headers:{cookie}}),repo,auth)).status,401);
  assert.equal(await DB.prepare('SELECT id FROM verification WHERE id = ?').bind('reset-id').first(),null);
});

test('invitations cannot reset a verified or blocked reader account',async()=>{
  const {auth,DB,env,messages}=setup();
  const cookie=await register(auth,'existing@example.test',messages);
  const user=(await auth.api.getSession({headers:new Headers({cookie})})).user;
  const {sendReaderInvitation}=await import('../src/invitations.js');
  await assert.rejects(sendReaderInvitation(env,user.id));
  await DB.prepare('INSERT INTO user (id,name,email,emailVerified,createdAt,updatedAt,banned) VALUES (?,?,?,0,?,?,1)').bind('blocked-id','Blocked','blocked-invite@example.test',1,1).run();
  await assert.rejects(sendReaderInvitation(env,'blocked-id'));
  assert.equal(messages.length,1);
});
