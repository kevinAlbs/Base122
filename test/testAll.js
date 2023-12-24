// Simple correctness unit tests of encoding and decoding functions.

let assert = require('assert')
, tester = require('./tester')
, testData = require('./testData')
, base122 = require('../base122')
;

const kIllegals = [
      0b0000000 // 0 = null
    , 0b0001010 // 10 = newline                
    , 0b0001101 // 13 = carriage return
    , 0b0100010 // 34 = double quote
    , 0b0100110 // 38 = ampersand
    , 0b1011100 // 92 = backslash
]
, kShortened = 0b111
;

function testEncodeDecode(rawData, expectedEncoding) {
    let strData = String.fromCodePoint(...rawData);
    assert.deepStrictEqual(expectedEncoding, base122.encode(rawData));
    assert.deepStrictEqual(expectedEncoding, base122.encode(strData));
    // Decode the encoding.
    assert.deepStrictEqual(rawData, base122.decode(expectedEncoding));
}

tester.addTest('oneByte', () => {
    // Encode in base-122, then decode, check that equal to the original.
    // Let's first encode one byte of just ones.
    let rawData = [0b11111111], expectedEncoding = [0b01111111, 0b01000000];
    testEncodeDecode(rawData, expectedEncoding);
});

tester.addTest('severalBytes', () => {
    // Let's try encoding alternating bits.
    let rawData = [0b10101010, 0b10101010, 0b10101010, 0b10101010];
    let expectedEncoding = [0b01010101, 0b00101010, 0b01010101, 0b00101010, 0b01010000];
    testEncodeDecode(rawData, expectedEncoding);
});

tester.addTest('illegalBytes', () => {
    // Test one single byte of each illegal with an extra 1.
    kIllegals.forEach((illegal, index) => {
        let rawData = [(illegal << 1) | 1];
        // Expect 0b110 <3 bit index> <0 flag> <1 bit> and zeros for rest.
        let expectedEncoding = [0b11000011 | (index << 2), 0b10000000];
        testEncodeDecode(rawData, expectedEncoding);
    });

    // Test two consecutive illegal sequences which should create a shortening.
    let rawData = [0, 0];
    let strData = String.fromCodePoint(...rawData);

    // Since only 14 bits are caputured in first utf-8 char, only two 0 bits remain, creating
    // a second utf-8 char with shortening.
    let expectedEncoding = [0b11000010, 0b10000000, 0b11011110, 0b10000000];
    testEncodeDecode(rawData, expectedEncoding);
});

tester.addTest('testUTF8ToString', () => {
    // Test helper for converting UTF-8 binary data to a string.
    let rawData = [0b11000010, 0b10111111, 0b01010101];
    let utf8Str = base122.utf8DataToString(rawData);
    assert.equal(utf8Str.codePointAt(0), 0b10111111, utf8Str.codePointAt(1), 0b1010101);
});

function testBase64EncodeDecode(base64) {
    let rawData = [];
    let base64Data = Buffer.from(base64, 'base64').toString('binary');
    for (let i = 0; i < base64Data.length; i++) rawData.push(base64Data.codePointAt(i));
    let encoded = base122.encodeFromBase64(base64);
    let decoded = base122.decode(encoded);
    assert.deepStrictEqual(rawData, decoded);
}

tester.addTest('realBase64Data', () => {
    // Just test that encoding and decoding gives back original.
    testBase64EncodeDecode(testData.base64.img1);
    testBase64EncodeDecode(testData.base64.img2);
    testBase64EncodeDecode(testData.base64.audio1);
    testBase64EncodeDecode(testData.base64.imgBug);
});

tester.addTest('throws error encoding strings with code points > 255', () => {
    assert.throws(() => {
        base122.encode("美");
    })
});

tester.addTest('can encode HTML with two <img> on same line', (end_callback) => {
    const input = "<img src='data:image/jpeg;base64,Qw==' /><img src='data:image/jpeg;base64,Qw==' />";

    const fs = require('fs');
    fs.writeFileSync("test.html", input);

    // Wrap test in promise to always delete temporary files in `finally`.
    new Promise((resolve) => {
        base122.encodeFile ("test.html", "test.html.out", {
            html: true,
            addDecoder: true
        }, resolve);
    }).then(() => {
        const got = fs.readFileSync("test.html.out", { encoding: "utf8"});
        const expect = '<img data-b122="!@" /><img data-b122="!@" />' + "\n"; // quirk: a newline is always added
        assert.equal(got, expect);
    }).finally(() => {
        if (fs.existsSync("test.html")) {
            fs.unlinkSync ("test.html");
        }
        if (fs.existsSync("test.html.out")) {
            fs.unlinkSync ("test.html.out");
        }
        end_callback();
    });
}, true /* async */);


tester.addTest('can encode HTML with </body> on same line', (end_callback) => {
    // This is a reproducing test case for issue 11.
    const input = "<body><img src='data:image/jpeg;base64,Qw==' /></body>";

    const fs = require('fs');
    fs.writeFileSync("test.html", input);

    // Wrap test in promise to always delete temporary files in `finally`.
    new Promise((resolve) => {
        base122.encodeFile ("test.html", "test.html.out", {
            html: true,
            addDecoder: true
        }, resolve);
    }).then(() => {
        const got = fs.readFileSync("test.html.out", { encoding: "utf8"});
        const decoderjs = fs.readFileSync("decode.min.js", { encoding: "utf8" });
        const expect = '<body><img data-b122="!@" /><script>' + decoderjs + "</script></body>" + "\n"; // quirk: a newline is always added
        assert.equal(got, expect);
    }).finally(() => {
        if (fs.existsSync("test.html")) {
            fs.unlinkSync ("test.html");
        }
        if (fs.existsSync("test.html.out")) {
            fs.unlinkSync ("test.html.out");
        }
        end_callback();
    });
}, true /* async */);


tester.run();
