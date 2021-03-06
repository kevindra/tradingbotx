import {AlpacaClient} from './client/AlpacaClient';
import {Opportunities, Opportunity} from './OpportunitiesFinder';
import {Order} from '@master-chief/alpaca';

let chalk = require('chalk');

export interface AccessToken {
  access_token: string,
  token_type: string,
  scope: string
}
export class Trader {
  alpacaClient: AlpacaClient;
  constructor(accessToken: AccessToken) {
    this.alpacaClient = new AlpacaClient(accessToken);
  }

  async performTrades(
    opportunities: Opportunities,
    perTradeMaxDollar = 200
  ) {
    let orders: Order[] = [];

    // buy interesting stuff
    const buyOpportunities = opportunities.buyOpportunities || [];
    orders.push(
      ...(await this.executeBuyTrades(buyOpportunities, perTradeMaxDollar))
    );

    // sell not so interesting stuff
    const sellOpportunities = opportunities.sellOpportunities || [];
    orders.push(...(await this.executeSellTrades(sellOpportunities)));
    return orders;
  }

  private async executeBuyTrades(
    buyOpportunities: Opportunity[],
    perTradeMaxDollar = 200
  ) {
    return await Promise.all(
      buyOpportunities.map(async o => {
        this.log(`Buy $${o.symbol} amount $${perTradeMaxDollar}`);

        const order = await this.alpacaClient.placeOrder({
          symbol: o.symbol,
          side: 'buy',
          notional: perTradeMaxDollar,
        });
        this.log(
          `Created order: $${order.symbol} filled qty: ${order.filled_qty} @ $${order.qty} type: ${order.type}`,
          'success'
        );
        return order;
      })
    );
  }

  private async executeSellTrades(sellOpportunities: Opportunity[]) {
    let positions = await this.alpacaClient.getPositions();

    // if account has current positions that are in sell opportunities
    const positionsToSell = positions.filter(p => {
      return sellOpportunities.filter(o => o.symbol === p.symbol).length > 0;
    });

    return await Promise.all(
      positionsToSell.map(async p => {
        const order = await this.alpacaClient.placeOrder({
          side: 'sell',
          symbol: p.symbol,
          qty: p.qty,
        });
        console.log(`Sell order submitted: ${JSON.stringify(order, null, 2)}`);
        return order;
      })
    );
  }

  private log(text: string, type = 'info') {
    if (type == 'info') {
      console.log(chalk.green(`info: ${text}`));
    } else if (type == 'heading') {
      console.log(chalk.blue(text));
    } else if (type == 'success') {
      console.log(chalk.green(`🎉 success: ${text}`));
    } else if (type == 'error') {
      console.log(chalk.red(text));
    }
  }
}