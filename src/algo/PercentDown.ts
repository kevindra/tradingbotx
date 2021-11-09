import { Algo, AlgoActionType, AlgoInput, AlgoOutput } from './algo';

interface Event {
  indicatorValue: number;
}

export class PercentDown implements Algo {
  async run(algoInput: AlgoInput): Promise<AlgoOutput> {
    const events: Event[] = [
      {
        indicatorValue: 0,
      },
    ];

    for (let i = 1; i < algoInput.adjustedClose.length; i++) {
      const prevClose = algoInput.adjustedClose[i - 1];
      const currentClose = algoInput.adjustedClose[i];
      if (prevClose <= currentClose) {
        events.push({
          indicatorValue: 0,
        });
      } else {
        const percentDown = (100 * (prevClose - currentClose)) / prevClose;
        events.push({
          indicatorValue: percentDown,
        });
      }
    }

    return {
      indicators: [
        events.map(e => e.indicatorValue || 0), // given end date values
        events.map(e => e.indicatorValue || 0), // historical values
      ],
    };
  }

  actionType(): AlgoActionType {
    return 'buy';
  }

  name(): string {
    return 'Percent Down';
  }

  id(): string {
    return 'PercentDown';
  }
}
