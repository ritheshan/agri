import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import LoadingAnimation from './LoadingAnimation'
import './Community.css'

const Community = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, token } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [activeTab, setActiveTab] = useState('posts') // 'posts' or 'agrishots'
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    image: null
  })
  const [imagePreview, setImagePreview] = useState(null)
  
  // Comments state
  const [showComments, setShowComments] = useState({})
  const [comments, setComments] = useState({})
  const [newComment, setNewComment] = useState({})
  const [loadingComments, setLoadingComments] = useState({})

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/community/posts')
      setPosts(response.data)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewPost({ ...newPost, image: file })
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    }
  }

  // Get user name for display
  const getUserName = (postUser) => {
    if (!postUser) return 'Anonymous Farmer';
    // Prioritize using name instead of phone number
    return postUser.name || 'Farmer';
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated || !user) {
      alert('Please login to create a post')
      navigate('/login')
      return
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Please fill in all required fields')
      return
    }

    const formData = new FormData()
    formData.append('title', newPost.title)
    formData.append('content', newPost.content)
    formData.append('user_id', user.id)
    formData.append('user_name', getUserName(user))  // Add username to post
    if (newPost.image) {
      formData.append('image', newPost.image)
    }

    try {
      // Using token from AuthContext instead of localStorage
      if (!token) {
        alert('Session expired. Please login again.')
        navigate('/login')
        return
      }

      const response = await axios.post('http://localhost:8000/community/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })
      
      setNewPost({ title: '', content: '', image: null })
      setImagePreview(null)
      setShowCreatePost(false)
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Session expired. Please login again.')
        navigate('/login')
      } else {
        alert('Failed to create post. Please try again.')
      }
    }
  }

  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      await axios.post(`http://localhost:8000/community/posts/${postId}/like`, {
        user_id: user.id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      fetchPosts()
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  // Comments functions
  const fetchComments = async (postId) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    try {
      const response = await axios.get(`http://localhost:8000/community/posts/${postId}/comments`)
      setComments(prev => ({ ...prev, [postId]: response.data }))
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  const toggleComments = (postId) => {
    const isShowing = showComments[postId]
    setShowComments(prev => ({ ...prev, [postId]: !isShowing }))
    
    if (!isShowing && !comments[postId]) {
      fetchComments(postId)
    }
  }

  const handleAddComment = async (postId) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const commentText = newComment[postId]
    if (!commentText?.trim()) return

    try {
      await axios.post(`http://localhost:8000/community/posts/${postId}/comments`, {
        content: commentText,
        user_id: user.id,
        user_name: getUserName(user)  // Add username to comment
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      setNewComment(prev => ({ ...prev, [postId]: '' }))
      fetchComments(postId) // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Failed to add comment. Please try again.')
    }
  }

  const handleDeleteComment = async (postId, commentIndex) => {
    if (!isAuthenticated) return

    try {
      await axios.delete(`http://localhost:8000/community/posts/${postId}/comments/${commentIndex}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      fetchComments(postId) // Refresh comments
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment. Please try again.')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString()
  }

  if (loading) {
    return (
      <div className="community">
        <div className="loading-container">
          <LoadingAnimation type="growth" message="Growing the community..." />
        </div>
      </div>
    )
  }

  return (
    <div className="community">
      <header className="community-header">
        <div className="header-content">
          <h1>👥 Farmer Community</h1>
          <div className="header-actions">
            <a href="/" className="back-home">← Back to Home</a>
            {isAuthenticated ? (
              <div className="user-info">
                <span>Welcome, {user.phone?.replace(/(\d{4})\d{4}(\d{2})/, '$1****$2')}</span>
                <button 
                  className="logout-btn"
                  onClick={() => navigate('/profile')}
                >
                  Profile
                </button>
              </div>
            ) : (
              <button 
                className="login-btn"
                onClick={() => navigate('/login')}
              >
                Login to Post
              </button>
            )}
          </div>
        </div>
        
        <div className="community-tabs">
          <button
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <span className="tab-icon">📝</span>
            Community Posts
          </button>
          <button
            className={`tab-btn ${activeTab === 'agrishots' ? 'active' : ''}`}
            onClick={() => setActiveTab('agrishots')}
          >
            <span className="tab-icon">📱</span>
            AgriShots (Reels)
            <span className="coming-soon">Coming Soon</span>
          </button>
        </div>
      </header>

      <div className="community-content">
        {activeTab === 'posts' ? (
          // Posts Tab Content
          <>
            <div className="create-post-section">
              {!showCreatePost ? (
                <div className="create-post-prompt">
                  <div className="prompt-content">
                    <span className="prompt-icon">✍️</span>
                    <span>Share your farming experience with the community</span>
                  </div>
                  <button 
                    className="create-post-btn"
                    onClick={() => {
                      if (isAuthenticated) {
                        setShowCreatePost(true)
                      } else {
                        navigate('/login')
                      }
                    }}
                  >
                    Create Post
                  </button>
                </div>
              ) : (
            <form onSubmit={handleCreatePost} className="create-post-form">
              <h3>Share Your Experience</h3>
              
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Post title..."
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <textarea
                  placeholder="Share your farming experience, tips, or ask questions..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  required
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="image-upload" className="image-upload-label">
                  📷 Add Photo (Optional)
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button 
                      type="button"
                      className="remove-image"
                      onClick={() => {
                        setNewPost({ ...newPost, image: null })
                        setImagePreview(null)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">Post</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowCreatePost(false)
                    setNewPost({ title: '', content: '', image: null })
                    setImagePreview(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="posts-feed">
          {posts.length === 0 ? (
            <div className="no-posts">
              <div className="no-posts-icon">📝</div>
              <h3>No posts yet</h3>
              <p>Be the first to share your farming experience!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post._id} className="post-card">
                <div className="post-header">
                  <div className="post-author">
                    <div className="author-avatar">👨‍🌾</div>
                    <div className="author-info">
                      <h4>{getUserName(post.user)}</h4>
                      <span className="post-date">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="post-content">
                  <h3>{post.title}</h3>
                  <p>{post.content}</p>
                  {post.image_url && (
                    <div className="post-image">
                      <img src={post.image_url} alt="Post" />
                    </div>
                  )}
                </div>
                
                <div className="post-actions">
                  <button 
                    className={`like-btn ${post.likes?.includes(user?.id) ? 'liked' : ''}`}
                    onClick={() => handleLike(post._id)}
                  >
                    ❤️ {post.likes?.length || 0}
                  </button>
                  <button 
                    className="comment-btn"
                    onClick={() => toggleComments(post._id)}
                  >
                    💬 Comment
                  </button>
                  <button className="share-btn">
                    📤 Share
                  </button>
                </div>

                {showComments[post._id] && (
                  <div className="comments-section">
                    <div className="comments-header">
                      <h4>Comments</h4>
                      <button 
                        className="close-comments"
                        onClick={() => setShowComments(prev => ({ ...prev, [post._id]: false }))}
                      >
                        ✕
                      </button>
                    </div>
                    
                    {loadingComments[post._id] ? (
                      <div className="loading-comments">
                        <LoadingAnimation type="growth" message="Loading comments..." />
                      </div>
                    ) : (
                      <div className="comments-list">
                        {comments[post._id]?.length === 0 ? (
                          <div className="no-comments">
                            <p>No comments yet. Be the first to comment!</p>
                          </div>
                        ) : (
                          comments[post._id]?.map((comment, index) => (
                            <div key={index} className="comment-item">
                              <div className="comment-author">
                                <div className="author-avatar">👩‍🌾</div>
                                <div className="author-info">
                                  <h5>{getUserName(comment.user)}</h5>
                                  <span className="comment-date">{formatDate(comment.created_at)}</span>
                                </div>
                                {(user?.id === comment.user_id || user?.id === post.user_id) && (
                                  <button 
                                    className="delete-comment-btn"
                                    onClick={() => handleDeleteComment(post._id, index)}
                                    title="Delete comment"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                              <div className="comment-content">
                                <p>{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    
                    {isAuthenticated ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleAddComment(post._id)
                        }} 
                        className="comment-form"
                      >
                        <textarea
                          placeholder="Add a comment..."
                          value={newComment[post._id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post._id]: e.target.value }))}
                          required
                          rows={2}
                        />
                        <button type="submit" className="submit-comment-btn">Post Comment</button>
                      </form>
                    ) : (
                      <div className="login-to-comment">
                        <p>Please <button onClick={() => navigate('/login')} className="login-link">login</button> to comment</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
          </>
        ) : (
          // AgriShots Tab Content
          <div className="agrishots-section">
            <div className="agrishots-grid">
              <div className="agrishot-card">
                <div className="agrishot-video">
                  <video 
                    controls 
                    poster="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                    className="agrishot-video-element"
                  >
                    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="agrishot-overlay">
                    <div className="agrishot-stats">
                      <span className="stat-item">
                        <span className="stat-icon">❤️</span>
                        <span className="stat-count">1.2K</span>
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">�</span>
                        <span className="stat-count">89</span>
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">🔄</span>
                        <span className="stat-count">45</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="agrishot-content">
                  <div className="agrishot-author">
                    <div className="author-avatar">👨‍🌾</div>
                    <div className="author-info">
                      <h4>@farmer_raj</h4>
                      <p>Modern Wheat Farming</p>
                    </div>
                  </div>
                  <div className="agrishot-description">
                    <p>🌾 Check out this amazing wheat harvesting technique! Using modern machinery can increase efficiency by 40%. 
                    #ModernFarming #WheatHarvest #AgricultureTech</p>
                  </div>
                  <div className="agrishot-tags">
                    <span className="tag">#Wheat</span>
                    <span className="tag">#Harvesting</span>
                    <span className="tag">#Technology</span>
                  </div>
                </div>
              </div>

              <div className="agrishot-card">
                <div className="agrishot-video">
                  <video 
                    controls 
                    poster="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                    className="agrishot-video-element"
                  >
                    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="agrishot-overlay">
                    <div className="agrishot-stats">
                      <span className="stat-item">
                        <span className="stat-icon">❤️</span>
                        <span className="stat-count">856</span>
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">💬</span>
                        <span className="stat-count">34</span>
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">�</span>
                        <span className="stat-count">23</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="agrishot-content">
                  <div className="agrishot-author">
                    <div className="author-avatar">👩‍🌾</div>
                    <div className="author-info">
                      <h4>@organic_priya</h4>
                      <p>Organic Farming Expert</p>
                    </div>
                  </div>
                  <div className="agrishot-description">
                    <p>🌱 Natural pest control using neem oil! This organic method keeps crops healthy without chemicals. 
                    Follow for more organic farming tips! #OrganicFarming #NaturalPestControl #SustainableAgriculture</p>
                  </div>
                  <div className="agrishot-tags">
                    <span className="tag">#Organic</span>
                    <span className="tag">#PestControl</span>
                    <span className="tag">#Sustainable</span>
                  </div>
                </div>
              </div>

              <div className="agrishot-card upload-card">
                <div className="upload-content">
                  <div className="upload-icon">�</div>
                  <h3>Share Your AgriShot</h3>
                  <p>Upload your farming videos to inspire others!</p>
                  <button className="upload-btn" onClick={() => alert('Upload feature coming soon!')}>
                    + Add Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Community
