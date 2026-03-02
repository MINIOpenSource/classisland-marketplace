import AdmZip from 'adm-zip';
import fs from 'fs';

const buffer = fs.readFileSync('.plugin-cache/index.zip');
const zip = new AdmZip(buffer);
const indexEntry = zip.getEntries().find(e => e.entryName.endsWith('index.v2.json'));
const json = JSON.parse(zip.readAsText(indexEntry));
console.log(json.Plugins[0]);
