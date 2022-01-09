module.exports = function escapeRegExpSource(source) {
    return source.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};