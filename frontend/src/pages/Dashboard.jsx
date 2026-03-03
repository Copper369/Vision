import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalPeople: 0,
    unlabeledFaces: 0,
    recentPhotos: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [photosRes, peopleRes, facesRes] = await Promise.all([
        api.get('/photos/search'),
        api.get('/faces/people'),
        api.get('/faces/unlabeled')
      ])

      setStats({
        totalPhotos: photosRes.data.photos?.length || 0,
        totalPeople: peopleRes.data.people?.length || 0,
        unlabeledFaces: facesRes.data.faces?.length || 0,
        recentPhotos: photosRes.data.photos?.slice(0, 6) || []
      })
    } catch (err) {
      console.error('Failed to fetch stats', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back<span className="gradient-text">.</span>
        </h1>
        <p className="text-gray-400">Here's what's happening with your photos today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Photos"
          value={stats.totalPhotos}
          icon={photoIcon}
          gradient="from-emerald-500 to-green-600"
          onClick={() => navigate('/gallery')}
        />
        <StatCard
          title="People Recognized"
          value={stats.totalPeople}
          icon={peopleIcon}
          gradient="from-emerald-400 to-emerald-600"
          onClick={() => navigate('/people')}
        />
        <StatCard
          title="Unlabeled Faces"
          value={stats.unlabeledFaces}
          icon={labelIcon}
          gradient="from-green-500 to-emerald-700"
          onClick={() => navigate('/label-faces')}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            title="Upload Photos"
            description="Add new photos to your collection"
            icon={uploadIcon}
            onClick={() => navigate('/gallery')}
          />
          <ActionCard
            title="Label Faces"
            description="Identify people in your photos"
            icon={labelIcon}
            onClick={() => navigate('/label-faces')}
          />
          <ActionCard
            title="AI Search"
            description="Find photos using natural language"
            icon={searchIcon}
            onClick={() => navigate('/chat')}
          />
          <ActionCard
            title="View People"
            description="Browse photos by person"
            icon={peopleIcon}
            onClick={() => navigate('/people')}
          />
        </div>
      </div>

      {/* Recent Photos */}
      {stats.recentPhotos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent Photos</h2>
            <button
              onClick={() => navigate('/gallery')}
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.recentPhotos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onClick={() => navigate(`/photo/${photo.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, gradient, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer glow-hover group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  )
}

function ActionCard({ title, description, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer group"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  )
}

function PhotoCard({ photo, onClick }) {
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

const photoIcon = (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const peopleIcon = (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const labelIcon = (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const uploadIcon = (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const searchIcon = (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

export default Dashboard
