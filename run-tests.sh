coffee -c -o build src/*.coffee
coffee -c -o build spec/*.coffee
cp spec/phantom.html build/

mocha-phantomjs build/phantom.html
