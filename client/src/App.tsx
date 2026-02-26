import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // 检查初始化状态
  useEffect(() => {
    const checkInit = async () => {
      try {
        const response = await fetch('/api/init/status');
        const data = await response.json();
        setIsInitialized(data.configured);
      } catch (error) {
        setIsInitialized(true);
      } finally {
        setLoading(false);
      }
    };
    checkInit();
  }, []);

  // 检查认证状态 - 只在初始化检查完成后执行
  useEffect(() => {
    if (loading) return;
    
    const token = localStorage.getItem('token');
    console.log('[App] Checking auth, token exists:', !!token);
    
    if (token) {
      setIsAuthenticated(true);
    }
    setAuthChecked(true);
  }, [loading]);

  // 登录处理 - 由Login组件调用
  const handleLogin = () => {
    console.log('[App] handleLogin called');
    setIsAuthenticated(true);
  };

  // 登出处理
  const handleLogout = () => {
    console.log('[App] handleLogout called');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/');
  };

  // 调试输出
  useEffect(() => {
    console.log('[App] State:', { 
      loading, 
      isInitialized, 
      isAuthenticated, 
      authChecked,
      currentPath: location.pathname 
    });
  }, [loading, isInitialized, isAuthenticated, authChecked, location.pathname]);

  // 加载中
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F3FF]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 未初始化
  if (isInitialized === false) {
    return <Routes><Route path="*" element={<InitConfig />} /></Routes>;
  }

  return (
    <Layout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={
            isAuthenticated 
              ? <Navigate to="/dashboard" replace /> 
              : <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated 
              ? <Navigate to="/dashboard" replace /> 
              : <Register onRegister={handleLogin} />
          } 
        />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/init" element={<InitConfig />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/image" 
          element={isAuthenticated ? <TextToImage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/text" 
          element={isAuthenticated ? <TextGenerate /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/image-understand" 
          element={isAuthenticated ? <ImageUnderstand /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/document" 
          element={isAuthenticated ? <DocumentProcess /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/excel" 
          element={isAuthenticated ? <ExcelProcess /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/admin" 
          element={isAuthenticated ? <Admin /> : <Navigate to="/login" replace />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
