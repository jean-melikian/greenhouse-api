/**
 * Created by ozone on 06/07/2017.
 */

var supertest = require('supertest')
	, should = require('should')
	, server = supertest.agent("http://localhost:9001");

describe("Server launch test", function () {
	it("should return every entries", function (done) {
		server.get("/sensors")
			.expect("Content-type", "application/json")
			.expect(200)
			.end(function (err, res) {
				res.status.should.equal(200);
				done()
			});
	});
});
