// Tests how base-123 compresses with gzip compression.
// Initial results show that base64 compresses better than base123.

let testData = require('./testData')
, base123 = require('../base123.js')
, zlib = require('zlib')
;

let base64Str = testData.base64.img1;
let rawData = Buffer.from(testData.base64.img1, 'base64');
let base64Gzip = zlib.gzipSync(base64Str);
let base123Str = String.fromCharCode(...(new Uint8Array(base123.encodeFromBase64(testData.base64.img1))));
let base123Gzip = zlib.gzipSync(base123Str);
let base123Data = Buffer.from(base123Str, 'utf-8');

console.log("Original\tBase64\tBase64 Gzip\tBase123\tBase123 Gzip");
console.log(rawData.length + "\t" + base64Str.length + "\t" + base64Gzip.length + "\t" + base123Data.length + "\t" + base123Gzip.length);