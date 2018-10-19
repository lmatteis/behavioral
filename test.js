import BProgram from './index';

test('Add hot water 3 times', done => {
  const bp = new BProgram();

  bp.addBThread('Add hot water 3 times', 1, function*() {
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

  bp.addBThread('except', 2, function*() {
    let foundEvents = [];
    while (true) {
      yield {
        wait: [() => true]
      };
      foundEvents.push(this.lastEvent);
      if (foundEvents.length === 3) {
        expect(foundEvents).toEqual([
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
