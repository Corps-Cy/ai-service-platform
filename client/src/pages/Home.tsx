import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Sparkles, Zap, Shield, CheckCircle } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: '文生图',
      description: '使用智谱CogView模型，将文字描述转换为精美图片',
      price: '¥2/次'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: '文档处理',
      description: 'PDF解析、转换、内容提取，支持多种文档格式',
      price: '¥1/页'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'Excel操作',
      description: '智能生成表格、数据分析、格式转换',
      price: '¥3/次'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: '图片理解',
      description: '基于GLM-4V多模态模型，精准理解图片内容',
      price: '¥1/次'
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
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              AI赋能，无限可能
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              基于智谱AI的专业服务平台，为您提供高质量的AI服务
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
              >
                免费注册
              </Link>
              <Link
                to="/pricing"
                className="btn bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-3"
              >
                查看价格
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              核心功能
            </h2>
            <p className="text-lg text-gray-600">
              强大的AI能力，满足您的各种需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="text-blue-600 font-semibold">{feature.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              选择适合您的套餐
            </h2>
            <p className="text-lg text-gray-600">
              灵活的定价方案，满足不同需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`card relative ${
                  plan.popular ? 'border-2 border-blue-600 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                      最受欢迎
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-blue-600">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/pricing"
                  className="block w-full btn btn-primary text-center"
                >
                  选择此方案
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            立即开始使用
          </h2>
          <p className="text-xl mb-8 opacity-90">
            注册即送免费体验额度，开启AI创作之旅
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium text-lg"
          >
            免费注册
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
