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
const MIN_BUY_CONFIDENCE = 80;
const MIN_SELL_CONFIDENCE = 80;

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined
        ? true
        : decodeURIComponent(sParameterName[1]);
    }
  }
};

var ticker = getUrlParameter('t') || 'BTC';
var currency = getUrlParameter('c') || 'USD';
var type = getUrlParameter('type') || 'crypto';
var horizon = getUrlParameter('h') || '365';

console.log(ticker, currency, type, horizon);
var endpoint = `/api/conf?t=${ticker}&c=${currency}&type=${type}&horizon=${horizon}`;

$(function () {
  var fetchedData;
  var chart;
  $.getJSON(endpoint, data => {
    fetchedData = data;
    chart = defineChart(data);
  });

  $('#conf').click(e => {
    chart.addAxis(
      {
        opposite: true,
        id: 'yA1',
      },
      false,
      false,
      false
    );

    console.log(fetchedData.map(v => v[2]));
    chart.addSeries(
      {
        yAxis: 'yA1',
        name: 'Buy Confidence',
        data: fetchedData.map(v => [v[0], v[2]]),
        showInLegend: true,
      },
      true,
      true
    );
    e.preventDefault();
  });
});

function defineChart(data) {
  return new Highcharts.chart('container', {
    chart: {
      zoomType: 'x',
    },
    title: {
      text: 'Buy Confidence',
    },
    subtitle: {
      text:
        document.ontouchstart === undefined
          ? 'Click and drag in the plot area to zoom in'
          : 'Pinch the chart to zoom in',
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: {
      title: {
        text: 'Price',
      },
    },
    legend: {
      enabled: false,
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

    series: [
      {
        type: 'area',
        name: 'Price',
        data: data.map(d => [d[0], d[1]]),
      },
    ],
  });
}

// Highcharts.getJSON(
//     // 'https://cdn.jsdelivr.net/gh/highcharts/highcharts@v7.0.0/samples/data/usdeur.json',

//     function (data) {
//         fetchedData = data;
//         console.log(data)

//     }
// );

// Analytics
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-HGFNWY883M');

// Dynamic Table
function getTickerConf(ticker, tickerType, horizon, callback) {
  $.ajax({
    url: '/api/latestconf',
    dataType: 'json',
    data: {
      t: ticker,
      type: tickerType,
      h: horizon,
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

function getOpportunities(
  tickers,
  horizon,
  buyConfThreshold,
  sellConfThreshold,
  callback
) {
  $.ajax({
    url: '/api/opportunities',
    dataType: 'json',
    data: {
      tickers: tickers.join(','),
      horizon: horizon,
      buyConfThreshold: buyConfThreshold,
      sellConfThreshold: sellConfThreshold,
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
      opp: opportunities,
      minBuyAmount: window.minBuyAmount,
      maxBuyAmount: window.maxBuyAmount,
      buyConfThreshold: MIN_BUY_CONFIDENCE,
      sellConfThreshold: MIN_SELL_CONFIDENCE,
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

$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();

  var actions =
    '<a class="add" title="Add" data-toggle="tooltip"><i class="material-icons">&#xE03B;</i></a>' +
    '<a class="edit" title="Edit" data-toggle="tooltip"><i class="material-icons">&#xE254;</i></a>' +
    '<a class="delete" title="Delete" data-toggle="tooltip"><i class="material-icons">&#xE872;</i></a>';

  // Append table with add row form on add new button click
  $('.add-new').click(function () {
    $(this).attr('disabled', 'disabled');
    var index = $('table tbody tr:last-child').index();
    var row =
      '<tr>' +
      '<td class="ticker"><input type="text" class="form-control" name="ticker"></td>' +
      '<td class="ticker-type"><select class="form-select" name="tickerType"><option value="stocks">Stocks</option><option value="crypto">Crypto</option></td>' +
      '<td class="horizon"><input type="text" class="form-control" name="horizon" value="360"></td></td>' +
      '<td class="price"></td>' +
      '<td class="buyconf"></td>' +
      '<td class="price-timestamp"></td>' +
      '<td>' +
      actions +
      '</td>' +
      '</tr>';
    $('table').append(row);
    $('table tbody tr')
      .eq(index + 1)
      .find('.add, .edit')
      .toggle();
    $('[data-toggle="tooltip"]').tooltip();
  });
  // Add row on add button click
  $(document).on('click', '.add', function () {
    var empty = false;
    var input = $(this).parents('tr').find('input[type="text"]');
    input.each(function () {
      if (!$(this).val()) {
        $(this).addClass('error');
        empty = true;
      } else {
        $(this).removeClass('error');
      }
    });
    $(this).parents('tr').find('.error').first().focus();
    if (!empty) {
      input.each(function () {
        $(this).parent('td').html($(this).val());
      });
      $(this).parents('tr').find('.add, .edit').toggle();
      $('.add-new').removeAttr('disabled');
    }
    var row = $(this).parents('tr');
    var ticker = row.find('td.ticker').text();
    var tickerType = row
      .find('td.ticker-type')
      .find('select option:selected')
      .val();
    var horizon = parseInt(row.find('td.horizon').text());
    row.find('td.price').html('Fetching..');
    row.find('td.buyconf').html('Fetching..');
    row.find('td.price-timestamp').html('Fetching..');

    getTickerConf(ticker, tickerType, horizon, function (data) {
      row.find('td.price').html('$' + data[1]);
      row.find('td.buyconf').html(parseFloat(data[2]).toFixed(2) + '%');
      row.find('td.price-timestamp').html(new Date(data[0]).toUTCString());
    });
  });
  // Edit row on edit button click
  $(document).on('click', '.edit', function () {
    $(this)
      .parents('tr')
      .find('td:not(:last-child)')
      .each(function () {
        var cssClass = $(this).attr('class');

        if (cssClass === 'ticker-type') {
          $(this).html($(this).html());
        } else if (cssClass === 'ticker') {
          $(this).html(
            '<input type="text" class="form-control" value="' +
              $(this).text() +
              '">'
          );
        } else if (cssClass === 'horizon') {
          $(this).html(
            '<input type="text" class="form-control" value="' +
              $(this).text() +
              '">'
          );
        }
      });

    $(this).parents('tr').find('.add, .edit').toggle();
    $('.add-new').attr('disabled', 'disabled');
  });
  // Delete row on delete button click
  $(document).on('click', '.delete', function () {
    $(this).parents('tr').remove();
    $('.add-new').removeAttr('disabled');
  });
});

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

$(document).on('click', '#load', function () {
  $('#load-container').removeClass('d-none');
});
$(document).on('click', '#load-data-button', function () {
  var data = $('#data-to-load').val();
  try {
    data = JSON.parse(data);
  } catch (err) {
    alert('Invalid data: ' + err);
  }
  // remove all rows first
  $('table tbody').html('');
  data.forEach(d => {
    var actions =
      '<a class="add" title="Add" data-toggle="tooltip"><i class="material-icons">&#xE03B;</i></a>' +
      '<a class="edit" title="Edit" data-toggle="tooltip"><i class="material-icons">&#xE254;</i></a>' +
      '<a class="delete" title="Delete" data-toggle="tooltip"><i class="material-icons">&#xE872;</i></a>';
    var row =
      '<tr>' +
      '<td class="ticker">' +
      d.ticker +
      '</td>' +
      '<td class="ticker-type"><select class="form-select" name="tickerType"><option value="stocks" ' +
      (d.tickerType === 'stocks' ? 'selected' : '') +
      '>Stocks</option><option value="crypto" ' +
      (d.tickerType === 'crypto' ? 'selected' : '') +
      '>Crypto</option></td>' +
      '<td class="horizon">' +
      d.horizon +
      '</td></td>' +
      '<td class="price">' +
      d.price +
      '</td>' +
      '<td class="buyconf">' +
      d.buyconf +
      '</td>' +
      '<td class="price-timestamp">' +
      d.priceTs +
      '</td>' +
      '<td>' +
      actions +
      '</td>' +
      '</tr>';
    $('table tbody').append(row);
    $('#load-container').addClass('d-none');
  });
});

$(document).on('click', '#refresh', function () {
  $('table tbody tr').each(function () {
    var record = {
      ticker: $(this).find('.ticker').text(),
      tickerType: $(this)
        .find('td.ticker-type')
        .find('select option:selected')
        .val(),
      horizon: $(this).find('td.horizon').text(),
    };
    var row = $(this);
    row.find('td.price').html('Fetching..');
    row.find('td.buyconf').html('Fetching..');
    row.find('td.price-timestamp').html('Fetching..');

    getTickerConf(
      record.ticker,
      record.tickerType,
      record.horizon,
      function (data) {
        row.find('td.price').html('$' + data[1]);
        row.find('td.buyconf').html(parseFloat(data[2]).toFixed(2) + '%');
        row.find('td.price-timestamp').html(new Date(data[0]).toUTCString());
      }
    );
  });
});

function getTickersForTrading(o, callback) {
  if (o.popular) {
    let listId = o.list;

    if (listId === 'kevin-popular') {
      tickers = POPULAR;
    } else {
      getWatchlist(listId, data => {
        callback(data.assets.map(a => a.symbol));
      });
      return;
    }
  } else {
    tickers = o.tickers.split(',');
  }

  callback(tickers);
}
$(document).on('submit', '#startbot', function (e) {
  e.preventDefault();

  var formData = $('#startbot').serializeArray();
  var o = {};
  formData.forEach(e => {
    o[e.name] = e.value;
  });

  // if both on or both off
  if (o.popular === 'on' && o.tickers !== '') {
    alert('Select only one, either a list or enter your own tickers.');
    return;
  } else if (!o.popular && o.tickers === '') {
    alert('Select at least one, either a list or enter your own tickers.');
    return;
  }
  window.minBuyAmount = o.minBuyAmount
  window.maxBuyAmount = o.maxBuyAmount

  // if (o.alp_access === '' || o.alp_secret === '') {
  //   alert(
  //     'You need to provide your Alpaca access and secret key in order trading bot to run successfully. '
  //   );
  //   return;
  // }
  // window.alp_access = o.alp_access;
  // window.alp_secret = o.alp_secret;

  getTickersForTrading(o, function (tickers) {
    var horizon = o.horizon;
    var opp = {
      buyOpportunities: [],
      sellOpportunities: [],
    };
    $('#spinner').show();
    $('#submit-button').attr('disabled', '');
    $('#result-table tbody').html('');
    $('#submit-trades-button').attr('disabled', '');

    analyzeTicker(tickers, horizon, 0, opp, opp => {
      $('#spinner').hide();
      $('#submit-button').removeAttr('disabled');
      $('#submit-trades-button').removeAttr('disabled');
      $('#result-message').html(
        'Done finding all the good opportunities. You can now submit them to trade. Press the trade button below to submit your trades.'
      );

      console.log('Final opportunities ' + JSON.stringify(opp));
      window.opportunities = opp;
    });
  });
});

function analyzeTicker(tickers, horizon, i, opp, done) {
  var waitTime = i === 0 ? 0 : 15000;
  if (i < tickers.length) {
    window.setTimeout(() => {
      $('#result-message').html(
        'Analyzing ticker ' + tickers[i] + ', it will take a while..'
      );
      getOpportunities(
        [tickers[i]],
        horizon,
        MIN_BUY_CONFIDENCE,
        MIN_SELL_CONFIDENCE,
        d => {
          var o =
            d.buyOpportunities.length > 0
              ? d.buyOpportunities[0]
              : d.sellOpportunities.length > 0
              ? d.sellOpportunities[0]
              : null;

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
                o.buyConfidence.toFixed(2) +
                '% </td>' +
                '<td >' +
                o.sellConfidence.toFixed(2) +
                '% </td>' +
                '<td > <input type="checkbox" class="form-checkbox" id="checkbox-' +
                o.symbol +
                '"checked/> </td>' +
                '<td id=trade-status-' +
                o.symbol +
                '> Not yet </td>' +
                '</tr>'
            );
            $('#result-message').html(
              'Sleeping for 15 seconds to reduce the load on APIs..'
            );
            opp.buyOpportunities = opp.buyOpportunities.concat(
              d.buyOpportunities
            );
            opp.sellOpportunities = opp.sellOpportunities.concat(
              d.sellOpportunities
            );
          }
          i++;
          analyzeTicker(tickers, horizon, i, opp, done);
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

    var buyo = opportunities.buyOpportunities || [];
    var sello = opportunities.sellOpportunities || [];

    buyo.forEach(b => {
      $('#trade-status-' + b.symbol).text('No order submitted.');
    });
    sello.forEach(b => {
      $('#trade-status-' + b.symbol).text('No shares to sell.');
    });
    (d.orders || []).forEach(order => {
      $('#trade-status-' + order.symbol).text('Order submitted.');
    });
  });
}

$(document).on('click', '#submit-trades-button', function (e) {
  $('#submit-trades-spinner').show();
  $('#submit-trades-button').attr('disabled', '');

  var buyo = window.opportunities.buyOpportunities || [];
  var sello = window.opportunities.sellOpportunities || [];

  buyo = buyo.filter(b => {
    return $('#checkbox-' + b.symbol).prop('checked') === true;
  });
  sello = sello.filter(s => {
    return $('#checkbox-' + s.symbol).prop('checked') === true;
  });
  var opp = {buyOpportunities: buyo, sellOpportunities: sello};
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
