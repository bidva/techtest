"use strict";

var _ = require('lodash');
var Promise = require('bluebird');

var Database = function(schemas, data) {
	this.schemas = schemas;
	this.data = data;
};

Database.prototype._get = function(model, query) {
	return Promise.resolve(_.where(this.data[model], query));
};

Database.prototype.get = function(model, query) {
	return this._get(model, query).then(function(results) {
		return results.map(function(result) {
			return _.cloneDeep(result);
		});
	});
};
Database.prototype.set = function(model, newData, id) {
	if (id) {
		return this._get(model, { id:id }).then(function(instance) {
			if (instance.length !== 1) {
				return Promise.reject("Invalid ID");
			}
			return _.cloneDeep(_.assign(instance[0], newData));
		});
	}
	else {
		var nextId = _.get(_.max(this.data[model], function(inst) {
			return inst.id;
		}), 'id');
		var newModel = _.assign(this.schemas[model], { id:(nextId || 0) + 1 }, newData);
		this.data[model].push(newModel);
		return Promise.resolve(_.cloneDeep(newModel));
	}
};
Database.prototype.remove = function(model, id) {
	this.data[model] = this.data[model].filter(function(instance) {
		instance.id !== id;
	});
	return Promise.resolve();
};

module.exports = Database;
