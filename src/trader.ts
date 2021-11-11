import { Order } from '@master-chief/alpaca';

import { AlpacaClient } from './client/AlpacaClient';
import { log } from './Logger';
import { Opportunities, Opportunity } from './OpportunitiesFinder';

export interface AccessToken {
  access_token: string;
  token_type: string;
  scope: string;
  apikey?: string;
  apisecret?: string;
}

export type ActionType = 'buy' | 'sell';
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
    action: ActionType,
    minTradeAmount: number,
    maxTradeAmount: number,
    minIndicatorValue: number,
    maxIndicatorValue: number
  ) {
    let orders: Order[] = [];

    // trade interesting stuff
    (
      await this.executeTrades(
        opportunities.opportunities || [],
        action,
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
    action: ActionType,
    minTradeAmount: number,
    maxTradeAmount: number,
    minIndicatorValue: number,
    maxIndicatorValue: number
  ) {
    const currentPositions = await this.alpacaClient.getPositions();

    // TODO Promise.all may cause burst of request to the service
    // and cause trades to fail
    return await Promise.all(
      opportunities.map(async o => {
        let currentMarketValue = 0;
        if (action === 'sell') {
          const symbolInPortfolio = currentPositions.filter(
            p => p.symbol === o.symbol
          );
          if (
            symbolInPortfolio !== undefined &&
            symbolInPortfolio.length === 1
          ) {
            const totalReturn = symbolInPortfolio[0].unrealized_plpc;
            if (totalReturn < 0) {
              log(
                `Did not submit sell order: ${action} ${o.symbol}, because order has negative total return of ${totalReturn}%. `,
                'error'
              );
              return;
            }
            currentMarketValue = symbolInPortfolio[0].market_value;
          }
        }

        let weightedTradeAmount = 0;
        // a short term fix to support more indicators
        if (maxIndicatorValue == Number.MAX_SAFE_INTEGER) {
          weightedTradeAmount = minTradeAmount * o.indicatorValues[0];
          // we don't consider max trade amount when there is no upper bound to the indicator value
          // weightedTradeAmount = Math.min(weightedTradeAmount, maxTradeAmount);
          log(
            `${action} $${o.symbol} weighted trade amount $${weightedTradeAmount} because Min Trade Amount = ${minTradeAmount} * IndicatorValue = ${o.indicatorValues[0]}`
          );
        } else {
          // normalize the amount based on min,max amount & min,max confidence
          weightedTradeAmount =
            minTradeAmount +
            ((o.indicatorValues[0] - minIndicatorValue) *
              (maxTradeAmount - minTradeAmount)) /
              (maxIndicatorValue - minIndicatorValue);
          log(
            `${action} $${o.symbol} weighted trade amount $${weightedTradeAmount} because Min Trade Amount = ${minTradeAmount}, Max Trade Amount = ${maxTradeAmount}`
          );
        }
        weightedTradeAmount = Math.round(weightedTradeAmount * 100) / 100; // round to 2 decimal places
        log(
          `${action} $${o.symbol} weighted trade amount $${weightedTradeAmount}`
        );

        let order;

        if (weightedTradeAmount < 1.0) {
          log(
            `${action} $${o.symbol} weighted trade amount $${weightedTradeAmount} is less than 1.00, not submitting order.`
          );
          return order;
        }

        if (action == 'sell' && weightedTradeAmount > currentMarketValue) {
          weightedTradeAmount = currentMarketValue; // can not sell beyond the current market value of the equity
        }

        try {
          order = await this.alpacaClient.placeOrder({
            symbol: o.symbol,
            side: action,
            notional: weightedTradeAmount,
          });
          log(
            `Created order: ${order.side} $${order.symbol} filled qty: ${order.filled_qty} @ $${order.qty} type: ${order.type}`,
            'success'
          );
        } catch (ex) {
          log(
            `Error submitting order: ${action} $${
              o.symbol
            } for $${weightedTradeAmount} type: ${action}, because ${JSON.stringify(
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
