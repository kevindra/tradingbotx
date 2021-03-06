import Alpaca from '@master-chief/alpaca';
import {OrderSide} from '../types';

export class AlpacaClient {
  alpaca;
  constructor() {
    this.alpaca = new Alpaca.AlpacaClient({
      credentials: {
        key: process.env.ALP_API_KEY || '',
        secret: process.env.ALP_SECURITY_KEY || '',
        paper: true,
        // usePolygon: false,
      },
      rate_limit: false,
    });
  }

  /**
   * Places a market order with day as time_in_force.
   */
  async placeOrder(
    symbol: string,
    side: OrderSide,
    qty?: number,
    notional?: number
  ) {
    let order;
    try {
      order = await this.alpaca.placeOrder({
        symbol: symbol,
        qty: qty,
        notional: notional,
        side: side,
        type: 'market',
        time_in_force: 'day',
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
    return order;
  }
}

// module.exports = new AlpacaClient();

// let ac = new AlpacaClient();
// ac.placeOrder('AAPL', 1, 'buy').then((o) => console.log(JSON.stringify(o)));
// ac.placeOrder('AAPL', 1, 'buy').then((o) => console.log(JSON.stringify(o)));
// ac.placeOrder('AAPL', 1, 'buy').then((o) => console.log(JSON.stringify(o)));
// ac.placeOrder('AAPL', 1, 'buy').then((o) => console.log(JSON.stringify(o)));
