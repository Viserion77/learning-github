const os = require('os');
const https = require('https');

const REPOSITORY = 'Viserion77/learning-github';
const PRE_RELEASE_ID = '-stage';

const [branch, githubToken] = process.argv.slice(2) || [];

(async () => {
  let newVersion = '';

  if (!branch) {
    process.stdout.write(`::error ::undefined params${os.EOL}`);
    process.exit(1);
  }

  try {
    const [lastRelease] = await getReleases();

    if (branch === 'master') {
      newVersion = getProdVersion(lastRelease);
    } else {
      process.stdout.write(`::error ::invalid branch${os.EOL}`);
      process.exit(1);
    }

    writeOutput('version', newVersion);
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.stdout.write(`::error ::${err && err.message}${os.EOL}`);
    process.exit(1);
  }
})();

function getProdVersion({ tag_name, draft }) {
  if (!tag_name.includes(PRE_RELEASE_ID)) {
    // ? Se a ultima release foi um draft o deploy falhou e essa versão será corrigida
    if (draft) return tag_name;

    // ? Se a ultima release não foi um draft dá bump de patch na versão
    if (!draft) return bumpVersion(tag_name.replace('v', ''));
  }

  // ? Se a ultima release foi uma prerelease e agora o deploy é pra master remove ${PRE_RELEASE_ID}
  if (tag_name.includes(PRE_RELEASE_ID)) return `${extractPreReleaseVersion(tag_name).version}`;

  return '';
}

function bumpVersion(version, isPre) {
  const patchBump = v => {
    const [major, minor, patch] = extractVersion(v);
    return `v${major}.${minor}.${patch + 1}`;
  };

  if (isPre) {
    let { extractedVersion, preReleaseVersion } = {};
    if (version.includes(PRE_RELEASE_ID)) {
      ({
        version: extractedVersion,
        preReleaseVersion,
      } = extractPreReleaseVersion(version));
    } else {
      ({
        version: extractedVersion,
        preReleaseVersion,
      } = extractPreReleaseVersion(`${version}${PRE_RELEASE_ID}.-1`));

      extractedVersion = patchBump(extractedVersion);
    }

    return `${extractedVersion}${PRE_RELEASE_ID}.${preReleaseVersion + 1}`;
  }

  return patchBump(version);
}

function extractVersion(version) {
  return version.replace('v', '').split('.').map(i => Number(i));
}

function extractPreReleaseVersion(version) {
  const [versionNumber, preReleaseVersion] = version.split(`${PRE_RELEASE_ID}.`);

  return {
    version: versionNumber,
    preReleaseVersion: Number(preReleaseVersion || 0),
  };
}

function getReleases() {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      hostname: 'api.github.com',
      path: `/repos/${REPOSITORY}/releases?per_page=5`,
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

          if (parsedBody && parsedBody.message === 'Bad credentials') {
            console.log('parsedBody', parsedBody);
            return reject('Invalid github Token');
          }

          const releases = parsedBody || [];

          if (!Array.isArray(releases) || !releases.length) return reject('releases not found');

          return resolve(releases);
        } catch (err) {
          return reject((err && err.message) || 'Cannot find the specified release');
        }
      });

      res.on('error', error => {
        console.error('Error - getreleasesList', error);

        return reject(error);
      });
    });

    req.end();
  });
}

async function writeOutput(name, value) {
  const outputLine = `::set-output name=${name}::${value}`;
  process.stdout.write(`${outputLine}${os.EOL}`);
}
