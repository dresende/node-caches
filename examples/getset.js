var myserver = require("../lib/caches")("myserver_stuff"),
    http = require("http"),
    server = http.createServer(handleRequest)
                 .listen(1337, serverStarted);

function serverStarted() {
	console.log("Go to http://localhost:1337/some_url");
}

function handleRequest(req, res) {
	myserver.getSet(req.url, function (data) {
		console.log("getting %s from cache", req.url);
		res.end(data);
	}, function (key, cb) {
		// item no in cache, let's create it (key is actually the url)
		console.log("adding %s to cache", key);

		return cb("Cached data for " + key, 3); // expire in 3 seconds
	});
}