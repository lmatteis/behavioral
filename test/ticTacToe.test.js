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

const disallowSquareReuse = [
  ...generateThreads(
    allCells,
    cellNumber =>
      function* disallowSquareReuse() {
        const event = e =>
          (e.type === 'X' || e.type === 'O') && e.payload === cellNumber;
        yield {
          wait: [event]
        };
        yield {
          block: [event]
        };
      }
  )
];

function* stopGameAfterWin() {
  yield {
    wait: ['XWins', 'OWins']
  };
  yield {
    block: ['X', 'O']
  };
}

function* defaultMoves() {
  while (true) {
    yield {
      request: [
        { type: 'O', payload: 0 },
        { type: 'O', payload: 1 },
        { type: 'O', payload: 2 },
        { type: 'O', payload: 3 },
        { type: 'O', payload: 4 },
        { type: 'O', payload: 5 },
        { type: 'O', payload: 6 },
        { type: 'O', payload: 7 },
        { type: 'O', payload: 8 }
      ]
    };
  }
}

function* startAtCenter() {
  yield {
    request: [{ type: 'O', payload: 4 }]
  };
}

const preventCompletionOfLineWithTwoXs = generateThreads(
  allLines,
  ([cell1, cell2, cell3]) =>
    function*() {
      const eventFn = matchAny('X', [cell1, cell2, cell3]);
      let line = [cell1, cell2, cell3];

      // Wait for two X's
      yield {
        wait: [eventFn]
      };
      line = line.filter(n => n !== this.lastEvent().payload);
      yield {
        wait: [eventFn]
      };
      line = line.filter(n => n !== this.lastEvent().payload);

      // Request an O
      yield {
        request: [{ type: 'O', payload: line[0] }]
      };
    }
);

test('DetectWins', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [...detectWins];

  threads.forEach(thread => {
    bp.addBThread('', ++priority, thread);
  });

  let foundEvents = [];
  bp.addBThread('except', ++priority, function*() {
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
    }
  });

  bp.run();

  // Play game
  bp.request({ type: 'X', payload: 0 });
  bp.request({ type: 'X', payload: 1 });
  bp.request({ type: 'X', payload: 2 });

  expect(foundEvents).toMatchObject([
    { payload: 0, type: 'X' },
    { payload: 1, type: 'X' },
    { payload: 2, type: 'X' },
    { type: 'XWins' }
  ]);
  done();
});

test('EnforcePlayerTurns with blocking', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [...detectWins, ...enforcePlayerTurns];

  threads.forEach(thread => {
    bp.addBThread('', ++priority, thread);
  });

  let foundEvents = [];
  bp.addBThread('except', ++priority, function*() {
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
    }
  });

  bp.run();

  // Play game
  bp.request({ type: 'X', payload: 0 });
  bp.request({ type: 'X', payload: 1 });
  bp.request({ type: 'X', payload: 2 });
  expect(foundEvents).toMatchObject([{ payload: 0, type: 'X' }]);
  done();
});

test('EnforcePlayerTurns without blocking', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [...detectWins, ...enforcePlayerTurns];

  threads.forEach(thread => {
    bp.addBThread('', ++priority, thread);
  });

  let foundEvents = [];
  bp.addBThread('except', ++priority, function*() {
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
    }
  });

  bp.run();

  // Play game
  bp.request({ type: 'X', payload: 0 });
  bp.request({ type: 'O', payload: 1 });
  bp.request({ type: 'X', payload: 4 });
  bp.request({ type: 'O', payload: 2 });
  bp.request({ type: 'X', payload: 8 });

  expect(foundEvents).toMatchObject([
    { payload: 0, type: 'X' },
    { payload: 1, type: 'O' },
    { payload: 4, type: 'X' },
    { payload: 2, type: 'O' },
    { payload: 8, type: 'X' },
    { type: 'XWins' }
  ]);
  done();
});

test('disallowSquareReuse', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [
    ...detectWins,
    ...enforcePlayerTurns,
    ...disallowSquareReuse
  ];

  threads.forEach(thread => {
    bp.addBThread('', ++priority, thread);
  });

  let foundEvents = [];
  bp.addBThread('except', ++priority, function*() {
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
    }
  });

  bp.run();

  // Play game
  bp.request({ type: 'X', payload: 0 });
  bp.request({ type: 'O', payload: 0 }); // Square reuse
  bp.request({ type: 'X', payload: 4 });
  bp.request({ type: 'O', payload: 2 });
  bp.request({ type: 'X', payload: 8 });

  expect(foundEvents).toMatchObject([
    { payload: 0, type: 'X' },
    { payload: 2, type: 'O' },
    { payload: 8, type: 'X' }
  ]);
  done();
});

test('Doesnt stopGameAfterWin', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [
    ...detectWins,
    ...enforcePlayerTurns,
    ...disallowSquareReuse
    // stopGameAfterWin
  ];

  threads.forEach(thread => {
    bp.addBThread('', ++priority, thread);
  });

  let foundEvents = [];
  bp.addBThread('except', ++priority, function*() {
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
    }
  });

  bp.run();

  // Play game
  bp.request({ type: 'X', payload: 0 });
  bp.request({ type: 'O', payload: 1 });
  bp.request({ type: 'X', payload: 4 });
  bp.request({ type: 'O', payload: 2 });
  bp.request({ type: 'X', payload: 8 });
  bp.request({ type: 'O', payload: 7 });

  expect(foundEvents).toMatchObject([
    { payload: 0, type: 'X' },
    { payload: 1, type: 'O' },
    { payload: 4, type: 'X' },
    { payload: 2, type: 'O' },
    { payload: 8, type: 'X' },
    { type: 'XWins' },
    { payload: 7, type: 'O' }
  ]);
  done();
});

test('stopGameAfterWin', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [
    ...detectWins,
    ...enforcePlayerTurns,
    ...disallowSquareReuse,
    stopGameAfterWin
  ];

  threads.forEach(thread => {
    bp.addBThread('', ++priority, thread);
  });

  let foundEvents = [];
  bp.addBThread('except', ++priority, function*() {
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
    }
  });

  bp.run();

  // Play game
  bp.request({ type: 'X', payload: 0 });
  bp.request({ type: 'O', payload: 1 });
  bp.request({ type: 'X', payload: 4 });
  bp.request({ type: 'O', payload: 2 });
  bp.request({ type: 'X', payload: 8 });
  bp.request({ type: 'O', payload: 7 });

  expect(foundEvents).toMatchObject([
    { payload: 0, type: 'X' },
    { payload: 1, type: 'O' },
    { payload: 4, type: 'X' },
    { payload: 2, type: 'O' },
    { payload: 8, type: 'X' },
    { type: 'XWins' }
  ]);
  done();
});

test('defaultMoves', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [
    ...detectWins,
    ...enforcePlayerTurns,
    ...disallowSquareReuse,
    stopGameAfterWin,
    defaultMoves
  ];

  threads.forEach(thread => {
    bp.addBThread('', ++priority, thread);
  });

  let foundEvents = [];
  bp.addBThread('except', ++priority, function*() {
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
    }
  });

  bp.run();

  // Play game
  bp.request({ type: 'X', payload: 0 });
  bp.request({ type: 'X', payload: 4 });
  bp.request({ type: 'X', payload: 8 });

  expect(foundEvents).toMatchObject([
    { payload: 0, type: 'X' },
    { payload: 1, type: 'O' },
    { payload: 4, type: 'X' },
    { payload: 2, type: 'O' },
    { payload: 8, type: 'X' },
    { type: 'XWins' }
  ]);
  done();
});

test('startAtCenter', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [
    ...detectWins,
    ...enforcePlayerTurns,
    ...disallowSquareReuse,
    stopGameAfterWin,
    startAtCenter,
    defaultMoves
  ];

  threads.forEach(thread => {
    bp.addBThread('', ++priority, thread);
  });

  let foundEvents = [];
  bp.addBThread('except', ++priority, function*() {
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
    }
  });

  bp.run();

  // Play game
  bp.request({ type: 'X', payload: 0 });
  bp.request({ type: 'X', payload: 4 });
  bp.request({ type: 'X', payload: 8 });

  expect(foundEvents).toMatchObject([
    { payload: 0, type: 'X' },
    { payload: 4, type: 'O' },
    { payload: 8, type: 'X' },
    { payload: 1, type: 'O' }
  ]);
  done();
});

test('preventCompletionOfLineWithTwoXs', done => {
  const bp = new BProgram();
  let priority = 0;

  const threads = [
    ...detectWins,
    ...enforcePlayerTurns,
    ...disallowSquareReuse,
    stopGameAfterWin,
    ...preventCompletionOfLineWithTwoXs,
    startAtCenter,
    defaultMoves
  ];

  threads.forEach(thread => {
    bp.addBThread('', ++priority, thread);
  });

  let foundEvents = [];
  bp.addBThread('except', ++priority, function*() {
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
    }
  });

  bp.run();

  // Play game
  bp.request({ type: 'X', payload: 0 });
  bp.request({ type: 'X', payload: 3 });

  expect(foundEvents).toMatchObject([
    { payload: 0, type: 'X' },
    { payload: 4, type: 'O' },
    { payload: 3, type: 'X' },
    { payload: 6, type: 'O' }
  ]);
  done();
});
