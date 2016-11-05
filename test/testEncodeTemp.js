// Simple correctness unit tests of encoding and decoding functions.

let assert = require('assert')
, base64 = require('base-64')
, tester = require('./tester')
, base123 = require('../base123')
;

const specials = [
      0b0000000 // 0 = null
    , 0b0001010 // 10 = newline                
    , 0b0001101 // 13 = carriage return
    , 0b0100010 // 34 = double quote
    , 0b1011100 // 92 = backslash
];

const kHeader = 0b00001111, kShortened = 0b01000000;

function testEncode(rawData, expectedEncoding) {
    let strData = String.fromCodePoint(...rawData);
    assert.deepStrictEqual(expectedEncoding, base123.encode(rawData));
    assert.deepStrictEqual(expectedEncoding, base123.encode(strData));
}

tester.addTest('oneByte', () => {
    // Encode in base123, then decode, check that equal to the original.
    // Let's first encode one byte of just ones.
    let rawData = [0b11111111], expectedEncoding = [kHeader, 0b01111111, 0b01000000];
    testEncode(rawData, expectedEncoding);
});

tester.addTest('severalBytes', () => {
    // Let's try encoding alternating bits.
    let rawData = [0b10101010, 0b10101010, 0b10101010, 0b10101010];
    let expectedEncoding = [kHeader, 0b01010101, 0b00101010, 0b01010101, 0b00101010, 0b01010000];
    testEncode(rawData, expectedEncoding);
});

tester.addTest('specialBytes', () => {
    // Test one single byte of each special with an extra 1.
    specials.forEach((special, index) => {
        let rawData = [(special << 1) | 1];
        // Expect 0b110 <3 bit index> <0 flag> <1 bit> and zeros for rest.
        let expectedEncoding = [kHeader, 0b11000011 | (index << 2), 0b10000000];
        testEncode(rawData, expectedEncoding);
    });

    // Test two consecutive special bytes.
    let rawData = [0, 0];
    let strData = String.fromCodePoint(...rawData);

    // Since only 14 bits are caputured in first utf-8 char, only two 0 bits remain, creating
    // a second utf-8 char.
    let expectedEncoding = [kHeader | kShortened, 0b11000010, 0b10000000, 0b11000010, 0b10000000];
    testEncode(rawData, expectedEncoding);
});

tester.run();