const fs = require('fs');
const [id, html_url, upload_url, body] = process.argv.slice(2) || [];

console.log('body', body);
console.log('id', id);
console.log('html_url', html_url);
console.log('upload_url', upload_url);

fs.writeFileSync(`${__dirname}/../release_draft.txt`, JSON.stringify({
  id,
  html_url,
  upload_url,
  body: body.replace(/('|`|")/g, ''),
}));
