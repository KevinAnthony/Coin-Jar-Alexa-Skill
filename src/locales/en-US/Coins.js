"use strict";

var CoinValues = [1.00, 0.25, 0.10, 0.05, 0.01];
var CoinsPerRoll = [25, 40, 50, 40, 50];
var CoinEnum = {
    Dollar: 0,
    Quarter: 1,
    Dime: 2,
    Nickel: 3,
    Penny: 4
};
module.exports = {
    GetCoinName: function(type, count) {
        switch (type) {
            case CoinEnum.Dollar:
                return (count === 1 ? "Dollar Coin" : "Dollar Coins");
            case CoinEnum.Quarter:
                return (count === 1 ? "Quarter" : "Quarters");
            case CoinEnum.Dime:
                return (count === 1 ? "Dime" : "Dimes");
            case CoinEnum.Nickel:
                return (count === 1 ? "Nickel" : "Nickels");
            case CoinEnum.Penny:
                return (count === 1 ? "Penny" : "Pennies");
        }
        return "";
    },
    ParseCoinType: function(type) {
        if (type === undefined) {
            return null;
        }
        type = type.toLowerCase();
        if (type === "dollars" || type === "dollar") {
            return CoinEnum.Dollar;
        }
        if (type === "quarters" || type === "quarter") {
            return CoinEnum.Quarter;
        }
        if (type === "dimes" || type === "dime") {
            return CoinEnum.Dime;
        }
        if (type === "nickels" || type === "nickel") {
            return CoinEnum.Nickel;
        }
        if (type === "pennies" || type === "penny") {
            return CoinEnum.Penny;
        }
        return null;
    },
    CoinValues: CoinValues,
    CoinsPerRoll: CoinsPerRoll,
    CoinEnum: CoinEnum
};