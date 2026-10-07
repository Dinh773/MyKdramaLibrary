import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// 1. Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Succesfully connected to MongoDB!'))
  .catch((err) => console.error('Connection error to MongoDB:', err))

// 2. Schema definition for Watchlist
const watchlistSchema = new mongoose.Schema({
  dramaId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  poster_path: { type: String },
  vote_average: { type: Number },
  first_air_date: { type: String },
  addedAt: { type: Date, default: Date.now },
})

const Watchlist = mongoose.model('Watchlist', watchlistSchema)

// ---------------- API Routes ---------------- //

// API 1: Get K-Drama from TMDB (Proxy)
app.get('/api/dramas', async (req, res) => {
  try {
    const { query = '', sortBy = 'popularity.desc' } = req.query
    const today = new Date().toISOString().split('T')[0]

    const endpoint = query
      ? `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}`
      : `https://api.themoviedb.org/3/discover/tv?with_origin_country=KR&with_genres=18&without_genres=10764,10767,10763&sort_by=${sortBy}&first_air_date.lte=${today}`

    const response = await fetch(endpoint, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    })

    const data = await response.json()
    const filteredResults = query
      ? (data.results || []).filter(
          (item) =>
            item.origin_country?.includes('KR') &&
            item.genre_ids?.includes(18) &&
            !item.genre_ids?.some((id) => [10764, 10767, 10763].includes(id))
        )
      : (data.results || [])

    res.json({ results: filteredResults })
  } catch (error) {
    res.status(500).json({ message: 'Server error when fetching dramas' })
  }
})

// API 2: Get Watchlist from Database
app.get('/api/watchlist', async (req, res) => {
  try {
    const list = await Watchlist.find().sort({ addedAt: -1 })
    res.json(list)
  } catch (error) {
    res.status(500).json({ message: 'Server error when fetching watchlist' })
  }
})

// API 3: Add a drama to Watchlist
app.post('/api/watchlist', async (req, res) => {
  try {
    const { id, name, poster_path, vote_average, first_air_date } = req.body

    const existing = await Watchlist.findOne({ dramaId: id })
    if (existing) {
      return res.status(400).json({ message: 'This drama is already in your watchlist!' })
    }

    const newItem = new Watchlist({
      dramaId: id,
      name,
      poster_path,
      vote_average,
      first_air_date,
    })

    await newItem.save()
    res.status(201).json(newItem)
  } catch (error) {
    res.status(500).json({ message: 'Server error when adding drama to watchlist' })
  }
})

// API 4: Delete a drama from Watchlist
app.delete('/api/watchlist/:dramaId', async (req, res) => {
  try {
    await Watchlist.findOneAndDelete({ dramaId: req.params.dramaId })
    res.json({ message: 'Successfully removed from watchlist' })
  } catch (error) {
    res.status(500).json({ message: 'Server error when removing drama from watchlist' })
  }
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})