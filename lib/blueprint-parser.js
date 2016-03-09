var async = require('async');
var glob = require('glob');
var fs = require('fs');
var drafter = require('drafter.js');
var validator = require('./validator');
var resultHandler = require('./result-handler');

var lineNumberFromCharacterIndex = function (string, index) {
    return string.substring(0, index).split("\n").length;
};

var getExamples  = function (ast, callback) {
    ast.resourceGroups.forEach(function (resourceGroup) {
        resourceGroup.resources.forEach(function (resource) {
            resource.actions.forEach(function (action) {
                action.examples.forEach(function (example) {
                    callback(example, action, resource, resourceGroup);
                });
            });
        });
    });
};

function parseBlueprint(file, cb) {
    var data = fs.readFileSync(file, {encoding: 'utf8'});
    var options = {type: 'ast'};
    drafter.parse(data, options, function (error, result) {
        if (error) {
            return cb(error, null, data);
        }
        cb(false, result, data);
    });
}

function parseFile (file, cb) {

    var validatorResult = {
        file: file,
        errors: [],
        warnings: []
    };

    parseBlueprint(file, function(error, result, fileContent) {
        if (error) {
            var lineNumber = lineNumberFromCharacterIndex(fileContent, error.location[0].index);
            validatorResult.errors.push({errorMessage: 'Error: ' + error.message + ' on line ' + lineNumber});
        } else {
            if (result.warnings.length) {
                validatorResult.warnings = result.warnings.map(function (warning) {
                    var lineNumber = lineNumberFromCharacterIndex(fileContent, warning.location[0].index);
                    return {errorMessage: warning.message + ' on line ' + lineNumber};
                });
            }

            getExamples(result.ast, function(example, action, resource, resourceGroup){
                example.requests.forEach(validator.validateJsonSpec(validatorResult, example, action, resource, resourceGroup));
                example.responses.forEach(validator.validateJsonSpec(validatorResult, example, action, resource, resourceGroup));
            });
        }

        cb(null, validatorResult);
    });

}

function getParser (file) {
    return function (asyncCb){
        parseFile(file, asyncCb);
    };
}

exports.parseAndValidateFiles = function (filesPath, failOnWarnings, cb) {
    var parallelTasks;

    glob(filesPath, {},  function (err, files) {
        parallelTasks = files.map(function(file){
            return getParser(file);
        });

        async.parallel(parallelTasks, resultHandler(failOnWarnings, cb));
    });

};
