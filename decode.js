// A base-122 decoder meant to run inside an HTML page on page load.
//
// To use, copy the decode.min.js file in a <script> tag inside the encoded HTML page. To minify the
// decoder again (if changes are made), use uglifyjs, or use the command provided in this package:
// npm run-script minify

(function() {
    // Given an HTML element with a data-b122 (and optional data-b122m) attribute, sets the src
    // to a blob URL of the represented data.
    function decode(el) {
        var strData = el.dataset.b122
        , mime = el.dataset.b122m || 'image/jpeg'
        , kIllegals = [
            0 // null
            , 10 // newline                
            , 13 // carriage return
            , 34 // double quote
            , 38 // ampersand
            , 92 // backslash
        ]
        // 1.75 = 14 / 8, which is the worse case data per char, even excluding the header.
        , decoded = new Uint8Array(1.75 * strData.length | 0) // | 0 is a terse way to round down
        , decodedIndex = 0
        , curByte = 0
        , bitOfByte = 0
        , header = strData.charCodeAt(0)
        ;

        function push7(byte) {
            byte <<= 1;
            // Align this byte to offset for current byte.
            curByte |= (byte >>> bitOfByte);
            bitOfByte += 7;
            if (bitOfByte >= 8) {
                decoded[decodedIndex++] = curByte;
                bitOfByte -= 8;
                // Now, take the remainder, left shift by what has been taken.
                curByte = (byte << (7 - bitOfByte)) & 255;
            }
        }
        
        for (var i = 1; i < strData.length; i++) {
            var c = strData.charCodeAt(i);
            // Check if this is a two-byte character.
            if (c > 127) {
                // Note, the charCodeAt will give the codePoint, thus
                // 0b110xxxxx 0b10yyyyyy will give => xxxxxyyyyyy
                push7(kIllegals[(c >>> 8) & 7]); // 7 = 0b111.
                // Push the remainder if this is not the last character or if the header says to.
                // 64 = 0b01000000, is the flag of the header bit.
                if (i != strData.length - 1 || !(header & 64)) push7(c & 127);
            } else {
                // One byte characters can be pushed directly.
                push7(c);
            }
        }
        el.src = URL.createObjectURL(
            new Blob([new Uint8Array(decoded, 0, decodedIndex)], {type: mime}));
    }

    var list = document.querySelectorAll('[data-b122]');
    for (var i = 0; i < list.length; i++) decode(list[i]);
}());