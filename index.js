'use strict';

var qs = require('querystring');
var request = require('request');

var buildPath = function (params) {
    params = params || {};

    params.type = 'contacts';
    params.alt = 'json';
    params.projection = params.projection || 'full';
    params.email = params.email || 'default';
    params['max-results'] = params['max-results'] || 500;

    var query = {
        alt: params.alt,
        'max-results': params['max-results']
    };

    var path = '/m8/feeds/';
    path += params.type + '/';
    path += params.email + '/';
    path += params.projection;
    path += '?' + qs.stringify(query);

    return path;
};

module.exports = function (opts) {
    return new Promise(function (resolve, reject) {

        if (opts.token == null) {
            reject(new Error('Missing OAuth token'));
        }

        var req = {
            method: 'GET',
            uri: 'https://www.google.com/' + buildPath(opts),
            headers: {
                Authorization: 'OAuth ' + opts.token
            }
        };

        request.get(req, function (err, res, data) {
            if (err) {
                reject(err);
            }

            if (res.statusCode > 300 || res.statusCode < 200) {
                reject(new Error('Status code: ' + res.statusCode));
            }

            try {
                data = JSON.parse(data);
                var contacts = [];

                if (data.feed != null) {
                    data.feed.entry.forEach(function (v, k) {
                        var ref;

                        // Parse image
                        var linkNode = v.link || [];
                        var images = linkNode
                            .filter(function (node) {
                                return node.type === 'image/*';
                            })
                            .map(function (node) {
                                return node.href;
                            });

                        var contact = {
                            email: (ref = v.gd$email) != null ? ref[0].address : void 0,
                            name: v.title.$t,
                            photo: images[0]
                        };

                        return contacts.push(contact);
                    });

                    resolve(contacts);
                }
                else {
                    reject(new Error('Unable to parse JSON. returned data is null'));
                }
            }
            catch (e) {
                reject(e);
            }
        });
    });
};
