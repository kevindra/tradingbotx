import {AlpacaClient} from './client/AlpacaClient';
import {Opportunities, Opportunity} from './OpportunitiesFinder';
import {Order} from '@master-chief/alpaca';
import {min} from 'lodash';

let chalk = require('chalk');

export interface AccessToken {
  access_token: string;
  token_type: string;
  scope: string;
}
export class Trader {
  alpacaClient: AlpacaClient;
  constructor(accessToken: AccessToken, isLiveMoney: boolean) {
    this.alpacaClient = new AlpacaClient(accessToken, isLiveMoney);
  }

  async performTrades(
    opportunities: Opportunities,
    minBuyAmount: number,
    maxBuyAmount: number,
    buyConfThreshold: number,
    sellConfThreshold: number
  ) {
    let orders: Order[] = [];

    // buy interesting stuff
    const buyOpportunities = opportunities.buyOpportunities || [];
    (
      await this.executeBuyTrades(
        buyOpportunities,
        minBuyAmount,
        maxBuyAmount,
        buyConfThreshold
      )
    ).map(o => {
      if (o !== undefined) orders.push(o);
    });

    // sell not so interesting stuff
    const sellOpportunities = opportunities.sellOpportunities || [];
    (await this.executeSellTrades(sellOpportunities)).map(o => {
      if (o !== undefined) orders.push(o);
    });

    return orders;
  }

  private async executeBuyTrades(
    buyOpportunities: Opportunity[],
    minBuyAmount: number,
    maxBuyAmount: number,
    buyConfThreshold: number
  ) {
    return await Promise.all(
      buyOpportunities.map(async o => {
        // normalize the amount based on min,max amount & min,max confidence
        let weightedAmountToInvest =
          minBuyAmount +
          ((o.buyConfidence - buyConfThreshold) *
            (maxBuyAmount - minBuyAmount)) /
            (100 - buyConfThreshold);
        weightedAmountToInvest = Math.floor(weightedAmountToInvest);

        this.log(`Buy $${o.symbol} amount $${weightedAmountToInvest}`);

        let order;
        try {
          order = await this.alpacaClient.placeOrder({
            symbol: o.symbol,
            side: 'buy',
            notional: weightedAmountToInvest,
          });
          this.log(
            `Created order: $${order.symbol} filled qty: ${order.filled_qty} @ $${order.qty} type: ${order.type}`,
            'success'
          );
        } catch (ex) {
          this.log(
            `Error submitting order: $${
              o.symbol
            } for $${weightedAmountToInvest} type: buy, because ${JSON.stringify(
              ex,
              null,
              2
            )}`,
            'error'
          );
        }
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
        let order;
        try {
          order = await this.alpacaClient.placeOrder({
            side: 'sell',
            symbol: p.symbol,
            qty: p.qty,
          });
          console.log(
            `Sell order submitted: ${JSON.stringify(order, null, 2)}`
          );
        } catch (ex) {
          this.log(
            `Error sumbitting order: $${p.symbol} for $${
              p.qty
            } type: buy, because ${JSON.stringify(ex, null, 2)}`,
            'error'
          );
        }
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
