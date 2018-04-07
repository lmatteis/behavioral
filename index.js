const BProgram = require('./bp').default

function* hot() {
  yield { wait: 'waterLevelLow' }
  for (var x = 1; x <= 3; x++) {
    yield { request: ['addHot'] }
  }
}

function* cold() {
  yield { wait: 'waterLevelLow' }
  for (var x = 1; x <= 3; x++) {
    yield { request: ['addCold'] }
  }
}

function* interleave() {
  while (true) {
    yield { wait: ['addHot'], block: ['addCold'] }
    yield { wait: ['addCold'], block: ['addHot'] }
  }
}

function* log() {
  while (true) {
    const v = yield { wait: ['addHot', 'addCold'] }
    console.log('event:', v)
  }
}

const bp = new BProgram()
let pr = 1
bp.addBThread('Add hot 3 times', pr++, hot)
bp.addBThread('Add cold 3 times', pr++, cold)
bp.addBThread('Interleave', pr++, interleave)
bp.addBThread('Log', pr++, log)

bp.event('waterLevelLow')

bp.run()
