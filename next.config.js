/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tắt ESLint trong build vì Next 15 + ESLint flat config có xung đột options (useEslintrc, extensions).
  // Chạy lint riêng: npm run lint
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jqtmrdiyysovrncppvgs.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig 