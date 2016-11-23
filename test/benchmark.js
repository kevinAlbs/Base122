let Benchmark = require('benchmark')
, testData = require('./testData')
, base122 = require('../base122')
, suite = new Benchmark.Suite('Base122')
, longBase122Data = base122.encodeFromBase64(testData.base64.img1)
, longRawData = []
;

for (let i = 0; i < 1000; i++) longRawData.push(i);

suite.add('SmallDecode', function() {
    let encoded = [0b01010101, 0b00101010, 0b01010101, 0b00101010, 0b01010000];
    base122.decode(encoded);
}).add('LargeDecode', () => {
    base122.decode(longBase122Data);
}).add('SmallEncode', function() {
    let data = [0b01010101, 0b10101010, 0b01010101, 0b11111111, 0b00000000];
    base122.encode(data);
}).add('LargeEncode', function() {
    base122.encode(longRawData);
}).on('complete', function() {
    this.each((bench) => {
        console.log(bench.toString());
    });
}, {maxTime: 5}).run();