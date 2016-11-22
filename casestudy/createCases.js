// Writes a number of images in both src, base64, and base123 format.
let fs = require('fs')
, base123 = require('../base123')
;

if (process.argv.length != 3) {
    console.log('Usage: node createCases.js <n>');
    console.log('<n> is the number of images to use in the files');
    process.exit(1);
}

const kNumImages = process.argv[2]
, kImgDir = 'img/'
, kOutDir = 'out/'
, kHeader = '<html><head><meta charset="utf-8"></head><body>'
, kFooter = '</body></html>'
, kBase123Script = '<script>' + fs.readFileSync('../decode.min.js') + '</script>'
;

let outSrc = fs.createWriteStream(kOutDir + kNumImages + '.html')
, outB64 = fs.createWriteStream(kOutDir + kNumImages + '-base64.html')
, outB123 = fs.createWriteStream(kOutDir + kNumImages + '-base123.html')
, outFiles = [outSrc, outB64, outB123]
;

outFiles.forEach((file) => { file.write(kHeader); });
for (let i = 0; i < kNumImages; i++) {
    outSrc.write('<img src="../' + kImgDir + i + '.png" />');
    let buf = fs.readFileSync(kImgDir + i + '.png');
    let base64String = buf.toString('base64');
    outB64.write('<img src="data:image/png;base64,'+ base64String + '" />');
    let base123Data = base123.encodeFromBase64(base64String); // TODO: bad, encode from buffer.
    outB123.write('<img data-b123="');
    outB123.write(new Buffer(new Uint8Array(base123Data)));
    outB123.write('">');
}
outB123.write(kBase123Script);
outFiles.forEach((file) => { file.end(kFooter); });
console.log('Files written to ' + kOutDir)