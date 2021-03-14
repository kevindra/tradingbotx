import {AlpacaClient} from './client/AlpacaClient';
import {Opportunities, Opportunity} from './OpportunitiesFinder';
import {Order} from '@master-chief/alpaca';
import {log} from './Logger';

export interface AccessToken {
  access_token: string;
  token_type: string;
  scope: string;
  apikey?: string;
  apisecret?: string;
}

/**
 * Given a list of opportunities, Trader trades them.
 */
export class Trader {
  alpacaClient: AlpacaClient;
  constructor(
    accessToken: AccessToken,
    isLiveMoney: boolean,
    apikey?: string,
    apisecret?: string
  ) {
    this.alpacaClient = new AlpacaClient(
      accessToken,
      isLiveMoney,
      apikey,
      apisecret
    );
  }

  async performTrades(
    opportunities: Opportunities,
    minTradeAmount: number,
    maxTradeAmount: number,
    minIndicatorValue: number,
    maxIndicatorValue: number
  ) {
    let orders: Order[] = [];

    // buy interesting stuff
    (
      await this.executeTrades(
        opportunities.opportunities || [],
        minTradeAmount,
        maxTradeAmount,
        minIndicatorValue,
        maxIndicatorValue
      )
    ).map(o => {
      if (o !== undefined) orders.push(o);
    });

    return orders;
  }

  private async executeTrades(
    opportunities: Opportunity[],
    minTradeAmount: number,
    maxTradeAmount: number,
    minIndicatorValue: number,
    maxIndicatorValue: number
  ) {
    // TODO Promise.all may cause burst of request to the service
    // and cause trades to fail
    return await Promise.all(
      opportunities.map(async o => {
        // normalize the amount based on min,max amount & min,max confidence
        let weightedTradeAmount =
          minTradeAmount +
          ((o.indicatorValues[0] - minIndicatorValue) *
            (maxTradeAmount - minTradeAmount)) /
            (maxIndicatorValue - minIndicatorValue);
        weightedTradeAmount = Math.floor(weightedTradeAmount);

        log(`${o.type} $${o.symbol} amount $${weightedTradeAmount}`);

        let order;
        try {
          order = await this.alpacaClient.placeOrder({
            symbol: o.symbol,
            side: o.type,
            notional: weightedTradeAmount,
          });
          log(
            `Created order: ${order.side} $${order.symbol} filled qty: ${order.filled_qty} @ $${order.qty} type: ${order.type}`,
            'success'
          );
        } catch (ex) {
          log(
            `Error submitting order: ${o.type} $${
              o.symbol
            } for $${weightedTradeAmount} type: buy, because ${JSON.stringify(
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
}
