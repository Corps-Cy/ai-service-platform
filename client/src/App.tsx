import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TextToImage from './pages/TextToImage';
import TextGenerate from './pages/TextGenerate';
import ImageUnderstand from './pages/ImageUnderstand';
import DocumentProcess from './pages/DocumentProcess';
import ExcelProcess from './pages/ExcelProcess';
import Pricing from './pages/Pricing';
import Admin from './pages/Admin';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <Layout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/image"
          element={isAuthenticated ? <TextToImage /> : <Navigate to="/login" />}
        />
        <Route
          path="/text"
          element={isAuthenticated ? <TextGenerate /> : <Navigate to="/login" />}
        />
        <Route
          path="/image-understand"
          element={isAuthenticated ? <ImageUnderstand /> : <Navigate to="/login" />}
        />
        <Route
          path="/document"
          element={isAuthenticated ? <DocumentProcess /> : <Navigate to="/login" />}
        />
        <Route
          path="/excel"
          element={isAuthenticated ? <ExcelProcess /> : <Navigate to="/login" />}
        />
        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/admin"
          element={isAuthenticated ? <Admin /> : <Navigate to="/login" />}
        />
      </Routes>
    </Layout>
  );
}

export default App;
