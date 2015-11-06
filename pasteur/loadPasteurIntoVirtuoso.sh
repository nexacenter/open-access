#!/bin/bash

function check {
    if [ "$size" == "334" ]
    then
        reload
    fi
}

function reload {
    rm /usr/local/virtuoso-opensource/share/virtuoso/vad/pasteur/rdf.nt
    cp output/rdf.nt /usr/local/virtuoso-opensource/share/virtuoso/vad/pasteur
    /usr/local/virtuoso-opensource/bin/isql 1111 dba NonTroppoVirtuoso exec="DROP SILENT GRAPH <http://roarmap.nexacenter.org/id/>;" 
    /usr/local/virtuoso-opensource/bin/isql 1111 dba NonTroppoVirtuoso exec="delete from db.dba.load_list;" 
    /usr/local/virtuoso-opensource/bin/isql 1111 dba NonTroppoVirtuoso exec="ld_dir ('/usr/local/virtuoso-opensource/share/virtuoso/vad/pasteur', '*.nt', 'http://roarmap.nexacenter.org/id/');" 
    /usr/local/virtuoso-opensource/bin/isql 1111 dba NonTroppoVirtuoso exec="rdf_loader_run();" 
    /usr/local/virtuoso-opensource/bin/isql 1111 dba NonTroppoVirtuoso exec="checkpoint;"
    /usr/local/virtuoso-opensource/bin/isql 1111 dba NonTroppoVirtuoso exec="exit;"
    sleep 5
    size="$( wget "http://roarmap.nexacenter.org/sparql?default-graph-uri=http%3A%2F%2Froarmap.nexacenter.org%2Fid%2F&query=select+%3Fa+%3Fb+%3Fc%0D%0Awhere+{%3Fa+%3Fb+%3Fc+.}%0D%0Alimit+100%0D%0A" --spider --server-response -O - 2>&1 | sed -ne '/Content-Length/{s/.*: //;p}' )"
    check
}

java -jar rdf-pasteur.jar
reload
