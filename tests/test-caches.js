var vows = require("vows"),
    assert = require("assert"),
    Cache = require("../lib/caches");

vows.describe("caches").addBatch({
	"a cache manager": {
		topic: new Cache("test"),
		"should have methods defined": function (cache) {
			assert.isObject(cache);
			assert.isFunction(cache.get);
			assert.isFunction(cache.set);
			assert.isFunction(cache.refresh);
			assert.isFunction(cache.getSet);
			assert.isFunction(cache.ready);
		}
	}
}).export(module);
