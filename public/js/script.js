const POPULAR = [
  'PLTR',
  'RIOT',
  'AAPL',
  'TSLA',
  'AMC',
  'SNDL',
  'NIO',
  'F',
  'GE',
  'MSFT',
  'DIS',
  'AMZN',
  'APHA',
  'ZOM',
  'AAL',
  'PLUG',
  'PFE',
  'CCIV',
  'ACB',
  'CCL',
  'GPRO',
  'DAL',
  'OGI',
  'NAKD',
  'SNAP',
  'BABA',
  'CTRM',
  'MRNA',
  'NFLX',
  'BAC',
  'CGC',
  'IDEX',
  'FCEL',
  'AMD',
  'TWTR',
  'FB',
  'T',
  'NCLH',
  'SPCE',
  'WKHS',
  'GM',
  'ZNGA',
  'UAL',
  'SBUX',
  'BA',
  'KO',
  'CRON',
  'UBER',
  'NVDA',
  'JNJ',
  'GNUS',
  'OCGN',
  'TXMD',
  'VOO',
  'PSEC',
  'SQ',
  'NKLA',
  'ABNB',
  'BNGO',
  'WMT',
  'DKNG',
  'LUV',
  'HEXO',
  'MRO',
  'PYPL',
  'RCL',
  'GOOGL',
];
const MIN_INDICATOR_VALUE = 80;
const MAX_INDICATOR_VALUE = 100;

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;

  var values = [];
  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      values.push(
        sParameterName[1] === undefined
          ? true
          : decodeURIComponent(sParameterName[1])
      );
    }
  }

  if (values.length === 1) return values[0];
  else return values;
};

var ticker = getUrlParameter('t');
var currency = getUrlParameter('c');
var type = getUrlParameter('type');
var form = getUrlParameter('h') || '365';
var endDate =
  getUrlParameter('endDate') || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
var algoIds = getUrlParameter('algoIds') || 'BuyLow';
var algoIdsList = typeof algoIds === 'string' ? [algoIds] : algoIds;

console.log(ticker, currency, type, form, algoIds);
var endpoint = `/api/indicators/history?t=${ticker}&c=${currency}&type=${type}&horizon=${form}&endDate=${endDate}&algoIds=${algoIdsList.join(
  ','
)}`;
console.log(endpoint);
function printAlgoResult(algoResult, algoIndex) {
  return (
    algoResult.algoNames[algoIndex] +
    ' Algo: ' +
    algoResult.timestamps[algoResult.timestamps.length - 1].algoOutputs[
      algoIndex
    ][1].toFixed(2) +
    '% ' +
    algoResult.types[algoIndex] +
    ' @ $' +
    algoResult.timestamps[algoResult.timestamps.length - 1].price.toFixed(2)
  );
}
$(document).ready(function () {
  // temp
  // ticker = getUrlParameter('t');
  // currency = getUrlParameter('c');
  // type = getUrlParameter('type');
  // form = getUrlParameter('h') || '365';
  // algoIds = getUrlParameter('algoIds') || 'BuyLow';
  // algoIdsList = typeof algoIds === 'string' ? [algoIds] : algoIds;

  if (Highcharts !== undefined && ticker && ticker.length !== 0) {
    $('#algo-result-spinner').show();
    $.getJSON(endpoint, data => {
      $('#algo-result-spinner').hide();
      $('#conf-ticker').html(ticker);
      $('#conf-value').html(
        // indicator value (just showing the first indicator for now)
        algoIdsList
          .map((a, i) => {
            return printAlgoResult(data, i);
          })
          .join('<br/>')
      );
      plotChart(data, ticker);
    });
  }
});

// TODO it plots only the first indicator of an Algo
function plotChart(data, ticker = '') {
  var yAxis = [
    {
      title: {
        text: 'Price',
      },
      opposite: true,
    },
    // {
    //   title: {
    //     text: 'Algo Result (0-100%)',
    //   },
    // },
  ];

  // uncomment me if need separate axis for each algo
  data.algoNames.forEach(an => {
    yAxis.push({
      title: {
        text: an,
      },
    });
  });

  var series = [
    // price
    {
      type: 'area',
      name: 'Price',
      yAxis: 0,
      data: data.timestamps.map(d => [d.timestamp, d.price]),
    },
  ];

  data.algoNames.forEach((an, i) => {
    series.push({
      yAxis: i + 1,
      name: an + ' - ' + data.types[i] + '% (' + ticker + ')',
      data: data.timestamps.map(d => [d.timestamp, d.algoOutputs[i][1]]),
    });
  });

  return new Highcharts.chart('container', {
    chart: {
      zoomType: 'x',
    },
    title: {
      text: 'Historical Algo Results - ' + ticker,
    },
    subtitle: {
      text: 'Historical algo result values based on the past price movements.',
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: yAxis,
    tooltip: {
      shared: true,
    },
    legend: {
      enabled: true,
    },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [0, Highcharts.getOptions().colors[0]],
            [
              1,
              Highcharts.color(Highcharts.getOptions().colors[0])
                .setOpacity(0)
                .get('rgba'),
            ],
          ],
        },
        marker: {
          radius: 2,
        },
        lineWidth: 1,
        states: {
          hover: {
            lineWidth: 1,
          },
        },
        threshold: null,
      },
    },

    series: series,
  });
}

// Analytics
if (window.location.hostname === 'www.tradingbotx.com') {
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', 'G-HGFNWY883M');
}

function getOpportunities(
  tickers,
  horizon,
  algoId,
  indicator,
  minIndicatorValue,
  maxIndicatorValue,
  callback
) {
  $.ajax({
    url: '/api/opportunities',
    dataType: 'json',
    data: {
      tickers: tickers.join(','),
      horizon: horizon,
      algoId: algoId,
      indicator: indicator,
      minIndicatorValue: minIndicatorValue,
      maxIndicatorValue: maxIndicatorValue,
    },
    success: function (data) {
      console.log('GOT: ' + JSON.stringify(data));
      callback(data);
    },
    fail: function () {
      alert('Error occurred.');
    },
  });
}

function trade(opportunities, callback) {
  $.ajax({
    url: '/api/trade',
    method: 'POST',
    dataType: 'json',
    data: {
      opportunities: opportunities,
      minTradeAmount: window.minTradeAmount,
      maxTradeAmount: window.maxTradeAmount,
      minIndicatorValue: MIN_INDICATOR_VALUE,
      maxIndicatorValue: MAX_INDICATOR_VALUE,
    },
    success: function (data) {
      console.log('GOT: ' + JSON.stringify(data));
      callback(data);
    },
    fail: function () {
      alert('Error occurred.');
    },
  });
}

function getWatchlist(id, callback) {
  $.ajax({
    url: '/api/watchlists',
    dataType: 'json',
    data: {
      id: id,
    },
    success: function (data) {
      console.log('GOT: ' + JSON.stringify(data));
      callback(data);
    },
    fail: function () {
      alert('Error occurred.');
    },
  });
}

function createWatchlist(name, tickers, callback) {
  $.ajax({
    url: '/api/watchlists',
    method: 'POST',
    dataType: 'json',
    data: {
      name: name,
      tickers: tickers,
    },
    success: function (data) {
      console.log('GOT: ' + JSON.stringify(data));
      callback(data);
    },
    fail: function () {
      alert('Error occurred.');
    },
  });
}

function editWatchlist(id, name, tickers, callback) {
  $.ajax({
    url: '/api/watchlists',
    method: 'POST',
    dataType: 'json',
    data: {
      id: id,
      name: name,
      tickers: tickers,
    },
    success: function (data) {
      console.log('GOT: ' + JSON.stringify(data));
      callback(data);
    },
    fail: function () {
      alert('Error occurred.');
    },
  });
}

function createSchedule(o, header, apiUrl, callback) {
  // https://API-ID.execute-api.REGION.amazonaws.com/STAGE
  $.ajax({
    url: apiUrl,
    method: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    crossDomain: true,
    data: JSON.stringify(o),
    headers: header,
    success: function (data) {
      console.log('GOT: ' + JSON.stringify(data));
      callback(data);
    },
    error: function (err) {
      alert('Error occurred. ' + JSON.stringify(err, null, 2));
    },
  });
}

$(document).on('click', '#save', function () {
  var records = [];
  $('table tbody tr').each(function () {
    var record = {
      ticker: $(this).find('.ticker').text(),
      tickerType: $(this)
        .find('td.ticker-type')
        .find('select option:selected')
        .val(),
      horizon: $(this).find('td.horizon').text(),
      price: $(this).find('td.price').text(),
      buyconf: $(this).find('td.buyconf').text(),
      priceTs: $(this).find('td.price-timestamp').text(),
    };
    records.push(record);
  });
  $('#save-string').html(
    '<div> <h3> Save the following string </h3> <span> You can use load your portfolio later by using the upload (<span class="material-icons">file_upload</span>) button. </span> <div class="bg-dark text-light px-2 mt-3">' +
      JSON.stringify(records) +
      '</div></div>'
  );
});

function getTickersForTrading(form, callback) {
  if (form.popular) {
    let listId = form.list;

    if (listId === 'kevin-popular') {
      tickers = POPULAR;
    } else {
      getWatchlist(listId, data => {
        callback(data.assets.map(a => a.symbol));
      });
      return;
    }
  } else {
    tickers = form.tickers.split(',');
  }

  callback(tickers);
}
$(document).on('submit', '#startbot', function (e) {
  e.preventDefault();

  var formData = $('#startbot').serializeArray();
  var form = {};
  formData.forEach(e => {
    form[e.name] = e.value;
  });

  // if both on or both off
  if (form.popular === 'on' && form.tickers !== '') {
    alert('Select only one, either a list or enter your own tickers.');
    return;
  } else if (!form.popular && form.tickers === '') {
    alert('Select at least one, either a list or enter your own tickers.');
    return;
  }

  getTickersForTrading(form, function (tickers) {
    var horizon = form.horizon;
    var opp = {
      opportunities: [],
    };
    $('#spinner').show();
    $('#submit-button').attr('disabled', '');
    $('#result-table tbody').html('');
    $('#submit-trades-button').attr('disabled', '');

    analyzeTicker(tickers, form, 0, opp, opp => {
      $('#spinner').hide();
      $('#submit-button').removeAttr('disabled');
      $('#submit-trades-button').removeAttr('disabled');
      $('#result-message').html(
        'Done finding all the good opportunities. You can now submit them to trade. Press the trade button below to submit your trades.'
      );

      console.log('Final opportunities ' + JSON.stringify(opp));
    });
    window.opportunities = opp;
    window.minTradeAmount = form.minTradeAmount;
    window.maxTradeAmount = form.maxTradeAmount;
  });
});

function analyzeTicker(tickers, form, i, opp, done) {
  var waitTime = i === 0 ? 0 : 1000;

  if (i < tickers.length) {
    window.setTimeout(() => {
      $('#result-message').html(
        'Analyzing ticker ' + tickers[i] + ', it will take a while..'
      );
      getOpportunities(
        [tickers[i]],
        form.horizon,
        form.algoId,
        form.indicator,
        form.minIndicatorValue,
        form.maxIndicatorValue,
        opportunities => {
          opportunities = opportunities.opportunities;
          // because we're looking for only one stock
          var o = opportunities.length > 0 ? opportunities[0] : null;

          if (o !== null) {
            $('#result-table tbody').append(
              '<tr>' +
                '<td >' +
                o.symbol +
                '</td>' +
                '<td > $' +
                o.price +
                '</td>' +
                '<td >' +
                o.indicatorValues[form.indicator].toFixed(2) +
                '% </td>' +
                '<td>' +
                (o.type === 'buy' ? 'Buy' : 'Sell, if own') +
                '</td>' +
                '<td > <input type="checkbox" class="form-checkbox" id="checkbox-' +
                o.symbol +
                '"checked/> </td>' +
                '<td id=trade-status-' +
                o.symbol +
                '> Not yet </td>' +
                '</tr>'
            );
            $('#result-message').html(
              // 'Sleeping for 15 seconds to reduce the load on APIs..'
              'Finding next good opportunity..'
            );
            opp.opportunities = opp.opportunities.concat(opportunities);
          }
          i++;
          analyzeTicker(tickers, form, i, opp, done);
        }
      );
    }, waitTime);
  } else {
    done(opp);
  }
}

function executeTrades(opportunities) {
  trade(opportunities, d => {
    console.log('Trade : ' + JSON.stringify(d, null, 2));
    $('#submit-trades-button').removeAttr('disabled');
    $('#submit-trades-spinner').hide();

    var opp = opportunities.opportunities || [];

    opp.forEach(b => {
      if (b.type === 'buy') {
        $('#trade-status-' + b.symbol).text('No order submitted.');
      } else if (b.type === 'sell') {
        $('#trade-status-' + b.symbol).text('No shares to sell.');
      }
    });

    (d.orders || []).forEach(order => {
      $('#trade-status-' + order.symbol).text(
        'Order submitted for $' + order.notional
      );
    });
  });
}

$(document).on('click', '#submit-trades-button', function (e) {
  $('#submit-trades-spinner').show();
  $('#submit-trades-button').attr('disabled', '');

  var selectedOpp = window.opportunities.opportunities || [];

  selectedOpp = selectedOpp.filter(b => {
    return $('#checkbox-' + b.symbol).prop('checked') === true;
  });

  var opp = {opportunities: selectedOpp};
  executeTrades(opp);
});

$(document).on('submit', '#create-watchlist', function (e) {
  e.preventDefault();
  $('#create-watchlist-spinner').show();
  $('#create-watchlist-button').attr('disabled', '');

  var formData = $('#create-watchlist').serializeArray();
  var o = {};
  formData.forEach(e => {
    o[e.name] = e.value;
  });
  var tickers = o.tickers.split(',').map(t => t.trim());

  createWatchlist(o.name, tickers, data => {
    window.location.replace('/watchlists?id=' + data.id);
  });
});

$(document).on('submit', '#edit-watchlist', function (e) {
  e.preventDefault();
  $('#edit-watchlist-spinner').show();
  $('#edit-watchlist-button').attr('disabled', '');

  var formData = $('#edit-watchlist').serializeArray();
  var o = {};
  formData.forEach(e => {
    o[e.name] = e.value;
  });
  var tickers = o.tickers.split(',').map(t => t.trim());
  editWatchlist(o.id, o.name, tickers, data => {
    window.location.replace('/watchlists?id=' + data.id);
  });
});

$(document).on('click', '#livemoneytogglediv', e => {
  alert(
    "Live money trading is not yet supported on this website. Waiting for Alpaca's approval."
  );
  e.preventDefault();
});

$(document).on('submit', '#create-schedule', function (e) {
  e.preventDefault();
  $('#create-schedule-spinner').show();
  $('#create-schedule-button').attr('disabled', '');

  var formData = $('#create-schedule').serializeArray();
  var o = {};
  formData.forEach(e => {
    o[e.name] = e.value;
  });
  if (o.apikey) {
    o.apikey = o.apikey.trim() === '' ? undefined : o.apikey.trim();
  }
  if (o.apisecret) {
    o.apisecret = o.apisecret.trim() === '' ? undefined : o.apisecret.trim();
  }

  var td = {};
  td.symbols = o.tickers.split(',').map(t => t.trim());
  td.lookBackDays = parseInt(o.lookBackDays);
  td.minTradeAmount = parseInt(o.minTradeAmount);
  td.maxTradeAmount = parseInt(o.maxTradeAmount);
  td.minIndicatorValue = parseFloat(o.minIndicatorValue);
  td.maxIndicatorValue = parseFloat(o.maxIndicatorValue);
  td.algoId = o.algoId.trim();

  var req = {};
  req.cron = o.cron.trim();
  req.paper = o.paper === 'true';
  req.brokerageType = o.brokerageType;
  req.tradeDetails = td;

  var header = {};

  if (o.apikey) {
    (header.apikey = o.apikey), (header.apisecret = o.apisecret);
  } else {
    header.Authorization = `Bearer ${o.accesstoken}`;
  }

  let apiUrl = o.tbotxUrl;
  o.accesstoken = undefined;
  o.apikey = undefined;
  o.apisecret = undefined;

  createSchedule(req, header, apiUrl, function (data) {
    window.location.replace('/automation?id=' + data.ruleArn);
  });
});

$(document).on('submit', '#run-backtest', function (e) {
  // e.preventDefault();
  $('#run-backtest-spinner').show();
  $('#run-backtest-button').attr('disabled', '');
});
