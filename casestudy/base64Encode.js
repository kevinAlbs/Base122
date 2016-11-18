let fs = require('fs');
if (process.argv.length != 3) {
    console.log("Usage: node base64EncodeImage.js file");
    process.exit(1);
}
console.log(fs.readFileSync(process.argv[2]).toString('base64'));