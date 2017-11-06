'use strict';

var Client = require('../index').Client;
var Template = require('../index').Template;
var Signer = require('../index').Signer;
var Field = require('../index').Field;

var config = require('./config');

var client = new Client(config.accessKey, config.businessId);

var documentTemplate = new Template();
documentTemplate.setTemplateId(config.templateId);
documentTemplate.setTitle('Form Test');
documentTemplate.setMessage('Test Message ');

// Create a signer for the document via the role specified in the template
var signer = new Signer();
signer.setRole('Client');
signer.setName('John Doe');
signer.setEmail(config.signerEmail);
documentTemplate.appendSigner(signer);

//Fill out custom fields
var field = new Field();
field.setIdentifier(config.fieldIdentifier);
field.setValue('value 1');
documentTemplate.appendField(field);

client.createDocumentFromTemplate(documentTemplate).then(function(doc) {

    console.log(doc.getDocumentHash());


})
.catch(function(err) {
    console.log(err);
});