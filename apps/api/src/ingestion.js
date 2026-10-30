export function validateSourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'www.gutenberg.org' && /^\/files\/\d+\/[\w.-]+\.txt$/.test(url.pathname) && !url.search && !url.hash && !url.username && !url.password && !url.port;
  } catch { return false; }
}

export function splitChapters(text) {
  const start = /\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*[^\n]*\n/i.exec(text);
  const end = /\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*/i.exec(text);
  const body = text.slice(start ? start.index + start[0].length : 0, end ? end.index : undefined);
  const pattern = /^CHAPTER[ \t]+(I|II|III|IV|V|VI|VII|VIII|IX|X|[IVXLCDM]+|\d+)(?:[. :—-]+[^\r\n]*)?[ \t]*$/gim;
  const headings = [...body.matchAll(pattern)];
  const first = headings.map((heading) => heading[1].toUpperCase()).lastIndexOf('I');
  const numericFirst = headings.map((heading) => heading[1]).lastIndexOf('1');
  const offset = Math.max(first, numericFirst, 0);
  const selected = headings.slice(offset);
  if (!selected.length) throw new Error('No supported chapter headings found');
  return selected.map((heading, index) => ({ number: index + 1, title: heading[0].trim(), text: body.slice(heading.index + heading[0].length, selected[index + 1]?.index ?? body.length).trim() }));
}
