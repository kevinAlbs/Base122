let fs = require('fs')
, http = require('http')
, numImagesLeft = 1000
, currentImageIndex = 0
;

const url = 'http://unsplash.it/64?image='
, kConcurrency = 8
;

function fetchImage() {
    if (numImagesLeft <= 0) return;
    let index = currentImageIndex++;
    console.log('Fetching image at id=' + index + ', ' + numImagesLeft + ' left');
    http.get(url + index, (res) => {
        if (res.statusCode != 200) {
            // Skip.
            fetchImage();
            return;
        }
        let imageData = Buffer.alloc(0);
        res.on('data', (chunk) => { imageData = Buffer.concat([imageData, chunk]); });
        res.on('end', () => {
            if (numImagesLeft <= 0) return;
            numImagesLeft--;
            fs.writeFile('img/' + numImagesLeft + '.jpg', imageData);
            fetchImage();
        });
    });
}

// Each fetchImage will act as a separate thread fetching images.
for (let i = 0; i < kConcurrency; i++) fetchImage();