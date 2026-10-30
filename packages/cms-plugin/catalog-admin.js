const idPattern = /^[a-z0-9-]{1,100}$/;
async function revision(text) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash).slice(0,8), (byte) => byte.toString(16).padStart(2,'0')).join('');
}
async function renderCatalog(db, toast) {
  const books = await db.prepare('SELECT id, title, author, published, withdrawn FROM books ORDER BY title LIMIT 100').all();
  const descriptions = await db.prepare(`SELECT descriptions.id, descriptions.text, descriptions.volume, descriptions.chapter, characters.name, books.title, content_evidence.excerpt FROM descriptions JOIN characters ON characters.id = descriptions.character_id JOIN books ON books.id = characters.book_id LEFT JOIN content_evidence ON content_evidence.entity_type = 'description' AND content_evidence.entity_id = descriptions.id ORDER BY books.title, characters.name, descriptions.volume, descriptions.chapter LIMIT 100`).all();
  const relations = await db.prepare(`SELECT relations.id, relations.label, relations.volume, relations.chapter, books.title, source.name AS source_name, target.name AS target_name, content_evidence.excerpt FROM relations JOIN books ON books.id = relations.book_id JOIN characters AS source ON source.id = relations.source_id JOIN characters AS target ON target.id = relations.target_id LEFT JOIN content_evidence ON content_evidence.entity_type = 'relation' AND content_evidence.entity_id = relations.id ORDER BY books.title, relations.volume, relations.chapter LIMIT 100`).all();
  const events = await db.prepare(`SELECT events.id, events.title, events.description, events.volume, events.chapter, books.title AS book_title, content_evidence.excerpt FROM events JOIN books ON books.id = events.book_id LEFT JOIN content_evidence ON content_evidence.entity_type = 'event' AND content_evidence.entity_id = events.id ORDER BY books.title, events.volume, events.chapter LIMIT 100`).all();
  return { blocks:[
    {type:'header',text:'Book catalog'},
    {type:'section',text:'Withdraw a book to remove it from the public catalog. Existing content is preserved.'},
    {type:'table',page_action_id:'books_page',columns:[{key:'title',label:'Title'},{key:'author',label:'Author'},{key:'status',label:'Status'},{key:'action',label:'Action',format:'element'}],rows:books.results.map((book)=>({title:book.title,author:book.author,status:book.published?'Published':book.withdrawn?'Withdrawn':'Draft',action:book.published?{type:'button',label:'Withdraw',action_id:'withdraw',value:book.id,style:'danger',confirm:{title:'Withdraw this book?',text:'The book and its portraits will no longer be publicly available.',confirm:'Withdraw',deny:'Cancel'}}:book.withdrawn?{type:'button',label:'Restore',action_id:'restore',value:book.id}:undefined}))},
    {type:'header',text:'Character descriptions'},
    {type:'table',page_action_id:'descriptions_page',columns:[{key:'book',label:'Book'},{key:'name',label:'Character'},{key:'position',label:'Volume / chapter'},{key:'text',label:'Description'},{key:'evidence',label:'Source excerpt'},{key:'action',label:'Action',format:'element'}],rows:descriptions.results.map((item)=>({book:item.title,name:item.name,position:`${item.volume} / ${item.chapter}`,text:item.text,evidence:item.excerpt || '',action:{type:'button',label:'Edit',action_id:'edit-description',value:item.id}}))},
    {type:'header',text:'Relationships'},
    {type:'table',page_action_id:'relations_page',columns:[{key:'book',label:'Book'},{key:'characters',label:'Characters'},{key:'position',label:'Volume / chapter'},{key:'text',label:'Relationship'},{key:'evidence',label:'Source excerpt'},{key:'action',label:'Action',format:'element'}],rows:relations.results.map((item)=>({book:item.title,characters:`${item.source_name} / ${item.target_name}`,position:`${item.volume} / ${item.chapter}`,text:item.label,evidence:item.excerpt || '',action:{type:'button',label:'Edit',action_id:'edit-relation',value:item.id}}))},
    {type:'header',text:'Events'},
    {type:'table',page_action_id:'events_page',columns:[{key:'book',label:'Book'},{key:'title',label:'Event'},{key:'position',label:'Volume / chapter'},{key:'text',label:'Description'},{key:'evidence',label:'Source excerpt'},{key:'action',label:'Action',format:'element'}],rows:events.results.map((item)=>({book:item.book_title,title:item.title,position:`${item.volume} / ${item.chapter}`,text:item.description,evidence:item.excerpt || '',action:{type:'button',label:'Edit',action_id:'edit-event-description',value:item.id}}))},
  ], ...(toast ? {toast} : {}) };
}

export async function catalogAdmin(db, input) {
  if (input?.type === 'block_action' && typeof input.value === 'string' && idPattern.test(input.value)) {
    if (input.action_id === 'withdraw') {
      await db.prepare('UPDATE books SET published = 0, withdrawn = 1 WHERE id = ? AND published = 1').bind(input.value).run();
      return renderCatalog(db,{type:'success',message:'Book withdrawn.'});
    }
    if (input.action_id === 'restore') {
      const result = await db.prepare('UPDATE books SET published = 1, withdrawn = 0 WHERE id = ? AND withdrawn = 1 AND EXISTS (SELECT 1 FROM sources WHERE sources.id = books.id AND rights_verified = 1)').bind(input.value).run();
      return renderCatalog(db,(result.meta?.changes ?? result.changes) ? {type:'success',message:'Book restored.'} : {type:'error',message:'Book cannot be restored until its source rights are verified.'});
    }
    if (input.action_id === 'edit-relation' || input.action_id === 'edit-event-description') {
      const relation = input.action_id === 'edit-relation';
      const item = await db.prepare(relation ? 'SELECT id, label AS text FROM relations WHERE id = ?' : 'SELECT id, description AS text FROM events WHERE id = ?').bind(input.value).first();
      if (!item) return renderCatalog(db,{type:'error',message:'Entry not found.'});
      const hash = await revision(item.text);
      const type = relation ? 'relation' : 'event-description';
      return {blocks:[{type:'header',text:relation ? 'Edit relationship' : 'Edit event'},{type:'form',block_id:'text-editor',fields:[{type:'text_input',action_id:'text',label:relation ? 'Relationship' : 'Description',initial_value:item.text,multiline:!relation}],submit:{label:'Save',action_id:`save-${type}_${item.id}_${hash}`}}]};
    }
    if (input.action_id === 'edit-description') {
      const item = await db.prepare('SELECT id, text FROM descriptions WHERE id = ?').bind(input.value).first();
      if (!item) return renderCatalog(db,{type:'error',message:'Description not found.'});
      const hash = await revision(item.text);
      return {blocks:[{type:'header',text:'Edit character description'},{type:'section',text:'This description is shown starting at its assigned chapter.'},{type:'form',block_id:'description-editor',fields:[{type:'text_input',action_id:'description',label:'Description',initial_value:item.text,multiline:true}],submit:{label:'Save',action_id:`save-description_${item.id}_${hash}`}}]};
    }
  }
  if (input?.type === 'form_submit' && typeof input.action_id === 'string') {
    const generic = /^save-(relation|event-description)_([a-z0-9-]{1,100})_([a-f0-9]{16})$/.exec(input.action_id);
    if (generic) {
      const text = input.values?.text;
      if (typeof text !== 'string' || !text.trim() || text.length > 2000) return renderCatalog(db,{type:'error',message:'Enter text of at most 2,000 characters.'});
      const relation = generic[1] === 'relation';
      const current = await db.prepare(relation ? 'SELECT label AS text FROM relations WHERE id = ?' : 'SELECT description AS text FROM events WHERE id = ?').bind(generic[2]).first();
      if (!current || await revision(current.text) !== generic[3]) return renderCatalog(db,{type:'error',message:'This entry changed. Reopen it before saving.'});
      const result = await db.prepare(relation ? 'UPDATE relations SET label = ? WHERE id = ? AND label = ?' : 'UPDATE events SET description = ? WHERE id = ? AND description = ?').bind(text.trim(),generic[2],current.text).run();
      return renderCatalog(db,(result.meta?.changes ?? result.changes) ? {type:'success',message:'Entry saved.'} : {type:'error',message:'This entry changed. Reopen it before saving.'});
    }
    const match = /^save-description_([a-z0-9-]{1,100})_([a-f0-9]{16})$/.exec(input.action_id);
    const text = input.values?.description;
    if (!match || typeof text !== 'string' || !text.trim() || text.length > 2000) return renderCatalog(db,{type:'error',message:'Enter a description of at most 2,000 characters.'});
    const current = await db.prepare('SELECT text FROM descriptions WHERE id = ?').bind(match[1]).first();
    if (!current || await revision(current.text) !== match[2]) return renderCatalog(db,{type:'error',message:'This description changed. Reopen it before saving.'});
    const result = await db.prepare('UPDATE descriptions SET text = ? WHERE id = ? AND text = ?').bind(text.trim(),match[1],current.text).run();
    return renderCatalog(db,(result.meta?.changes ?? result.changes) ? {type:'success',message:'Description saved.'} : {type:'error',message:'This description changed. Reopen it before saving.'});
  }
  return renderCatalog(db);
}
