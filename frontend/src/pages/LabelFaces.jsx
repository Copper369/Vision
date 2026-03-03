import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Toast from '../components/Toast'

function LabelFaces() {
  const navigate = useNavigate()
  const [faces, setFaces] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [personName, setPersonName] = useState('')
  const [toast, setToast] = useState(null)
  const [labeling, setLabeling] = useState(false)

  useEffect(() => {
    fetchUnlabeledFaces()
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const fetchUnlabeledFaces = async () => {
    try {
      const response = await api.get('/faces/unlabeled')
      setFaces(response.data.faces || [])
      setCurrentIndex(0)
    } catch (err) {
      showToast('Failed to fetch unlabeled faces', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLabel = async (faceId, name) => {
    if (!name.trim()) return
    
    setLabeling(true)
    try {
      await api.post('/faces/label', {
        face_id: faceId,
        person_name: name.trim()
      })
      
      showToast(`Labeled as ${name}`, 'success')
      setPersonName('')
      
      // Move to next face
      if (currentIndex < faces.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // Refresh list
        fetchUnlabeledFaces()
      }
    } catch (err) {
      showToast('Failed to label face', 'error')
    } finally {
      setLabeling(false)
    }
  }

  const handleSkip = () => {
    if (currentIndex < faces.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setPersonName('')
    }
  }

  const handleNotAFace = async (faceId) => {
    try {
      await api.delete(`/faces/${faceId}`)
      showToast('Face removed', 'success')
      
      if (currentIndex < faces.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        fetchUnlabeledFaces()
      }
    } catch (err) {
      showToast('Failed to remove face', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading faces...</p>
        </div>
      </div>
    )
  }

  const currentFace = faces[currentIndex]

  return (
    <div className="fade-in">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Label Faces<span className="gradient-text">.</span>
        </h1>
        <p className="text-gray-400">
          {faces.length === 0 ? 'No unlabeled faces' : `${currentIndex + 1} of ${faces.length} faces`}
        </p>
      </div>

      {faces.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold mb-2">All done!</h3>
          <p className="text-gray-400 mb-6">All faces have been labeled</p>
          <button
            onClick={() => navigate('/gallery')}
            className="btn-primary"
          >
            Go to Gallery
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / faces.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Face Card */}
            <div className="card">
              <FaceCropImage faceId={currentFace.id} />
              
              {/* Photo Preview */}
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">From photo:</p>
                <PhotoPreview photoId={currentFace.photo_id} />
              </div>
            </div>

            {/* Label Form */}
            <div className="card">
              <h2 className="text-2xl font-semibold mb-6">Who is this?</h2>

              {/* Suggestion */}
              {currentFace.suggested_person && (
                <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm text-gray-400 mb-3">AI Suggestion:</p>
                  <button
                    onClick={() => handleLabel(currentFace.id, currentFace.suggested_person.name)}
                    disabled={labeling}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {currentFace.suggested_person.name}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">or enter a different name below</p>
                </div>
              )}

              {/* Manual Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Person's Name
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLabel(currentFace.id, personName)
                    }
                  }}
                  autoFocus={!currentFace.suggested_person}
                />
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => handleLabel(currentFace.id, personName)}
                  disabled={!personName.trim() || labeling}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {labeling ? 'Labeling...' : 'Label Face'}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSkip}
                    className="btn-secondary"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => handleNotAFace(currentFace.id)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                  >
                    Not a Face
                  </button>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="mt-6 p-4 rounded-lg bg-gray-800">
                <p className="text-xs text-gray-400 mb-2 font-medium">Keyboard Shortcuts:</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Enter</span>
                    <span>Label face</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tab</span>
                    <span>Skip to next</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FaceCropImage({ faceId }) {
  const [imageUrl, setImageUrl] = useState(null)

  useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await api.get(`/faces/${faceId}/crop`, {
          responseType: 'blob'
        })
        setImageUrl(URL.createObjectURL(response.data))
      } catch (err) {
        console.error('Failed to load face', err)
      }
    }
    loadImage()

    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [faceId])

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Face to label"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

function PhotoPreview({ photoId }) {
  const [imageUrl, setImageUrl] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await api.get(`/photos/${photoId}`, {
          responseType: 'blob'
        })
        setImageUrl(URL.createObjectURL(response.data))
      } catch (err) {
        console.error('Failed to load photo', err)
      }
    }
    loadImage()

    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [photoId])

  return (
    <div 
      onClick={() => navigate(`/photo/${photoId}`)}
      className="relative h-32 rounded-lg overflow-hidden bg-gray-800 cursor-pointer group"
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt="Source photo"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">View Full Photo</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

export default LabelFaces
