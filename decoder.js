// This is a copy of the NodeJS version of the decode function adorned functionality for the web.
// Include this function in HTML pages with base123 encoding.
let specials = [
    0 // null
    , 10 // newline                
    , 13 // carriage return
    , 34 // double quote
    , 92 // backslash
]
, kHeader = 0b00001111 // Enforce odd and greater than 13 to avoid special chars.
, kShortened = 0b01000000
;
// Bitwise order of operations (according to MDN)
// ~ << >> >>> & ^ |
// Subtraction (-) comes before all.
// Base for web function.
function decodeString(strData) {
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
    }
    
    for (var i = 1; i < strData.length; i++) {
        let c = strData.charCodeAt(i);

        // Check for a leading 1 bit, indicating a two-byte character.
        if (c > 127) {
            // Note, the charCodeAt will give the codePoint, thus
            // 0b110xxxxx 0b10yyyyyy will give => xxxxxyyyyyy
            
            var specialIndex = c >>> 8 & 7; // 7 = 0b111. Note, >>> precedes &
            push7(specials[specialIndex]);

            // Skip the remainder only if this is the last character and the header says so.
            if (i == strData.length - 1 && (header & kShortened)) continue;
            push7(c & 0x7F); // Note order of operations.
        } else {
            // Regular ascii.
            push7(c);
        }
    }
    return decoded;
}


function decode(el) {
    var str = el.dataset.b123;
    var mime = el.dataset.b123m || 'image/png';
    inflated = new Uint8Array(decodeString(str));
    var blob = new Blob([inflated], {type: mime});
    console.log(blob);
    var url = URL.createObjectURL(blob);
    el.src = url;
}

document.querySelectorAll('[data-b123]').forEach(el => decode(el));