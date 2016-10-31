let Benchmark = require('benchmark')
, testData = require('./testData')
, base123 = require('../base123')
, suite = new Benchmark.Suite('Decoding')
;

suite.add('SmallDecode', function() {
    let encoded = [0b01010101, 0b00101010, 0b01010101, 0b00101010, 0b01010000];
    base123.decode(encoded);
}).add('LargeDecode', () => {
    // nop.
}).on('complete', function() {
    this.each((bench) => {
        console.log(bench.toString());
    });
}, {maxTime: 5}).run();