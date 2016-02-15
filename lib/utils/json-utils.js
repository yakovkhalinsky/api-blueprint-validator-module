var tv4 = require('tv4');
var metaSchema = require('./meta-schema-v4');

function validateSchema (schema){
    if (metaSchema.$schema) {
        tv4.addSchema('', metaSchema);
        tv4.addSchema(metaSchema.$schema, metaSchema);
    }

    if (!tv4.validate(schema, metaSchema)) {
        throw new Error('JSON schema is not valid! ' + tv4.error.message + ' at path "' + tv4.error.dataPath + '"');
    }
}

function parseJson (json){
    return JSON.parse(json);
}

function hasSchema (spec){
    return !!spec.schema;
}

function match(regex, contentType) {
    return contentType ? regex.test(contentType) : false;
}

exports.isJsonContentType = function(contentType) {
    return match(/json/i, contentType);
};

exports.parseBody = function(spec, cb){
    try {
        spec.body = parseJson(spec.body);
        cb();
    } catch (err){
        cb(err);
    }
};

exports.validateAndParseSchema = function(spec, cb){
    if (hasSchema(spec)){
        try {
            spec.schema = parseJson(spec.schema);
            validateSchema(spec.schema);
            cb();
        } catch (err){
            cb(err);
        }
    }
};

exports.validateJsonAgainstSchema = function(jsonBody, jsonSchema, cb){
    if (jsonSchema && !tv4.validate(jsonBody, jsonSchema)) {
        cb('Invalid JSON for given schema: ' + tv4.error.message + ' at path "' + tv4.error.dataPath + '"');
    }
    cb();
};

