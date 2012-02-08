var util = require("util");

module.exports = MemoryStore;

function MemoryStore(opts) {
	var store = {}, expires = {},
	    checkTimerId = null, memstore,
	    prepareLocked = false;

	if (typeof opts == "undefined") {
		opts = {};
	}
	if (!opts.hasOwnProperty("defaultExpire")) {
		opts.defaultExpire = 60;
	}

	function prepareExpireCheck() {
		var next = null;

		for (k in expires) {
			if (next === null) {
				next = expires[k];
			} else if (next > expires[k]) {
				next = expires[k];
			}
		}

		if (next !== null) {
			if (checkTimerId !== null) {
				clearTimeout(checkTimerId);
			}
			checkTimerId = setTimeout(clearExpiredItems, next - Date.now() + 1000);

			prepareLocked = true;
			setTimeout(function () {
				prepareLocked = false;
			}, 1000);
		}
	}

	function clearExpiredItems() {
		var dt = Date.now();

		for (k in expires) {
			if (expires[k] <= dt) {
				delete expires[k];
				delete store[k];
			}
		}

		prepareExpireCheck();
	}

	return memstore = {
		set: function (key, value, expire, cb) {
			store[key] = Buffer.isBuffer(value) ? value : new Buffer(value);
			if (expire !== null) {
				expires[key] = (util.isDate(expire) ? expire.getTime() : Date.now() + (expire * 1000));
			}

			!prepareLocked && prepareExpireCheck();

			typeof cb == "function" && cb(null);

			return this;
		},
		get: function () {
			if (arguments.length == 0) {
				throw new Error("Missing key (optional) and callback");
			}

			var keys = Array.prototype.slice.apply(arguments),
			    cb = keys.pop(),
			    values = {};

			if (typeof cb != "function") {
				throw new Error("Invalid or missing callback");
			}

			if (keys.length == 0) {
				return cb(new Error("Missing keys"));
			}

			if (keys.length == 1) {
				if (!store.hasOwnProperty(keys[0])) {
					return cb(new Error("Key not found"));
				}

				return cb(null, store[keys[0]]);
			}

			keys.forEach(function (key) {
				if (store.hasOwnProperty(key)) {
					values[key] = store[key];
				}
			});

			cb(null, values);

			return this;
		},
		getSet: function (key, getcb, setcb) {
			if (!store.hasOwnProperty(key)) {
				setcb(key, function (value, expire) {
					memstore.set(key, value, expire, function () {
						getcb(value);
					});
				});
				return;
			}

			getcb(store[key]);

			return this;
		},
		refresh: function () {
			var keys = Array.prototype.slice.apply(arguments),
			    expire = keys.pop();

			if (util.isDate(expire)) {
				expire = expire.getTime();
			} else if (typeof expire == "number") {
				expire = Date.now() + (expire * 1000);
			} else {
				keys.push(expire);

				expire = Date.now() + (opts.defaultExpire * 1000);
			}

			keys.forEach(function (key) {
				if (expires.hasOwnProperty(key)) {
					expires[key] = expire;
				}
			});

			return this;
		}
	};
}