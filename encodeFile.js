let base122 = require('./base122')
;
function help() {
    console.log('================');
    console.log('Base-122 Encoder');
    console.log('================');
    console.log('Re-encodes a UTF-8 encoded file with base-64 data into base-122');
    console.log('Usage: node encodeFile.js [--html] [--add-decoder] <in_file> <out_file>');
    console.log('    --html Treats the input file as an HTML document. Replaces instances');
    console.log('           of base-64 data URIs');
    console.log('    --add-decoder If --html is passed, insert the decoder JS before </body>');
}

if (process.argv.length < 3 || process.argv[2].match(/^(\-h|\-\-help)$/i)) {
    help();
    process.exit(0);
} else if (process.argv.length < 4) {
    help();
    process.exit(1);
}

// Last two arguments are input and output file.
let inFile = process.argv[process.argv.length - 2]
, outFile = process.argv[process.argv.length - 1]
, html = false
, addDecoder = false
;

if (process.argv.length > 4) {
    for (let i = 2; i < process.argv.length - 2; i++) {
        if (process.argv[i] == '--html') html = true;
        else if (process.argv[i] == '--add-decoder') addDecoder = true;
        else {
            console.log('Unrecognized option ' + process.argv[i]);
            process.exit(1);
        }
    }
}

base122.encodeFile(inFile, outFile, { html: html, addDecoder: addDecoder }, () => {
    console.log('Base-122 encoded file written to ' + outFile);
    process.exit(0);
});