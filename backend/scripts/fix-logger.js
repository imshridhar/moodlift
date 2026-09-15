const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, '../src'), (filePath) => {
  if (filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace const logger = require('../utils/logger') or similar with const { logger }
    const res = content.replace(/const\s+logger\s+=\s+require\((['"])(.*?logger.*?)(['"])\);/g, 'const { logger } = require($1$2$3);');
    if (res !== content) {
      fs.writeFileSync(filePath, res, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
