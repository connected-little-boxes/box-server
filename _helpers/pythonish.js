function wrapPythonIshCode(input) {
    // Makes sure that the p

    // Work internally with \n line endings
    let s = String(input).replace(/\r\n?/g, "\n");

    // 1) Ensure it starts with "begin\n" (case-insensitive)
    if (!/^begin\n/i.test(s)) {
        s = "begin\n" + s;
    }

    // 2) Ensure it ends with "\nend\n" (case-insensitive)
    //    Also, if it ends with "end" (no trailing newline), add one.
    if (!/\nend\n$/i.test(s)) {
        if (/end$/i.test(s)) {
            // ends with "end" but not "\n" — add one
            s += "\n";
        }
        if (!/\nend\n$/i.test(s)) {
            // still not correct; append the full terminator
            if (!/\n$/.test(s)) s += "\n";
            s += "end\n";
        }
    }

    return s+"run\n";
}

module.exports = wrapPythonIshCode;
