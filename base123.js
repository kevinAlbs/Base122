// Read over https://github.com/mathiasbynens/base64 and maybe webkit implementation for ideas on
// performance improvements.

let base64 = require('base-64')
, fs = require('fs')
, specials = [
    0 // null
    , 10 // newline                
    , 13 // carriage return
    , 34 // double quote
    , 92 // backslash
];
let assert = require('assert');
const kDebug = false
, kString = 0
, kUint8Array = 1
;

function debugLog() {
    if (kDebug) console.log(...arguments);
}

function encodeFromBase64(base64String) {
    return encode(base64.decode(base64String));
}

// rawData may be a string (similar to btoa) or a Uint8Array. Returns a base123 encoded string.
function encode(rawData) {
    let dataType = typeof(rawData) == 'string' ? kString : kUint8Array;
    var curIndex = 0, curMask = 0b10000000, stringData = [];
    var bitsFound = 0;

    // Returns false when no more bits are left.            
    function getOne() {
        if (curIndex >= rawData.length) return false;
        let curByte = dataType == kString ? rawData.codePointAt(curIndex) : rawData[curIndex];
        bit = (curByte & curMask) > 0 ? 1 : 0;
        bitsFound++;

        curMask = curMask >>> 1;
        if (curMask == 0) {
            curIndex++;
            curMask = 0b10000000
        }
        return bit;
    }
    
    function get7() {
        if (curIndex >= rawData.length) return false;
        var b = 0;
        for (var i = 0; i < 7; i++) {
            b = b << 1;
            var bit = getOne();
            if (bit === false) continue; // Still want to return whatever we have, left shifted.
            b |= bit;
        }
        return b;
    }
    
    while(true) {
        // Grab 7 bits.
        var bits = get7();
        if (bits === false) break;

        var specialIndex = specials.indexOf(bits);
        if (specialIndex != -1) {
            debugLog('Special time for bits ', bits.toString(2), bits);
            var b1 = 0b11000000, b2 = 0b10000000;
            b1 |= (0b111 & specialIndex) << 2;
            // See if there are any bits after this special sequence.
            // If there are, then there can be a variable range of 7 bits in last bit of
            // special byte and remaining 6 in other.
            // Otherwise, there are a variable number of 7 in the special code. Either way,
            // % 8 should chop off the excess.
            var nextBits = get7();
            if (nextBits === false) {
                debugLog(' Special code contains the last 7ish bits.');
                b1 |= 0b11000010; // Turn on flag.
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
            debugLog(' Unicode character is ', b1.toString(2), b2.toString(2));
        } else {
            stringData.push(bits);
        }
    }
    return stringData;
}

function encodeFile(filepath) {
    // TODO.
    // POC
    let contents = fs.readFileSync(filepath, {encoding: 'utf-8'});
    let encoding = encode(base64.decode(contents));
    let encodingStr = String.fromCharCode(...encoding);
    fs.writeFileSync(filepath + '.base123', encodingStr, {encoding: 'binary'});
}

encodeFile('base64example.txt');


// Bitwise order of operations (according to MDN)
// ~ << >> >>> & ^ |
// Subtraction (-) comes before all.
// Base for web function.
function decodeString(strData) {
    let decoded = [];
    let curByte = 0;
    let bitOfByte = 0;

    // TODO: compact and optimize this function.
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
    
    for (var i = 0; i < strData.length; i++) {
        let c = strData.charCodeAt(i);
        let c2 = strData.charCodeAt(i+1); // charCodeAt returns NaN if out of range, which is fine.

        // Check for a leading 1 bit, indicating a two-byte character.
        if (c >>> 7) {
            debugLog('Two byte code', c.toString(2), c2.toString(2));
            
            var specialIndex = c >>> 2 & 7; // 7 = 0b111. Note, >>> precedes &
            debugLog(specialIndex);
            debugLog('Special index', specialIndex, specialIndex.toString(2));

            // Get the last bit of the first character.

            // Explanation
            /*
            var b1 = (c << 6) & 0b01000000;
            // Get the five bits stored in the second byte.
            var b2 = c2 & 0b00111111;
            var remainder = b1 | b2;

            // Only push if the ending flag bit is 0.
            if (c & 2) {}
            else push7(remainder);
            */

            debugLog('Special inflated to ', specials[specialIndex].toString(2));
            push7(specials[specialIndex]);

            if (~c & 2) push7(c << 6 & 64 | c2 & 63); // Note order of operations.
            else debugLog('Ending bit set, not adding remainder');
            i++;
        } else {
            // Regular ascii.
            debugLog('Adding', c, c.toString(2));
            push7(c);
        }
    }
    return decoded;
}

// TODO: DRY but inefficient. Prefer non-DRY.
function decode(rawData) {
    let dataType = typeof(rawData) == 'string' ? kString : kUint8Array;
    if (dataType == kUint8Array) return decodeString(String.fromCodePoint(...rawData));
    return decodeString(rawData);
}

module.exports = {
    encode: encode,
    decode: decode,
    encodeFile: encodeFile
};
