import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Modal from '../components/Modal'

function People() {
  const navigate = useNavigate()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [personPhotos, setPersonPhotos] = useState([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  useEffect(() => {
    fetchPeople()
  }, [])

  const fetchPeople = async () => {
    try {
      const response = await api.get('/faces/people')
      setPeople(response.data.people || [])
    } catch (err) {
      console.error('Failed to fetch people', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePersonClick = async (person) => {
    setSelectedPerson(person)
    setLoadingPhotos(true)
    
    try {
      // Use the correct endpoint with query parameter
      const response = await api.get(`/photos/search?person=${encodeURIComponent(person.name)}`)
      setPersonPhotos(response.data.photos || [])
    } catch (err) {
      console.error('Failed to fetch person photos', err)
      setPersonPhotos([])
    } finally {
      setLoadingPhotos(false)
    }
  }

  const closeModal = () => {
    setSelectedPerson(null)
    setPersonPhotos([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading people...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          People<span className="gradient-text">.</span>
        </h1>
        <p className="text-gray-400">
          {people.length} {people.length === 1 ? 'person' : 'people'} recognized in your photos
        </p>
      </div>

      {/* People Grid */}
      {people.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No people found</h3>
          <p className="text-gray-400 mb-6">Start by labeling faces in your photos</p>
          <button
            onClick={() => navigate('/label-faces')}
            className="btn-primary"
          >
            Label Faces
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {people.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onClick={() => handlePersonClick(person)}
            />
          ))}
        </div>
      )}

      {/* Person Photos Modal */}
      <Modal
        isOpen={selectedPerson !== null}
        onClose={closeModal}
        title={`Photos of ${selectedPerson?.name || ''}`}
      >
        {loadingPhotos ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading photos...</p>
            </div>
          </div>
        ) : personPhotos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No photos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {personPhotos.map((photo) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                onClick={() => {
                  closeModal()
                  navigate(`/photo/${photo.id}`)
                }}
              />
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

function PersonCard({ person, onClick }) {
  const [avatarUrl, setAvatarUrl] = useState(null)

  useEffect(() => {
    const loadAvatar = async () => {
      if (!person.avatar_face_id) return
      
      try {
        // Get cropped face image
        const response = await api.get(`/faces/${person.avatar_face_id}/crop`, {
          responseType: 'blob'
        })
        setAvatarUrl(URL.createObjectURL(response.data))
      } catch (err) {
        console.error('Failed to load avatar', err)
      }
    }
    loadAvatar()

    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl)
    }
  }, [person.avatar_face_id])

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer group"
    >
      {/* Circular Avatar */}
      <div className="relative mb-3">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-800 group-hover:border-emerald-500 transition-all glow-hover">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={person.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Photo count badge */}
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-gray-900 flex items-center justify-center text-xs font-bold">
          {person.photo_count || 0}
        </div>
      </div>

      {/* Name */}
      <h3 className="font-semibold text-center group-hover:text-emerald-400 transition-colors">
        {person.name}
      </h3>
      <p className="text-xs text-gray-400">
        {person.photo_count || 0} {person.photo_count === 1 ? 'photo' : 'photos'}
      </p>
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

export default People
