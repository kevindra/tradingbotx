import Alpaca from '@master-chief/alpaca';
import {AccessToken} from '../trader';
import {OrderSide} from '../types';
import request from 'request';

export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  qty?: number;
  notional?: number;
}

export class AlpacaClient {
  alpaca;
  accessToken: AccessToken | undefined;
  apiKey;
  secret;

  constructor(
    accessToken: AccessToken,
    isLiveMoney: boolean,
    apikey?: string,
    apisecret?: string
  ) {
    console.log(
      `initializing alpaca with ${JSON.stringify(
        accessToken
      )}, key: ${apikey}, secret: ${apisecret}, liveMoney: ${isLiveMoney}, typeof liveMoney ${typeof isLiveMoney}`
    );

    if (apikey) {
      this.alpaca = new Alpaca.AlpacaClient({
        credentials: {
          key: apikey,
          secret: apisecret || '',
          paper: !isLiveMoney,
        },
      });
      this.apiKey = apikey;
      this.secret = apisecret;
    } else if (process.env.ALP_OAUTH_DISABLED === 'true') {
      if (process.env.ALP_USE_LIVE_MONEY === 'true') {
        this.alpaca = new Alpaca.AlpacaClient({
          credentials: {
            key: process.env.ALP_API_KEY_LIVE || '',
            secret: process.env.ALP_API_SECRET_KEY_LIVE || '',
            paper: false,
          },
        });
        this.apiKey = process.env.ALP_API_KEY_LIVE;
        this.secret = process.env.ALP_API_SECRET_KEY_LIVE;
      } else {
        this.alpaca = new Alpaca.AlpacaClient({
          credentials: {
            key: process.env.ALP_API_KEY || '',
            secret: process.env.ALP_API_SECRET_KEY || '',
            paper: true,
          },
        });
        this.apiKey = process.env.ALP_API_KEY;
        this.secret = process.env.ALP_API_SECRET_KEY;
      }
    } else {
      this.alpaca = new Alpaca.AlpacaClient({
        credentials: {
          access_token: accessToken.access_token, // accessToken must be present for OAUTH
          paper: !isLiveMoney,
        },
        rate_limit: false,
      });
    }
    this.accessToken = accessToken;
  }

  /**
   * Places a market order with day as time_in_force.
   */
  async placeOrder(order: OrderRequest) {
    try {
      return await this.alpaca.placeOrder({
        symbol: order.symbol,
        // qty: order.qty,
        notional: order.notional,
        side: order.side,
        type: 'market',
        time_in_force: 'day',
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // update watchlist in the sdk doesn't work.. so i wrote my own
  async updateWatchlist(
    id: string,
    name: string,
    tickers: string[],
    isLiveMoney: boolean
  ) {
    const url =
      (isLiveMoney
        ? `https://api.alpaca.markets/v2/watchlists/`
        : `https://paper-api.alpaca.markets/v2/watchlists/`) + id;

    const params = {
      name: name,
      symbols: tickers,
    };
    return new Promise((resolve, reject) => {
      request.put(
        {
          url: url,
          json: params,
          headers: {
            // either api/secret or access token will be set
            Authorization:
              this.accessToken !== undefined
                ? `Bearer ${this.accessToken.access_token}`
                : undefined,
            'APCA-API-KEY-ID': this.apiKey,
            'APCA-API-SECRET-KEY': this.secret,
          },
        },
        (err, res, body) => {
          if (err) {
            reject(body);
          } else {
            resolve(body);
          }
        }
      );
    });
  }

  async getPositions() {
    return await this.alpaca.getPositions();
  }

  raw() {
    return this.alpaca;
  }
}
