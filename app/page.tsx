'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function Home() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    ffmpegRef.current = new FFmpeg();
    load();
  }, []);

  const load = async () => {
    if (!ffmpegRef.current) return;
    setIsLoading(true);
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
      console.log(message);
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    setIsReady(true);
    setIsLoading(false);
  };

  const convertToAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setMessage('开始转换...');
      setIsLoading(true);
      
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) return;
      const inputFileName = 'input.' + file.name.split('.').pop();
      const outputFileName = 'output.mp3';
      
      // Write the file to memory
      await ffmpeg.writeFile(inputFileName, await fetchFile(file));
      
      // Run the FFmpeg command
      await ffmpeg.exec([
        '-i', inputFileName,
        '-vn', // Disable video
        '-acodec', 'libmp3lame', // Use MP3 codec
        '-q:a', '2', // Quality (0-9, 0=best)
        outputFileName
      ]);
      
      // Read the result
      const data = await ffmpeg.readFile(outputFileName);
      const blob = new Blob([data], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, '') + '.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setMessage('转换完成！');
    } catch (error) {
      console.error(error);
      setMessage('转换失败：' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">视频音频提取器</h1>
        
        <div className="mb-8 text-center">
          <p className="text-lg mb-6">快速、安全地从视频中提取音频</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <div className="flex items-start space-x-2">
              <svg className="w-6 h-6 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p>完全本地处理，确保文件隐私安全</p>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-6 h-6 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p>快速转换，无需等待上传下载</p>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-6 h-6 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p>无文件大小限制，无次数限制</p>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-6 h-6 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p>无需注册，免费使用所有功能</p>
            </div>
          </div>
        </div>

        {!isReady && (
          <button
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={load}
            disabled={isLoading}
          >
            {isLoading ? '加载中...' : '加载 FFmpeg'}
          </button>
        )}

        {isReady && (
          <div className="flex flex-col items-center gap-4">
            <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-blue rounded-lg shadow-lg tracking-wide uppercase border border-blue cursor-pointer hover:bg-blue-500 hover:text-white">
              <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
              </svg>
              <span className="mt-2 text-base leading-normal">选择视频文件</span>
              <input type='file' className="hidden" accept="video/*" onChange={convertToAudio} />
            </label>
          </div>
        )}

        {message && (
          <div className="mt-4 p-4 rounded bg-gray-100">
            <p className="text-center">{message}</p>
          </div>
        )}

        {isLoading && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </main>
  );
}
