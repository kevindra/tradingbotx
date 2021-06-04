var json = require('./portfolio.json');
json.symbols = json.symbols.sort();
console.log(JSON.stringify(json));
console.log(json.symbols.join(','));
// dummy
