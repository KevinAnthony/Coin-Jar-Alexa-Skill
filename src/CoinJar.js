'use strict'
var fs = require('fs')
var authorize = require('./google/authorize')
var google = require('googleapis')

var SHEET_NAME = "Coin Counts"

function CoinJar (){
    this.FileID = null;
    this.Coins = [];
    this.Rolls = [];
}

CoinJar.prototype.Load = function (session, speech, initCallback){
    self.InitCallback = initCallback;
    var accessToken = JSON.stringify(session.user.accessToken)
	fs.readFile('client_secret.json', function processClientSecrets (err, content) {
	if (err) {
		var secretsError = 'There was an issue reaching the skill';
		speech.tell(secretsError);
		return;
    } else {
        var client = JSON.parse(content);
        authorize(client, accessToken, function (err, oauthClient) {
			if (err) {
				console.log("No OAuth2");
                console.log("Error: " + err);                
				var noOauth = 'You must have a linked account to use this skill. Please use the alexa app to link your account.';
				speech.tell(noOauth);
				return;
			}
			self.findSheetId(oauthClient)
		})
    }
  })
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
CoinJar.prototype.loadSheet = function(auth) {
    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: self.FileID,
        range: 'B2:F3',
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var rows = response.values;
        if (rows.length == 0) {
            console.log('No data found.');
        } else {
            if (rows.length !== 2){
                console.log('Incorrect number of rows returned');
                return;
            }
            var coinRow = rows[0];
            var rollRow = rows[1];
            for (var i = 0; i < coinRow.length; i++){
                self.Coins.push(parseInt(coinRow[i]));
            }
            for (var i = 0; i < rollRow.length; i++){
                self.Rolls.push(parseInt(rollRow[i]));
            }
            console.log("Coins: " + self.Coins);
            console.log("Rolls: " + self.Rolls);
        }
        console.log(self.InitCallback);
        self.InitCallback();
    });
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
CoinJar.prototype.findSheetId = function(auth) {
    var service = google.drive('v3');
    service.files.list({
        auth: auth,
        fields: "nextPageToken, files(id, name)"
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var files = response.files;
        if (files.length == 0) {
            console.log('No files found.');
        } else {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.name === SHEET_NAME) {
                    self.FileID = file.id;
                    console.log(file.name);
                }
            }
        }
        if (!self.FileID) {
            console.log("Could not find sheet")
            return;
        }
        self.loadSheet(auth);
    });
}

var self = module.exports = new CoinJar();
