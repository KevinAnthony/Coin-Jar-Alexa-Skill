'use strict';

var Alexa = require('alexa-sdk');
var Http = require('http');
var APP_ID = 'amzn1.ask.skill.19a0c045-705a-4341-a05f-9b9f0d5fbd00';
var Intl = require('intl');

var AlexaSkill = require('./AlexaSkill');
var Jar = require('./CoinJar');

var CoinLocale = undefined;
var Formatter = undefined;

var CoinJar = function () {
    AlexaSkill.call(this, APP_ID);
};

CoinJar.prototype = Object.create(AlexaSkill.prototype);
CoinJar.prototype.constructor = CoinJar;

CoinJar.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId+  ", locale: " + sessionStartedRequest.locale  );    
    // any initialization logic goes here
    CoinLocale = require('./locale/Coins.' + sessionStartedRequest.locale + '.js');
    Formatter = new Intl.NumberFormat(sessionStartedRequest.locale, {  style: 'currency', minimumFractionDigits: 2, });
};

CoinJar.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);

};

CoinJar.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId + ", sessionId: " + session.sessionId);
// any cleanup logic goes here
};

CoinJar.prototype.intentHandlers = {    
    "AddCoins": function(intent, session, response) {
        handleAddCoinsRequest(intent, session, response); 
    },
    "RemoveCoins": function (intent, session, response) {
        handleRemoveCoinsReques(intent, session, response);
    },
    "RollCoins": function (intent, session, response) {
        handleRollCoinsRequest(intent, session, response);
    },
    "CashRolls": function (intent, session, response) {
        handleCashRollsRequest(intent, session, response);
    },
    "GetRollCount": function (intent, session, response) {
        handleGetRollCountRequest(intent, session, response);
    },
    "GetCoinCount": function (intent, session, response) {
        handleGetCoinCountRequest(intent, session, response);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },
    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

function handleAddCoinsRequest(intent, session, speech) {
    if (Jar.Coins.length === 0) {
        Jar.Load(session, speech, ()=> {
            addCoinRequest(intent, session, speech);
        });
    } else {
        addCoinRequest(intent, session, speech);
    }
}

function addCoinRequest(intent, session, speech){
    var count = parseInt(intent.slots.Count.value);
    if (!TestCount(count, speech)) return;
    var type = CoinLocale.ParseCoinType(intent.slots.Type.value);
    if (!TestType(type)) return;
    Jar.Coins[type] += count

    speech.tell("You Added " + intent.slots.Count.value + " " + intent.slots.Type.value + " to your coin jar for a total of " + Jar.Coins[type] + " " + intent.slots.Type.value);
}

function handleRemoveCoinsRequest(intent, session, speech) {
    if (Jar.Coins.length === 0) {
        Jar.Load(session, speech, ()=> {
            removeCoinsRequest(intent, session, speech)        
        });
    } else {
        removeCoinsRequest(intent, session, speech)
    }
}

function removeCoinsRequest(intent, session, speech){
    var count = parseInt(intent.slots.Count.value);
    if (!TestCount(count, speech)) return;
    var type = CoinLocale.ParseCoinType(intent.slots.Type.value);
    if (!TestType(type)) return;
    Jar.Coins[type] -= count

    speech.tell("You Removed " + intent.slots.Count.value + " " + intent.slots.Type.value + " from your coin jar for a total of " + Jar.Coins[type] + " " + intent.slots.Type.value);
}

function handleRollCoinsRequest(intent, session, speech) {
    if (Jar.Coins.length === 0) {
        Jar.Load(session, speech, ()=> {
            rollCoinsRequest(intent, session, speech)
        });
    } else {
        rollCoinsRequest(intent, session, speech)
    }
}

function rollCoinsRequest(intent, session, speech) {
    var count = 1;
    var type = CoinLocale.ParseCoinType(intent.slots.Type.value);
    if (!TestType(type)) return;
    var needed = CoinLocale.CoinsPerRoll[type] * count;
    console.log("Needed: " + needed);
    console.log("Type: " + type);
    if (Jar.Coins[type] < needed) {
        speech.tell("You don't have enough coins to roll " + type)
        return;
    }
    Jar.Rolls[type] += count;
    Jar.Coins[type] -= needed;
    if (Jar.Rolls[type] > 1) {
        speech.tell("You now have " + Jar.Rolls[type] + " Rolls, and " + Jar.Coins[type] + " " + intent.slots.Type.value + " Left");
    } else {
        speech.tell("You now have " + Jar.Rolls[type] + " Roll, and " + Jar.Coins[type] + " " + intent.slots.Type.value + " Left");
    }
}

function handleCashRollsRequest(intent, session, speech) {
    if (Jar.Coins.length === 0) {
        Jar.Load(session, speech, ()=> {
            cashRollsRequest(intent, session, speech)
        });
    } else {
        cashRollsRequest(intent, session, speech)
    }
}

function cashRollsRequest(intent, session, speech){
    var type = CoinLocale.ParseCoinType(intent.slots.Type.value);
    if (!type) {
        Jar.Rolls = [0, 0, 0, 0, 0];
        speech.tell("You have cashed all your rolls");
    } else {
        Jar.Rolls[type] = 0;
        speech.tell("You have cashed all your" + intent.slots.Type.value);
    }
}

function handleGetRollCountRequest(intent, session, speech) {
    if (Jar.Coins.length === 0) {
        Jar.Load(session, speech, ()=> {
            getRollCountRequest(intent, session, speech)
        });
    } else {
        getRollCountRequest(intent, session, speech)
    }
}

function getRollCountRequest(intent, session, speech){
    var type = CoinLocale.ParseCoinType(intent.slots.Type.value);
    if (!type) {
//TODO say how many of everything we have
speech.tell("You have " );
} else {
    Jar.Rolls[type] = 0;
    speech.tell("You have cashed all your" + intent.slots.Type.value);
}
}

function handleGetCoinCountRequest(intent, session, speech) {
    if (Jar.Coins.length === 0) {
        Jar.Load(session, speech, ()=> {
            getCoinCountRequest(intent, session, speech)
        });
    } else {
        getCoinCountRequest(intent, session, speech)
    }
}

function getCoinCountRequest(intent, session, speech) {
    var type = CoinLocale.ParseCoinType(intent.slots.Type.value);
    if (!type) {
        var utter = ""   
        var card = ""    
        value = 0; 
        for (var coin in CoinLocale.CoinEnum) {
            var coinType = CoinLocale.CoinEnum[coin];
            if (Jar.Coins[coinType] !== 0){
                var count = Jar.Coins[coinType];
                utter = utter.concat("You have " + count + " " + CoinLocale.GetCoinName(coinType, count) + ". ");
                card = card.concat("You have " + count + " " + CoinLocale.GetCoinName(coinType, count) + ".\n");
                value = (CoinLocale.CoinValues[coinType] * count) + value;
            }
        }
        if (utter === "") {
            utter = "You have no coins in your jar"
        }
        var title = "Total: " + Formatter.format(value);
        speech.tellWithCard(utter, title, card);
    } else {
        if (Jar.Coins[type] === 0){
            speech.tell("You have no coins in your jar");
        } else {
            var value = (CoinLocale.CoinValues[coinType] * count);
            var title = "Total: " + Formatter.format(value);
            var utter = "You have " + Jar.Coins[type] + " " + CoinLocale.GetCoinName(type, Jar.Coins[coinType]) + ". ";
            speech.tellWithCard(utter, "Coin Jar", utter);
        }
    }
}

function TestType(type, speech) {
    if (!type) {
        speech.tell("Error: please specify a type of coin");
        return false;
    }
    return true;
}

function TestCount(count, speech) {
    if (isNaN(count)) {
        speech.tell("Error: please specify a valid number of coins or rolls");
        return false;
    }
    return true;
}

function handleWelcomeRequest(response) {
    response.tell("I now support coin jars, right now with google drive backing");
}

function handleHelpRequest(response) {
    var repromptText = "Please say something like 'Add 3 Quarters to my jar' or 'How Many Coins do I have in my Jar";
    var speechOutput = "Welcome To Coin Jar Mark 4" + repromptText;

    response.tell(speechOutput);
}

exports.handler = function (event, context) {
    var coinJar = new CoinJar();        
    coinJar.execute(event, context);    
};
