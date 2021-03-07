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
  accessToken;
  constructor(accessToken: AccessToken) {
    this.alpaca = new Alpaca.AlpacaClient({
      credentials: {
        // key: process.env.ALP_API_KEY || accessKey,
        // secret: process.env.ALP_SECURITY_KEY || secretKey,
        access_token: accessToken.access_token,
        paper: process.env.ALP_LIVE_MONEY !== 'true',
        // usePolygon: false,
      },
      rate_limit: false,
    });
    this.accessToken = accessToken;
  }

  /**
   * Places a market order with day as time_in_force.
   */
  async placeOrder(order: OrderRequest) {
    try {
      return await this.alpaca.placeOrder({
        symbol: order.symbol,
        qty: order.qty,
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
  async updateWatchlist(id: string, name: string, tickers: string[]) {
    const url =
      (process.env.ALP_LIVE_MONEY === 'true'
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
            Authorization: `Bearer ${this.accessToken.access_token}`,
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
