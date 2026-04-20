const cache = {};

function setCache(key, data, ttl = 60000) {
    cache[key] = {
        data,
        expiry: Date.now() + ttl
    };
}

function getCache(key) {
    const item = cache[key];

    if (!item) return null;

    if (Date.now() > item.expiry) {
        delete cache[key];
        return null;
    }

    return item.data;
}

module.exports = { setCache, getCache };