# Algorithm Repositories

## BuyLow Algorithm

`BuyLow` algorithm finds attractive stocks to buy. It measures the dip percent from the previous high and then finds the percentage dip per interval. It then normalizes the values and returns them as buy confidences. This algorithm can quickly find if a stock has gone down too much too fast relative to its given past time frame. In a bull market, it can come very handy.

## SellHigh Algorithm

`SellHigh` algorithm is just opposite of what `BuyLow` does. Essentially it is `100 - BuyLow`. 