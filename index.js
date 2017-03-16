'use strict';

require('isomorphic-fetch');
var qs = require('querystring');
var _ = require('lodash');

var buildPath = function (params) {
    params = params || {};

    params.type = 'contacts';
    params.alt = 'json';
    params.projection = params.projection || 'full';
    params.email = params.email || 'default';
    params['max-results'] = params['max-results'] || 500;

    var query = {
        alt: params.alt,
        'max-results': params['max-results'],
        'access_token': params.token
    };

    var path = '/m8/feeds/';
    path += params.type + '/';
    path += params.email + '/';
    path += params.projection;
    path += '?' + qs.stringify(query);

    return path;
};

var fetchOptions = {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
};

module.exports = function (opts) {
    return new Promise(function (resolve, reject) {
        if (opts.token == null) {
            reject(new Error('Missing OAuth token'));
        }

        var url = 'https://www.google.com/' + buildPath(opts);

        fetch(url, fetchOptions)
            .then(function (response) {
                if (response.statusCode > 300 || response.statusCode < 200) {
                    throw new Error('Status code: ' + response.statusCode);
                }
                return response.json();
            })
            .then(function (data) {
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

                        var emails = [];
                        var phoneNumbers = [];

                        if (v.gd$email) {
                            v.gd$email.forEach(function(email) {
                                emails.push(email.address)
                            })
                        }

                        if (v.gd$phoneNumber) {
                            v.gd$phoneNumber.forEach(function(phone) {
                                if (phone.uri) {
                                    phoneNumbers.push(phone.uri.replace(/\D/g,''))
                                }
                            })
                        }

                        var contact = {
                            email: emails,
                            phoneNumber: phoneNumbers,
                            name: v.title.$t,
                            google_id: _.get(v, 'id.$t', '').substring(_.lastIndexOf(url, '/') + 1)
                            // photo: images[0]
                        };
                        
                        return contacts.push(contact);
                    });

                    resolve(contacts);
                }
                else {
                    throw new Error('Unable to parse JSON. returned data is null');
                }
            })
            .catch(function (error) {
                reject(error);
            });
    });
};
