module.exports = function getMatchingBracket(source, start) {
    let match = source.substring(
        0, start + 1
    ).split("").reverse().join("").match(
        /[\(\{\[]/
    );
    if (!match) {
        return undefined;
    }
    const startIndex = start - match.index;
    const expectedClosing = [];
    let escaped = false;
    for (let i = startIndex; i < source.length; i++) {
        const char = source[i];

        if (escaped) {
            escaped = false;
            continue;
        }
        if (char === "\\") {
            escaped = true;
            continue;
        }

        if (char === "(") {
            expectedClosing.push(")");
            continue;
        }
        if (char === "[") {
            expectedClosing.push("]");
            continue;
        }
        if (char === "{") {
            expectedClosing.push("}");
            continue;
        }

        if (char.match(/[\)\}\]]/)) {
            const expected = expectedClosing.pop();
            if (char !== expected) {
                return undefined;
            }

            if (expectedClosing.length === 0) {
                return i;
            }
            continue;
        }
    }

    return undefined;
}