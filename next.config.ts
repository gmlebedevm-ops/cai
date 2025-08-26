import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Разрешение CORS для разработки
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://172.20.1.14:3000'
  ],
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // 禁用 webpack 的热模块替换
      config.watchOptions = {
        ignored: ['**/*'], // 忽略所有文件变化
      };
    }
    return config;
  },
  eslint: {
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
