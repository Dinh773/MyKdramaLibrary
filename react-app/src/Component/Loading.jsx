import React from 'react'

const Loading = ({ message = "Loading, please wait..." }) => {
  return (
    <>
    <div className="loader-container">
      <div className="spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
    </>
  )
}

export default Loading