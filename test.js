import BProgram from './index';

test('add hot/cold water', () => {
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
  bp.run();
  console.log('wow');
});
