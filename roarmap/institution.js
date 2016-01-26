// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

var http = require("http");

// Maps the institution-id (a positive number) into the values of the
// policies that we're interested into. The callback receives two arguments,
// the first one being the error (if any) and the mapping between policy
// names and their values. The data source is nexacenter's sparql endpoint.
exports.getInstitutionById = function(institutionId, cb) {

    var

        // Base URL of nexacenter endpoint
        kvBaseEndpointUrl = "http://roarmap.nexacenter.org/sparql?",

        // Base URL of institutions inside the triple store
        kvBaseInstitutionUrl = "http://roarmap.nexacenter.org/id/eprint/",

        // Base URL of properties inside the triple store
        kvBasePropertyUrl = "http://roarmap.nexacenter.org/id/property/",

        // Properties to retain in the result object
        kvRetainVerbs = {
            journalArticleVersion: true,
            locusOfDeposit: true,
            mandateContentType: true,
            dateOfDeposit: true,
            dateToBeMadeOpen: true,
            embargoHumSoc: true,
            embargoSciTechMed: true,
            maximalEmbargoWaivable: true,
            canDepositBeWaived: true,
            makingDepositOpen: true,
            openLicensingConditions: true,
            goldOAOptions: true
        };

    // Returns the string "application/json" quoted for URI inclusion
    function genApplicationJson() {
        return encodeURIComponent("application/json");
    }

    // Maps institution-id to the corresponding SPARQL query
    function genInstitutionQuery(institutionId) {
        if (typeof institutionId !== "number" || institutionId < 0) {
            throw new Error("invalid institutionId type: " +
                institutionId);
        }
        return encodeURIComponent("select distinct ?verb ?object { " +
            "<" + kvBaseInstitutionUrl + institutionId + "> " +
            "?verb ?object }");
    }

    // Maps institution-id to the URL for lowLevelGet()
    function genInstitutionUrl(institutionId) {
        return kvBaseEndpointUrl + "query=" + genInstitutionQuery(
            institutionId) + "&format=" + genApplicationJson();
    }

    // Performs a GET and pass to callback error (if any) and full body
    function lowLevelGet(url, cb) {
        http.get(url, function(response) {
            if (response.statusCode !== 200) {
                response.resume();
                cb(new Error("invalid status: " + response.statusCode));
                return;
            }
            var body = "";
            response.on("data", function(chunk) {
                body += chunk
            });
            response.on("end", function() {
                cb(undefined, body);
            });
        }).on("error", function(error) {
            cb(error);
        });
    }

    // High level GET that parses and postprocess JSON response
    function issueGet(url, cb, postproc) {
        lowLevelGet(url, function(err, data) {
            if (err) {
                cb(err);
                return;
            }
            var record;
            try {
                record = JSON.parse(data);
                if (typeof postproc === "function") {
                    record = postproc(record);
                }
            } catch (err) {
                cb(err);
                return;
            }
            cb(null, record);
        });
    }

    // Normalize institution and only retain desired fields
    function normalizeInstitution(record) {
        var newRecord = {};
        record = record.results.bindings;
        for (var i = 0; i < record.length; ++i) {
            var verb = record[i].verb.value,
                object = record[i].object.value;
            if (verb.indexOf(kvBasePropertyUrl) === 0) {
                verb = verb.replace(kvBasePropertyUrl, "");
                if (kvRetainVerbs[verb] === true) {
                    newRecord[verb] = object;
                }
            }
        }
        return newRecord;
    }

    issueGet(genInstitutionUrl(institutionId), cb, normalizeInstitution);
};

if (require.main === module) {
    exports.getInstitutionById(825, function(error, record) {
        if (error) throw error;
        console.log(record);
    });
}
