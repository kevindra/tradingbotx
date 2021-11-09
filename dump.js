/**
 * Dumps the portfolio to the console.
 */
const {Console} = require('console');
var json = require('./portfolio');

json[0].symbols = json[0].symbols.sort();
json[1].symbols = json[1].symbols.sort();

console.log('============================');
console.log('Portfolio Event Configuration');
console.log('============================');
console.log();

console.log('Buy Config:');
console.log('----------');
console.log(JSON.stringify(json[0]));
console.log();

console.log('Sell Config:');
console.log('-----------');
console.log(JSON.stringify(json[1]));
console.log();

console.log('===========================');
console.log('Serialized Portfolio Stocks');
console.log('===========================');
console.log();

console.log(`Buy list: Total: (${json[0].symbols.length})`);
console.log('---------');
console.log(json[0].symbols.join(','));
console.log();

console.log(`Sell list: (${json[0].symbols.length})`);
console.log('----------');
console.log(json[1].symbols.join(','));
// dummy
