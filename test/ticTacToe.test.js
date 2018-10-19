import BProgram from '../index';

function generateThreads(fnGenerator, fn) {
  let threads = [];
  for (let o of fnGenerator()) {
    threads.push(fn(o));
  }
  return threads;
}

function* allLines() {
  // Horizontal lines
  yield [0, 1, 2];
  yield [3, 4, 5];
  yield [6, 7, 8];

  // Vertical lines
  yield [0, 3, 6];
  yield [1, 4, 7];
  yield [2, 5, 8];

  // Diagonal
  yield [0, 4, 8];
  yield [2, 4, 6];
}

export const matchAny = (inputEvent, [x1, x2, x3]) => event => {
  const cellNumber = event.payload;
  return (
    event.type === inputEvent &&
    (cellNumber === x1 || cellNumber === x2 || cellNumber === x3)
  );
};

export function* allCells() {
  yield 0;
  yield 1;
  yield 2;
  yield 3;
  yield 4;
  yield 5;
  yield 6;
  yield 7;
  yield 8;
}

const detectWins = [
  ...generateThreads(
    allLines,
    ([cell1, cell2, cell3]) =>
      function* detectWinByX() {
        const eventFn = matchAny('X', [cell1, cell2, cell3]);
        yield {
          wait: [eventFn]
        };
        yield {
          wait: [eventFn]
        };
        yield {
          wait: [eventFn]
        };
        yield {
          request: ['XWins']
        };
      }
  ),
  ...generateThreads(
    allLines,
    ([cell1, cell2, cell3]) =>
      function* detectWinByO() {
        const eventFn = matchAny('O', [cell1, cell2, cell3]);
        yield {
          wait: [eventFn]
        };
        yield {
          wait: [eventFn]
        };
        yield {
          wait: [eventFn]
        };
        yield {
          request: ['OWins']
        };
      }
  )
];

const enforcePlayerTurns = [
  function* enforcePlayerTurns() {
    while (true) {
      yield { wait: ['X'], block: ['O'] };
      yield { wait: ['O'], block: ['X'] };
    }
  }
];

test('DetectWins', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [...detectWins];

  threads.forEach(thread => {
    bp.addBThread('DetectWins', ++priority, thread);
  });

  bp.addBThread('except', ++priority, function*() {
    let foundEvents = [];
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent);
      if (foundEvents.length === 4) {
        expect(foundEvents).toEqual([
          { payload: 0, type: 'X' },
          { payload: 1, type: 'X' },
          { payload: 2, type: 'X' },
          { type: 'XWins' }
        ]);
        done();
      }
    }
  });

  bp.run();

  // Play game
  bp.event({ type: 'X', payload: 0 });
  bp.event({ type: 'X', payload: 1 });
  bp.event({ type: 'X', payload: 2 });
});

test('EnforcePlayerTurns with blocking', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [...detectWins, ...enforcePlayerTurns];

  threads.forEach(thread => {
    bp.addBThread('DetectWins', ++priority, thread);
  });

  bp.addBThread('except', ++priority, function*() {
    let foundEvents = [];
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent);
      if (foundEvents.length === 1) {
        expect(foundEvents).toEqual([{ payload: 0, type: 'X' }]);
        done();
      }
    }
  });

  bp.run();

  // Play game
  bp.event({ type: 'X', payload: 0 });
  bp.event({ type: 'X', payload: 1 });
  bp.event({ type: 'X', payload: 2 });
});

test('EnforcePlayerTurns without blocking', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [...detectWins, ...enforcePlayerTurns];

  threads.forEach(thread => {
    bp.addBThread('DetectWins', ++priority, thread);
  });

  bp.addBThread('except', ++priority, function*() {
    let foundEvents = [];
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent);
      if (foundEvents.length === 3) {
        expect(foundEvents).toEqual([
          { payload: 0, type: 'X' },
          { payload: 1, type: 'O' },
          { payload: 2, type: 'X' }
        ]);
        done();
      }
    }
  });

  bp.run();

  // Play game
  bp.event({ type: 'X', payload: 0 });
  bp.event({ type: 'O', payload: 1 });
  bp.event({ type: 'X', payload: 2 });
});
