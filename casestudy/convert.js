let fs = require('fs')
;

const kNumImages = 1000
, kImgDir = 'img/'
;

for (let index = 0; index < kNumImages; index++) {
    console.log("Processing " + index);
    fs.renameSync(kImgDir + index + '.png', 'imgRenamed/' + index + '.jpg');
}