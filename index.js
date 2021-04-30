const request = require('request');
const fs = require('fs');

const ESTIMATED_TAX_RATE = 0.2;

const dir = __dirname;

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
        const costBasis = coinInfo['usd_spent']/coinInfo['total_coin'];
        coinInfo['Cost Basis'] = '$' + costBasis.toFixed(2);
        coinInfo['Multiplier'] = (price / (coinInfo['usd_spent']/coinInfo['total_coin'])).toFixed(2);
        coinInfo['Target Mult'] = (targets[key] / (coinInfo['usd_spent']/coinInfo['total_coin'])).toFixed(2);
        coinInfo['Progress'] = `${Math.round(100 * (price - costBasis) / (targets[key] - costBasis))}%`;
        const coinInUsd = turnCryptoIntoUsd(body[coinInfo['name']], coinInfo['total_coin']);
        coinInfo['Current Value'] = coinInUsd.toFixed(2);
        currentUsd += coinInUsd;
    }

    for (const key in aggregate) {
        aggregate[key]['Total Profit'] = '$' + numberWithCommas((aggregate[key]['Current Value'] - aggregate[key]['usd_spent']).toFixed(0));
        const profit = targets[key] * aggregate[key]['Coins'] - aggregate[key]['usd_spent'];
        aggregate[key]['Target Profit'] = '$' + numberWithCommas(profit.toFixed(0));
        aggregate[key]['Current Value'] = '$' + aggregate[key]['Current Value']
        aggregate[key]['Investment'] = '$' + aggregate[key]['usd_spent'];
    }
    var newAgg = sortAggByMultiplier(aggregate);

    console.table(newAgg, [
        'Coins',
        'Investment',
        'Current Value',
        'Cost Basis',
        'Target Price',
        'Current Price',
        'Target Mult',
        'Progress',
        'Multiplier',
        'Target Profit',
        'Total Profit']);

	console.log("\n.....Total initial worth: $" + numberWithCommas(initialUsd.toFixed(2)));
	console.log(  ".....Total current worth: $" + numberWithCommas(currentUsd.toFixed(2)));
  const curRealWorth = (initialUsd + (currentUsd - initialUsd) * (1 - ESTIMATED_TAX_RATE)).toFixed(2);
	console.log(  "Total current real worth: $" + numberWithCommas(curRealWorth));

  const totalGains = (currentUsd - initialUsd).toFixed(2);
	console.log("\n.............Total gains: $" + numberWithCommas(totalGains));
  const posttaxGains = (currentUsd - initialUsd) * (1 - ESTIMATED_TAX_RATE);
	console.log(  "...........Posttax gains: $" + numberWithCommas(posttaxGains.toFixed(2)));
});


})
})

function sortAggByMultiplier(aggregate) {
    var newAgg = {}
    var iterations = Object.keys(aggregate).length;
    for (var i = 0; i < iterations; i += 1) {
        var maxMultiplier = null;
        var maxMultiplierKey = null;
        for (const key in aggregate) {
            if (maxMultiplier == null || parseFloat(aggregate[key]['Multiplier']) > maxMultiplier) {
                maxMultiplier = parseFloat(aggregate[key]['Multiplier']);
                maxMultiplierKey = key;
            }
        }
        newAgg[maxMultiplierKey] = aggregate[maxMultiplierKey];
        delete aggregate[maxMultiplierKey];
    }
    return newAgg;
}

function turnCryptoIntoUsd(converter, cryptoAmount) {
	return cryptoAmount * (1.0 / converter);
}

function numberWithCommas(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

