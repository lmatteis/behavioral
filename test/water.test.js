import BProgram from '../index';

test('Add hot water 3 times', done => {
  const bp = new BProgram();
  let priority = 0;

  bp.addBThread('Add hot water 3 times', ++priority, function*() {
    yield {
      request: [{ type: 'HOT' }]
    };
    yield {
      request: [{ type: 'HOT' }]
    };
    yield {
      request: [{ type: 'HOT' }]
    };
  });

  bp.addBThread('except', ++priority, function*() {
    let foundEvents = [];
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
      if (foundEvents.length === 3) {
        expect(foundEvents).toMatchObject([
          { type: 'HOT' },
          { type: 'HOT' },
          { type: 'HOT' }
        ]);
        done();
      }
    }
  });
  bp.run();
});

test('Add hot/cold water 3 times', done => {
  const bp = new BProgram();
  let priority = 0;

  bp.addBThread('Add hot water 3 times', ++priority, function*() {
    yield {
      request: [{ type: 'HOT' }]
    };
    yield {
      request: [{ type: 'HOT' }]
    };
    yield {
      request: [{ type: 'HOT' }]
    };
  });

  bp.addBThread('Add cold water 3 times', ++priority, function*() {
    yield {
      request: [{ type: 'COLD' }]
    };
    yield {
      request: [{ type: 'COLD' }]
    };
    yield {
      request: [{ type: 'COLD' }]
    };
  });

  bp.addBThread('except', ++priority, function*() {
    let foundEvents = [];
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
      if (foundEvents.length === 6) {
        expect(foundEvents).toMatchObject([
          { type: 'HOT' },
          { type: 'HOT' },
          { type: 'HOT' },
          { type: 'COLD' },
          { type: 'COLD' },
          { type: 'COLD' }
        ]);
        done();
      }
    }
  });
  bp.run();
});

test('Interleave', done => {
  const bp = new BProgram();
  let priority = 0;

  bp.addBThread('Add hot water 3 times', ++priority, function*() {
    yield {
      request: [{ type: 'HOT' }]
    };
    yield {
      request: [{ type: 'HOT' }]
    };
    yield {
      request: [{ type: 'HOT' }]
    };
  });

  bp.addBThread('Add cold water 3 times', ++priority, function*() {
    yield {
      request: [{ type: 'COLD' }]
    };
    yield {
      request: [{ type: 'COLD' }]
    };
    yield {
      request: [{ type: 'COLD' }]
    };
  });

  bp.addBThread('Interleave', ++priority, function*() {
    while (true) {
      yield {
        wait: [{ type: 'HOT' }],
        block: [{ type: 'COLD' }]
      };
      yield {
        wait: [{ type: 'COLD' }],
        block: [{ type: 'HOT' }]
      };
    }
  });

  bp.addBThread('except', ++priority, function*() {
    let foundEvents = [];
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
      if (foundEvents.length === 6) {
        expect(foundEvents).toMatchObject([
          { type: 'HOT' },
          { type: 'COLD' },
          { type: 'HOT' },
          { type: 'COLD' },
          { type: 'HOT' },
          { type: 'COLD' }
        ]);
        done();
      }
    }
  });
  bp.run();
});

test('Interleave without arrays', done => {
  const bp = new BProgram();
  let priority = 0;

  bp.addBThread('Add hot water 3 times', ++priority, function*() {
    yield {
      request: { type: 'HOT' }
    };
    yield {
      request: { type: 'HOT' }
    };
    yield {
      request: { type: 'HOT' }
    };
  });

  bp.addBThread('Add cold water 3 times', ++priority, function*() {
    yield {
      request: { type: 'COLD' }
    };
    yield {
      request: { type: 'COLD' }
    };
    yield {
      request: { type: 'COLD' }
    };
  });

  bp.addBThread('Interleave', ++priority, function*() {
    while (true) {
      yield {
        wait: { type: 'HOT' },
        block: { type: 'COLD' }
      };
      yield {
        wait: { type: 'COLD' },
        block: { type: 'HOT' }
      };
    }
  });

  bp.addBThread('except', ++priority, function*() {
    let foundEvents = [];
    while (true) {
      yield {
        wait: () => true
      };
      foundEvents.push(this.lastEvent());
      if (foundEvents.length === 6) {
        expect(foundEvents).toMatchObject([
          { type: 'HOT' },
          { type: 'COLD' },
          { type: 'HOT' },
          { type: 'COLD' },
          { type: 'HOT' },
          { type: 'COLD' }
        ]);
        done();
      }
    }
  });
  bp.run();
});

test('Without objects but arrays', done => {
  const bp = new BProgram();
  let priority = 0;

  bp.addBThread('Add hot water 3 times', ++priority, function*() {
    yield {
      request: ['HOT']
    };
    yield {
      request: ['HOT']
    };
    yield {
      request: ['HOT']
    };
  });

  bp.addBThread('Add cold water 3 times', ++priority, function*() {
    yield {
      request: ['COLD']
    };
    yield {
      request: ['COLD']
    };
    yield {
      request: ['COLD']
    };
  });

  bp.addBThread('Interleave', ++priority, function*() {
    while (true) {
      yield {
        wait: ['HOT'],
        block: ['COLD']
      };
      yield {
        wait: ['COLD'],
        block: ['HOT']
      };
    }
  });

  bp.addBThread('except', ++priority, function*() {
    let foundEvents = [];
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent());
      if (foundEvents.length === 6) {
        expect(foundEvents).toMatchObject([
          { type: 'HOT' },
          { type: 'COLD' },
          { type: 'HOT' },
          { type: 'COLD' },
          { type: 'HOT' },
          { type: 'COLD' }
        ]);
        done();
      }
    }
  });
  bp.run();
});

test('Without objects', done => {
  const bp = new BProgram();
  let priority = 0;

  bp.addBThread('Add hot water 3 times', ++priority, function*() {
    yield {
      request: 'HOT'
    };
    yield {
      request: 'HOT'
    };
    yield {
      request: 'HOT'
    };
  });

  bp.addBThread('Add cold water 3 times', ++priority, function*() {
    yield {
      request: 'COLD'
    };
    yield {
      request: 'COLD'
    };
    yield {
      request: 'COLD'
    };
  });

  bp.addBThread('Interleave', ++priority, function*() {
    while (true) {
      yield {
        wait: 'HOT',
        block: 'COLD'
      };
      yield {
        wait: 'COLD',
        block: 'HOT'
      };
    }
  });

  bp.addBThread('except', ++priority, function*() {
    let foundEvents = [];
    while (true) {
      yield {
        wait: () => true
      };
      foundEvents.push(this.lastEvent());
      if (foundEvents.length === 6) {
        expect(foundEvents).toMatchObject([
          { type: 'HOT' },
          { type: 'COLD' },
          { type: 'HOT' },
          { type: 'COLD' },
          { type: 'HOT' },
          { type: 'COLD' }
        ]);
        done();
      }
    }
  });
  bp.run();
});

test('With functions', done => {
  const bp = new BProgram();
  let priority = 0;

  bp.addBThread('Add hot water 3 times', ++priority, function*() {
    yield {
      request: 'HOT'
    };
    yield {
      request: 'HOT'
    };
    yield {
      request: 'HOT'
    };
  });

  bp.addBThread('Add cold water 3 times', ++priority, function*() {
    yield {
      request: 'COLD'
    };
    yield {
      request: 'COLD'
    };
    yield {
      request: 'COLD'
    };
  });

  bp.addBThread('Interleave', ++priority, function*() {
    while (true) {
      yield {
        wait: event => event.type === 'HOT',
        block: event => event.type === 'COLD'
      };
      yield {
        wait: event => event.type === 'COLD',
        block: event => event.type === 'HOT'
      };
    }
  });

  bp.addBThread('except', ++priority, function*() {
    let foundEvents = [];
    while (true) {
      yield {
        wait: () => true
      };
      foundEvents.push(this.lastEvent());
      if (foundEvents.length === 6) {
        expect(foundEvents).toMatchObject([
          { type: 'HOT' },
          { type: 'COLD' },
          { type: 'HOT' },
          { type: 'COLD' },
          { type: 'HOT' },
          { type: 'COLD' }
        ]);
        done();
      }
    }
  });
  bp.run();
});
