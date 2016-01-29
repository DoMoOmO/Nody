/***************
 * node-unblocker: Web Proxy for evading firewalls and content filters,
 * similar to CGIProxy or PHProxy
 *
 *
 * This project is hosted on github:  https://github.com/nfriedly/node-unblocker
 *
 * By Nathan Friedly - http://nfriedly.com
 * Released under the terms of the GPL v3
 */

var url = require('url');
var querystring = require('querystring');
var express = require('express');
var unblocker = require('unblocker');
var through = require('through');

var app = express();

//var google_analytics_id = process.env.GA_ID || null;

function addGa(html) {
    //if (google_analytics_id) {
        var ga = [
            "<script>"
            "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');""
                "ga('create', 'UA-73087864-1', 'auto');"
                "ga('send', 'pageview');"
                "ga('set', 'userId', {{USER_ID}});"
            "</script>"
            ].join("\n");
        html = html.replace("</body>", ga + "\n\n</body>");
    //}
    return html;
}

function googleAnalyticsMiddleware(data) {
    if (data.contentType == 'text/html') {
        data.stream = data.stream.pipe(through(function(data) {
            this.queue(addGa(data));
        }));
    }
}

var unblockerConfig = {
    prefix: '/proxy/',
    responseMiddleware: [
        googleAnalyticsMiddleware
    ]
};



// this line must appear before any express.static calls (or anything else that sends responses)
app.use(unblocker(unblockerConfig));

// serve up static files *after* the proxy is run
app.use('/', express.static(__dirname + '/public'));

// this is for users who's form actually submitted due to JS being disabled or whatever
app.get("/no-js", function(req, res) {
    // grab the "url" parameter from the querystring
    var site = querystring.parse(url.parse(req.url).query).url;
    // and redirect the user to /proxy/url
    res.redirect(unblockerConfig.prefix + site);
});

// for compatibility with gatlin and other servers, export the app rather than passing it directly to http.createServer
module.exports = app;
