export async function sourceAdmin(db, input) {
  if (input?.type === 'block_action' && input.action_id === 'verify' && typeof input.value === 'string' && /^gutenberg-\d+$/.test(input.value)) {
    await db.prepare("UPDATE sources SET rights_verified = 1, status = 'pending', last_error = NULL WHERE id = ? AND rights_verified = 0").bind(input.value).run();
  }
  if (input?.type === 'block_action' && input.action_id === 'retry' && typeof input.value === 'string' && /^gutenberg-\d+$/.test(input.value)) {
    await db.prepare("UPDATE sources SET status = 'pending', last_error = NULL WHERE id = ? AND status = 'failed' AND rights_verified = 1").bind(input.value).run();
  }
  const { results } = await db.prepare('SELECT id, title, author, url, rights_verified, status, last_error FROM sources ORDER BY title LIMIT 100').all();
  return { blocks: [
    { type:'header', text:'Book sources' },
    { type:'section', text:'Verify the rights for each target territory and edition before enabling processing. Discovery metadata alone does not establish permission.' },
    { type:'table', page_action_id:'sources_page', columns:[{key:'title',label:'Title'},{key:'author',label:'Author'},{key:'url',label:'Source'},{key:'status',label:'Status'},{key:'error',label:'Last error'},{key:'action',label:'Rights',format:'element'}], rows:results.map((source) => ({title:source.title,author:source.author,url:source.url,status:source.status,error:source.last_error || '',action:source.rights_verified ? (source.status === 'failed' ? {type:'button',label:'Retry',action_id:'retry',value:source.id} : undefined) : {type:'button',label:'Verify rights',action_id:'verify',value:source.id,confirm:{title:'Confirm rights?',text:'Confirm that this edition may be used in every intended territory.',confirm:'Verify',deny:'Cancel'}}})) },
  ] };
}
