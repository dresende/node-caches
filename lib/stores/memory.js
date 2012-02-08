module.exports = MemoryStore;

function MemoryStore(opts) {
	var store = {}, expires = {},
	    checkTimerId = null,
	    prepareLocked = false;

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

	return {
		set: function (key, value, expire, cb) {
			store[key] = Buffer.isBuffer(value) ? value : new Buffer(value);
			if (expire !== null) {
				expires[key] = expire;
			}

			!prepareLocked && prepareExpireCheck();

			return cb(null);
		},
		get: function (key, cb) {
			if (!store.hasOwnProperty(key)) {
				return cb(new Error("Key not found"));
			}

			return cb(null, store[key]);
		},
		refresh: function (key, expire) {
			if (store.hasOwnProperty(key)) {
				expires[key] = expire;
			}
		},
		ready: true
	};
}