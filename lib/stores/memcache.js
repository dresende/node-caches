var Memcached = require("memcached");

module.exports = MemcacheStore;

function MemcacheStore(opts) {
	if (!opts.hasOwnProperty("locations")) {
		opts.locations = "127.0.0.1:11211";
	}
	var memcached = new Memcached(opts.locations),
	    store = {};

	memcached.connect(opts.locations, function () {
		if (typeof store.ready == "function") {
			store.ready(store);
		}
	});

	return store = {
		set: function (key, value, expire, cb) {
			memcached.set(key, value, (expire !== null ? expire - Date.now() : 0), cb);
		},
		get: function (key, cb) {
			memcached.get(key, function (err, val) {
				if (err || val === false) {
					return cb(err);
				}

				return cb(null, new Buffer(val));
			});
		},
		refresh: function (key, expire) {
			memcached.get(key, function (err, value) {
				memcached.set(key, value, (expire ? expire - Date.now() : 0));
			});
		}
	};
}