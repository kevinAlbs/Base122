let base122 = require('./base122')
;
function help() {
    console.log("Base-122 Encoder");
    console.log("Re-encodes an HTML file with base-64 encoded data into base-122");
    console.log("Usage: node encodeFile.js input-file.html output-file.html");
}

if (process.argv.length < 3 || process.argv[2].match(/^(\-h|\-\-help)$/i)) {
    help();
    process.exit(0);
} else if (process.argv.length != 4) {
    help();
    process.exit(1);
}

base122.encodeFile(process.argv[2], process.argv[3], () => {
    console.log("Base-122 encoded file written to " + process.argv[3]);
    process.exit(0);
});