Compact Data URI
================

The goal is to improve the base64 data URI by using the ASCII characters that base64 neglects.

Existing Work
-------------
[Base91](http://base91.sourceforge.net/) implementation encodes 13-14 bit sequences in two 91 bit
characters. 91^2 = 8281 and 2^13 = 8192, so there is some room 8281-8192=89. The algorithm is:
Take 13 bits, if the value is < 88, than it is safe to consume an additional bit, since 2^13 + 88 <
8281. The final encoding uses ASCII characters
0xxxxxxx 0xxxxxxx with final values mapped from original data to a character table.

Two 91 bit characters can encode 13 bits, saving 1 bit for every 16 bits of input as opposed to
base64. The decoder is also probably a bit simpler.

Approach
--------

Based on quick testing (modern Edge, Chrome, Firefox, and IE) it seems like it is safe to pass
123 of the ASCII characters, excluding newline, double quote, carriage return, backslash, and null
character. However, null character seems fine to pass, but sublime text renders the HTML file as
a binary file.

This proposes to encode at least 7 bits per byte, improving base64 by 1 bit per byte and improving
base91 by about .5 bits per byte.

To handle values that appear outside of the base, i.e. numbers 124-127, I'm proposing to use two
byte UTF-8 characters to encode the 7 bits and consume additional information.

UTF-8 Encoding scheme
---------------------

If the 7 bits (x) are less than 123, map to our character table (y), and
encode the result.

1 byte: 0yyyyyyy (7 bits of information encoded in 8)

If the 7 bits are greater than or equal to 123 (123, 124, 125, 126, 127), encode the difference
128 - number in the first 3 bits (z) of a UTF-8 two byte character, and use the remaining bits
bits (w) to encode 7 additional bits.

2 bytes: 110zzz1w 01wwwwww (14 bits of information encoded in 16)

Therefore, we always maintain the 7:8 ratio regardless of whether we use the UTF-8 two byte or one
byte characters.

Implementation Notes
--------------------
btoa() => converts binary string to base64 (ascii). This string has UTF-16 codepoints with values between 0x00 and 0xFF to represent bytes. Groups bits in groups of 6, maps to table, produces character.
atob() => takes base64 ascii and spits out string.

Use URL.createObjectURL to avoid recreating in Base64! Now this avoids as much of a performance hit
of rencoding/decoding!

Consider using DataView perhaps for different endianness:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView


Things learned
--------------
- % 8 chop-off is ok when variable amount is <= 7, in general for base b, adding something < b will
not change a digit by more than one.

I.e. if I'm decoding a string which is a multiple of 8 bits and has potentially 7 extra bits,
chopping will save me.

- Order of operations for bitwise operators really matters.
data[curIndex] & curMask > 0 ? 1 : 0;
is not the same as
(data[curIndex] & curMask) > 0 ? 1 : 0;

- Copy paste does not always preserve UTF-8 characters in sublime!

- TextEncoding than TextDecoding does not preserve the bits if using invalid chars (as expected)

References
----------
Difference between unicode code points (just a number) and the physical encoding (utf-8, ascii, ...)
http://www.joelonsoftware.com/articles/Unicode.html

Javascript String Encoding
https://mathiasbynens.be/notes/javascript-encoding

Has a table comparing gzip compressed and non-gzip compressed
http://davidbcalhoun.com/2011/when-to-base64-encode-images-and-when-not-to/

Bug
---
Oh boy.

Problem #1: Why does TextDecoder(bytes) followed by TextEncoder(string) sometimes not return the original bytes?
Problem #2: Why does getCodePoint() in JS not give back the raw UTF-8 bytes?

After hasty research [1], [3], problem #1 seemed to be caused by invalid two-byte UTF-8 byte sequences, which I did not know existed. 
This file confirms that as long as the first byte is 0b110xxx1x and above, these are all valid. One bit lost is actually not bad,
as I can compensate by changing my somewhat arbitary ending flag for a single header byte at the front of the string.

Problem #2 is really two issues. The first, naively, was assuming that getCodePoint() returned the full UTF-8
encoding string, i.e. 0b110xxxxx 0b10xxxxxx with the 0b110 and 0b10 included. However, since the codepoint is just
the bits that are really encoded (the x's) getCodePoint will return those bits concatenated. However, this may make
decoding easier!

The second issue to this is that some bytes were invalid bytes caused by problem #1, giving incorrect results on top of my
incorrect assumptions.

Before scrapping encode and decode, modify the python script to write a string of sequential valid UTF-8 characters. Then, simply
reread the string in the browser to ensure the codepoints are what we expect. My remaining concern, from [2].

I may also want to read [4,5] to ensure I'm not misunderstanding anything.

[1] https://en.wikipedia.org/wiki/UTF-8 See the section on the codepage layout. Notice how some sections of two-byte sequences
are invalid.

[2] http://ecmanaut.blogspot.com/2006/07/encoding-decoding-utf8-in-javascript.html Using decodeURIComponent to convert from
UTF-8 to JS string. Mathias' comment only applies to three byte UTF-8 strings.

[3] https://tools.ietf.org/html/rfc3629#page-5 Gives a layout of valid UTF-8 strings.

[4] https://mathiasbynens.be/notes/javascript-escapes Mathias' post.

[5] https://en.wikipedia.org/wiki/Byte_order_mark BOM


Minimal path to release
-----------------------
- Clean up API, add comments, etc.
- Do a fair perf test in a web page of base64 vs base123. (Is there an approximate function of
transfer rate as a function of data size.). Use JSPerf
- Do a fair storage size test when gzip considered. original vs base64 vs base123
- Add a case study of an image rich page before and after.
    - Test performance on firefox
    - Test with gzip
- Rename everything to base122
- Add option to encodeFile to include decoder before </body>
- Consider adding an NPM package
- Finish blog post
- Rewrite this readme