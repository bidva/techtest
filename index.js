"use strict";

var Database = require('./src/Database.js');

var schemas = {
	users: { id:1, name:'', email:'', groups:[] },
	groups: { id:1, name:'' },
};

var database = new Database(schemas, {
	users: [
		{ id:1, name:'joe', email:'joe@gmail.com', groups:[1] },
		{ id:2, name:'joe Blow', email:'joe.blow@example.com', groups:[1, 2] },
	],
	groups: [
		{ id:1, name:'The Joes' },
		{ id:2, name:'The Blows' },
	],
});

var ApplicationFactory = require('./src/ApplicationFactory.js');

var app = ApplicationFactory(require('express')(), database);
app.set('port', 12345);
app.listen(app.get('port'), function() {
	console.log("Express Rest server listening on port " + app.get('port'));
});
