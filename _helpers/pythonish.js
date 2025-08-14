function wrapPythonIshCode(codeText) {
    let code = `\r\n*RH\r\n*RC\r\*RM\r\nbegin\r\n${codeText}\r\nend\r\n*RX\r\n*RS\r\n`;
    return code;
}

module.exports = wrapPythonIshCode;
