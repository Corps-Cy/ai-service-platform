import React, { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Download, Loader2, Sparkles } from 'lucide-react';

const TextToImage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [num, setNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiService.createImageTask(prompt, size, num);
      setResult(response.data.result);
      toast.success('图片生成成功');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-generated-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center space-x-2 bg-[#F5F3FF] px-4 py-2 rounded-full mb-4">
          <Sparkles className="w-5 h-5 text-[#6366F1]" />
          <span className="text-[#6366F1] font-semibold">AI 文生图</span>
        </div>
        <h1 className="text-4xl font-bold text-[#1E1B4B] mb-4">
          文生图
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          使用智谱CogView模型，将文字描述转换为精美图片
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：输入表单 */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="space-y-6">
              <div>
                <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-2">
                  提示词
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="input resize-none"
                  placeholder="描述你想要生成的图片，例如：一只可爱的橙色小猫坐在窗台上，阳光洒在它身上，数字艺术风格"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="size" className="block text-sm font-semibold text-gray-700 mb-2">
                    图片尺寸
                  </label>
                  <select
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="input cursor-pointer"
                  >
                    <option value="1024x1024">1024 x 1024</option>
                    <option value="768x1024">768 x 1024</option>
                    <option value="1024x768">1024 x 768</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="num" className="block text-sm font-semibold text-gray-700 mb-2">
                    生成数量
                  </label>
                  <select
                    id="num"
                    value={num}
                    onChange={(e) => setNum(Number(e.target.value))}
                    className="input cursor-pointer"
                  >
                    <option value={1}>1张</option>
                    <option value={2}>2张</option>
                    <option value={4}>4张</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className={`btn btn-primary w-full flex items-center justify-center ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    生成图片
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="mt-6 p-4 bg-[#F5F3FF] rounded-xl border border-[#6366F1]/20">
            <p className="text-sm text-[#6366F1]">
              <strong>💡 消耗：</strong> 200 tokens/次 | 支持中文和英文提示词
            </p>
          </div>
        </div>

        {/* 右侧：结果展示 */}
        <div className="lg:col-span-2">
          {result && result.data && (
            <div className="card animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1E1B4B]">生成结果</h2>
                <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full text-sm font-semibold">
                  {result.data.length} 张图片
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.data.map((image: any, index: number) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden bg-gray-50">
                    <img
                      src={image.url}
                      alt={`Generated ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button
                        onClick={() => handleDownload(image.url)}
                        className="btn btn-primary bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        下载
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">准备就绪</h3>
              <p className="text-gray-600">输入提示词开始创作</p>
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#6366F1] animate-pulse" />
                </div>
              </div>
              <p className="mt-6 text-gray-600">AI 正在为您创作...</p>
              <div className="mt-4 typing-indicator justify-center">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextToImage;
