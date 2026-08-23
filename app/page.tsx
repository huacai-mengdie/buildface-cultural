'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import MacbookScene from './components/MacbookScene';

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setError(true), []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const updateScrollTransition = () => {
      frame = 0;
      const travel = Math.max(window.innerHeight * 0.72, 1);
      const progress = Math.min(Math.max(window.scrollY / travel, 0), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const motionScale = reducedMotion.matches ? 1 : 1 - eased * 0.2;
      const motionY = reducedMotion.matches ? 0 : eased * -18;

      hero.style.setProperty('--hero-scale', motionScale.toFixed(4));
      hero.style.setProperty('--hero-y', `${motionY.toFixed(2)}px`);
      hero.style.setProperty('--hero-radius', `${(eased * 28).toFixed(2)}px`);
      hero.style.setProperty('--hero-shadow', (eased * 0.28).toFixed(3));
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScrollTransition);
    };

    updateScrollTransition();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    reducedMotion.addEventListener('change', scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      reducedMotion.removeEventListener('change', scheduleUpdate);
    };
  }, []);

  return (
    <main className="page-shell">
      <section className="scroll-stage" aria-label="筑脸文创首屏">
        <article ref={heroRef} className={`hero ${hovered ? 'is-model-hovered' : ''}`}>
          <img
            className="background-art"
            src="/buildface-background.jpg"
            alt=""
            aria-hidden="true"
          />

          <div className="top-cleaner" aria-hidden="true" />

          <nav className="image-hotspots" aria-label="主要导航">
            <a className="hotspot hotspot-brand" href="#" aria-label="筑脸 Buildface 首页">
              <img src="/ui/brand.png" alt="" aria-hidden="true" />
            </a>
            <a className="hotspot hotspot-nav hotspot-service" href="#服务" aria-label="服务">
              <img className="button-art button-art-default" src="/ui/service.png" alt="" aria-hidden="true" />
              <img className="button-art button-art-hover" src="/ui/service-hover.png" alt="" aria-hidden="true" />
            </a>
            <a className="hotspot hotspot-nav hotspot-team" href="#团队" aria-label="团队">
              <img className="button-art button-art-default" src="/ui/team.png" alt="" aria-hidden="true" />
              <img className="button-art button-art-hover" src="/ui/team-hover.png" alt="" aria-hidden="true" />
            </a>
            <a className="hotspot hotspot-nav hotspot-process" href="#流程" aria-label="流程">
              <img className="button-art button-art-default" src="/ui/process.png" alt="" aria-hidden="true" />
              <img className="button-art button-art-hover" src="/ui/process-hover.png" alt="" aria-hidden="true" />
            </a>
            <button className="hotspot hotspot-nav hotspot-cooperate" type="button" aria-label="合作 GO">
              <img className="button-art button-art-default" src="/ui/cooperate.png" alt="" aria-hidden="true" />
              <img className="button-art button-art-hover" src="/ui/cooperate-hover.png" alt="" aria-hidden="true" />
            </button>
          </nav>

          <div className="decor-layer" aria-hidden="true">
            <img className="glitch-decor decor-hash" src="/ui/hash.png" alt="" />
            <img className="glitch-decor decor-arrow" src="/ui/arrow.png" alt="" />
            <img className="glitch-decor decor-no1" src="/ui/no1.png" alt="" />
          </div>

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
        </article>
      </section>

      <section className="next-panel" aria-label="下一内容区域" />
    </main>
  );
}
