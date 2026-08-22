import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '筑脸文创｜城市潮流文创',
  description: '筑脸文创城市潮流创意展示',
  openGraph: {
    title: '筑脸文创｜城市潮流文创',
    description: '真实三维苹果笔记本与潮流视觉融合的筑脸文创展示',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '筑脸文创城市潮流文创' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '筑脸文创｜城市潮流文创',
    description: '真实三维苹果笔记本与潮流视觉融合的筑脸文创展示',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
