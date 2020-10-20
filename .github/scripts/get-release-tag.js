const https = require('https');
const os = require('os');

const [releaseId, githubToken] = process.argv.slice(2) || [];

(() => {
  if (!releaseId) throw new Error('releaseId not found');
  if (!githubToken) throw new Error('githubToken not found');

  const options = {
    method: 'GET',
    hostname: 'api.github.com',
    path: `/repos/Viserion77/learning-github/releases/${releaseId}`,
    headers: {
      Authorization: `token ${githubToken}`,
      'User-Agent': new https.Agent(),
    },
  };
  
  const req = https.request(options, res => {
    const chunks = [];
  
    res.on('data', chunk => {
      chunks.push(chunk);
    });
  
    res.on('end', () => {
      const body = Buffer.concat(chunks).toString();

      try {
        const parsedBody = JSON.parse(body);

        if (parsedBody.message === 'Bad credentials') {
          console.log('body', body);
          throw new Error('Invalid github Token');
        }

        if (!parsedBody.tag_name) throw new Error('Tag name not found');

        const output = `::set-output name=tag_name::${parsedBody.tag_name}`;

        process.stdout.write(`${output}${os.EOL}`);
      } catch (err) {
        throw new Error((err && err.message) || 'Cannot find the specified release');
      }
    });
  
    res.on('error', error => {
      console.error('Request error', error);
      throw new Error(error);
    });
  });
  
  req.end();
})();
