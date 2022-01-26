require("regexp-match-indices/shim")();

const convertSourcePatternToPathRegExp = require("./convertSourcePatternToPathRegExp");
const getMatchingBracket = require("./getMatchingBracket");

module.exports = function getCorresponingGroups(source, glob) {
    if (glob.indexOf("/**/") >= 0) {
        throw new Error("Can't use multiple folder match");
    }

    const regex = convertSourcePatternToPathRegExp("", glob);

    const match = regex.exec(source);
    if (!match) {
        return undefined;
    }

    const { indices } = match;

    const result = [];
    let previousGroupLength = 0;
    for (let i = 1; i < indices.length; i++) {
        const [ start, end ] = indices[i] || [];
        if (start === undefined) {
            result.push(undefined);
            continue;
        }

        let group = glob.substring(
            start + previousGroupLength
        );
        if (
            group.match(/^[?@!+*]\(/)
        ) {
            const endIndex = getMatchingBracket(group, 1);
            if (endIndex === undefined) {
                result.push(undefined);
                continue;
            }

            group = group.substring(0, endIndex + 1);
        } else if (group.startsWith("*")) {
            group = "*";
        }
        result.push([
            match[i],
            group
        ]);
        previousGroupLength = (
            group.length - match[i].length
        );
    }

    return result;
}