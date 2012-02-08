var fs = require("fs"),
    ids = {};

module.exports = Caches;

loadStores();

function Caches(id, store) {
	if (typeof store == "undefined") {
		store = Caches.defaultStore;
	}
	if (!Caches.stores.hasOwnProperty(store)) {
		throw new Error("Unknown store");
	}

	id = store + ":" + id;
	if (!ids.hasOwnProperty(id)) {
		ids[id] = new Caches.stores[store]();
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