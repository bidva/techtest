"use strict";

var assert = require("chai").assert;
var Database = require('../src/Database.js');

describe("Database functions", function() {
	var user1 = { id:1, name:'joe', email:'joe@gmail.com', groups:[1] };
	var user2 = { id:2, name:'joe Blow', email:'joe.blow@example.com', groups:[1, 2] };

	var schemas = {
		users: { id:1, name:'', email:'', groups:[] },
		groups: { id:1, name:'' },
	}

	describe("get", function() {
		var database = new Database(schemas, {
			users: [user1, user2],
			groups: [
				{ id:1, name:'The Joes' },
				{ id:2, name:'The Blows' },
			],
		});

		it("should return the right data when looking for an id", function(done) {
			database.get('users', { id:1 }).then(function(results) {
				assert.isArray(results);

				// returns immuable object
				assert.notEqual(results[0], user1);
				// returns the right object
				assert.deepEqual(results[0], user1);

				// returns only one object
				assert.lengthOf(results, 1);

				done();
			}).catch(done);
		});

		it("should return the right data when looking for a relation", function(done) {
			database.get('users', { groups:[1] }).then(function(results) {
				assert.isArray(results);

				// returns immuable object
				assert.notEqual(results[0], user1);
				assert.notEqual(results[1], user2);
				// returns the right object
				assert.deepEqual(results[0], user1);
				assert.deepEqual(results[1], user2);

				// returns only one object
				assert.lengthOf(results, 2);

				done();
			}).catch(done);
		});
	});

	describe("set", function() {
		it("should add a new user", function(done) {
			var database = new Database(schemas, {
				users: [user1],
			});

			var newUser = { name: 'Georges' };
			database.set('users', newUser).then(function(inserted) {
				// returns immuable object
				assert.notOk(newUser.id);
				// returns the right object
				assert.equal(inserted.name, newUser.name);
				assert.isDefined(inserted.email);

				return database.get('users', newUser).then(function(foundUsers) {
					var foundUser = foundUsers[0];

					// returns immuable object
					assert.notEqual(inserted, foundUser);
					// returns the right object
					assert.deepEqual(inserted, foundUser);
					assert.equal(foundUser.name, newUser.name);

					done();
				});
			}).catch(done);
		});

		it("should edit a user", function(done) {
			var database = new Database(schemas, {
				users: [user1],
			});

			var newInfo = { name: 'Georges' };
			database.set('users', newInfo, user1.id).then(function(updated) {
				// returns immuable object
				assert.notDeepEqual(updated, newInfo);
				assert.notOk(newInfo.id);
				// returns the right object
				assert.equal(updated.name, newInfo.name);

				return database.get('users', { id:user1.id }).then(function(foundUsers) {
					var foundUser = foundUsers[0];

					// returns immuable object
					assert.notEqual(updated, foundUser);
					// returns the right object
					assert.deepEqual(updated, foundUser);
					assert.equal(foundUser.name, newInfo.name);

					done();
				});
			}).catch(done);
		});
	});

	describe("remove", function() {
		it("should remove a user", function(done) {
			var database = new Database(schemas, {
				users: [user1],
			});

			database.remove('users', user1.id).then(function() {
				return database.get('users').then(function(foundUsers) {
					assert.lengthOf(foundUsers, 0);
					done();
				});
			}).catch(done);
		});
	});

});
