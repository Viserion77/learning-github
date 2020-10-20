const os = require('os');
const fs = require('fs');

const [file, ...args] = process.argv.slice(2);

(() => {
  const fileJson = fs.readFileSync(file).toString('utf8');
  args.splice(0, 0, fileJson);

  const mergedJson = args.reduce((acc, i) => {
    Object.entries(JSON.parse(i)).map(([key, value]) => {
      acc[key] = value;
    });

    return acc;
  }, {});

  const output = `${JSON.stringify(mergedJson)}${os.EOL}`;

  process.stdout.write(output);
  fs.writeFileSync(file, output);
})();
