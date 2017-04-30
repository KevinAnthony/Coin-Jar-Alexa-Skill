"use strict";

var fs = require("fs");
var authorize = require("./google/authorize");
var google = require("googleapis");

var SHEET_NAME = "Coin Counts";

function nextChar(c) { return String.fromCharCode(c.charCodeAt(0) + 1); }

function CoinJar() {
    this.FileID = null;
    this.Coins = [];
    this.Rolls = [];
    this.Auth = null;
    this.CoinLocale = null;
    this.I18N = null;
}

CoinJar.prototype.Load = function(session, speech, initCallback) {
    self.InitCallback = initCallback;
    var accessToken = JSON.stringify(session.user.accessToken);
    fs.readFile("client_secret.json", function processClientSecrets(err, content) {
        if (err) {
            speech.tell(self.I18N.t("GeneralConnectionError"));
            return;
        } else {
            var client = JSON.parse(content);
            authorize(client, accessToken, function(err, oauthClient) {
                if (err) {
                    console.log("No OAuth2");
                    console.log("Error: " + err);
                    speech.tell(self.I18N.t("NoOAuthTokenError"));
                    return;
                }
                self.Auth = oauthClient;
                self.findSheetId();
            });
        }
    });
};

/**
* Lists the names and IDs of up to 10 files.
*
* @param {google.auth.OAuth2} auth An authorized OAuth2 client.
*/
CoinJar.prototype.loadSheet = function() {
    var sheets = google.sheets("v4");
    sheets.spreadsheets.values.get({
        auth: self.Auth,
        spreadsheetId: self.FileID,
        range: "B2:F3",
    }, function(err, response) {
        if (err) {
            console.log("The API returned an error: " + err);
            return;
        }
        var rows = response.values;
        if (rows.length == 0) {
            console.log("No data found.");
        } else {
            if (rows.length !== 2) {
                console.log("Incorrect number of rows returned");
                return;
            }
            var coinRow = rows[0];
            var rollRow = rows[1];
            for (var i = 0; i < coinRow.length; i++) {
                self.Coins.push(parseInt(coinRow[i]));
            }
            for (var i = 0; i < rollRow.length; i++) {
                self.Rolls.push(parseInt(rollRow[i]));
            }
        }
        console.log(self.InitCallback);
        self.InitCallback();
    });
};
CoinJar.prototype.saveSheet = function() {
    var sheets = google.sheets("v4");
    var requests = [];
    var row1 = [];
    var row2 = [];
    for (var coin in self.CoinLocale.CoinEnum) {
        var coinType = self.CoinLocale.CoinEnum[coin];
        row1.push({ userEnteredValue: { numberValue: Coins[coinType] } });
        row2.push({ userEnteredValue: { numberValue: Rolls[coinType] } });
    }

    requests.push({
        updateCells: {
            start: { sheetId: 0, rowIndex: 1, columnIndex: 1 },
            rows: [
                {
                    values: row1
                }
            ],
            fields: "userEnteredValue"
        }
    });
    requests.push({
        updateCells: {
            start: { sheetId: 0, rowIndex: 2, columnIndex: 1 },
            rows: [
                {
                    values: row2
                }
            ],
            fields: "userEnteredValue"
        }
    });
    var batchUpdateRequest = { requests: requests };
    sheets.spreadsheets.batchUpdate({
        spreadsheetId: self.FileID,
        resource: batchUpdateRequest,
        auth: self.Auth
    }, function(err, response) {
        if (err) {
            console.log(err);
        }
    });
};
CoinJar.prototype.nextChar = function(c) { return String.fromCharCode(c.charCodeAt(0) + 1); };
CoinJar.prototype.createSheet = function() {
    var sheets = google.sheets("v4");
    sheets.spreadsheets.create({
        resource: { properties: { title: SHEET_NAME } },
        auth: auth
    }, function(err, response) {
        if (err) {
            console.log("Error : unable to create file, " + err);
            return;
        } else {
            self.FileID = response.spreadsheetId;
            var requests = [];
            requests.push({
                updateSheetProperties: {
                    properties: { sheetId: 0, title: self.I18N.t("SheetTitle") },
                    fields: "title"
                }
            });
            var row1 = [];
            var row2 = [];
            var row3 = [];
            var row4 = [];
            var row5 = [];
            var row6 = [];

            var column = "B";
            row1.push({ userEnteredValue: { stringValue: "" } });
            row2.push({ userEnteredValue: { stringValue: self.I18N.t("SheetCoinCount") } });
            row3.push({ userEnteredValue: { stringValue: self.I18N.t("SheetRolledCount") } });
            row4.push({ userEnteredValue: { stringValue: self.I18N.t("SheetCoinCValues") } });
            row5.push({ userEnteredValue: { stringValue: "" } });
            row6.push({ userEnteredValue: { stringValue: self.I18N.t("SheetCoinsToWrap") } });

            var totalRolledFormula = "= ";
            for (var coin in self.CoinLocale.CoinEnum) {
                var coinType = self.CoinLocale.CoinEnum[coin];
                row1.push({ userEnteredValue: { stringValue: CoinLocale.GetCoinName(coinType, 2) } });
                row2.push({ userEnteredValue: { numberValue: 0 } });
                row3.push({ userEnteredValue: { numberValue: 0 } });
                row4.push({ userEnteredValue: { formulaValue: "= " + column + "2 * " + self.CoinLocale.CoinValues[coinType] }, userEnteredFormat: { numberFormat: { type: "CURRENCY" } } });
                row5.push({ userEnteredValue: { stringValue: "" } });
                row6.push({ userEnteredValue: { formulaValue: "= (" + column + "2 / " + self.CoinLocale.CoinsPerRoll[coinType] + ") - " + column + "3" } });
                totalRolledFormula = totalRolledFormula.concat("(" + column + "3 * " + self.CoinLocale.CoinsPerRoll[coinType] * self.CoinLocale.CoinValues[coinType] + ") + ");
                column = nextChar(column);
            }

            row4.push({ userEnteredValue: { stringValue: "" }, });
            row4.push({ userEnteredValue: { stringValue: self.I18N.t("SheetTotalCoinValue") } });
            row4.push({ userEnteredValue: { stringValue: "" } });
            row4.push({ userEnteredValue: { stringValue: self.I18N.t("SheetTotalWrappedValue") } });
            row5.push({ userEnteredValue: { stringValue: "" } });
            row5.push({ userEnteredValue: { formulaValue: "= Sum(B4:" + column + "4)" }, userEnteredFormat: { numberFormat: { type: "CURRENCY" } } });
            row5.push({ userEnteredValue: { stringValue: "" } });
            row5.push({ userEnteredValue: { formulaValue: str = totalRolledFormula.slice(0, -3) }, userEnteredFormat: { numberFormat: { type: "CURRENCY" } } });
            requests.push({
                updateCells: {
                    start: { sheetId: 0, rowIndex: 0, columnIndex: 0 },
                    rows: [
                        {
                            values: row1
                        }
                    ],
                    fields: "userEnteredValue,userEnteredFormat.numberFormat"
                }
            });
            requests.push({
                updateCells: {
                    start: { sheetId: 0, rowIndex: 1, columnIndex: 0 },
                    rows: [
                        {
                            values: row2
                        }
                    ],
                    fields: "userEnteredValue,userEnteredFormat.numberFormat"
                }
            });
            requests.push({
                updateCells: {
                    start: { sheetId: 0, rowIndex: 2, columnIndex: 0 },
                    rows: [
                        {
                            values: row3
                        }
                    ],
                    fields: "userEnteredValue,userEnteredFormat.numberFormat"
                }
            });
            requests.push({
                updateCells: {
                    start: { sheetId: 0, rowIndex: 3, columnIndex: 0 },
                    rows: [
                        {
                            values: row4
                        }
                    ],
                    fields: "userEnteredValue,userEnteredFormat.numberFormat"
                }
            });
            requests.push({
                updateCells: {
                    start: { sheetId: 0, rowIndex: 4, columnIndex: 0 },
                    rows: [
                        {
                            values: row5
                        }
                    ],
                    fields: "userEnteredValue,userEnteredFormat.numberFormat"
                }
            });
            requests.push({
                updateCells: {
                    start: { sheetId: 0, rowIndex: 5, columnIndex: 0 },
                    rows: [
                        {
                            values: row6
                        }
                    ],
                    fields: "userEnteredValue,userEnteredFormat.numberFormat"
                }
            });

            var batchUpdateRequest = { requests: requests };
            sheets.spreadsheets.batchUpdate({
                spreadsheetId: self.FileID,
                resource: batchUpdateRequest,
                auth: self.Auth
            }, function(err, response) {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
};

/**
* Lists the names and IDs of up to 10 files.
*
* @param {google.auth.OAuth2} auth An authorized OAuth2 client.
*/
CoinJar.prototype.findSheetId = function() {
    var service = google.drive("v3");
    service.files.list({
        q: "name = '" + SHEET_NAME + "'",
        auth: auth,
        fields: "nextPageToken, files(id, name)"
    }, function(err, response) {
        if (err) {
            console.log("The API returned an error: " + err);
            return;
        }
        var files = response.files;
        if (files.length == 0) {
            self.createSheet();
        } else {
            self.FileID = files[0].id;
        }
        if (!self.FileID) {
            self.createSheet();
        } else {
            self.loadSheet();
        }
    });
};

var self = module.exports = new CoinJar();