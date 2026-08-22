'use client';

import { useCallback, useState } from 'react';
import MacbookScene from './components/MacbookScene';

export default function Home() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setError(true), []);

  return (
    <main className={`hero ${hovered ? 'is-model-hovered' : ''}`}>
      <img
        className="background-art"
        src="/buildface-background.jpg"
        alt=""
        aria-hidden="true"
      />

      <nav className="image-hotspots" aria-label="主要导航">
        <a className="hotspot hotspot-brand" href="#" aria-label="筑脸 Buildface 首页" />
        <a className="hotspot hotspot-service" href="#服务" aria-label="服务" />
        <a className="hotspot hotspot-team" href="#团队" aria-label="团队" />
        <a className="hotspot hotspot-process" href="#流程" aria-label="流程" />
        <button className="hotspot hotspot-cooperate" type="button" aria-label="合作 GO" />
      </nav>

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

    </main>
  );
}
