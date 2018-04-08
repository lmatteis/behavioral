const BProgram = require('./bp').default

function asyncData(data) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data)
    }, 2000)
  })
}
function fetchMovies() {
  return asyncData([
    { name: 'Indiana jones' },
    { name: 'The matrix' }
  ])
}
function fetchMovieDetails() {
  return asyncData({
    name: 'The matrix',
    description: 'best movie ever'
  })
}

const store = {}

const bp = new BProgram()
let pr = 1

bp.addBThread(`
Fetch movies from API and store them in memory
`, pr++, function* () {
  yield { request: ['FETCH_MOVIES'] }
  const movies = yield fetchMovies()
  store.movies = movies
  yield { request: ['FETCH_MOVIES_SUCCESS'] }

  // simulate a click of a movie
  yield { request: ['MOVIE_CLICKED'] }
})

bp.addBThread(`
Fetch movie details
`, pr++, function* () {
  yield { wait: ['MOVIE_CLICKED'] }
  yield { request: ['FETCH_MOVIE_DETAILS'] }
  console.log('details')
  yield fetchMovieDetails(store.clickedMovieId)
  yield { request: ['FETCH_MOVIE_DETAILS_SUCCESS'] }
})

bp.addBThread(`
Fetch movie reviews
`, pr++, function* () {
  yield { wait: ['MOVIE_CLICKED'] }
  yield { request: ['FETCH_MOVIE_REVIEWS'] }
  console.log('reviews')
  yield fetchMovieDetails(store.clickedMovieId)
  yield { request: ['FETCH_MOVIE_REVIEWS_SUCCESS'] }
})

bp.addBThread(`
Run fetch movie details/reviews in parallel
`, pr++, function* () {
  yield { wait: ['FETCH_MOVIE_REVIEWS'], block: ['FETCH_MOVIE_DETAILS'] }
  // yield { wait: ['FETCH_MOVIE_DETAILS'], block: ['FETCH_MOVIE_REVIEWS'] }
})

bp.addBThread('Log', pr++, function* () {
  while (true) {
    yield { wait: event => console.log(event) }
  }
})

bp.run()
