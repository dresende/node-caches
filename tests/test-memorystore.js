var vows = require("vows"),
    assert = require("assert"),
    memoryStore = require("../lib/stores/memory"),
    store = new memoryStore(),
    cache_key = "my-cache-key",
    cache_data = "my cache data";

vows.describe("memory store").addBatch({
	"adding a key that expires in 2 secs": {
		topic: function () {
			store.set(cache_key, cache_data, Date.now() + 2000, this.callback);
		},
		"should be ok": function () {
			store.get(cache_key, function (err, data) {
				assert.isNull(err);
				assert.equal(data, cache_data);
			});
		},
		"and after 3 secs": {
			topic: function () {
				var cb = this.callback;

				setTimeout(function () {
					store.get(cache_key, cb);
				}, 3000);
			},
			"should be gone": function (err, _) {
				assert.instanceOf(err, Error);
			}
		}
	}
}).addBatch({
	"adding a key that expires in 2 secs": {
		topic: function () {
			store.set(cache_key, cache_data, Date.now() + 2000, this.callback);
		},
		"and refreshing it more 4 secs": {
			topic: function () {
				store.refresh(cache_key, Date.now() + 4000);

				return true;
			},
			"after 3 secs": {
				topic: function () {
					var cb = this.callback;

					setTimeout(function () {
						store.get(cache_key, cb);
					}, 3000);
				},
				"should be there": function (err, data) {
					assert.isNull(err);
					assert.equal(data, cache_data);
				},
				"after 2 more secs": {
					topic: function () {
						var cb = this.callback;

						setTimeout(function () {
							store.get(cache_key, cb);
						}, 2000);
					},
					"should be gone": function (err, _) {
						assert.instanceOf(err, Error);
					}
				}
			}
		}
	}
}).export(module);
