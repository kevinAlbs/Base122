let fs = require('fs')
, http = require('http')
, currentImageIndex = 0
;

const url = 'http://unsplash.it/64?image='
, kNumImages = 1000
, kConcurrency = 8
;

function fetchImage() {
    if (currentImageIndex >= kNumImages) return;
    let index = currentImageIndex++;
    console.log('Fetching image ' + index + '/' + kNumImages);
    http.get(url + index, (res) => {
        let imageData = Buffer.alloc(0);
        res.on('data', (chunk) => { imageData = Buffer.concat([imageData, chunk]); });
        res.on('end', () => {
            fs.writeFile('img/' + index + '.png', imageData);
            fetchImage();
        });
    });
}

// Each fetchImage will act as a separate thread fetching images.
for (let i = 0; i < kConcurrency; i++) fetchImage();