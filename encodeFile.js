let base123 = require('./base123')
;
function help() {
    console.log("Base-123 File Encoder");
    console.log("Usage: node encodeFile.js input-file.html output-file.html");
}

if (process.argv.length < 3 || process.argv[2].match(/^(\-h|\-\-help)$/i)) {
    help();
    process.exit(0);
} else if (process.argv.length != 4) {
    help();
    process.exit(1);
}

base123.encodeFile(process.argv[2], process.argv[3], () => {
    console.log("Base-123 encoded file written to " + process.argv[3]);
    process.exit(0);
});