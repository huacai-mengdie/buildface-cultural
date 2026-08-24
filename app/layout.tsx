import type { Metadata } from 'next';
import './globals.css';

const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const PUBLIC_ORIGIN = process.env.GITHUB_ACTIONS === 'true'
  ? 'https://huacai-mengdie.github.io'
  : 'https://buildface-cultural.hhcgg91234.chatgpt.site';

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_ORIGIN),
  title: '筑脸文创｜城市潮流文创',
  description: '筑脸文创城市潮流创意展示',
  openGraph: {
    title: '筑脸文创｜城市潮流文创',
    description: '真实三维苹果笔记本与潮流视觉融合的筑脸文创展示',
    images: [{ url: `${ASSET_BASE}/og.png`, width: 1200, height: 630, alt: '筑脸文创城市潮流文创' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '筑脸文创｜城市潮流文创',
    description: '真实三维苹果笔记本与潮流视觉融合的筑脸文创展示',
    images: [`${ASSET_BASE}/og.png`],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <style>{`@font-face{font-family:"Biaoxiaozhi Unbounded";src:url("${ASSET_BASE}/fonts/biaoxiaozhi-unbounded.otf") format("opentype");font-style:normal;font-weight:400;font-display:swap}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
