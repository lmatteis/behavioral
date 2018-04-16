import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

function asyncData(data, ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data)
    }, ms)
  })
}

function fetchComments(ms) {
  return asyncData([
    { id: 1, comment: 'I love Behavioral Programming' },
    { id: 2, comment: 'I think React works well with BP' }
  ], ms)
}

const BProgram = require('./bp').default
const bp = new BProgram()
let pr = 1

bp.run()

function withBehavior(WrappedComponent, threads) {
  // ...and returns another component...
  return class extends React.Component {
    state = {}
    componentDidMount() {
      threads.forEach(thread =>
        bp.addBThread(``, pr++, thread)
      )
      var that = this
      bp.addBThread('Log', pr++, function* () {
        while (true) {
          yield {
            wait: [(event, payload) => {
              // console.log('event', event, payload)
              if (event.startsWith('SET_STATE')) {
                that.setState(payload)
              }
              return true
            }]
          }
        }
      })
      bp.run()
    }

    render() {
      // ... and renders the wrapped component with the fresh data!
      // Notice that we pass through any additional props
      return <WrappedComponent {...this.state} {...this.props} />;
    }
  }
}

class Comments extends React.Component {
  render() {
    if (!this.props.comments) {
      return null
    }
    return this.props.comments.map(c =>
      <div key={c.id}>{c.comment}</div>
    )
  }
}

const BehavioralComments = withBehavior(Comments, [
  function* () {
    const comments = yield { wait: ['FETCH_COMMENTS_SUCCESS'] }
    yield { request: ['SET_STATE_COMMENTS'], payload: comments }
  },
  function* () {
    yield { request: ['FETCH_COMMENTS']}
    const comments = yield fetchComments(1000)
    yield { request: ['FETCH_COMMENTS_SUCCESS'], payload: { comments }}
  },
])

function CommentsCount(props) {
  return <div>{props.commentsCount}</div>
}
const BehavioralCommentsCount = withBehavior(CommentsCount, [
  function* () {
    yield { request: ['FETCH_COMMENTS_COUNT']}
    const comments = yield fetchComments(2000)
    yield { request: ['FETCH_COMMENTS_COUNT_SUCCESS']}
    yield { request: ['SET_STATE_COMMENTS_COUNT'], payload: { commentsCount: comments.length }}
  }
])

const BlockCommentsCount = withBehavior(BehavioralCommentsCount, [
  //// STUFF AFTER THIS COULD BE ADDED BY OTHERS
  function* () {
    // block FETCH_COMMENTS_COUNT
    yield { block: ['FETCH_COMMENTS_COUNT']}
  },
  function* () {
    const { comments } = yield { wait: ['FETCH_COMMENTS_SUCCESS']}
    yield { request: ['SET_STATE_COMMENTS_COUNT'], payload: { commentsCount: comments.length }}
  }
])

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Ciao Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <hr />
        <BehavioralComments />
        <BlockCommentsCount />
      </div>
    );
  }
}

export default App;
