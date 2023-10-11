var logActive = [true];

function tinyLog() {

    let output = "";

    if (arguments.length == 1) {
        if (arguments[0] == "*OFF*") {
            logActive = false;
            return;
        }
        if (arguments[0] == "*ON*") {
            logActive = true;
            return;
        }
    }

    if (!logActive) {
        return;
    }

    for (let i = 0; i < arguments.length; i++) {
        output += String(arguments[i]);
        console.log(output);
    }
}

module.exports = tinyLog;
