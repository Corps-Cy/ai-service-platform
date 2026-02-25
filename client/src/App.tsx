import React, { useState, useEffect } from 'react';
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
import InitConfig from './pages/InitConfig';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isInitialized, setIsInitialized] = useState(true);
  const [checkingInit, setCheckingInit] = useState(true);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const checkInitialization = async () => {
      try {
        const response = await fetch('/api/init/status');
        const data = await response.json();
        setIsInitialized(data.configured);
      } catch (error) {
        // 如果API调用失败，默认认为已初始化（避免无限重定向）
        setIsInitialized(true);
      } finally {
        setCheckingInit(false);
      }
    };

    checkInitialization();
  }, []);

  return (
    <Layout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
      <Routes>
        {/* 初始化检查 */}
        {!isInitialized && !checkingInit && (
          <Route path="*" element={<InitConfig />} />
        )}

        {/* 正常路由 */}
        <Route path="/" element={<Home />} />
        <Route path="/init" element={<InitConfig />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onRegister={handleLogin} />} />
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
