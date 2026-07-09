const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.html') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace <ion-header mode="ios"> with <ion-header class="ion-no-border premium-header">
  content = content.replace(/<ion-header mode="ios">/g, '<ion-header class="ion-no-border premium-header">');
  
  // Replace <ion-header class="ion-no-border"> with <ion-header class="ion-no-border premium-header">
  content = content.replace(/<ion-header class="ion-no-border">/g, '<ion-header class="ion-no-border premium-header">');
  
  // Update ion-back-button to have text="" and color="dark" if not already present
  // This regex matches <ion-back-button ...> and we will rebuild it
  content = content.replace(/<ion-back-button([^>]*)>/g, (match, p1) => {
    let attrs = p1;
    // Remove existing text="something"
    attrs = attrs.replace(/\s*text="[^"]*"/g, '');
    // Remove existing color="something"
    attrs = attrs.replace(/\s*color="[^"]*"/g, '');
    return `<ion-back-button${attrs} text="" color="dark">`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

const targetDir = path.join(__dirname, 'src', 'app');
walkDir(targetDir, processFile);
console.log('Done replacing headers.');
