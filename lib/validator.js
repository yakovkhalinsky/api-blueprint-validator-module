var jsonUtils = require('./utils/json-utils');

exports.validateJsonSpec = function(validatorResult, example, action, resource, resourceGroup) {
    return function (spec) {
        var isJsonSpec = spec.headers.some(function (header) {
            return header.name === 'Content-Type' && jsonUtils.isJsonContentType(header.value);
        });

        function hasJsonBody(){
            return !!spec.body;
        }

        function hasJsonSchema(){
            return !!spec.schema;
        }

        var errorHandler = function(prefix){
            return function(err){
                if (err){
                    validatorResult.errors.push({
                        example: example,
                        action: action,
                        resource: resource,
                        resourceGroup: resourceGroup,
                        errorMessage: (prefix ? prefix + ' - ' : '' ) + err
                    });
                }
            };
        };

        if (isJsonSpec) {
            if (hasJsonBody()) {
                jsonUtils.parseBody(spec, errorHandler('JSON Body validation'));
            }

            if (hasJsonSchema()){
                jsonUtils.validateAndParseSchema(spec, errorHandler('JSON Schema validation'));
            }

            if (hasJsonBody() && hasJsonSchema()) {
                jsonUtils.validateJsonAgainstSchema(spec.body, spec.schema, errorHandler());
            }
        }
    };
};
