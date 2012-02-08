// every module calling caches with this id ("my-cache") will
// get the same store and will have access to the same items
var mycache = require("../lib/caches")("my-cache", "memcache");

// you can use a Date object instead of a Number
// to define expiration time
mycache.ready(function () {
	mycache.set("myfile1", "my data 1", 3); // expires after 3 seconds
	mycache.set("myfile2", "my data 2", 6); // expires after 6 seconds
	mycache.set("myfile3", "my data 3", null); // never expires
});

// check in 1 second
setTimeout(function () {
	// calling get with only one item ID means data
	// will be the actual item value instead of an
	// object like in this example
	mycache.get("myfile1", "myfile2", "myfile3", function (err, data) {
		console.log("FIRST TRY");
		console.log("error:", err);
		console.log("data:", data);
	});
}, 1000);

// check in 4 seconds
setTimeout(function () {
	mycache.get("myfile1", "myfile2", "myfile3", function (err, data) {
		console.log("SECOND TRY");
		console.log("error:", err);
		console.log("data:", data);
	});

	// this will prevent this item from expiring between
	// this setTimeout() and the next one..
	mycache.refresh("myfile2", 8); // refresh expiration to 8 seconds from now
}, 4000);

// check in 8 seconds
setTimeout(function () {
	mycache.get("myfile1", "myfile2", "myfile3", function (err, data) {
		console.log("THIRD TRY");
		console.log("error:", err);
		console.log("data:", data);
	});
}, 8000);

// check in 15 seconds
setTimeout(function () {
	mycache.get("myfile1", "myfile2", "myfile3", function (err, data) {
		// you will only see myfile3 because all others expired
		// and myfile3 never expires
		console.log("FORTH TRY");
		console.log("error:", err);
		console.log("data:", data);
	});
}, 15000);