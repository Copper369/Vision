import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Chat() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [pendingEmailDelivery, setPendingEmailDelivery] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const handleSend = async () => {
    if (!message.trim()) return

    const userMessage = message
    setMessage('')
    setChatHistory([...chatHistory, { type: 'user', text: userMessage }])
    setLoading(true)

    try {
      // Check if we're waiting for an email address
      if (pendingEmailDelivery) {
        const emailMatch = userMessage.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
        
        if (emailMatch) {
          const recipient = emailMatch[0]
          
          try {
            const emailResponse = await api.post('/deliver/email', {
              recipient: recipient,
              photo_ids: pendingEmailDelivery.photoIds,
              subject: `Photos from Drishyamitra`
            })
            
            setChatHistory(prev => [...prev, { 
              type: 'bot', 
              text: emailResponse.data.success 
                ? `Successfully sent ${pendingEmailDelivery.photoIds.length} photos to ${recipient}`
                : `Failed to send email: ${emailResponse.data.message}`,
              success: emailResponse.data.success
            }])
            
            setPendingEmailDelivery(null)
          } catch (emailErr) {
            setChatHistory(prev => [...prev, { 
              type: 'bot', 
              text: `Failed to send email: ${emailErr.response?.data?.error || emailErr.message}`,
              success: false
            }])
            setPendingEmailDelivery(null)
          }
        } else {
          setChatHistory(prev => [...prev, { 
            type: 'bot', 
            text: "I couldn't find a valid email address. Please provide an email like: user@example.com"
          }])
        }
        
        setLoading(false)
        return
      }

      const response = await api.post('/chat/query', { message: userMessage })
      
      if (response.data.action === 'email_ask_recipient' && response.data.photos) {
        setPendingEmailDelivery({
          photoIds: response.data.photos.map(p => p.id),
          photos: response.data.photos
        })
        
        setChatHistory(prev => [...prev, { 
          type: 'bot', 
          text: response.data.message,
          data: response.data 
        }])
      }
      else if (response.data.action === 'email' && response.data.photos && response.data.recipient) {
        try {
          const photoIds = response.data.photos.map(p => p.id)
          const emailResponse = await api.post('/deliver/email', {
            recipient: response.data.recipient,
            photo_ids: photoIds,
            subject: `Photos from Drishyamitra`
          })
          
          setChatHistory(prev => [...prev, { 
            type: 'bot', 
            text: emailResponse.data.success 
              ? `Successfully sent ${photoIds.length} photos to ${response.data.recipient}`
              : `Failed to send email: ${emailResponse.data.message}`,
            data: response.data,
            success: emailResponse.data.success
          }])
        } catch (emailErr) {
          setChatHistory(prev => [...prev, { 
            type: 'bot', 
            text: `Failed to send email: ${emailErr.response?.data?.error || emailErr.message}`,
            data: response.data,
            success: false
          }])
        }
      } else {
        setChatHistory(prev => [...prev, { 
          type: 'bot', 
          text: response.data.message || `Found ${response.data.count || 0} photos`,
          data: response.data 
        }])
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { 
        type: 'bot', 
        text: 'Sorry, something went wrong. Please try again.',
        success: false
      }])
      setPendingEmailDelivery(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestions = [
    "Show photos of Aditya",
    "Find photos from last week",
    "Show me all group photos",
    "Mail photos of Sonali to sonali@example.com"
  ]

  return (
    <div className="fade-in h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">
          AI Assistant<span className="gradient-text">.</span>
        </h1>
        <p className="text-gray-400">Ask me anything about your photos</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
              <p className="text-gray-400 mb-6 text-center max-w-md">
                I can help you search photos, organize them, or send them via email
              </p>
              
              {/* Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMessage(suggestion)
                      inputRef.current?.focus()
                    }}
                    className="text-left p-4 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {chatHistory.map((msg, idx) => (
                <div key={idx}>
                  <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`max-w-2xl ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          msg.type === 'user'
                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                            : msg.success === false
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                            : msg.success === true
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                            : 'bg-gray-800 text-gray-100'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                  
                  {/* Show photos if available */}
                  {msg.type === 'bot' && msg.data?.photos && msg.data.photos.length > 0 && (
                    <div className="ml-4 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
                        {msg.data.photos.slice(0, 8).map((photo) => (
                          <PhotoThumbnail 
                            key={photo.id} 
                            photo={photo} 
                            onClick={() => navigate(`/photo/${photo.id}`)}
                          />
                        ))}
                      </div>
                      {msg.data.photos.length > 8 && (
                        <p className="text-sm text-gray-400 mt-2">
                          + {msg.data.photos.length - 8} more photos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 px-4 py-3 rounded-2xl flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PhotoThumbnail({ photo, onClick }) {
  const [imageUrl, setImageUrl] = useState(null)

  useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await api.get(`/photos/${photo.id}`, {
          responseType: 'blob'
        })
        setImageUrl(URL.createObjectURL(response.data))
      } catch (err) {
        console.error('Failed to load image', err)
      }
    }
    loadImage()

    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [photo.id])

  return (
    <div 
      onClick={onClick}
      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={photo.filename}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-gray-800 animate-pulse"></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  )
}

export default Chat
