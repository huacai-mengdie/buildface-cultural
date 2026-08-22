'use client';

import { useCallback, useState } from 'react';
import MacbookScene from './components/MacbookScene';

const navItems = ['服务', '团队', '流程'];

export default function Home() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setError(true), []);

  return (
    <main className={`hero ${hovered ? 'is-model-hovered' : ''}`}>
      <header className="site-header">
        <a className="brand" href="#" aria-label="筑脸 Buildface 首页">
          <span className="brand-mark" aria-hidden="true">
            <i className="mark-left" /><i className="mark-right" /><i className="mark-dot" />
          </span>
          <span className="brand-name"><strong>筑脸</strong><small>BUILDFACE</small></span>
          <span className="brand-rule" aria-hidden="true" />
          <span className="brand-tagline"><b>造房子 找筑脸</b><small>AI超会交易服务平台</small></span>
        </a>

        <nav className="primary-nav" aria-label="主要导航">
          {navItems.map((item) => <a href={`#${item}`} key={item}>{item}</a>)}
        </nav>
        <button className="cooperate" type="button">合作GO</button>
      </header>

      <section className="hero-copy" aria-label="城市潮流文创">
        <span className="hash-mark" aria-hidden="true">#</span>
        <h1>城市潮流文创</h1>
        <div className="english-copy" aria-hidden="true"><span>CULTURAL</span><span>CREATIVITY</span></div>
      </section>

      <div className="model-glow" aria-hidden="true" />
      <div className="model-stage" aria-label="苹果笔记本电脑三维模型">
        <MacbookScene
          onLoad={handleLoad}
          onProgress={setProgress}
          onError={handleError}
          onHoverChange={setHovered}
        />
      </div>

      {!loaded && !error && (
        <div className="loading" role="status" aria-live="polite">
          <span>LOADING OBJECT</span><div><i style={{ width: `${progress}%` }} /></div><b>{Math.round(progress)}%</b>
        </div>
      )}
      {error && <div className="load-error" role="alert">模型加载失败，请通过本地服务器打开此页面后重试。</div>}

      <div className="lime-arrow" aria-hidden="true"><span className="arrow-line" /><span className="arrow-head" /></div>
      <div className="number-badge" aria-hidden="true"><span>NO:1</span></div>
      <p className="interaction-hint">HOVER THE MAC · ROTATE</p>
    </main>
  );
}
