// Benchmark various approaches to pushing onto an array when the element count is mostly 
// known, but can only be greater (for decoding).

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
//}).add('Uint8ArrayParts', function() {
}).on('complete', function() {
    console.log(this.name);
    this.each((bench) => {
        console.log(bench.toString());
    });
}, {maxTime: 15}).run();
