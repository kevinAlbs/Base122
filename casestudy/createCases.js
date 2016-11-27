// Writes a number of images in both src, base-64, and base-122 format.
let fs = require('fs')
, base122 = require('../base122')
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
, kBase122Script = '<script>' + fs.readFileSync('../decode.min.js') + '</script>'
;

let outSrc = fs.createWriteStream(kOutDir + kNumImages + '.html')
, outB64 = fs.createWriteStream(kOutDir + kNumImages + '-base64.html')
, outB122 = fs.createWriteStream(kOutDir + kNumImages + '-base122.html')
, outFiles = [outSrc, outB64, outB122]
;

outFiles.forEach((file) => { file.write(kHeader); });
for (let i = 0; i < kNumImages; i++) {
    outSrc.write('<img src="../' + kImgDir + i + '.jpg" />');
    let buf = fs.readFileSync(kImgDir + i + '.jpg');
    let base64String = buf.toString('base64');
    outB64.write('<img src="data:image/jpeg;base64,'+ base64String + '" />');
    let base122Data = base122.encodeFromBase64(base64String); // TODO: bad, encode from buffer.
    outB122.write('<img data-b122="');
    outB122.write(new Buffer(new Uint8Array(base122Data)));
    outB122.write('">');
}
outB122.write(kBase122Script);
outFiles.forEach((file) => { file.end(kFooter); });
console.log('Files written to ' + kOutDir)