import React, { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Download, Loader2 } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">文生图</h1>

      <div className="space-y-6">
        <div className="card">
          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                提示词
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="input"
                placeholder="描述你想要生成的图片，例如：一只可爱的橙色小猫坐在窗台上，阳光洒在它身上，数字艺术风格"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                  图片尺寸
                </label>
                <select
                  id="size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="input"
                >
                  <option value="1024x1024">1024x1024</option>
                  <option value="768x1024">768x1024</option>
                  <option value="1024x768">1024x768</option>
                </select>
              </div>

              <div>
                <label htmlFor="num" className="block text-sm font-medium text-gray-700 mb-2">
                  生成数量
                </label>
                <select
                  id="num"
                  value={num}
                  onChange={(e) => setNum(Number(e.target.value))}
                  className="input"
                >
                  <option value={1}>1张</option>
                  <option value={2}>2张</option>
                  <option value={4}>4张</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn btn-primary w-full"
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

        {result && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">生成结果</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.data?.map((image: any, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={image.url}
                    alt={`Generated ${index + 1}`}
                    className="w-full rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      onClick={() => handleDownload(image.url)}
                      className="btn btn-primary"
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
      </div>

      {/* 提示信息 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 消耗：200 tokens/次 | 支持中文和英文提示词
        </p>
      </div>
    </div>
  );
};

export default TextToImage;
