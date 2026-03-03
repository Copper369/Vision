import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Gallery from './pages/Gallery'
import People from './pages/People'
import Chat from './pages/Chat'
import History from './pages/History'
import LabelFaces from './pages/LabelFaces'
import PhotoDetail from './pages/PhotoDetail'
import Layout from './components/Layout'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token')
  })

  const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token')
    return token ? children : <Navigate to="/login" />
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
        <Route path="/register" element={<Register setAuth={setIsAuthenticated} />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout setAuth={setIsAuthenticated}>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/gallery" element={
          <PrivateRoute>
            <Layout setAuth={setIsAuthenticated}>
              <Gallery />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/people" element={
          <PrivateRoute>
            <Layout setAuth={setIsAuthenticated}>
              <People />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/chat" element={
          <PrivateRoute>
            <Layout setAuth={setIsAuthenticated}>
              <Chat />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/history" element={
          <PrivateRoute>
            <Layout setAuth={setIsAuthenticated}>
              <History />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/label-faces" element={
          <PrivateRoute>
            <Layout setAuth={setIsAuthenticated}>
              <LabelFaces />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/photo/:photoId" element={
          <PrivateRoute>
            <Layout setAuth={setIsAuthenticated}>
              <PhotoDetail />
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App
