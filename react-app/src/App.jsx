import { useState, useEffect } from 'react'
import Header from './Component/Header.jsx'
import Search from './Component/Search.jsx'

function App() {
  const API_BASE_URL = 'https://mykdramalibrary.onrender.com'

  const [searchTerm, setSearchTerm] = useState('')
  const [moviesList, setMoviesList] = useState([])
  const [sortBy, setSortBy] = useState('popularity.desc')

  const [currentTab, setCurrentTab] = useState('home')
  const [watchlist, setWatchlist] = useState([])

  // 1. Get Kdrama list from TMDB API
  const fetchMovies = async (query = '') => {
    try {
      const endpoint = `${API_BASE_URL}/api/dramas?query=${encodeURIComponent(query)}&sortBy=${sortBy}`
      const response = await fetch(endpoint)
      if (!response.ok) throw new Error('Server error when fetching dramas')

      const data = await response.json()
      setMoviesList(data.results || [])
    } catch (error) {
      console.error('Error fetching dramas:', error)
    }
  }

  // 2. Get Watchlist from MongoDB
  const fetchWatchlist = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/watchlist`)
      if (res.ok) {
        const data = await res.json()
        setWatchlist(data)
      }
    } catch (err) {
      console.error('Server error when fetching watchlist:', err)
    }
  }

  // 3. Add a drama to Watchlist
  const handleAddToWatchlist = async (drama) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: drama.id,
          name: drama.name,
          poster_path: drama.poster_path,
          vote_average: drama.vote_average,
          first_air_date: drama.first_air_date,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert(`Successfully added "${drama.name}" to Watchlist!`)
        fetchWatchlist() 
      } else {
        alert(data.message || 'Failed to add drama to watchlist!')
      }
    } catch (error) {
      console.error('Server error when adding drama to watchlist:', error)
    }
  }

  // 4. Delete a drama from Watchlist
  const handleRemoveFromWatchlist = async (dramaId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/watchlist/${dramaId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setWatchlist((prev) => prev.filter((item) => item.dramaId !== dramaId))
      }
    } catch (err) {
      console.error('Server error when removing drama from watchlist:', err)
    }
  }

  // 5. Fetch dramas when searchTerm or sortBy changes, with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMovies(searchTerm)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, sortBy])

  // 6. Fetch watchlist on initial render
  useEffect(() => {
    fetchWatchlist()
  }, [])

  return (
    <main className="main-wrapper">
      <Header />

      {/* ================= NAVIGATION TAB ================= */}
      <nav className="tab-nav">
        <button
          className={`tab-btn ${currentTab === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentTab('home')}
        >
          🎬 Discover Kdramas
        </button>
        <button
          className={`tab-btn ${currentTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => {
            fetchWatchlist()
            setCurrentTab('watchlist')
          }}
        >
          ❤️ Watchlist ({watchlist.length})
        </button>
      </nav>

      {/* ================= Home tab ================= */}
      {currentTab === 'home' && (
        <>
          <section className="search-section">
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            {searchTerm && <h2 className="search-preview">Results for: "{searchTerm}"</h2>}
          </section>

          <div className="filter-section">
            <button
              className={`filter-btn ${sortBy === 'popularity.desc' ? 'active' : ''}`}
              onClick={() => setSortBy('popularity.desc')}
            >
              🔥 Most Popular
            </button>
            <button
              className={`filter-btn ${sortBy === 'first_air_date.desc' ? 'active' : ''}`}
              onClick={() => setSortBy('first_air_date.desc')}
            >
              ✨ Newest
            </button>
          </div>

          <section className="movies-section">
            <ul className="movies-grid">
              {moviesList.map((movie) => (
                <li className="movie-card" key={movie.id}>
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                        : 'https://via.placeholder.com/500x750?text=No+Poster'
                    }
                    alt={movie.name}
                  />
                  <div className="movie-info">
                    <h3>{movie.name}</h3>
                    <p>Release Date: {movie.first_air_date || 'N/A'}</p>
                    <p>Rating: {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
                    <button
                      className="watchlist-btn"
                      onClick={() => handleAddToWatchlist(movie)}
                    >
                      ❤️ Add to Watchlist
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* ================= WATCHLIST tab ================= */}
      {currentTab === 'watchlist' && (
        <section className="movies-section">
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
            Kdramas you saved for later ({watchlist.length})
          </h2>

          {watchlist.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888' }}>
              The watchlist is empty. Please go back to the Explore page to add dramas!
            </p>
          ) : (
            <ul className="movies-grid">
              {watchlist.map((item) => (
                <li className="movie-card" key={item.dramaId}>
                  <img
                    src={
                      item.poster_path
                        ? `https://image.tmdb.org/t/p/w500/${item.poster_path}`
                        : 'https://via.placeholder.com/500x750?text=No+Poster'
                    }
                    alt={item.name}
                  />
                  <div className="movie-info">
                    <h3>{item.name}</h3>
                    <p>Release Date: {item.first_air_date || 'N/A'}</p>
                    <p>Rating: {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</p>
                    <button
                      className="watchlist-btn remove-btn"
                      onClick={() => handleRemoveFromWatchlist(item.dramaId)}
                    >
                      🗑️ Remove from Watchlist
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}

export default App