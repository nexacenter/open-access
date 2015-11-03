var http = require('http');
var xml2js = require('xml2js');
var fs = require('fs');
var Iconv = require('iconv').Iconv;

var parser = new xml2js.Parser();
var iconv = new Iconv('ISO-8859-1', 'utf-8');
var output_filename = "publishers.csv";

var options = {
    host: 'www.sherpa.ac.uk',
    path: '/romeo/api29.php?all=yes&ak=4QWuf25EjyQ'
};

fs.writeFile(output_filename, "id,parentid,name,alias,homeurl,prearchiving,prerestrictions,postarchiving,postrestrictions,pdfarchiving,pdfrestrictions,conditions,mandates,paidaccessurl,paidaccessname,paidaccessnotes,ifcoyrightlink,romeocolour,dateadded,dateupdated\r\n", function(err) {
    if (err) {
        return console.log(err);
    }
});

getData(function(publishers) {
    for (i = 0; i < publishers.length; i++) {
        for (j = 0; j < Object.keys(publishers[i]).length; j++) {
            fs.appendFileSync(output_filename, publishers[i][Object.keys(publishers[i])[j]] + ",");
        }
        fs.appendFileSync(output_filename, "\r\n");
    }
});

function getData(cb) {
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
                //console.log(JSON.stringify(result, null, 2));
                var publishers = new Array();

                for (i = 0; i < result.romeoapi.publishers[0].publisher.length; i++) {
                    getPublisher(result, function(publisher) {
                        publishers.push(publisher);
                    });
                }
                cb(publishers);
            });
        });
    }).end();
}

function getPublisher(result, cb) {
    var publisher = new Object();
    //Here we choose which fields to save; can be expanded
    publisher.id = cleanCommas(result.romeoapi.publishers[0].publisher[i].$.id);
    publisher.parentid = cleanCommas(result.romeoapi.publishers[0].publisher[i].$.parentid);
    publisher.name = cleanCommas(result.romeoapi.publishers[0].publisher[i].name[0]);
    publisher.alias = cleanCommas(result.romeoapi.publishers[0].publisher[i].alias[0]);
    publisher.homeurl = cleanCommas(result.romeoapi.publishers[0].publisher[i].homeurl[0]);
    publisher.prearchiving = cleanCommas(result.romeoapi.publishers[0].publisher[i].preprints[0].prearchiving[0]);
    publisher.prerestrictions = cleanCommas(result.romeoapi.publishers[0].publisher[i].preprints[0].prerestrictions);
    publisher.postarchiving = cleanCommas(result.romeoapi.publishers[0].publisher[i].postprints[0].postarchiving[0]);
    if (result.romeoapi.publishers[0].publisher[i].postprints[0].postrestrictions[0].postrestriction != undefined) {
        publisher.postrestrictions = cleanCommas(result.romeoapi.publishers[0].publisher[i].postprints[0].postrestrictions[0].postrestriction[0]);
    } else {
        publisher.postrestrictions = "";
    }
    publisher.pdfarchiving = cleanCommas(result.romeoapi.publishers[0].publisher[i].pdfversion[0].pdfrestrictions[0]);
    if (result.romeoapi.publishers[0].publisher[i].pdfversion[0].pdfrestrictions[0].pdfrestriction != undefined) {
        publisher.pdfrestrictions = cleanCommas(result.romeoapi.publishers[0].publisher[i].pdfversion[0].pdfrestrictions[0].pdfrestriction[0]);
    } else {
        publisher.pdfrestrictions = "";
    }
    publisher.conditions = cleanCommas(stringifyArray(result.romeoapi.publishers[0].publisher[i].conditions[0].condition));
    publisher.mandates = cleanCommas(result.romeoapi.publishers[0].publisher[i].mandates[0]);
    publisher.paidaccessurl = cleanCommas(result.romeoapi.publishers[0].publisher[i].paidaccess[0].paidaccessurl[0]);
    publisher.paidaccessname = cleanCommas(result.romeoapi.publishers[0].publisher[i].paidaccess[0].paidaccessname[0]);
    publisher.paidaccessnotes = cleanCommas(result.romeoapi.publishers[0].publisher[i].paidaccess[0].paidaccessnotes[0]);
    if (result.romeoapi.publishers[0].publisher[i].copyrightlinks[0] != "") {
        publisher.coyrightlink = cleanCommas(result.romeoapi.publishers[0].publisher[i].copyrightlinks[0].copyrightlink[0].copyrightlinkurl[0]);
    } else {
        publisher.coyrightlink = "";
    }
    publisher.romeocolour = cleanCommas(result.romeoapi.publishers[0].publisher[i].romeocolour[0]);
    publisher.dateadded = cleanCommas(result.romeoapi.publishers[0].publisher[i].dateadded[0]);
    publisher.dateupdated = cleanCommas(result.romeoapi.publishers[0].publisher[i].dateupdated[0]);

    cb(publisher);
}

function cleanCommas(string) {
    if (string != undefined && typeof string === 'string') {
        string = string.replace(/,/g,'');
    }
    return string;
}

function stringifyArray(array) {
    var string;
    for (var i in array) {
        string += array[i];
        string += "§";
    }
    return string;
}
