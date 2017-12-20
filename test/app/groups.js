"use strict";

var request = require("supertest");
var assert = require("chai").assert;
var Database = require('../../src/Database.js');
var ApplicationFactory = require('../../src/ApplicationFactory.js');
var express = require('express');
var _ = require('lodash');

describe("/groups", function() {
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

	var group1EagerLoaded = _.assign({}, group1, { users:[user1, user2] });
	var group2EagerLoaded = _.assign({}, group2, { users:[user2] });

	var getNewApp = function() {
		return ApplicationFactory(express(), new Database(schemas, _.cloneDeep(defaultDatabase)));
	};

	describe("GET", function() {
		it("should return all groups with their users", function(done) {
			request(getNewApp())
				.get("/groups")
				.end(function(err, res) {
					if (err) return done(err);

					assert.isArray(res.body);

					assert.sameDeepMembers(res.body, [group1EagerLoaded, group2EagerLoaded])

					done();
				});
		});

		it("should return 1 group with its users", function(done) {
			request(getNewApp())
				.get("/groups/" + group1.id)
				.end(function(err, res) {
					if (err) return done(err);

					assert.isObject(res.body);

					assert.deepEqual(res.body, group1EagerLoaded)

					done();
				});
		});

		it("should return a 404 for inexisting groups", function(done) {
			request(getNewApp())
				.get("/groups/12345")
				.expect(404)
				.end(function(err) {
					if (err) return done(err);

					done();
				});
		});
	});

	describe("POST", function() {
		it("should create a new group", function(done) {
			var newGroup = { name:'Charlie' };
			var app = getNewApp();
			request(app)
				.post("/groups")
				.send(newGroup)
				.end(function(err, res) {
					if (err) return done(err);

					assert.equal(res.body.name, newGroup.name);

					app.database.get('groups', newGroup).then(function(groups) {
						assert.ok(groups[0]);
						assert.equal(groups[0].name, newGroup.name);

						done();
					}).catch(done);
				});
		});
	});

	describe("PUT", function() {
		it("should update an existing group", function(done) {
			var newAttributes = { name:'Charlie' };
			var app = getNewApp();
			request(app)
				.put("/groups/" + group1.id)
				.send(newAttributes)
				.end(function(err, res) {
					if (err) return done(err);

					assert.equal(res.body.name, newAttributes.name);
					assert.deepEqual(res.body, _.assign({}, group1EagerLoaded, newAttributes));

					app.database.get('groups', { id:group1.id }).then(function(groups) {
						assert.ok(groups[0]);
						assert.deepEqual(groups[0], _.assign({}, group1, newAttributes));

						done();
					}).catch(done);
				});
		});
	});

	describe("DELETE", function() {
		it("should delete an existing group", function(done) {
			var app = getNewApp();
			request(app)
				.delete("/groups/" + group1.id)
				.end(function(err, res) {
					if (err) return done(err);

					app.database.get('groups', { id:group1.id }).then(function(groups) {
						assert.lengthOf(groups, 0);

						return app.database.get('users', { groups:[group1.id] }).then(function(usersInGroup) {
							assert.lengthOf(usersInGroup, 0);
							done();
						});
					}).catch(done);
				});
		});
	});

	//
	// Relations
	//

	describe("POST users", function() {
		it("should add an existing user to an existing group", function(done) {
			var app = getNewApp();
			request(app)
				.post("/groups/" + group2.id + "/users")
				.send(user1)
				.end(function(err, res) {
					if (err) return done(err);

					assert.deepEqual(res.body, _.assign({}, group2EagerLoaded, {
						users: [
							_.assign({}, user1, { groups:[group1.id, group2.id] }),
							user2,
						]
					}));

					app.database.get('users', { id:user1.id }).then(function(users) {
						assert.sameDeepMembers(users[0].groups, [group1.id, group2.id]);

						done();
					}).catch(done);
				});
		});
	});

	describe("DELETE users", function() {
		it("should remove an existing user of an existing group", function(done) {
			var app = getNewApp();
			request(app)
				.delete("/groups/" + group1.id + "/users/" + user1.id)
				.expect(200)
				.end(function(err, res) {
					if (err) return done(err);

					app.database.get('users', { id:user1.id }).then(function(users) {
						assert.sameDeepMembers(users[0].groups, []);

						done();
					}).catch(done);
				});
		});
	});

});
