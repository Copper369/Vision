import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Toast from '../components/Toast'

function FaceThumbnail({ faceId, alt, className, onClick }) {
  const [imageUrl, setImageUrl] = useState(null)

  useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await api.get(`/faces/${faceId}/crop`, {
          responseType: 'blob'
        })
        setImageUrl(URL.createObjectURL(response.data))
      } catch (err) {
        console.error('Failed to load face image', err)
      }
    }
    loadImage()

    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [faceId])

  return imageUrl ? (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  ) : (
    <div className={`${className} bg-gray-800 animate-pulse`}></div>
  )
}

function PhotoDetail() {
  const { photoId } = useParams()
  const navigate = useNavigate()
  const [faces, setFaces] = useState([])
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [labelingFace, setLabelingFace] = useState(null)
  const [personName, setPersonName] = useState('')
  const [highlightedFace, setHighlightedFace] = useState(null)
  const [editingFace, setEditingFace] = useState(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchPhotoDetails()
  }, [photoId])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const fetchPhotoDetails = async () => {
    try {
      const photoResponse = await api.get(`/photos/${photoId}`, {
        responseType: 'blob'
      })
      const url = URL.createObjectURL(photoResponse.data)
      setImageUrl(url)

      const facesResponse = await api.get(`/photos/${photoId}/faces`)
      setFaces(facesResponse.data.faces)
    } catch (err) {
      showToast('Failed to fetch photo details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImageLoad = (e) => {
    setImageDimensions({
      width: e.target.offsetWidth,
      height: e.target.offsetHeight,
      naturalWidth: e.target.naturalWidth,
      naturalHeight: e.target.naturalHeight
    })
  }

  const getBboxStyle = (bbox) => {
    if (!imageDimensions.width || !bbox) return {}
    
    const [x, y, w, h] = bbox.split(',').map(Number)
    const scaleX = imageDimensions.width / imageDimensions.naturalWidth
    const scaleY = imageDimensions.height / imageDimensions.naturalHeight
    
    return {
      position: 'absolute',
      left: `${x * scaleX}px`,
      top: `${y * scaleY}px`,
      width: `${w * scaleX}px`,
      height: `${h * scaleY}px`,
      border: '3px solid #a855f7',
      boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.3), 0 0 20px rgba(168, 85, 247, 0.5)',
      pointerEvents: 'none',
      zIndex: 10,
      borderRadius: '8px'
    }
  }

  const handleLabelFace = async (faceId) => {
    if (!personName.trim()) return

    try {
      await api.post('/faces/label', {
        face_id: faceId,
        person_name: personName.trim()
      })
      
      showToast('Face labeled successfully', 'success')
      setPersonName('')
      setLabelingFace(null)
      setEditingFace(null)
      setHighlightedFace(null)
      fetchPhotoDetails()
    } catch (err) {
      showToast('Failed to label face', 'error')
    }
  }

  const handleEditFace = (face) => {
    setEditingFace(face.id)
    setPersonName(face.person_name || '')
    setHighlightedFace(face.id)
  }

  const handleCancelEdit = () => {
    setEditingFace(null)
    setPersonName('')
    setHighlightedFace(null)
  }

  const handleDeleteFace = async (faceId) => {
    try {
      await api.delete(`/faces/${faceId}`)
      showToast('Face removed successfully', 'success')
      fetchPhotoDetails()
    } catch (err) {
      showToast('Failed to delete face', 'error')
    }
  }

  const handleConfirmSuggestion = async (faceId, suggestedName) => {
    try {
      await api.post('/faces/label', {
        face_id: faceId,
        person_name: suggestedName
      })
      showToast(`Labeled as ${suggestedName}`, 'success')
      setHighlightedFace(null)
      fetchPhotoDetails()
    } catch (err) {
      showToast('Failed to label face', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading photo...</p>
        </div>
      </div>
    )
  }

  const unlabeledFaces = faces.filter(f => !f.person_name)
  const labeledFaces = faces.filter(f => f.person_name)

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
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold">
          Photo Details<span className="gradient-text">.</span>
        </h1>
        <div className="w-20"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photo */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Photo</h2>
          <div className="relative rounded-lg overflow-hidden">
            {imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt="Photo"
                  className="w-full rounded-lg"
                  onLoad={handleImageLoad}
                />
                {highlightedFace && faces.find(f => f.id === highlightedFace) && (
                  <div style={getBboxStyle(faces.find(f => f.id === highlightedFace).bbox)} />
                )}
              </>
            ) : (
              <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-emerald-400">{faces.length}</div>
              <div className="text-xs text-gray-400">Total Faces</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{labeledFaces.length}</div>
              <div className="text-xs text-gray-400">Labeled</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-400">{unlabeledFaces.length}</div>
              <div className="text-xs text-gray-400">Unlabeled</div>
            </div>
          </div>
        </div>

        {/* Faces */}
        <div className="space-y-6">
          {/* Labeled Faces */}
          {labeledFaces.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">
                Labeled Faces ({labeledFaces.length})
              </h2>
              <div className="space-y-3">
                {labeledFaces.map((face) => (
                  <div key={face.id}>
                    {editingFace === face.id ? (
                      <div className="border-2 border-emerald-500 rounded-lg p-4 bg-emerald-500/10">
                        <div className="flex items-start gap-4">
                          <FaceThumbnail
                            faceId={face.id}
                            alt={face.person_name}
                            className="w-16 h-16 rounded-full object-cover ring-4 ring-emerald-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-400 mb-2">Change from "{face.person_name}" to:</p>
                            <input
                              type="text"
                              value={personName}
                              onChange={(e) => setPersonName(e.target.value)}
                              placeholder="Enter new name"
                              className="w-full mb-2"
                              autoFocus
                              onKeyPress={(e) => e.key === 'Enter' && handleLabelFace(face.id)}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLabelFace(face.id)}
                                disabled={!personName.trim()}
                                className="btn-primary text-sm disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="btn-secondary text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition ${
                          highlightedFace === face.id 
                            ? 'bg-emerald-500/20 ring-2 ring-emerald-500' 
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                        onClick={() => setHighlightedFace(highlightedFace === face.id ? null : face.id)}
                      >
                        <FaceThumbnail
                          faceId={face.id}
                          alt={face.person_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-semibold">{face.person_name}</div>
                          <div className="text-sm text-gray-400">Confidence: {(face.confidence * 100).toFixed(0)}%</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditFace(face)
                            }}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFace(face.id)
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Click on a face to highlight it in the photo
              </p>
            </div>
          )}

          {/* Unlabeled Faces */}
          {unlabeledFaces.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">
                Unlabeled Faces ({unlabeledFaces.length})
              </h2>
              <div className="space-y-4">
                {unlabeledFaces.map((face) => (
                  <div 
                    key={face.id} 
                    className={`border-2 rounded-lg p-4 transition ${
                      highlightedFace === face.id 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : 'border-gray-700 bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <FaceThumbnail
                        faceId={face.id}
                        alt="Unlabeled face"
                        className={`w-20 h-20 rounded-lg object-cover cursor-pointer ${
                          highlightedFace === face.id ? 'ring-4 ring-emerald-500' : ''
                        }`}
                        onClick={() => setHighlightedFace(highlightedFace === face.id ? null : face.id)}
                      />
                      <div className="flex-1">
                        {face.suggested_person && labelingFace !== face.id ? (
                          <div className="mb-3">
                            <p className="text-sm text-gray-400 mb-2">Is this {face.suggested_person.name}?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setHighlightedFace(face.id)
                                  handleConfirmSuggestion(face.id, face.suggested_person.name)
                                }}
                                className="btn-primary text-sm"
                              >
                                Yes, it's {face.suggested_person.name}
                              </button>
                              <button
                                onClick={() => {
                                  setLabelingFace(face.id)
                                  setHighlightedFace(face.id)
                                }}
                                className="btn-secondary text-sm"
                              >
                                No, someone else
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {(!face.suggested_person || labelingFace === face.id) && (
                          <div>
                            <input
                              type="text"
                              value={labelingFace === face.id ? personName : ''}
                              onChange={(e) => {
                                setLabelingFace(face.id)
                                setHighlightedFace(face.id)
                                setPersonName(e.target.value)
                              }}
                              placeholder="Enter person's name"
                              className="w-full mb-2"
                              onKeyPress={(e) => e.key === 'Enter' && handleLabelFace(face.id)}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLabelFace(face.id)}
                                disabled={!personName.trim()}
                                className="btn-primary text-sm disabled:opacity-50"
                              >
                                Label Face
                              </button>
                              <button
                                onClick={() => handleDeleteFace(face.id)}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-sm transition-colors"
                              >
                                Not a Face
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {faces.length === 0 && (
            <div className="card text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-gray-400">No faces detected in this photo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PhotoDetail
