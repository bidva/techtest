"use strict";

var bodyParser = require('body-parser');
var _ = require('lodash');

module.exports = function(app, database) {
	app.use(bodyParser.json());

	//
	// USERS
	//

	app.get('/users', function(req, res) {
		database.get('users').then(function(users) {
			database.get('groups').then(groups => {
				users.forEach(function(user) {
					let newGroups=_(groups)
  					.indexBy('id')
  					.at(user.groups)
  					.value();
					user.groups = newGroups;
				})
				res.send(users);
			})
		})
	});

	app.get('/users/:id', function(req, res) {
		database.get('users', { id:Number(req.params.id) }).then(function(users) {
			if (typeof (users[0]) === 'undefined') {
				res.status(404).send('Not found');
			}else{
				database.get('groups').then(groups => {
					let newGroups=_(groups)
	  					.indexBy('id')
	  					.at(users[0].groups)
	  					.value();
	  			users[0].groups = newGroups
					res.send(users[0]);
				})
			};
			})
	});

	app.post('/users', (req, res) => {
    database.set('users', req.body).then(function(user) {
			res.send(user);
		});
  });

  app.put('/users/:id', (req, res) => {
  	let userId = Number(req.params.id);
    database.set('users', req.body,userId).then(function(user) {
    	database.get('groups').then(groups => {
			let newGroups=_(groups)
  					.indexBy('id')
  					.at(user.groups)
  					.value();
  			user.groups = newGroups
				res.send(user);
			})
		});
  });

  app.delete('/users/:id', function(req, res) {
		let userId = Number(req.params.id);
		database.remove('users', { id:userId }).then(function() {
			res.sendStatus(200);
		});
	});

	//
	// GROUPS
	//
	app.get('/groups', function(req, res) {
		let groups = database.get('groups');
		let users = database.get('users');
		Promise.all([groups, users]).then(values => {
			values[0].forEach(function(group) { 
				group.users = _.filter(values[1], { groups: [group.id] });
			});
  		res.send(values[0])
		});
	});

	app.get('/groups/:id', function(req, res) {
		database.get('groups', { id:Number(req.params.id) }).then(function(groups) {
			database.get('users').then(users => {
				if (typeof (groups[0]) === 'undefined') {
				res.status(404).send('Not found');
			}else{
				groups[0].users=_.filter(users, { groups: [groups[0].id] })
				res.send(groups[0]);	
			}	
			})
		});
	});	
	app.post('/groups', (req, res) => {
    database.set('groups', req.body).then(function(group) {
			res.send(group);
		});
  });

  app.post('/groups/:groupId/users', (req, res) => {
  	let groupId = Number(req.params.groupId);
  	req.body.groups.push(groupId)
    database.set('users', req.body,req.body.id).then(function() {
    	database.get('groups', { id:Number(groupId) }).then(function(groups){
    		database.get('users').then(users => {
					groups[0].users=_.filter(users, { groups: [groupId] })
					res.send(groups[0]);
    		})
    	})
		});
  });

  app.put('/groups/:id', (req, res) => {
  	let groupId = Number(req.params.id);
    database.set('groups', req.body,groupId).then(function(group) {
    	database.get('users').then(users => {
				group.users=_.filter(users, { groups: [group.id] })
				res.send(group);
			})
		});
  });

	app.delete('/groups/:id', function(req, res) {
		let groupId = Number(req.params.id);
		let group = database.get('users', { groups:[Number(req.params.id)] }).then(function(users){
			let userIds =  _(users)
  			.map('id')
  			.value()
  		let promises = []
			userIds.forEach(function(userId) {
				promises.push(database.remove('users', { id:userId }));
			})
			Promise.all(promises).then(function(){
							database.remove('groups', { id:groupId }).then(function() {
				res.sendStatus(200);
			});
			})
		})
	});

	app.delete('/groups/:groupId/users/:userId', function(req, res) {
		let groupId = Number(req.params.groupId);
		let userId = Number(req.params.userId);
		console.log(groupId)
		console.log(userId)
		database.get('users', { id:userId}).then(function(user){
			user.groups = _.filter(user.groups,groupId )
			database.set('users', user,userId).then(function(user) {
				res.send(user);
			})
		})
	});

	// for test purposes
	app.database = database;
	return app;
};
