import { useState, useEffect } from 'react'
import { postAction } from '../api/sheets'

const QUEUE_KEY = 'fintrack_offline_queue'

export const useOfflineQueue = () => {
  const [online, setOnline] = useState(navigator.onLine)
  const [queue, setQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Flush queue when coming back online
  useEffect(() => {
    if (online && queue.length > 0) {
      flushQueue()
    }
  }, [online])

  const saveToQueue = (action, data) => {
    const item = { action, data, timestamp: Date.now() }
    const newQueue = [...queue, item]
    setQueue(newQueue)
    localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue))
  }

  const flushQueue = async () => {
    const current = [...queue]
    setQueue([])
    localStorage.removeItem(QUEUE_KEY)
    for (const item of current) {
      try {
        await postAction(item.action, item.data)
      } catch {
        // Re-queue on failure
        saveToQueue(item.action, item.data)
      }
    }
  }

  return { online, queue, saveToQueue }
}

export default useOfflineQueue
