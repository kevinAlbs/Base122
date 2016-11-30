// Provides functions for encoding/decoding data to and from base-122.

let fs = require('fs')
, readline = require('readline')
;

const kString = 0
, kUint8Array = 1
, kDefaultMimeType = "image/jpeg"
, kDebug = false
, kIllegals = [
    0 // null
    , 10 // newline
    , 13 // carriage return
    , 34 // double quote
    , 38 // ampersand
    , 92 // backslash
]
, kShortened = 0b111 // Uses the illegal index to signify the last two-byte char encodes <= 7 bits.
;

/**
 * Encodes raw data into base-122.
 * @param {Uint8Array|Buffer|Array|String} rawData - The data to be encoded. This can be an array
 * or Buffer with raw data bytes or a string of bytes (i.e. the type of argument to btoa())
 * @returns {Array} The base-122 encoded data as a regular array of UTF-8 character byte values.
 */
function encode(rawData) {
    let dataType = typeof(rawData) == 'string' ? kString : kUint8Array
    , curIndex = 0
    , curBit = 0 // Points to current bit needed
    , curMask = 0b10000000
    , outData = []
    , getByte = dataType == kString ? i => rawData.codePointAt(i) : i => rawData[i]
    ;

    // Get seven bits of input data. Returns false if there is no input left.
    function get7() {
        if (curIndex >= rawData.length) return false;
        // Shift, mask, unshift to get first part.
        let firstByte = getByte(curIndex);
        let firstPart = ((0b11111110 >>> curBit) & firstByte) << curBit;
        // Align it to a seven bit chunk.
        firstPart >>= 1;
        // Check if we need to go to the next byte for more bits.
        curBit += 7;
        if (curBit < 8) return firstPart; // Do not need next byte.
        curBit -= 8;
        curIndex++;
        // Now we want bits [0..curBit] of the next byte if it exists.
        if (curIndex >= rawData.length) return firstPart;
        let secondByte = getByte(curIndex);
        let secondPart = ((0xFF00 >>> curBit) & secondByte) & 0xFF;
        // Align it.
        secondPart >>= 8 - curBit;
        return firstPart | secondPart;
    }

    while(true) {
        // Grab 7 bits.
        let bits = get7();
        if (bits === false) break;
        debugLog('Seven input bits', print7Bits(bits), bits);

        let illegalIndex = kIllegals.indexOf(bits);
        if (illegalIndex != -1) {
            // Since this will be a two-byte character, get the next chunk of seven bits.
            let nextBits = get7();
            debugLog('Handle illegal sequence', print7Bits(bits), print7Bits(nextBits));

            let b1 = 0b11000010, b2 = 0b10000000;
            if (nextBits === false) {
                debugLog('Last seven bits are an illegal sequence.');
                b1 |= (0b111 & kShortened) << 2
                nextBits = bits; // Encode these bits after the shortened signifier.
            } else {
                b1 |= (0b111 & illegalIndex) << 2;
            }

            // Push first bit onto first byte, remaining 6 onto second.
            let firstBit = (nextBits & 0b01000000) > 0 ? 1 : 0;
            b1 |= firstBit;
            b2 |= nextBits & 0b00111111;
            outData.push(b1);
            outData.push(b2);
        } else {
            outData.push(bits);
        }
    }
    return outData;
}

/**
 * Re-encodes an HTML or text file with base-64 data to one with base-122 data.
 * @param {String} inpath - The filepath of the input file.
 * @param {String} outpath - The filepath of the output file.
 * @param {Object} options
 * @param {Boolean} options.html - Parse the input file as HTML and re-encode base64 data URIs.
 * @param {Boolean} options.addDecoder - If HTML, insert the minified decoder before </body>.
 * @param {Function} callback - Called upon completion.
 */
function encodeFile(inpath, outpath, options, callback) {
    let inStream = fs.createReadStream(inpath, {encoding: 'utf8'});
    let outStream = fs.createWriteStream(outpath, {defaultEncoding: 'utf8'});
    let decoderScript = options.addDecoder ? fs.readFileSync('decode.min.js') : '';

    outStream.on('error', () => { throw 'Error writing to ' + outpath; });
    inStream.on('error', () => { throw 'Error reading from ' + inpath; });

    if (!options.html) {
        // This is a plain base-64 encoded file.
        let fileContents = "";
        inStream.on('data', (chunk) => { fileContents += chunk; });
        inStream.on('end', () => {
            let encoded = encodeFromBase64(fileContents);
            let encodedStr = String.fromCharCode(...encoded);
            outStream.end(encodedStr, 'binary', callback);
        });
        return;
    }

    let rl = readline.createInterface({ input: inStream });
    rl.on('line', (line) => {
        let regexp = /src=[\"\']data:(.*);base64,(.*?)[\"\']/ig;
        let bodyRegExp = /<\/body>/i;
        let results;
        let prevIndex = 0;
        while ((results = regexp.exec(line)) !== null) {
            outStream.write(line.substring(prevIndex, results.index));
            let mimetype = results[1];
            let encoded = encodeFromBase64(results[2]);
            let encodedStr = String.fromCharCode(...encoded);
            outStream.write('data-b122="');
            outStream.write(encodedStr, 'binary');
            outStream.write('"');
            if (mimetype != kDefaultMimeType) outStream.write(' data-b122m="' + mimetype + '"');
            prevIndex = regexp.lastIndex;
        }
        if (options.addDecoder) {
            // Check for </body> to insert decoder.
            if ((results = bodyRegExp.exec(line)) != null) {
                // </body> cannot be valid if it's before any data URI.
                if (results.index >= prevIndex) {
                    outStream.write(line.substring(0, results.index) + '<script>' + decoderScript
                        + '</script>');
                    prevIndex = results.index;
                }
            }
        }
        outStream.write(line.substring(prevIndex) + "\n");
    });

    rl.on('close', () => {
        outStream.end('', callback);
    });
}

/**
 * Re-encodes a base-64 encoded string into base-122.
 * @param {String} base64String - A base-64 encoded string.
 * @returns {Array} - The base-122 encoded data.
 */
function encodeFromBase64(base64String) {
    // "binary" encoding encodes each byte in a separate character.
    let strData = Buffer.from(base64String, 'base64').toString('binary');
    return encode(strData);
}

/**
 * Decodes base-122 encoded data back to the original data.
 * @param {Uint8Array|Buffer|String} rawData - The data to be decoded. This can be a Uint8Array
 * or Buffer with raw data bytes or a string of bytes (i.e. the type of argument to btoa())
 * @returns {Array} The data in a regular array representing byte values.
 */
function decode(base122Data) {
    let strData = typeof(base122Data) == 'string' ? base122Data : utf8DataToString(base122Data)
    , decoded = []
    , decodedIndex = 0
    , curByte = 0
    , bitOfByte = 0
    ;

    function push7(byte) {
        byte <<= 1;
        // Align this byte to offset for current byte.
        curByte |= (byte >>> bitOfByte);
        bitOfByte += 7;
        if (bitOfByte >= 8) {
            decoded.push(curByte);
            bitOfByte -= 8;
            // Now, take the remainder, left shift by what has been taken.
            curByte = (byte << (7 - bitOfByte)) & 255;
        }
    }

    for (let i = 0; i < strData.length; i++) {
        let c = strData.charCodeAt(i);
        // Check if this is a two-byte character.
        if (c > 127) {
            // Note, the charCodeAt will give the codePoint, thus
            // 0b110xxxxx 0b10yyyyyy will give => xxxxxyyyyyy
            let illegalIndex = (c >>> 8) & 7; // 7 = 0b111.
            // We have to first check if this is a shortened two-byte character, i.e. if it only
            // encodes <= 7 bits.
            if (illegalIndex != kShortened) push7(kIllegals[illegalIndex]);
            // Always push the rest.
            push7(c & 127);
        } else {
            // One byte characters can be pushed directly.
            push7(c);
        }
    }
    return decoded;
}


/**
 * Converts a sequence of UTF-8 bytes to a string.
 * @param {Uint8Array|Buffer} data - The UTF-8 data.
 * @returns {String} A string with each character representing a code point.
 */
function utf8DataToString(data) {
    return Buffer.from(data).toString('utf-8');
}

// For debugging.
function debugLog() {
    if (kDebug) console.log(...arguments);
}

// For debugging.
function print7Bits(num) {
    return "0000000".substring(num.toString(2).length) + num.toString(2);
}

// For debugging.
function print8Bits(num) {
    return "00000000".substring(num.toString(2).length) + num.toString(2);
}

module.exports = {
    encode: encode,
    decode: decode,
    encodeFromBase64: encodeFromBase64,
    encodeFile: encodeFile,
    utf8DataToString: utf8DataToString
};
