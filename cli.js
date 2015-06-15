#!/usr/bin/env node

var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var app = require('./');
app.enable('verbose');

require(path.join(process.cwd(), 'example.js'));
app.run.apply(app, argv._);
