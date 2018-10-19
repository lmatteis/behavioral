```js
yarn add behavioral
```

```js
import BProgram from 'behavioral';

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

bp.addBThread('console.log', ++priority, function*() {
  while (true) {
    yield {
      wait: () => true
    };
    console.log(this.lastEvent());
  }
});

bp.run();
```
