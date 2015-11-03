var http = require('http');
var xml2js = require('xml2js');
var csv = require('csv');
var fs = require('fs');
var Iconv = require('iconv').Iconv;

var parser = new xml2js.Parser();
var iconv = new Iconv('ISO-8859-1', 'utf-8');
var output_filename = "porto_plus.csv";

fs.readFile("porto.csv", "utf8", function(err, data) {
    if (err) {
        return console.log(err);
    }
    csv.parse(data, function(err, my_csv) {
        fs.writeFile(output_filename, "ID,Journal,Editor,Domain,jtitle,issn,romeopub,pubid,alert,URL\r\n", function(err) {
            if (err) {
                return console.log(err);
            }
        });
        for (var i = 1; i < my_csv.length; i++) { //Adjust here for less rows
            trigger(i, my_csv);
        }
    });
});

function trigger(i, my_csv) {
    setTimeout(function() {
        var journal_title = cleanAmpersand(my_csv[i][0].split(' ').join('+'));
        var options = {
            host: 'www.sherpa.ac.uk',
            path: '/romeo/api29.php?jtitle=' + journal_title + '&ak=4QWuf25EjyQ'
        };
        getData(options, function(callback) {
            if (callback === "Journal not found") {
                printOld(my_csv[i]);
                fs.appendFileSync(output_filename, ",,,,Journal not found\r\n");
            } else if (callback === "Many journals found") {
                printOld(my_csv[i]);
                fs.appendFileSync(output_filename, ",,,,Many journals found,http://"+options.host+options.path+"\r\n");
            } else {
                printOld(my_csv[i]);
                for (j = 0; j < Object.keys(callback).length; j++) {
                    fs.appendFileSync(output_filename, callback[Object.keys(callback)[j]] + ",");
                }
                fs.appendFileSync(output_filename, "\r\n");
            }
        });
    }, 1000 * i);
}

function getData(options, cb) {
    //console.log("[" + getNow() + "] GET " + options.path);
    http.request(options).on("response", function(res) {
        var str = '';

        res.on('data', function(chunk) {
            var buffer = iconv.convert(chunk);
            str += buffer.toString('utf8');
        });

        res.on('end', function() {
            parser.parseString(str, function(err, result) {
                if (err) {
                    return console.log(err);
                }
                if (result.romeoapi.header[0].outcome[0] === "notFound") {
                    //console.log("Journal not found");
                    cb("Journal not found");
                } else if (result.romeoapi.header[0].outcome[0] === "manyJournals") {
                    //console.log("Many journals found");
                    cb("Many journals found");
                } else if (result.romeoapi.header[0].outcome[0] === "singleJournal") {
                    //console.log(JSON.stringify(result, null, 2));
                    var my_journal = new Object;

                    //Here we choose which fields to save; can be expanded
                    my_journal.jtitle = cleanCommas(result.romeoapi.journals[0].journal[0].jtitle[0]);
                    my_journal.issn = cleanCommas(result.romeoapi.journals[0].journal[0].issn[0]);
                    my_journal.romeopub = cleanCommas(result.romeoapi.journals[0].journal[0].romeopub[0]);
                    my_journal.pubid = cleanCommas(result.romeoapi.publishers[0].publisher[0].$.id);
                    cb(my_journal);
                } else if (result.romeoapi.header[0].outcome[0] === "uniqueZetoc") {
                    var my_journal = new Object;

                    //Here we choose which fields to save; can be expanded
                    my_journal.jtitle = cleanCommas(result.romeoapi.journals[0].journal[0].jtitle[0]);
                    my_journal.issn = cleanCommas(result.romeoapi.journals[0].journal[0].issn[0]);
                    cb(my_journal);
                }
            });
        });
    }).end();
}

function getNow() {
    return new Date().toISOString();
}

function cleanCommas(string) {
    if (string != undefined && typeof string === 'string') {
        string = string.replace(/,/g,'');
    }
    return string;
}

function cleanAmpersand(string) {
    if (string != undefined && typeof string === 'string') {
        string = string.replace(/&/g,'%26');
    }
    return string;
}

function printOld(array) {
    for (j = 0; j < array.length; j++) {
        fs.appendFileSync(output_filename, cleanCommas(array[j]) + ",");
    }
}
