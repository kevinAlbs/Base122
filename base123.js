let base64 = require('base-64')
, specials = [
    0 // null
    , 10 // newline                
    , 13 // carriage return
    , 34 // double quote
    , 92 // backslash
];

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
}

function decode(rawData) {
    let decoded = [];
    let curByte = 0;
    let bitOfByte = 0;

    function push7(byte) {
        byte = byte << 1;
        // Align this byte to offset for current byte.
        curByte = curByte | (byte >>> bitOfByte);
        bitOfByte += 7;
        if (bitOfByte >= 8) {
            decoded.push(curByte);
            bitOfByte %= 8;
            // Now, take the remainder, left shift by what has been taken.
            curByte = (byte << (7 - bitOfByte)) & 0xFF;
        }
    }

    let dataType = typeof(rawData) == 'string' ? kString : kUint8Array;
    
    // Now arr is an array of numbers representing raw binary of characters.
    for (var i = 0; i < rawData.length; i++) {
        if (rawData[i] & 0b10000000) {
            // 2 byte character.
            debugLog('Two byte code', rawData[i].toString(2), rawData[i+1].toString(2));
            
            var specialIndex = (rawData[i] & 0b00011100) >>> 2;
            debugLog('Special index', specialIndex, specialIndex.toString(2));

            // Since we're using Uint8Arrays, left shifting should cut off. TODO: not true if str.
            var b1 = (rawData[i] & 0b00000001) << 6;
            var b2 = rawData[i+1] & 0b00111111;
            debugLog('Special inflated to ', specials[specialIndex].toString(2));

            push7(specials[specialIndex]);

            var remainder = b1 | b2;
            debugLog('Remainder', remainder, remainder.toString(2));
            // Check if ending bit is set, if so, ignore remainder.
            if (rawData[i] & 0b00000010) {
                debugLog('Ending bit set, not adding remainder');
            } else {
                push7(remainder);
            }
            i++;
        } else {
            // Regular ascii.
            debugLog('Adding', rawData[i], rawData[i].toString(2));
            push7(rawData[i])
        }
    }
    return decoded;
}

module.exports = {
    encode: encode,
    decode: decode,
    encodeFile: encodeFile
};