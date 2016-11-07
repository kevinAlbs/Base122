let Benchmark = require('benchmark')
, testData = require('./testData')
, base123 = require('../base123')
, suite = new Benchmark.Suite('Decoding')
, longBase123Data = base123.encodeFromBase64(testData.base64.img1)
;

suite.add('SmallDecode', function() {
    let encoded = [0b01010101, 0b00101010, 0b01010101, 0b00101010, 0b01010000];
    base123.decode(encoded);
}).add('LargeDecode', () => {
    // nop.
    base123.decode(longBase123Data);
}).on('complete', function() {
    this.each((bench) => {
        console.log(bench.toString());
    });
}, {maxTime: 5}).run();