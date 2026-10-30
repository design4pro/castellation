const character = { name:{type:'string'}, description:{type:'string'}, appearance:{type:'string'}, evidence:{type:'string'} };
const relation = { from:{type:'string'}, to:{type:'string'}, label:{type:'string'}, evidence:{type:'string'} };
const event = { title:{type:'string'}, description:{type:'string'}, evidence:{type:'string'} };
const arrayOf = (properties) => ({ type:'array', items:{ type:'object', properties, required:Object.keys(properties), additionalProperties:false } });
export const analysisSchema = { type:'object', properties:{ characters:arrayOf(character), relations:arrayOf(relation), events:arrayOf(event) }, required:['characters','relations','events'], additionalProperties:false };

export function validateAnalysis(raw, text) {
  let result;
  try { result = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { throw new Error('Analysis is not valid JSON'); }
  if (!result || typeof result !== 'object' || !['characters','relations','events'].every((key) => Array.isArray(result[key]) && result[key].length <= 100)) throw new Error('Invalid analysis structure');
  for (const [key, fields] of [['characters',character],['relations',relation],['events',event]]) {
    for (const item of result[key]) {
      if (!item || typeof item !== 'object' || !Object.keys(fields).every((field) => typeof item[field] === 'string' && item[field].length <= 2000 && (field === 'appearance' || item[field].trim()))) throw new Error(`Invalid ${key} entry`);
      if (item.evidence.length > 500 || !text.includes(item.evidence)) throw new Error(`Invalid ${key} evidence`);
    }
  }
  const names = new Set(result.characters.map((item) => item.name.trim().toLocaleLowerCase('en-US')));
  if (names.size !== result.characters.length) throw new Error('Duplicate character names');
  for (const item of result.relations) if (!names.has(item.from.trim().toLocaleLowerCase('en-US')) || !names.has(item.to.trim().toLocaleLowerCase('en-US'))) throw new Error('Relation references an unknown character');
  return result;
}
