import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, Menu, X, Zap, LayoutDashboard, LogOut, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, isAuthenticated, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: '首页' },
    { path: '/image', label: '文生图', auth: true },
    { path: '/text', label: '文本生成', auth: true },
    { path: '/image-understand', label: '图片理解', auth: true },
    { path: '/document', label: '文档处理', auth: true },
    { path: '/excel', label: 'Excel操作', auth: true },
    { path: '/pricing', label: '价格' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    setIsMenuOpen(false);
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      {/* 导航栏 */}
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-gradient-to-br from-[#6366F1] to-[#818CF8] p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[#1E1B4B]">AI服务平台</span>
            </Link>

            {/* 桌面导航 */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                if (item.auth && !isAuthenticated) return null;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-semibold transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-[#6366F1]'
                        : 'text-gray-600 hover:text-[#6366F1]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* 用户区域 */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium text-gray-600 hover:text-[#6366F1] transition-colors duration-200 flex items-center space-x-1"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>仪表板</span>
                  </Link>
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200 flex items-center space-x-1"
                  >
                    <Settings className="w-4 h-4" />
                    <span>管理后台</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>退出</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-600 hover:text-[#6366F1] transition-colors duration-200"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary px-4 py-2"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>

            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100">
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => {
                if (item.auth && !isAuthenticated) return null;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'bg-[#F5F3FF] text-[#6366F1]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-gray-100">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      仪表板
                    </Link>
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                    >
                      管理后台
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      退出
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      登录
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-medium bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors duration-200"
                    >
                      注册
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 主要内容 */}
      <main>
        {children}
      </main>

      {/* 页脚 */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2026 AI Service Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
