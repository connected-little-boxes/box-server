const qrcode = require('qrcode');

function generateQRCode(data) {
    return new Promise((kept, broken) => {
        qrcode.toDataURL(data, function (err, url) {
            if (err) {
                broken(err);
            }
            else {
                kept(url);
            }
        });
    });
}

module.exports = generateQRCode;
