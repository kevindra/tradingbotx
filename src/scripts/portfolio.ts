let portfolio: Record<string, string[]> = {
  'common': [
    'AMD','Z','SBUX','ETSY','NKLA','COST','MA','WOOF','PYPL','FATE','DAL','BYND','SPOT','SQ','BA','CCL','MTCH','WMT','TWLO','OPEN','NVDA','V','REGN','CRSP','FVRR','GLD','GOOGL','ARKK','SHOP','PLTR','TSLA','CVNA','TWST','NVTA','U','PRLB','CHWY','RIOT','CMG','LOW','MSTR','AAPL','HD','MSFT','NFLX','UBER','ZM','ROKU','NIO','CRM','TDOC','JPM','DOCU','RKT','PG','SE','FB'
  ],
  'recretional': [
    'DOO','PII','PTON','YETI','POOL','SWBI'
  ],
  'hotels_motels_cruise_lines': [
    'MAR','HLT','CCL'
  ],
  'education': [
    'TAL','EDU'
  ],
  'oil_gas': [
    'HP','RIG','PTEN'
  ],
  'renewable_energy': [
    'ENPH','SEDG','PLUG','RUN'
  ],
  'internet_gaming': [
    'ATVI','ZNGA'
  ],
  'environmental_services': [
    'WM','RSG','WCN'
  ]
}

const industries = Object.keys(portfolio)
let allTickers = new Set()
industries.forEach(industryName => {
  portfolio[industryName].forEach(ticker => {
    allTickers.add(ticker)
  })
});

let allTickersArray = Array.from(allTickers)
allTickersArray = allTickersArray.sort()
console.log("All Tickers : " + allTickersArray.join(","))
console.log("Total tickers: " + allTickersArray.length)

// sell: cron(35 13 ? * MON-FRI *)
// buy: cron(31 13 ? * MON-FRI *)