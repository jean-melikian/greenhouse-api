/**
 * Created by ozone on 06/07/2017.
 */

var supertest = require('supertest')
	, should = require('should')
	, app = require('../app')
	, server = supertest.agent(app);

describe("Server launch test", function () {
	it("should return json", function (done) {
		server.get("/sensors")
			.expect("Content-type", /application\/json/)
			.expect(200, done)
	});
	it("should return 201 CREATED", function(done) {
		server.post("/sensors", {"hygrometer": "999", "luminosity": "1024"})
			.expect("Content-type", /application\/json/)
			.expect(201, done)
		});
});
