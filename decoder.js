// This is a copy of the NodeJS version of the decode function adorned functionality for the web.
// Include this function in HTML pages with base123 encoding.
function decode(base123) {
    // This function will push the last 7 bits of the given byte onto the current array,
    // which contains the numeric values of all bytes.
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
    var arr = [];
    var decoded = [];
    var curByte = 0;
    var bitOfByte = 0;
    // TextEncoder() is not very cross-browser. TODO: see if using String.codePointAt is easier to implement.
    // var arr = new TextEncoder().encode(base123String);
    var arr = typeof(base123) == "object" ? new Uint8Array(base123) : new TextDecoder().decode(atob(base123));
    // Now arr is an array of numbers representing raw binary of characters.
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] & 0x80) {
            // 2 byte character.            
            var specialIndex = (arr[i] & 0x1C) >>> 2;
            // Since we're using Uint8Arrays, left shifting should cut off.
            var b1 = (arr[i] & 0x1) << 6;
            var b2 = arr[i+1] & 0x3F;

            push7(specials[specialIndex]);

            var remainder = b1 | b2;
            // Check if ending bit is set, if so, ignore remainder.
            if (arr[i] & 0x02) {
            } else {
                push7(remainder);
            }
            i++;
        } else {
            // Regular ascii.
            push7(arr[i])
        }
    }
    return decoded;
}