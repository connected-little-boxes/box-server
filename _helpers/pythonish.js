function wrapPythonIshCode(codeText) {
    let code = `\r\npythonish\r\nbegin\r\n${codeText}\r\nend\r\nsave "active.txt"\r\nload "active.txt"\r\nexit\r\n`;
    return code;
}

module.exports = wrapPythonIshCode;
