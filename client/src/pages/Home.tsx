import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Sparkles, Zap, Shield, ArrowRight, Type, Image as ImageIcon, FileText, Table, Eye } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: <Type className="w-8 h-8 text-[#6366F1]" />,
      title: '文生图',
      description: '使用智谱CogView模型，将文字描述转换为精美图片',
      price: '¥2/次',
      color: 'bg-blue-50'
    },
    {
      icon: <FileText className="w-8 h-8 text-[#6366F1]" />,
      title: '文档处理',
      description: 'PDF解析、转换、内容提取，支持多种文档格式',
      price: '¥1/页',
      color: 'bg-green-50'
    },
    {
      icon: <Table className="w-8 h-8 text-[#6366F1]" />,
      title: 'Excel操作',
      description: '智能生成表格、数据分析、格式转换',
      price: '¥3/次',
      color: 'bg-purple-50'
    },
    {
      icon: <Eye className="w-8 h-8 text-[#6366F1]" />,
      title: '图片理解',
      description: '基于GLM-4V多模态模型，精准理解图片内容',
      price: '¥1/次',
      color: 'bg-orange-50'
    },
  ];

  const plans = [
    {
      name: '月卡',
      price: '¥29',
      period: '/月',
      features: ['文生图100次', 'PDF处理500页', 'Excel操作50次', '文本生成不限'],
      popular: false
    },
    {
      name: '季卡',
      price: '¥79',
      period: '/季',
      features: ['文生图300次', 'PDF处理1500页', 'Excel操作150次', '文本生成不限', '优先处理'],
      popular: true
    },
    {
      name: '年卡',
      price: '¥299',
      period: '/年',
      features: ['文生图1200次', 'PDF处理6000页', 'Excel操作600次', '文本生成不限', '优先处理', '专属客服'],
      popular: false
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      {/* Hero Section */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8 animate-fade-in">
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
              <span className="text-white text-sm">AI 驱动的智能服务平台</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight animate-slide-up">
              AI 赋能，
              <span className="block mt-2">无限可能</span>
            </h1>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              基于智谱AI的专业服务平台，为您提供高质量的AI服务
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link
                to="/register"
                className="btn btn-primary text-lg px-8 py-4 inline-flex items-center group"
              >
                免费开始
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/pricing"
                className="btn btn-ghost text-white hover:bg-white/10 border border-white/30 text-lg px-8 py-4"
              >
                查看价格
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E1B4B] mb-4">
              核心功能
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              强大的AI能力，满足您的各种需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`${feature.color} p-3 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-[#1E1B4B] mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="text-[#6366F1] font-semibold">
                  {feature.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-24 bg-[#F5F3FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E1B4B] mb-4">
              选择适合您的套餐
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              灵活的定价方案，满足不同需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative card p-8 ${
                  plan.popular ? 'border-2 border-[#10B981] scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#10B981] text-white text-sm font-medium px-4 py-1 rounded-full shadow-lg shadow-emerald-500/30">
                      最受欢迎
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-[#1E1B4B] mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-[#6366F1]">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <Shield className="w-5 h-5 text-[#10B981] mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/pricing"
                  className={`block w-full btn text-center ${
                    plan.popular ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  选择此方案
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-[#6366F1] to-[#818CF8] rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            </div>

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                立即开始使用
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                注册即送免费体验额度，开启AI创作之旅
              </p>
              <Link
                to="/register"
                className="inline-block bg-white text-[#6366F1] hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                免费注册
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
