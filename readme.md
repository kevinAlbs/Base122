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
for more informatin (w)

2 bytes: 110zzzww 01wwwwww (15 bits of information encoded in 16)

Since the optimization with the 2 byte UTF-8 characters gives us a better ratio, it begs the
question of whether a smaller base will give us better overall compression since this will
only occur with small probability. A rough and likely incorrect formula for compression ratio is:

(x / 128) * 7 / 8 + ((128 - x) / 128) * (7 + 11 - ceil(log_2(128 - x))) / 16

Explanation:

x / 128 = probability of encoding in one byte
7 / 8 = compression ratio for one byte

(128 - x)/128 = probability of encoding in two bytes
7 + 11 - ceil(log_2(128 - x)) / 16 = compression ratio for two bytes

Briefly graphing this on my calculator gave me 122.11 as a maximum, so it seems decent.


Implementation Notes
--------------------
btoa() => converts binary string to base64 (ascii). This string has UTF-16 codepoints with values between 0x00 and 0xFF to represent bytes. Groups bits in groups of 6, maps to table, produces character.
atob() => takes base64 ascii and spits out string.

I think I need to first group my data by bytes and put this into a string, then call btoa().

How do I get my data into a string?

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

- It seems like TextEncoding than TextDecoding does not preserve the bits...

References:
Difference between unicode code points (just a number) and the physical encoding (utf-8, ascii, ...)
http://www.joelonsoftware.com/articles/Unicode.html

Javascript String Encoding
https://mathiasbynens.be/notes/javascript-encoding

TODO
----
Consider how to best support both string and numeric arrays in decode function but also allow
easy transition to web-only version, and also get test coverage from unit tests.

Perf test:
JSPerf/BenchmarkJS to test:
1. Using a plain array and casting to Uint8Array vs. using a string and concatenating

Currently I think we are incorrectly assuming codepoints are 1 byte each. Codepoints give two bytes
if it is a two byte character. This may actually simplify the decode code. However, before I get
into this, I should really confirm that I can reconstruct from base123 from a file.


Minimal path to release
-----------------------
- Remove 'base64' dependency in favor of using native Buffer.from(base64string, 'base64')
- Finish encodeFile
- Clean up API, add comments, etc.
- Add more base64 image test cases.
- Do a fair perf test in a web page of base64 vs base123. (Is there an approximate function of 
transfer rate as a function of data size.)
- Add a case study of an image rich page before and after.
- Finish blog post.