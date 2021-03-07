import Alpaca from '@master-chief/alpaca';
import {AccessToken} from '../trader';
import {OrderSide} from '../types';

export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  qty?: number;
  notional?: number;
}
export class AlpacaClient {
  alpaca;
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

  async getPositions() {
    return await this.alpaca.getPositions();
  }

  raw() {
    return this.alpaca;
  }
}
