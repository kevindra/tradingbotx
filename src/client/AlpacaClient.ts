import Alpaca from '@master-chief/alpaca';
import {OrderSide} from '../types';

export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  qty?: number;
  notional?: number;
}
export class AlpacaClient {
  alpaca;
  constructor() {
    this.alpaca = new Alpaca.AlpacaClient({
      credentials: {
        key: process.env.ALP_API_KEY || 'PK1GIX30SSW0MI9O4SIP',
        secret:
          process.env.ALP_SECURITY_KEY ||
          'YEaKCvNTuB69xcrTLQXZg8YaaSOcbddPNdcRfNJd',
        paper: true,
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
}

// module.exports = new AlpacaClient();

// let ac = new AlpacaClient();
// ac.placeOrder('AAPL', 1, 'buy').then((o) => console.log(JSON.stringify(o)));
// ac.placeOrder('AAPL', 1, 'buy').then((o) => console.log(JSON.stringify(o)));
// ac.placeOrder('AAPL', 1, 'buy').then((o) => console.log(JSON.stringify(o)));
// ac.placeOrder('AAPL', 1, 'buy').then((o) => console.log(JSON.stringify(o)));
