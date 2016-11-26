let base122 = require('../base122');
let inputData = require('fs').readFileSync('example.jpg')
let base64Encoded = inputData.toString('base64');
let base122Encoded = Buffer.from(base122.encode(inputData), 'utf8');
console.log("Original size = " + inputData.length); // Original size = 1429
console.log("Base-64 size = " + base64Encoded.length); // Base-64 size = 1908
console.log("Base-122 size = " + base122Encoded.length); // Base-122 size = 1635
console.log("Saved " + (base64Encoded.length - base122Encoded.length) + " bytes") // Saved 273 bytes