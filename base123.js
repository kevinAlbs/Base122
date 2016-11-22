// Provides functions for encoding/decoding data to and from base-123.

let fs = require('fs')
, readline = require('readline')
;

const kString = 0
, kUint8Array = 1
, kHeader = 0b00001111 // To avoid illegal characters, enforce odd and >13. TODO: improve.
, kShortened = 0b01000000
, kDefaultMimeType = "image/png"
, kDebug = false
, kIllegals = [
    0 // null
    , 10 // newline
    , 13 // carriage return
    , 34 // double quote
    , 38 // ampersand
    , 92 // backslash
]
;

/**
 * Encodes raw data into base-123.
 * @param {Uint8Array|Buffer|String} rawData - The data to be encoded. This can be a Uint8Array
 * or Buffer with raw data bytes or a string of bytes (i.e. the type of argument to btoa())
 * @returns {Uint8Array} The base-123 encoded data as a sequence of UTF-8 character bytes.
 */
function encode(rawData) {
    let dataType = typeof(rawData) == 'string' ? kString : kUint8Array
    , curIndex = 0
    , curMask = 0b10000000
    , header = kHeader
    , stringData = []
    ;

    // Returns false when no more bits are left.
    function getOne() {
        if (curIndex >= rawData.length) return false;
        let curByte = dataType == kString ? rawData.codePointAt(curIndex) : rawData[curIndex]; // TODO: Do not do this 7 times when once is necessary.
        bit = (curByte & curMask) > 0 ? 1 : 0;

        curMask = curMask >>> 1;
        if (curMask == 0) {
            curIndex++;
            curMask = 0b10000000
        }
        return bit;
    }
   
    // Get seven bits of input data. TODO: remove the use of getOne()
    function get7() {
        if (curIndex >= rawData.length) return false;
        var b = 0;
        for (var i = 0; i < 7; i++) {
            b = b << 1;
            var bit = getOne();
            if (bit === false) continue; // Still return whatever we have, left shifted.
            b |= bit;
        }
        return b;
    }

    while(true) {
        // Grab 7 bits.
        var bits = get7();
        if (bits === false) break;

        debugLog('Seven input bits are ', print7Bits(bits), bits);
        var illegalIndex = kIllegals.indexOf(bits);
        if (illegalIndex != -1) {
            debugLog('Special time for bits ', print7Bits(bits), bits);
            var b1 = 0b11000010, b2 = 0b10000000;
            b1 |= (0b111 & illegalIndex) << 2;
            // See if there are any bits after this special sequence.
            // If there are, then there can be a variable range of 7 bits in last bit of
            // special byte and remaining 6 in other.
            // Otherwise, there are a variable number of 7 in the special code. Either way,
            // % 8 should chop off the excess.
            var nextBits = get7();
            if (nextBits === false) {
                debugLog(' Special code contains the last 7ish bits.');
                header |= kShortened;
            } else {
                debugLog(' There are additional bits', nextBits.toString(2))
                // Push first bit onto first byte, remaining 6 onto second.
                var firstBit = (nextBits & 0b01000000) > 0 ? 1 : 0;
                debugLog(firstBit, nextBits.toString(2), nextBits & 0b01000000, b1.toString(2));
                b1 |= firstBit;
                debugLog(b1.toString(2));
                b2 |= nextBits & 0b00111111;
            }
            stringData.push(b1);
            stringData.push(b2);
        } else {
            stringData.push(bits);
        }
        
    }
    // Add header byte to front.
    stringData.unshift(header);
    return stringData;
}

/**
 * Re-encodes an HTML file with base-64 strings to one with base-123 strings.
 * @param {String} inpath - The filepath of the input file.
 * @param {String} outpath - The filepath of the output file.
 * @param {Function} callback - Called upon completion.
 */
function encodeFile(inpath, outpath, callback) {
    let inStream = fs.createReadStream(inpath, {encoding: 'utf8'});
    let outStream = fs.createWriteStream(outpath, {defaultEncoding: 'utf8'});

    outStream.on('error', () => { throw 'Error writing to ' + outpath; });
    inStream.on('error', () => { throw 'Error reading from ' + inpath; });

    let rl = readline.createInterface({ input: inStream });
    rl.on('line', (line) => {
        let regexp = /src=[\"\']data:(.*);base64,(.*?)[\"\']/ig;
        let results;
        let prevIndex = 0;
        while ((results = regexp.exec(line)) !== null) {
            outStream.write(line.substring(prevIndex, results.index));
            let mimetype = results[1];
            let encoded = encodeFromBase64(results[2]);
            let encodedStr = String.fromCharCode(...encoded);
            outStream.write('data-b123="');
            outStream.write(encodedStr, 'binary');
            outStream.write('"');
            if (mimetype != kDefaultMimeType) outStream.write(' data-b123m="' + mimetype + '"');
            prevIndex = regexp.lastIndex;
        }
        outStream.write(line.substring(prevIndex) + "\n");
    });
    
    rl.on('close', () => {
        inStream.close();
        outStream.close();
        if (callback) callback();
    });
}

/**
 * Re-encodes a base-64 encoded string into base-123.
 * @param {String} base64String - A base-64 encoded string.
 * @returns {Uint8Array} - The base-123 encoded data.
 */
function encodeFromBase64(base64String) {
    // "binary" encoding encodes each byte in a separate character.
    let strData = Buffer.from(base64String, 'base64').toString('binary');
    return encode(strData);
}

/**
 * Decodes base-123 encoded data back to the original data.
 * @param {Uint8Array|Buffer|String} rawData - The data to be decoded. This can be a Uint8Array
 * or Buffer with raw data bytes or a string of bytes (i.e. the type of argument to btoa())
 * @returns {Uint8Array} The base-123 encoded data as a sequence of UTF-8 character bytes.
 */
function decode(base123Data) {
    // TODO: make sure this matches web version as closely as possible
    let strData = base123Data;
    if (typeof(rawData) != 'string') strData = utf8DataToString(base123Data);
    // Bitwise order of operations (according to MDN)
    // ~ << >> >>> & ^ |
    // Subtraction (-) comes before all.
    // Base for web function.
    let decoded = [];
    let curByte = 0;
    let bitOfByte = 0;
    let header = strData.charCodeAt(0);

    function push7(byte) {
        byte <<= 1;
        // Align this byte to offset for current byte.
        curByte = curByte | byte >>> bitOfByte;
        // Explanation:
        bitOfByte += 7;
        if (bitOfByte >= 8) {
            decoded.push(curByte);
            bitOfByte -= 8;
            // Now, take the remainder, left shift by what has been taken.
            curByte = byte << 7 - bitOfByte & 255;
        }
        debugLog('Decoded[] = ', decoded);
    }
    
    for (var i = 1; i < strData.length; i++) {
        let c = strData.charCodeAt(i);

        // Check for a leading 1 bit, indicating a two-byte character.
        if (c > 127) {
            // Note, the charCodeAt will give the codePoint, thus
            // 0b110xxxxx 0b10yyyyyy will give => xxxxxyyyyyy
            debugLog('Two byte code', c.toString(2));
            
            var illegalIndex = c >>> 8 & 7; // 7 = 0b111. Note, >>> precedes &
            debugLog(illegalIndex);
            debugLog('Special index', illegalIndex, illegalIndex.toString(2));
            debugLog('Special inflated to ', kIllegals[illegalIndex].toString(2));
            push7(kIllegals[illegalIndex]);

            // Skip the remainder only if this is the last character and the header says so.
            if (i == strData.length - 1 && (header & kShortened)) continue;
            push7(c & 0x7F); // Note order of operations.
        } else {
            // Regular ascii.
            debugLog('Adding', c, c.toString(2));
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
