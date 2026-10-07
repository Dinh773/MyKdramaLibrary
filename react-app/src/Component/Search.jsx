import React from 'react'

const Search = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="search">
        <div>
            <img src="/search.png" alt="Search Icon">
            </img>
            <input className="search-input" type="text" placeholder="Search your movie right over here !" onChange={(e) => setSearchTerm(e.target.value)}></input>
        </div>

    </div>
  )
}

export default Search