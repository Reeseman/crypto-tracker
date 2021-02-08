const request = require('request');
const fs = require('fs');

const ESTIMATED_TAX_RATE = 0.2;

const dir = process.cwd();

fs.readFile(`${dir}/purchases.json`, 'utf8', (err, purchasesJsonString) => {

if (purchasesJsonString == null) {
    console.log("TODO: 'purchases.json' not set up yet");
    return;
}

const purchases = JSON.parse(purchasesJsonString);

fs.readFile(`${dir}/targets.json`, 'utf8', (err, targetsJsonString) => {

const targets = targetsJsonString == null ? {} : JSON.parse(targetsJsonString);

var currentUsd = 0;
var initialUsd = 0;

aggregate = {}
for (var i = 0; i < purchases.length; i++) {
    purchase = purchases[i];
    purchase.coin = purchase.coin.toUpperCase();
    if (aggregate[`${purchase.coin}`] == undefined) {
        aggregate[`${purchase.coin}`] = {}
        aggregate[`${purchase.coin}`].usd_spent = 0;
        aggregate[`${purchase.coin}`].total_coin = 0;
        aggregate[`${purchase.coin}`].name = purchase.coin;
        aggregate[`${purchase.coin}`]['Target Price'] = targets[purchase.coin] == undefined ? null : '$' + targets[purchase.coin];
    }
    aggregate[`${purchase.coin}`].usd_spent += purchase.usd_spent;
    aggregate[`${purchase.coin}`].total_coin += purchase.amount;
    initialUsd += purchase.usd_spent;
}

var tsymsRequestValue = '';
for (const key in aggregate) {
    tsymsRequestValue += key + ',';
}

request("https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=" + tsymsRequestValue, function (error, response, body) {
	body = JSON.parse(body);
    for (const key in aggregate) {
        var coinInfo = aggregate[key];
        coinInfo['Coins'] = coinInfo['total_coin'];
        const price = 1/body[coinInfo['name']];
        coinInfo['Current Price'] = '$' + price.toFixed(2);
        coinInfo['Cost Basis'] = '$' + (coinInfo['usd_spent']/coinInfo['total_coin']).toFixed(2);
        const coinInUsd = turnCryptoIntoUsd(body[coinInfo['name']], coinInfo['total_coin']);
        coinInfo['Current Value'] = coinInUsd.toFixed(2);
        currentUsd += coinInUsd;
    }

    for (const key in aggregate) {
        aggregate[key]['Total Profit'] = '$' + (aggregate[key]['Current Value'] - aggregate[key]['usd_spent']).toFixed(2);
        aggregate[key]['Current Value'] = '$' + aggregate[key]['Current Value']
        aggregate[key]['Total Investment'] = '$' + aggregate[key]['usd_spent'];
    }

    console.table(aggregate, ['Coins', 'Total Investment', 'Current Value', 'Cost Basis', 'Current Price', 'Target Price', 'Total Profit']);

	console.log("\n.....Total initial worth: $" + initialUsd);
	console.log(  ".....Total current worth: $" + currentUsd);
	console.log(  "Total current real worth: $" + (initialUsd + (currentUsd - initialUsd) * (1 - ESTIMATED_TAX_RATE)));
	console.log(  "........Total gains: $" + (currentUsd - initialUsd));
	console.log(  "......Posttax gains: $" + (currentUsd - initialUsd) * (1 - ESTIMATED_TAX_RATE));
});


})
})

function turnCryptoIntoUsd(converter, cryptoAmount) {
	return cryptoAmount * (1.0 / converter);
}

