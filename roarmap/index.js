// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

var fs = require("fs"),
    http = require("http"),
    kvHostName = 'roarmap.eprints.org',
    kvIndexFile = "index.html",
    kvPort = 8080,
    kvRetainFields = {
        "can_deposit_be_waived": true,
        "date_made_open": true,
        "date_of_deposit": true,
        "embargo_hum_soc": true,
        "embargo_sci_tech_med": true,
        "gold_oa_options": true,
        "iliege_hefce_model": true,
        "journal_article_version": true,
        "locus_of_deposit": true,
        "making_deposit_open": true,
        "mandate_content_types": true,
        "maximal_embargo_waivable": true,
        "open_licensing_conditions": true
    };

function simplify(record) {
    var newRecord = {};
    Object.keys(record).forEach(function (key) {
        if (kvRetainFields[key]) {
            newRecord[key] = record[key];
        }
    });
    return newRecord;
}

function asList(record) {
    var newRecord = [];
    Object.keys(record).forEach(function (key) {
        var value = record[key];
        console.log(key, value, typeof value);
        if (value instanceof Array) {
            for (var i = 0; i < value.length; ++i) {
                newRecord.push([key, value[i]]);
            }
        } else {
            newRecord.push([key, value]);
        }
    });
    return newRecord;
}

function callEprints(path, callback) {
    var request = http.request({
        hostname: kvHostName,
        method: "GET",
        path: path,
        headers: {
            accept: "application/json"
        }
    }, function (response) {
        if (response.statusCode !== 200) {
            response.resume();
            callback(new Error("unexpected status code"));
            return;
        }
        response.on("error", function (error) {
            callback(error);
        });
        var body = "";
        response.on("data", function (data) {
            body += data;
        });
        response.on("end", function () {
            var record;
            try {
                record = JSON.parse(body);
            } catch (error) {
                callback(error);
                return;
            }
            callback(undefined, record);
        });
    });
    request.on("error", function (error) {
        callback(error);
    });
    request.end();
}

http.createServer(function (request, response) {

    if (request.url === "/") {
        var stream = fs.createReadStream(kvIndexFile);
        stream.on("error", function (error) {
            console.log("stream error:", error);
            response.end();
        });
        stream.pipe(response);
        return;
    }

    if (request.url.match(/^\/id\/eprint\/[0-9]+/)) {
        callEprints(request.url, function (error, record) {
            if (error) {
                console.log("callEprints error:", error);
                response.writeHead(500);
                response.end("Internal Server Error\n");
                return;
            }
            record = asList(simplify(record));
            response.writeHead(200, {
                "Content-Type": "application/json"
            });
            response.end(JSON.stringify(record, undefined, 4));
        });
        return;
    }

    response.writeHead(404);
    response.end("Not Found\n");

}).listen(kvPort, function () {
    console.log("server listening on port", kvPort);
});
