import React, { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ErrorBoundary from './ErrorBoundary'
import { ENDPOINTS } from '../config/apiConfig'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(true) // Start with chat open
  const [show, setShow] = useState(true) // Show immediately
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello! 👋 How can I help you today with agricultural advice?" }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [chatSize, setChatSize] = useState({ width: 350, height: 450 }) // Default size
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 })
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 })
  
  const iconRef = useRef(null)
  const chatRef = useRef(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatboxRef = useRef(null)
  const messageContainerRef = useRef(null)

  // Show chat immediately on mount
  useEffect(() => {
    setShow(true)
  }, [])

  // Scroll to bottom when messages change, but only within the chat container
  useEffect(() => {
    if (messageContainerRef.current && messagesEndRef.current && isOpen) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (position.x !== 0 || position.y !== 0) {
        if (chatboxRef.current) {
          const maxX = window.innerWidth - chatboxRef.current.offsetWidth;
          const maxY = window.innerHeight - chatboxRef.current.offsetHeight;
          
          // Adjust position if window gets smaller than chat position
          setPosition(prev => ({
            x: Math.min(prev.x, maxX),
            y: Math.min(prev.y, maxY)
          }));
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  const toggleChat = () => {
    setIsOpen(prev => !prev)
    setIsChatMinimized(false)
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        y: isOpen ? 0 : -10,
        duration: 0.2,
      })
    }
  }

  const minimizeChat = () => {
    setIsChatMinimized(true)
  }

  const maximizeChat = () => {
    setIsChatMinimized(false)
  }
  
  // Draggable functionality
  const handleMouseDown = (e) => {
    if (chatboxRef.current && e.target.closest('#chatbot-header')) {
      const chatboxRect = chatboxRef.current.getBoundingClientRect();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - chatboxRect.left,
        y: e.clientY - chatboxRect.top
      });
      // Prevent text selection during drag
      e.preventDefault();
    }
  };
  
  const handleMouseMove = (e) => {
    if (isDragging && chatboxRef.current) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Calculate boundaries to keep chat on screen
      const maxX = window.innerWidth - chatboxRef.current.offsetWidth;
      const maxY = window.innerHeight - chatboxRef.current.offsetHeight;
      
      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));
      
      chatboxRef.current.style.left = `${boundedX}px`;
      chatboxRef.current.style.right = 'auto';
      chatboxRef.current.style.top = `${boundedY}px`;
      chatboxRef.current.style.bottom = 'auto';
      
      setPosition({ x: boundedX, y: boundedY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Resize functionality
  const handleResizeStart = (e) => {
    if (chatboxRef.current) {
      setIsResizing(true);
      setResizeStart({ x: e.clientX, y: e.clientY });
      setInitialSize({ 
        width: chatboxRef.current.offsetWidth, 
        height: chatboxRef.current.offsetHeight 
      });
      e.preventDefault();
    }
  };

  const handleResizeMove = (e) => {
    if (isResizing && chatboxRef.current) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newWidth = Math.max(260, initialSize.width + deltaX);
      const newHeight = Math.max(300, initialSize.height + deltaY);
      
      // Limit maximum size
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.8;
      
      setChatSize({
        width: Math.min(newWidth, maxWidth),
        height: Math.min(newHeight, maxHeight)
      });
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };
  
  // Add event listeners for drag and resize functionality
  useEffect(() => {
    if (isOpen && !isChatMinimized) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      if (isResizing) {
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
      }
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        if (isResizing) {
          document.removeEventListener('mousemove', handleResizeMove);
          document.removeEventListener('mouseup', handleResizeEnd);
        }
      };
    }
  }, [isOpen, isChatMinimized, isDragging, isResizing]);

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { from: "user", text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call Groq API
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: `You are **AgriBot**, a helpful agricultural assistant. You specialize in:

- **Crop recommendations** and **farming techniques**
- **Government agricultural schemes** and **subsidies** (focus on Indian policies)
- **Weather-related farming advice**
- **Pest and disease management**
- **Sustainable farming practices**
- **Agricultural technology and tools**

## Response Formatting Guidelines

- Use \`##\` for **main headings**
- Use \`###\` for **subheadings**
- Use bullet points (\`-\`) for **lists**
- Use \`**bold**\` for emphasis
- Use \`>\` for **quotes** or **important information**

## Tone and Style

- Always provide **practical, actionable advice** for farmers
- Keep responses **concise but informative**
- Use **simple language** that farmers can easily understand`
            },
            {
              role: 'user',
              content: input
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      const data = await response.json()

      if (data.choices && data.choices[0]) {
        const botMessage = {
          from: 'bot',
          text: data.choices[0].message.content
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error('No response from AI')
      }
    } catch (error) {
      const errorMessage = {
        from: 'bot',
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment. In the meantime, you can explore our dashboard features for crop recommendations and farming insights!"
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {show && (
        <>
          <button
            ref={iconRef}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-transparent flex flex-col items-center justify-center group"
            onClick={toggleChat}
            aria-label="Open Chatbot"
          >
            <div
              className="mb-2 text-sm text-green-800 font-bold bg-green-100 px-3 py-1 rounded-full shadow-md
                         transition-all duration-500 ease-in-out transform opacity-100 
                         group-hover:opacity-100"
            >
              {isOpen ? '' : 'Need help?'}
            </div>

            <img
              src="/farmer-icon.svg"
              alt="Chat icon"
              className="w-12 h-12 transition-transform duration-300 ease-in-out group-hover:scale-110 
                         bg-farm-green p-2 rounded-full shadow-lg"
            />
          </button>

          {isOpen && !isChatMinimized && (
            <div
              ref={chatboxRef}
              className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-40 
                        transition-all overflow-hidden"
              style={{
                top: position.y !== 0 ? `${position.y}px` : 'auto',
                left: position.x !== 0 ? `${position.x}px` : 'auto',
                right: position.x === 0 ? '1.5rem' : 'auto',
                bottom: position.y === 0 ? '7rem' : 'auto',
                width: `${chatSize.width}px`,
                height: `${chatSize.height}px`,
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              <div 
                className="bg-farm-green text-white p-3 flex justify-between items-center cursor-move select-none" 
                id="chatbot-header"
              >
                <div className="flex items-center">
                  <img src="/farmer-icon.svg" alt="Farmer" className="w-8 h-8 mr-2" />
                  <span className="text-lg font-semibold">AgriMaster Assistant</span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={minimizeChat}
                    className="text-white hover:text-gray-200 transition-colors mr-2"
                    aria-label="Minimize chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                    </svg>
                  </button>
                  <button
                    onClick={toggleChat}
                    className="text-white hover:text-red-200 transition-colors"
                    aria-label="Close chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div 
                ref={messageContainerRef}
                className="flex-1 p-3 overflow-y-auto text-sm text-gray-700 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" 
                onClick={(e) => e.stopPropagation()}
              >
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`px-3 py-2 rounded-lg max-w-[85%] break-words overflow-hidden ${msg.from === "user" ? "bg-green-100 text-right" : "bg-gray-100 text-left"
                        }`}
                    >
                      {msg.from === "bot" ? (
                        <div className="prose prose-sm prose-headings:text-green-800 prose-headings:font-medium prose-h2:text-base prose-h3:text-sm prose-strong:text-green-700 prose-li:my-0.5 prose-p:my-1 max-w-none">
                          <div className="markdown-content">
                            <ErrorBoundary fallback={<p>{msg.text}</p>}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.text}
                              </ReactMarkdown>
                            </ErrorBoundary>
                          </div>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-3 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-3 py-2 bg-gray-50 flex overflow-x-auto space-x-2 no-scrollbar">
                <button
                  onClick={() => {
                    setInput("How to deal with potato blight?")
                    setTimeout(() => sendMessage(), 100)
                  }}
                  className="text-xs bg-gray-100 hover:bg-green-100 px-2 py-1 rounded whitespace-nowrap"
                >
                  Potato blight?
                </button>
                <button
                  onClick={() => {
                    setInput("Best time to sow wheat?")
                    setTimeout(() => sendMessage(), 100)
                  }}
                  className="text-xs bg-gray-100 hover:bg-green-100 px-2 py-1 rounded whitespace-nowrap"
                >
                  When to sow wheat?
                </button>
                <button
                  onClick={() => {
                    setInput("How to increase crop yield?")
                    setTimeout(() => sendMessage(), 100)
                  }}
                  className="text-xs bg-gray-100 hover:bg-green-100 px-2 py-1 rounded whitespace-nowrap"
                >
                  Increase yield
                </button>
              </div>

              <div className="p-2 border-t flex">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  ref={inputRef}
                  className="flex-1 px-3 py-2 border rounded-l-md outline-none text-sm focus:ring-2 focus:ring-green-600"
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="bg-farm-green hover:bg-green-700 px-4 text-white rounded-r-md text-sm transition-all duration-75 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    "Send"
                  )}
                </button>
              </div>

              <div 
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                onMouseDown={handleResizeStart}
                style={{
                  backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)',
                  backgroundSize: '3px 3px',
                  backgroundRepeat: 'space',
                  backgroundPosition: 'center'
                }}
              />
            </div>
          )}

          {isOpen && isChatMinimized && (
            <div className="fixed bottom-6 right-24 bg-farm-green text-white rounded-lg shadow-lg z-40 px-4 py-2 flex items-center justify-between w-auto max-w-[300px] hover:bg-green-700 transition-colors duration-300">
              <div className="flex items-center truncate">
                <img src="/farmer-icon.svg" alt="Farmer" className="w-6 h-6 mr-2 flex-shrink-0" />
                <span className="font-medium truncate">AgriMaster Assistant</span>
              </div>
              <div className="flex items-center ml-4">
                <button
                  onClick={maximizeChat}
                  className="text-white hover:text-gray-200 transition-colors mr-2"
                  aria-label="Expand chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                </button>
                <button
                  onClick={toggleChat}
                  className="text-white hover:text-red-200 transition-colors"
                  aria-label="Close chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default Chatbot
