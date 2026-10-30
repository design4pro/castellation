const idPattern = /^[A-Za-z0-9_-]{1,128}$/;
const pageSize = 25;

async function renderUsers(db, search = '', page = 0, toast) {
  search = typeof search === 'string' ? search.trim().slice(0, 100) : '';
  page = Number.isSafeInteger(page) && page >= 0 && page <= 100000 ? page : 0;
  const query = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
  const {results} = await db.prepare("SELECT id, name, email, emailVerified, banned, EXISTS (SELECT 1 FROM account WHERE account.userId = user.id AND account.providerId = 'credential') AS hasCredential FROM user WHERE name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?").bind(query, query, pageSize + 1, page * pageSize).all();
  const navigation = [];
  if (page > 0) navigation.push({type:'button',label:'Previous',action_id:'reader-page',value:JSON.stringify({search,page:page-1})});
  if (results.length > pageSize) navigation.push({type:'button',label:'Next',action_id:'reader-page',value:JSON.stringify({search,page:page+1})});
  return {blocks:[
    {type:'header',text:'Reader accounts'},
    {type:'section',text:'Reader accounts are separate from EmDash administrators. Changing an email requires verification and signs the reader out.'},
    {type:'actions',elements:[{type:'button',label:'Create account',action_id:'reader-create',value:'create'}]},
    {type:'form',block_id:'reader-search',fields:[{type:'text_input',action_id:'search',label:'Search by name or email',initial_value:search}],submit:{label:'Search',action_id:'reader-search'}},
    {type:'section',text:`Page ${page+1}`},
    {type:'table',page_action_id:'readers_page',columns:[{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'verified',label:'Email verified'},{key:'status',label:'Status'},{key:'edit',label:'Edit',format:'element'},{key:'block',label:'Block',format:'element'},{key:'action',label:'Sessions',format:'element'},{key:'delete',label:'Delete',format:'element'},{key:'invite',label:'Invitation',format:'element'}],rows:results.slice(0,pageSize).map((user)=>({name:user.name,email:user.email,verified:user.emailVerified?'Yes':'No',status:user.banned?'Blocked':'Active',edit:{type:'button',label:'Edit',action_id:'reader-edit',value:user.id},block:{type:'button',label:user.banned?'Unblock':'Block',action_id:user.banned?'reader-unblock':'reader-block',value:user.id,...(!user.banned?{style:'danger',confirm:{title:'Block account?',text:'The reader will be signed out and cannot sign in.',confirm:'Block',deny:'Cancel'}}:{})},action:{type:'button',label:'Revoke sessions',action_id:'revoke-reader-sessions',value:user.id,style:'danger',confirm:{title:'Revoke sessions?',text:'The reader will be signed out on all devices.',confirm:'Revoke',deny:'Cancel'}},delete:{type:'button',label:'Delete',action_id:'reader-delete',value:user.id,style:'danger',confirm:{title:'Delete account?',text:'This permanently deletes the account, its sessions, and reading progress.',confirm:'Delete',deny:'Cancel'}},invite:!user.emailVerified && !user.banned && !user.hasCredential ? {type:'button',label:'Resend invitation',action_id:'reader-invite',value:user.id} : undefined}))},
    ...(navigation.length ? [{type:'actions',elements:navigation}] : []),
  ],...(toast?{toast}:{})};
}

export async function usersAdmin(db, input, invitations) {
  if (input?.type === 'block_action' && input.action_id === 'reader-create') return {blocks:[{type:'header',text:'Create reader account'},{type:'section',text:'The reader will receive an email to verify their address and set a password.'},{type:'form',block_id:'reader-create-form',fields:[{type:'text_input',action_id:'name',label:'Name'},{type:'text_input',action_id:'email',label:'Email'}],submit:{label:'Create',action_id:'reader-create-submit'}}]};
  if (input?.type === 'form_submit' && input.action_id === 'reader-create-submit') {
    const name = typeof input.values?.name === 'string' ? input.values.name.trim() : '';
    const email = typeof input.values?.email === 'string' ? input.values.email.trim().toLowerCase() : '';
    if (!name || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return renderUsers(db,'',0,{type:'error',message:'Enter a valid name and email.'});
    const id=crypto.randomUUID();
    try {
      await db.prepare('INSERT INTO user (id,name,email,emailVerified,createdAt,updatedAt,role,banned) VALUES (?,?,?,0,?,?,?,0)').bind(id,name,email,Date.now(),Date.now(),'user').run();
    } catch { return renderUsers(db,'',0,{type:'error',message:'Account could not be created. Check whether the email is already in use.'}); }
    try {
      await invitations.send(id);
      return renderUsers(db,'',0,{type:'success',message:'Account created and invitation sent.'});
    } catch { return renderUsers(db,'',0,{type:'error',message:'Account created, but the invitation could not be sent. Use Resend invitation to try again.'}); }
  }
  if (input?.type === 'form_submit' && input.action_id === 'reader-search') return renderUsers(db,input.values?.search);
  if (input?.type === 'block_action' && input.action_id === 'reader-page') {
    try { const state = JSON.parse(input.value); return renderUsers(db,state.search,state.page); } catch { return renderUsers(db); }
  }
  if (input?.type === 'block_action' && typeof input.value === 'string' && idPattern.test(input.value)) {
    if (input.action_id === 'reader-invite') {
      try {
        await invitations.send(input.value);
        return renderUsers(db,'',0,{type:'success',message:'Invitation sent.'});
      } catch { return renderUsers(db,'',0,{type:'error',message:'Invitation could not be sent. Check the account and email configuration.'}); }
    }
    if (input.action_id === 'reader-delete') {
      const result = await db.prepare('DELETE FROM user WHERE id = ?').bind(input.value).run();
      return renderUsers(db,'',0,(result.meta?.changes ?? result.changes) ? {type:'success',message:'Account deleted.'} : {type:'error',message:'Account not found.'});
    }
    if (input.action_id === 'revoke-reader-sessions') {
      await db.prepare('DELETE FROM session WHERE userId = ?').bind(input.value).run();
      return renderUsers(db,'',0,{type:'success',message:'Sessions revoked.'});
    }
    if (input.action_id === 'reader-block' || input.action_id === 'reader-unblock') {
      const blocked = input.action_id === 'reader-block';
      const result = await db.prepare('UPDATE user SET banned = ?, banReason = NULL, banExpires = NULL, updatedAt = ? WHERE id = ?').bind(blocked?1:0,Date.now(),input.value).run();
      return renderUsers(db,'',0,(result.meta?.changes ?? result.changes) ? {type:'success',message:blocked?'Account blocked.':'Account unblocked.'} : {type:'error',message:'Account not found.'});
    }
    if (input.action_id === 'reader-edit') {
      const user = await db.prepare('SELECT id, name, email FROM user WHERE id = ?').bind(input.value).first();
      if (!user) return renderUsers(db,'',0,{type:'error',message:'Account not found.'});
      return {blocks:[{type:'header',text:'Edit reader account'},{type:'section',text:'Changing the email signs the reader out and requires verification.'},{type:'form',block_id:'reader-editor',fields:[{type:'text_input',action_id:'name',label:'Name',initial_value:user.name},{type:'text_input',action_id:'email',label:'Email',initial_value:user.email}],submit:{label:'Save',action_id:`reader-save_${user.id}`}}]};
    }
  }
  if (input?.type === 'form_submit' && typeof input.action_id === 'string' && input.action_id.startsWith('reader-save_')) {
    const id = input.action_id.slice('reader-save_'.length);
    const name = typeof input.values?.name === 'string' ? input.values.name.trim() : '';
    const email = typeof input.values?.email === 'string' ? input.values.email.trim().toLowerCase() : '';
    if (!idPattern.test(id) || !name || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return renderUsers(db,'',0,{type:'error',message:'Enter a valid name and email.'});
    const existing = await db.prepare('SELECT id FROM user WHERE email = ? AND id != ?').bind(email,id).first();
    if (existing) return renderUsers(db,'',0,{type:'error',message:'This email is already in use.'});
    try {
      const result = await db.prepare('UPDATE user SET name = ?, emailVerified = CASE WHEN email != ? THEN 0 ELSE emailVerified END, email = ?, updatedAt = ? WHERE id = ?').bind(name,email,email,Date.now(),id).run();
      return renderUsers(db,'',0,(result.meta?.changes ?? result.changes) ? {type:'success',message:'Account updated.'} : {type:'error',message:'Account not found.'});
    } catch { return renderUsers(db,'',0,{type:'error',message:'Account could not be updated.'}); }
  }
  return renderUsers(db);
}
