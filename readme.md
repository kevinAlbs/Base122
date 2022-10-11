# Base-122 Encoding #
A space efficient UTF-8 binary-to-text encoding created as an alternative to base-64 in data URIs. Base-122 is ~14% smaller than equivalent base-64 encoded data. Details of motivation and implementation can be found on [this article](http://blog.kevinalbs.com/base122).

Base-122 is currently an experimental encoding, and may undergo changes.

## Basic Usage ##
Base-122 encoding produces UTF-8 characters, but encodes more bits per byte than base-64.
```javascript
let base122 = require('./base122');
let inputData = require('fs').readFileSync('example.jpg')
let base64Encoded = inputData.toString('base64');
let base122Encoded = Buffer.from(base122.encode(inputData), 'utf8');

console.log("Original size = " + inputData.length); // Original size = 1429
console.log("Base-64 size = " + base64Encoded.length); // Base-64 size = 1908
console.log("Base-122 size = " + base122Encoded.length); // Base-122 size = 1635
console.log("Saved " + (base64Encoded.length - base122Encoded.length) + " bytes") // Saved 273 bytes
```

Note, even though base-122 produces valid UTF-8 characters, control characters aren't always preserved when copy pasting. Therefore, encodings should be saved to files through scripts, not copy-pasting. Here is an example of saving base-122 to a file:
```javascript
let base122 = require('./base122'), fs = require('fs');
let encodedData = base122.encode([0b01101100, 0b11110000]);
fs.writeFileSync('encoded.txt', Buffer.from(encodedData), {encoding: 'utf-8'});
```
And to decode a base-122 encoded file:
```javascript
let base122 = require('./base122'), fs = require('fs');
let fileData = fs.readFileSync('encoded.txt', {encoding: 'utf-8'});
let decodedData = base122.decode(fileData);
```

## Using in Web Pages ##
Base-122 was created with the web in mind as an alternative to base-64 in data URIs. However, as explained in [this article](http://blog.kevinalbs.com/base122), base-122 is <i>not recommended</i> to be used in web pages. Base-64 compresses better than base-122 with gzip, and there is a performance penalty of decoding. However, the web decoder is still included in this repository as a proof-of-concept.
</blockquote>

The script encodeFile.js is used as a convenience to re-encode base-64 data URIs from an HTML file into base-122.
Suppose you have a base-64 encoded image in the file `example.html` as follows:
```html
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body>
    <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wgARCABAAEADASIAAhEBAxEB/8QAGwAAAwEAAwEAAAAAAAAAAAAAAgQFAwABBwb/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH03tUhvpURrqbmVwmEeVUx0H1F2Roebiab6BzCQ6POQ6gzmpWJFN2efDMTTGt09ivuahWOcZ//xAAgEAACAgICAgMAAAAAAAAAAAACAwABBBIREwUhFCIz/9oACAEBAAEFAuZzOZtN5vOam1TebzeWdVLyVwstNT5C53hKe+yU4jhbBLaXNjc1Hc7UNtMBmwLFTrMbd1iqylWUMhKmLW2XhDSlsHqr8R0ZPsoBtV3m8ioHtqZJEsBIqAW0MLIKonPyahPPKbqfYPuZgbFbIJ+jZtEHrGEZUlrKYfkmnBzN7KDfFbXUWVXaLX1NNQ3ju1jyQVf/xAAUEQEAAAAAAAAAAAAAAAAAAABA/9oACAEDAQE/AQf/xAAUEQEAAAAAAAAAAAAAAAAAAABA/9oACAECAQE/AQf/xAAsEAABAwMBBgQHAAAAAAAAAAABAAIREiExIgMQMkFRYRMjcZEwM2JygaGx/9oACAEBAAY/Avh3IXEuML5jfdcbfdaSVTS6vsgCdR5SuDaInH7WpsrWtBYV3hOIAkWEqk88TdAsNzzRL3ymm0fSpo9iqnNv6oUCrrIVUGG80Bl56Knwtp+VFLgSmDZVZWb/AGoPrZULwolCaqVo8v8Aq5PHogTFkzAMY6q7VgkbsbrWKY5oLR1Q2wN22QqvCii/ffjc1xyOq8qpqccg8iFbZmexX//EACAQAQACAgIDAQEBAAAAAAAAAAEAESExQVFhcYGRsdH/2gAIAQEAAT8h9oZbhLTiUlGPdGB6z5nxBLAeYFyZQ3n6l+f0pDh/NK0rwxK1rQpfogwUsKBB4xuIVrwigcS/cKAR6OI+4HNLxC2qtGdwGnnFs1+7bBOEJo8RiNR5qp5k2Fe4XVBzsjTOZOsHvZS0S9OGY/2WK3EAf7N1+1D11K9DTPwmgZj24uz/AGOLEpiR06hoZXlZsO5hd2dZRrKb2x8mS4K8dxLf7Xv6gwyByZl6DHHEQTuWrCMi/UVt6NVKih0ZYZ7DcNqosWwa6wduYXEbQ/kAZhDgxNwN2xFDY5Bx8i4Jv7EGp881VP/aAAwDAQACAAMAAAAQ48AQocYogYQw8wks/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAwEBPxAH/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAgEBPxAH/8QAJRABAQACAgICAQQDAAAAAAAAAREAITFBYYFRcZGhscHREOHx/9oACAEBAAE/ELXZc5C3B8rg9jiIrT1gqA+9YM4XPkfp/jCyt7GedtKYiNPuMzaAqAFcBgEWaP3Y82fpv5whWuuBytDmRuXOodKOZTd+cb421wPG/wCckzcw6PnVMAggjWBDYTduP4psU/V4xRdiqKuqcv4zpLF83etTHZmwLtUSPZ3h6mQYg7Nt/wCYYTQmjRuF47wmlq5ke9bywDAyijpL8T8ZydQaKhCiz6wvlGERWU71Mh634Rny6Uxvdh3g54jxOJiS6hxfT9uLhawWowu4NemJ0Q0KV5xM5HoALv8AP7YdFuGrfsFycbgcpu70/wCsKDqCtvxmpUb6gpX43MlhCAz0bV4MvigFhHsN45XDAiKpn0frhHC7geRAqyHPjKoI9gNehx2EggXT1j+pyGfGRQHGr7x0r0msWFcV3P7/ALxYepTu6buzrG4wB2SS66DHNZ46PL9HNyZBMRKNh+MLGqbwJSF57YAIeU3idMCqa5xThyDanSX6zbFXkT8rkPDcLTjx+22H35xRJaj+kRz/2Q==" />
</body>
</html>
```

This can be re-encoded to base-122 using the following:
```shell
node encodeFile.js --html example.html example-base122.html
```
This produces the file `example-base122.html`
```html
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body>
    <img data-b122="v~ J#(` m@0 @0ƆA``@( ƅ!PPq `0ƅBaPtJʆd1`X, 21R*F#ri@Z( %I#[`8ƄB0P(ҨʅCρ P(ƅA P(ƅA P(ƅA P(ƅA P(ƅA P(ƅA P(ƅGBÈ@D@?| ¶à  A`o~À 4à S=UoRQʺMf+B0GJTcP>Q;Py֦MzLGN!j9TVngOCMk:=E>s(+8g| À@    ΰ)(Ι{   Pf9MS<oj6Tofy3U%r+BeS)yg<O>dSD8-Ai9Xn5sZC6L1)kmnXU2JY!H%Җ[2x!RK0=*~hd}Jí+^7HT[)I(m*DsyB<yӵ0>s˅6 OhlmXaTK,Srӎ^e>Zu.hZ}Ӎ!^m1r U| ¨À~hÀ`   |q D ?{  À'pDÁ@@8΢   DDHң8d҃  ePl?}PÀãxpw֥cyF}kFo]4I*4]/YT<R֍Q c{-ӥ5VA0W<DÈX%)<ӴC9sί>)S4>JM1*N6*ƂW,BUyP^=ǏBmJE`lU2Y_p(-JBx(J U%4<_p.'GQY@cU.j`Hnc:kƱfA4:Pm@nmH*^Ɣ/o_Fs.G*y*M' y+63b_qÀÀ À EQ0ְˇ#mH>h2n    4qJ{Q@zgf>%@<`.Ҩ7Oj/gz)yRZ+aDVZh)?ΆƂFDWB    ?8(G}`9RxBm*hg8O-M?;6pB4<#j5)s0W֗*HiN2:`{lRhKiaL?lXVqv7/m!uj+h4gpML=֮g|ãEDS    NPh2^+9Bw3V(ko6p+c֥_v^(2IL^AG;K+2uǭt5)(Pt2aO0n˕Ϣlʺ`vsb!~ 0CADn;1ƍG8|E`M~bSsfU'4àPqEasK| ¨À~hÀ` | q D ?{  À'qD΀À ҔQ8d4ΐp|?}PÀxBkY9dp>+AvΕSkP^Xa9yi+=F<viґʟ8f6@*`4?;S?N+.ևPsלu%2Mog˸mWq_prҷ:)@ FX6    ]ֿEƿ+cƗ1*:SK|3R,/Mo-ҝLlm(H{pzLADfm@ PMʍa<;a-.2zoà2EI?   |3IjE!,eǥuV~geiқnaoOxN    (8_'vq8-0-#n^L'΍sDgt?`}X:pjolIc8)]o'|,P+7qM%#>P)/c9I0BO#5<_ƀX#lcJp`ΕҾGuaևH@UH9xe(vWPqliuGzN!OFπ8j}qi/$k8W9~@ECj)ntnv:c8`2$]:kt9׌ADQX?S<Rg[)^S*5gƸ95~Y[Ǟοdˡ4qq}[0}|qΥT?Rg2" />
</body>
</html>
```

The file [decode.min.js](decode.min.js) is a 469 byte decoder that can be included in web pages with base-122 encoded data. This can be copied into a base-122 encoded file, which will query the DOM for elements with the "data-b122" attribute. Passing the "--addDecoder" flag will automatically include it:
```shell
node encodeFile.js --html --add-decoder example.html example-base122.html
```
Will now produce the file with the decoder:
```html
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body>
    <img data-b122="v~ J#(` m@0 @0ƆA``@( ƅ!PPq `0ƅBaPtJʆd1`X, 21R*F#ri@Z( %I#[`8ƄB0P(ҨʅCρ P(ƅA P(ƅA P(ƅA P(ƅA P(ƅA P(ƅA P(ƅGBÈ@D@?| ¶à  A`o~À 4à S=UoRQʺMf+B0GJTcP>Q;Py֦MzLGN!j9TVngOCMk:=E>s(+8g| À@    ΰ)(Ι{   Pf9MS<oj6Tofy3U%r+BeS)yg<O>dSD8-Ai9Xn5sZC6L1)kmnXU2JY!H%Җ[2x!RK0=*~hd}Jí+^7HT[)I(m*DsyB<yӵ0>s˅6 OhlmXaTK,Srӎ^e>Zu.hZ}Ӎ!^m1r U| ¨À~hÀ`   |q D ?{  À'pDÁ@@8΢   DDHң8d҃  ePl?}PÀãxpw֥cyF}kFo]4I*4]/YT<R֍Q c{-ӥ5VA0W<DÈX%)<ӴC9sί>)S4>JM1*N6*ƂW,BUyP^=ǏBmJE`lU2Y_p(-JBx(J U%4<_p.'GQY@cU.j`Hnc:kƱfA4:Pm@nmH*^Ɣ/o_Fs.G*y*M' y+63b_qÀÀ À EQ0ְˇ#mH>h2n    4qJ{Q@zgf>%@<`.Ҩ7Oj/gz)yRZ+aDVZh)?ΆƂFDWB    ?8(G}`9RxBm*hg8O-M?;6pB4<#j5)s0W֗*HiN2:`{lRhKiaL?lXVqv7/m!uj+h4gpML=֮g|ãEDS    NPh2^+9Bw3V(ko6p+c֥_v^(2IL^AG;K+2uǭt5)(Pt2aO0n˕Ϣlʺ`vsb!~ 0CADn;1ƍG8|E`M~bSsfU'4àPqEasK| ¨À~hÀ` | q D ?{  À'qD΀À ҔQ8d4ΐp|?}PÀxBkY9dp>+AvΕSkP^Xa9yi+=F<viґʟ8f6@*`4?;S?N+.ևPsלu%2Mog˸mWq_prҷ:)@ FX6    ]ֿEƿ+cƗ1*:SK|3R,/Mo-ҝLlm(H{pzLADfm@ PMʍa<;a-.2zoà2EI?   |3IjE!,eǥuV~geiқnaoOxN    (8_'vq8-0-#n^L'΍sDgt?`}X:pjolIc8)]o'|,P+7qM%#>P)/c9I0BO#5<_ƀX#lcJp`ΕҾGuaևH@UH9xe(vWPqliuGzN!OFπ8j}qi/$k8W9~@ECj)ntnv:c8`2$]:kt9׌ADQX?S<Rg[)^S*5gƸ95~Y[Ǟοdˡ4qq}[0}|qΥT?Rg2" />
<script>!function(){function e(e){function t(e){e<<=1,l|=e>>>i,i+=7,i>=8&&(c[o++]=l,i-=8,l=e<<7-i&255)}for(var a=e.dataset.b122,n=e.dataset.b122m||"image/jpeg",r=[0,10,13,34,38,92],c=new Uint8Array(1.75*a.length|0),o=0,l=0,i=0,f=0;f<a.length;f++){var b=a.charCodeAt(f);if(b>127){var d=b>>>8&7;7!=d&&t(r[d]),t(127&b)}else t(b)}e.src=URL.createObjectURL(new Blob([new Uint8Array(c,0,o)],{type:n}))}for(var t=document.querySelectorAll("[data-b122]"),a=0;a<t.length;a++)e(t[a])}();</script></body>
</html>
```

## Development ##
If contributing changes to encoder/decoder functions, first run the tests with `npm test`. Note that there are two slightly different forms of the decoder function. [base122.js](base122.js) contains a decoder function for the NodeJS implementation, while [decode.js](decode.js) contains the decoder function with slight changes to run in the browser. Run `npm run-script minify` to minify [decode.js](decode.js) into [decode.min.js](decode.min.js).

## Other Implementations ##
- C: https://github.com/kevinAlbs/libbase122
