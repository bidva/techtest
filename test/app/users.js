"use strict";

var request = require("supertest");
var assert = require("chai").assert;
var Database = require('../../src/Database.js');
var ApplicationFactory = require('../../src/ApplicationFactory.js');
var express = require('express');
var _ = require('lodash');

describe("/users", function() {
	var user1 = { id:1, name:'joe', email:'joe@gmail.com', groups:[1] };
	var user2 = { id:2, name:'joe Blow', email:'joe.blow@example.com', groups:[1, 2] };

	var group1 = { id:1, name:'The Joes' };
	var group2 = { id:2, name:'The Blows' };

	var defaultDatabase = {
		users: [user1, user2],
		groups: [group1, group2],
	};
	var schemas = {
		users: { id:1, name:'', email:'', groups:[] },
		groups: { id:1, name:'' },
	}

	var user1EagerLoaded = _.assign({}, user1, { groups:[group1] });
	var user2EagerLoaded = _.assign({}, user2, { groups:[group1, group2] });

	var getNewApp = function() {
		return ApplicationFactory(express(), new Database(schemas, _.cloneDeep(defaultDatabase)));
	};

	describe("GET", function() {
		it("should return all users with their groups", function(done) {
			request(getNewApp())
				.get("/users")
				.end(function(err, res) {
					if (err) return done(err);

					assert.isArray(res.body);

					assert.sameDeepMembers(res.body, [user1EagerLoaded, user2EagerLoaded])

					done();
				});
		});

		it("should return 1 user with its groups", function(done) {
			request(getNewApp())
				.get("/users/" + user1.id)
				.end(function(err, res) {
					if (err) return done(err);

					assert.isObject(res.body);

					assert.deepEqual(res.body, user1EagerLoaded)

					done();
				});
		});

		it("should return a 404 for inexisting users", function(done) {
			request(getNewApp())
				.get("/users/12345")
				.expect(404)
				.end(function(err) {
					if (err) return done(err);

					done();
				});
		});
	});

	describe("POST", function() {
		it("should create a new user", function(done) {
			var newUser = { name:'Charlie' };
			var app = getNewApp();
			request(app)
				.post("/users")
				.send(newUser)
				.end(function(err, res) {
					if (err) return done(err);

					assert.equal(res.body.name, newUser.name);

					app.database.get('users', newUser).then(function(users) {
						assert.ok(users[0]);
						assert.equal(users[0].name, newUser.name);

						done();
					}).catch(done);
				});
		});
	});

	describe("PUT", function() {
		it("should update an existing user", function(done) {
			var newAttributes = { name:'Charlie' };
			var app = getNewApp();
			request(app)
				.put("/users/" + user1.id)
				.send(newAttributes)
				.end(function(err, res) {
					if (err) return done(err);

					assert.equal(res.body.name, newAttributes.name);
					assert.deepEqual(res.body, _.assign({}, user1EagerLoaded, newAttributes));

					app.database.get('users', { id:user1.id }).then(function(users) {
						assert.ok(users[0]);
						assert.deepEqual(users[0], _.assign({}, user1, newAttributes));

						done();
					}).catch(done);
				});
		});
	});

	describe("DELETE", function() {
		it("should delete an existing user", function(done) {
			var app = getNewApp();
			request(app)
				.delete("/users/" + user1.id)
				.end(function(err, res) {
					if (err) return done(err);

					app.database.get('users', { id:user1.id }).then(function(users) {
						assert.lengthOf(users, 0);

						done();
					}).catch(done);
				});
		});
	});

});
