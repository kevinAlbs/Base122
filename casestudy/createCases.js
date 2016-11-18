// Writes a number of images in both src, base64, and base123 format.
let fs = require('fs')
, base123 = require('../base123')
;

const kNumImages = 1000
, kImgDir = 'img/'
, kHeader = "<html><head><meta charset='utf-8'></head><body>"
, kFooter = "</body></html>"
, kBase123Script = '<script>function b123d(a){function i(a){a<<=1,f|=a>>>g,g+=7,g>=8&&(e.push(f),g-=8,f=a<<7-g&255)}for(var b=[0,10,13,34,92],d=64,e=[],f=0,g=0,h=a.charCodeAt(0),j=1;j<a.length;j++){var k=a.charCodeAt(j);if(k>127){var l=k>>>8&7;if(i(b[l]),j==a.length-1&&h&d)continue;i(127&k)}else i(k)}return e}document.querySelectorAll("[data-b123]").forEach(a=>{var b=a.dataset.b123,c=a.dataset.b123m||"image/png";inflated=new Uint8Array(b123d(b));var d=new Blob([inflated],{type:c}),e=URL.createObjectURL(d);a.src=e});</script>'
;

let outSrc = fs.createWriteStream('out.html')
, outB64 = fs.createWriteStream('out-base64.html')
, outB123 = fs.createWriteStream('out-base123.html')
, outFiles = [outSrc, outB64, outB123]
;

outFiles.forEach((file) => { file.write(kHeader); });
for (let i = 0; i < kNumImages; i++) {
    outSrc.write('<img src="' + kImgDir + i + '.png" />');
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