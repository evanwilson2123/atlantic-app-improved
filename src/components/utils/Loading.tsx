import React from 'react'

/**
 * 
 * @returns A comprehensive loading component that matches the 
 * styling of the rest of the app
 */
const Loading = () => {
  return (
    <div className="w-full max-w-3xl mx-auto flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
    </div>
  )
}

export default Loading