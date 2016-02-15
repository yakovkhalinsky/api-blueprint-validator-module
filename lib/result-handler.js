require('colors');

var logError = function(error){
    console.log('Message: '.red + error.errorMessage.red);

    var errorTrack = [];
    if (error.resourceGroup && error.resourceGroup.name){
        errorTrack.push('Group: ' + error.resourceGroup.name);
    }
    if (error.resource) {
        if (error.resource.name) {
            errorTrack.push('Resource: ' + error.resource.name);
        } else if (error.resource.uriTemplate) {
            errorTrack.push('Resource: ' + error.resource.uriTemplate);
        }
    }
    if (error.action && error.action.name){
        errorTrack.push('Action: ' + error.action.name);
    }
    if (error.example && error.example.name){
        errorTrack.push('Example: ' + error.example.name);
    }

    if (errorTrack.length){
        console.log(errorTrack.join(', ').red);
    }
};

module.exports = function (failOnWarnings, done) {
    return function (err, results) {
        var fail = false;

        function hasPassed(result) {
            return !result.errors.length && !(failOnWarnings && result.warnings.length);
        }

        results.forEach(function (result) {
            console.log('');
            console.log((hasPassed(result) ? ' Passed '.green : ' Fail '.red).inverse, result.file);

            if (result.errors.length) {
                result.errors.forEach(logError);
                fail = true;
            }

            if (result.warnings.length) {
                result.warnings.forEach(logError);
                fail = fail || failOnWarnings;
            }
        });

        console.log('\nBlueprint validation finished');
        done(!fail);
    };
};