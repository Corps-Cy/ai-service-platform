import React, { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Upload, Eye, Loader2, Zap, Sparkles, FileText } from 'lucide-react';

const ImageUnderstand: React.FC = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('图片大小不能超过5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUrl) {
      toast.error('请先上传图片');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiService.createTask({
        type: 'image_understand',
        input: JSON.stringify({ image: '[IMAGE]', prompt })
      });

      const taskId = response.data.taskId;

      // 轮询任务结果
      const interval = setInterval(async () => {
        const taskResponse = await apiService.getTask(taskId);
        
        if (taskResponse.data.task.status === 'completed') {
          clearInterval(interval);
          setResult(taskResponse.data.task.output);
          setLoading(false);
          toast.success('图片分析完成');
        } else if (taskResponse.data.task.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
          toast.error('图片分析失败');
        }
      }, 2000);

      // 30秒超时
      setTimeout(() => {
        clearInterval(interval);
        if (loading) {
          setLoading(false);
          toast.error('分析超时，请稍后再试');
        }
      }, 30000);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.response?.data?.error || '分析失败');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center space-x-2 bg-[#F5F3FF] px-4 py-2 rounded-full mb-4">
          <Sparkles className="w-5 h-5 text-[#6366F1]" />
          <span className="text-[#6366F1] font-semibold">AI 图片理解</span>
        </div>
        <h1 className="text-4xl font-bold text-[#1E1B4B] mb-4">
          图片理解
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          基于GLM-4V多模态模型，精准理解图片内容
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：上传和分析 */}
        <div className="space-y-6">
          {/* 图片上传卡片 */}
          <div className="card">
            <h2 className="text-xl font-bold text-[#1E1B4B] mb-6 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-[#6366F1]" />
              上传图片
            </h2>

            {/* 上传区域 */}
            {!imagePreview ? (
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageUpload({ target: { files: [file] } } as any);
                }}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-[#6366F1]/30 rounded-xl p-8 text-center cursor-pointer hover:border-[#6366F1]/60 transition-colors"
              >
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">拖拽图片到此处，或</p>
                <label className="btn btn-primary inline-flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  选择文件
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 图片预览 */}
                <div className="relative bg-[#F5F3FF] rounded-xl p-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full aspect-square object-contain rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setImageUrl('');
                      setResult(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
                    title="清除图片"
                  >
                    ✕
                  </button>
                </div>

                {/* 文件信息 */}
                <div className="text-sm text-gray-600 mb-4">
                  文件大小：{(imagePreview.length * 0.75 / 1024).toFixed(2)} KB
                </div>

                {/* 提示词输入 */}
                <div>
                  <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-2">
                    附加提示（可选）
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="input resize-none"
                    placeholder="例如：描述图片中的主要内容、场景、对象等"
                  />
                </div>

                {/* 分析按钮 */}
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !imageUrl}
                  className={`btn btn-primary w-full flex items-center justify-center ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      开始分析
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 使用说明 */}
          <div className="bg-[#F5F3FF]/10 border border-[#6366F1]/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#1E1B4B] mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-[#6366F1]" />
              使用说明
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="inline-block w-2 text-center text-[#10B981] mr-2">✓</span>
                支持JPG、PNG、WEBP等常见图片格式
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 text-center text-[#10B981] mr-2">✓</span>
                最大文件大小：5MB
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 text-center text-[#10B981] mr-2">✓</span>
                添加提示词可以提高理解准确性
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 text-center text-[#10B981] mr-2">✓</span>
                分析结果将保留在任务历史中
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 text-center text-[#10B981] mr-2">✓</span>
                支持多对象检测、场景理解、文字识别等
              </li>
            </ul>
          </div>
        </div>

        {/* 右侧：结果展示 */}
        <div className="lg:col-span-1">
          {result && result.data ? (
            <div className="card animate-fade-in h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1E1B4B]">
                  分析结果
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="typing-indicator">
                    <span className="typing-dot bg-[#10B981]"></span>
                    <span className="typing-dot bg-[#10B981]"></span>
                    <span className="typing-dot bg-[#10B981]"></span>
                  </span>
                  <span className="text-sm text-gray-500">AI已分析完成</span>
                </div>
              </div>

              {/* 结果内容 */}
              <div className="bg-[#F5F3FF] rounded-xl p-6 border border-[#6366F1]/20">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono overflow-x-auto">
                  {typeof result.data === 'string' 
                    ? result.data 
                    : JSON.stringify(result.data, null, 2)}
                </pre>
              </div>

              {/* 操作按钮 */}
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={() => navigator.clipboard.writeText(typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2))}
                  className="btn btn-secondary flex-1"
                >
                  复制结果
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setImagePreview(null);
                    setImageUrl('');
                  }}
                  className="btn btn-ghost flex-1"
                >
                  重置
                </button>
              </div>
            </div>
          ) : !imagePreview && !loading && (
            <div className="card flex flex-col items-center justify-center py-16 text-center h-full">
              <Eye className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                准备就绪
              </h3>
              <p className="text-gray-600">
                上传图片开始AI智能分析
              </p>
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#6366F1] animate-pulse" />
                </div>
              </div>
              <p className="mt-6 text-gray-600">AI 正在深度分析图片...</p>
              <div className="typing-indicator justify-center mt-4">
                <span className="typing-dot bg-[#6366F1]"></span>
                <span className="typing-dot bg-[#6366F1]"></span>
                <span className="typing-dot bg-[#6366F1]"></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUnderstand;
