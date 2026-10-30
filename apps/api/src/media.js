export async function servePortrait(id, db, bucket) {
  if (!/^c-[a-f0-9]{24}-[1-9]\d*$/.test(id)) return new Response('Not found',{status:404});
  const portrait = await db.prepare('SELECT portraits.id FROM portraits JOIN characters ON characters.id = portraits.character_id JOIN books ON books.id = characters.book_id WHERE portraits.id = ? AND books.published = 1').bind(id).first();
  if (!portrait) return new Response('Not found',{status:404});
  const image = await bucket.get(`portraits/${id}.jpg`);
  if (!image) return new Response('Not found',{status:404});
  return new Response(image.body,{headers:{'content-type':image.httpMetadata?.contentType ?? 'image/jpeg','cache-control':'no-store','x-content-type-options':'nosniff','access-control-allow-origin':'*'}});
}
