// Tests how base-122 compresses with gzip compression.
// Initial results show that base64 compresses better than base122.

let testData = require('./testData')
, base122 = require('../base122.js')
, zlib = require('zlib')
;

let base64Str = testData.base64.img1;
let rawData = Buffer.from(testData.base64.img1, 'base64');
let base64Gzip = zlib.gzipSync(base64Str);
let base122Str = String.fromCharCode(...(new Uint8Array(base122.encodeFromBase64(testData.base64.img1))));
let base122Gzip = zlib.gzipSync(base122Str);
let base122Data = Buffer.from(base122Str, 'utf-8');

console.log("Original\tBase64\tBase64 Gzip\tBase122\tBase122 Gzip");
console.log(rawData.length + "\t" + base64Str.length + "\t" + base64Gzip.length + "\t" + base122Data.length + "\t" + base122Gzip.length);