'use strict';

var config = require('./config.js');
var request = require('request');
//require('request-debug')(request);
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var qs = require('querystring');
var Promise = require('bluebird');

module.exports = ApiRequest;

/**
 *
 * Create new request object
 * @param       {String} httpType       HTTP request type. GET, PUT, POST etc
 * @param       {String} accessKey      Access key from eversign dashboard
 * @param       {String} endPoint       Endpoint URI
 * @param       {Object} parameters     GET Parameters
 * @param       {Object} payload        Data payload
 * @constructor
 */
function ApiRequest(httpType, accessKey, endPoint, responseType, parameters, payload) {
  this.httpType = httpType;
  this.accessKey = accessKey;
  this.endPoint = endPoint;
  this.parameters = parameters;
  this.payload = payload;
  this.responseType = responseType;
}

/**
 *
 * Make a multipart request to eversign API
 * @return {Object} Response JSON
 */
ApiRequest.prototype.startMultipartUpload = function () {
  if(config.DEBUG_MODE) console.log(config.API_URL + this.endPoint);
  var self = this;

  return new Promise(function (resolve, reject) {
    request({
      method: self.httpType,
      uri: config.API_URL + self.endPoint + "?" + qs.stringify(createQuery(self)),
      formData: {
        upload: fs.createReadStream(path.resolve(self.payload))
      },
    },
    function (error, response, body) {
      if(error || JSON.parse(body).success === false){
        error = JSON.parse(body);
        reject(error)
      } else {
        resolve(JSON.parse(body));
      }
    }
  );
  });

}

/**
 * Starts the configured API Request of the ApiRequest instance.
 * Returns different objects based on the request sent. Consult the Eversign API
 * documentation for more information.
 * @return {Promise} A promise that either resolves with array of documents or regects
 * with an error
 */
ApiRequest.prototype.startRequest = function(){
  if(config.DEBUG_MODE) console.log(config.API_URL + this.endPoint);
  var self = this;
  
  this.payload = _.mapKeys(this.payload, function(value, key) {
    return _.snakeCase(key);
  });
  
  var requestOptions = {
    method: this.httpType,
    uri: config.API_URL + this.endPoint + "?" + qs.stringify(createQuery(this)),
    body: JSON.stringify(this.payload)
  };
  return new Promise(function (resolve, reject) {
    request(requestOptions, function (error, httpResponse, body) {
      var res = JSON.parse(body);
      if(error || res.success === false){
        var err = res.error ? res.error : error;
        reject(err);
      } else {
        if(self.responseType){
          var res = JSON.parse(body);
          var Type = require('./' + self.responseType);
          if(res.length){
            //is an array
            var result = res.map(function (obj) {
              obj = _.mapKeys(obj, function(v, k ){ return _.camelCase(k); });
              return new Type(obj);
            })
            resolve(result);
          }else{
            //Not an array, or empty
            resolve(new Type(res));
          }
        }
        resolve(JSON.parse(body));
      }
    });
  });

};

ApiRequest.prototype.startDownload = function () {
  var self = this;
  if(!this.payload || !this.payload.hasOwnProperty('sink'))
    throw new Error('Sink is required to download a file');

  return new Promise(function (resolve, reject) {
    request(config.API_URL + self.endPoint + "?" + qs.stringify(createQuery(self)) )
      .on('response', function(response) {
        resolve(response);
      })
      .on('error', function(error) {
        reject(error);
      })
      .pipe(fs.createWriteStream(self.payload.sink));
  });

};

/**
 *
 * Inserts API ket into parameters
 * @return {Obejct} Query having parameters and api key
 */
function createQuery(context) {
  var query = {
    access_key : context.accessKey,
  };

  if(context.parameters) query = Object.assign(query, context.parameters);

  return query;
}