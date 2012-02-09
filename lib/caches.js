var util = require("util"),
    fs = require("fs"),
    ids = {};

module.exports = Caches;

loadStores();

function Caches() {
	var id = null, store = undefined,
	    opts = {};

	for (var i = 0; i < arguments.length; i++) {
		switch (typeof arguments[i]) {
			case "object":
				opts = arguments[i];
				break;
			case "string":
				if (id === null) {
					id = arguments[i];
				} else {
					store = arguments[i];
				}
		}
	}

	if (id === null) {
		throw new Error("Missing cache id");
	}

	if (typeof store == "undefined") {
		store = Caches.defaultStore;
	}
	if (!Caches.stores.hasOwnProperty(store)) {
		throw new Error("Unknown store");
	}

	id = store + ":" + id;
	if (!ids.hasOwnProperty(id)) {
		ids[id] = extendStore(Caches.stores[store], opts);
	}

	return ids[id];
}

function loadStores() {
	Caches.stores = {};
	Caches.defaultStore = "memory";

	fs.readdirSync(__dirname + "/stores/").forEach(function (item) {
		if (!item.match(/\.js$/)) {
			return;
		}

		item = item.substr(0, item.length - 3);

		Caches.stores[item] = require("./stores/" + item);
	});
}

function extendStore(cacheStore, opts) {
	if (!opts.hasOwnProperty("expire")) {
		opts.expire = 60;
	}
	opts.expire *= 1000;

	var store = new cacheStore(opts);

	return {
		ready: function (cb) {
			if (store.ready === true) {
				return cb();
			}
			store.ready = cb;
		},
		set: function (key, value) {
			if (arguments.length < 3) {
				throw new Exception("Too few parameters");
			}
			var cb = arguments[arguments.length - 1],
			    expire = (arguments.length > 3 ? arguments[2] : undefined);

			if (typeof expire == "undefined") {
				expire = Date.now() + opts.expire;
			} else if (expire !== null) {
				expire = (util.isDate(expire) ? expire.getTime() : Date.now() + (expire * 1000));
			}

			store.set(key, value, expire, function (err) {
				typeof cb == "function" && cb(err);
			});

			return this;
		},
		get: function () {
			if (arguments.length == 0) {
				throw new Error("Missing key (optional) and callback");
			}

			var keys = Array.prototype.slice.apply(arguments),
			    cb = keys.pop(),
			    values = {}, total_keys = keys.length;

			if (typeof cb != "function") {
				throw new Error("Invalid or missing callback");
			}

			switch (total_keys) {
				case 0:
					return cb(new Error("Missing keys"));
				case 1:
					return store.get(keys[0], cb);
			}

			keys.forEach(function (key) {
				store.get(key, function (err, val) {
					if (!err && val) {
						values[key] = val;
					}
					total_keys -= 1;
					if (total_keys == 0) {
						return cb(null, values);
					}
				});
			});

			return this;
		},
		getSet: function (key, getcb, setcb) {
			this.get(key, function (err, value) {
				if (err) {
					setcb(key, function (value, expire) {
						if (value === null) {
							// nothing to cache
							return getcb(null);
						}
						store.set(key, value, expire, function () {
							getcb(value);
						});
					});
					return;
				}
				getcb(value);
			});
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
				store.refresh(key, expire);
			});

			return this;
		}
	};
}
