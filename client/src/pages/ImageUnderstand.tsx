import React, { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { Eye, Upload, Loader2 } from 'lucide-react';

const ImageUnderstand: React.FC = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleGenerate = async () => {
    if (!imageUrl.trim()) {
      toast.error('请输入图片URL');
      return;
    }

    if (!prompt.trim()) {
      toast.error('请输入提问');
      return;
    }

    setLoading(false);
    setResult('');

    try {
      const response = await apiService.createImageUnderstandTask(imageUrl, prompt);
      const content = response.data.result.choices[0].message.content;
      setResult(content);
      toast.success('分析成功');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '分析失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">图片理解</h1>

      <div className="space-y-6">
        <div className="card">
          <div className="space-y-4">
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                图片URL
              </label>
              <input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={handleUrlChange}
                className="input"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {imageUrl && (
              <div>
                <p className="text-sm text-gray-600 mb-2">预览：</p>
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-w-full h-auto rounded-lg max-h-96"
                  onError={() => toast.error('图片加载失败')}
                />
              </div>
            )}

            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                提问
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="input"
                placeholder="例如：描述这张图片的内容 / 这是什么物体 / 图片中的颜色有哪些"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5 mr-2" />
                  分析图片
                </>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">分析结果</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{result}</p>
            </div>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 支持理解图片内容、描述场景、识别物体等 | 消耗：100 tokens/次
        </p>
      </div>
    </div>
  );
};

export default ImageUnderstand;
