// Benchmark various approaches to pushing onto an array when the element count is mostly 
// known, but can only be greater (for decoding).

// Run on my laptop, suggests that using a sequence of Uint8Arrays may be worthwile. Blob
// constructor accepts an array of Uint8Arrays.
//
// ArrayPush
// Push x 14,508 ops/sec ±0.39% (90 runs sampled)
// HalfPreAlloc x 22,886 ops/sec ±0.37% (90 runs sampled)
// WholePreAlloc x 44,985 ops/sec ±0.41% (91 runs sampled)
// MostPreAlloc x 23,898 ops/sec ±0.43% (91 runs sampled)
// SetProp x 15,662 ops/sec ±0.46% (92 runs sampled)
// Uint8ArrayExact x 59,187 ops/sec ±1.64% (75 runs sampled)

// However, we know that each byte represents 7 bits (or each two bytes represents 14).
// Hence, ratio will always be 16/15. So no resizing is necessary!!

let Benchmark = require('benchmark')
, suite = new Benchmark.Suite('ArrayPush')
, assert = require('assert')
;

const kCount = 10000
, kPrealloc = 5000
, kMostCount = 8500
;

suite.add('Push', function() {
    var arr = [];
    for (var i = 0; i < kCount; i++) {
        arr.push(1);
    }
}).add('HalfPreAlloc', function() {
    var arr = new Array(kPrealloc);
    for (var i = 0; i < kCount; i++) {
        arr[i] = 1;
    }
}).add('WholePreAlloc', function() {
    var arr = new Array(kCount);
    for (var i = 0; i < kCount; i++) {
        arr[i] = 1;
    }
}).add('MostPreAlloc', function() {
    var arr = new Array(kMostCount);
    for (var i = 0; i < kCount; i++) {
        arr[i] = 1;
    }
}).add('SetProp', function() {
    var arr = [];
    for (var i = 0; i < kCount; i++) {
        arr[i] = 1;
    }
}).add('Uint8ArrayExact', function() {
    var arr = new Uint8Array(kCount);
    for (var i = 0; i < kCount; i++) {
        arr[i] = 1;
    }
}).add('Uint8ArrayAndResize', function() {
    var arr = new Uint8Array(2 * kCount);
    for (var i = 0; i < kCount; i++) {
        arr[i] = 1;
    }
    var final = new Uint8Array(arr, 0, kCount);
}).on('complete', function() {
    console.log(this.name);
    this.each((bench) => {
        console.log(bench.toString());
    });
}, {maxTime: 15}).run();
