// Tests how base-122 compresses with gzip compression.
// Initial results show that base64 compresses better than base122.

let testData = require('./testData')
, base122 = require('../base122.js')
, zlib = require('zlib')
;

function test(name, b64Str) {
    let rawData = Buffer.from(b64Str, 'base64')
    , b64Gzip = zlib.gzipSync(b64Str)
    , b122Data = Buffer.from(new Uint8Array(base122.encodeFromBase64(b64Str)), 'utf-8')
    , b122Gzip = zlib.gzipSync(b122Data.toString())
    ;
    //console.log("Name\tOriginal\tBase64\tBase64 Gzip\tBase122\tBase122 Gzip");
    console.log(name + "\t" + rawData.length + "\t" + b64Str.length + "\t" + b64Gzip.length + "\t" + b122Data.length + "\t" + b122Gzip.length);
}

test('Size32', testData.base64.s32);
test('Size64', testData.base64.s64);
test('Size128', testData.base64.s128);
test('Size256', testData.base64.s256);