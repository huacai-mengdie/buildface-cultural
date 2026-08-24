'use client';

import { useEffect, useRef } from 'react';
import ThirdScreen from './ThirdScreen';

const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const CARD_ITEMS = [
  { src: `${ASSET_BASE}/second-screen/visual-content.png`, alt: '视觉内容' },
  { src: `${ASSET_BASE}/second-screen/brand-empowerment.png`, alt: '品牌赋能' },
  { src: `${ASSET_BASE}/second-screen/cultural-development.png`, alt: '文创开发' },
  { src: `${ASSET_BASE}/second-screen/digital-intelligence.png`, alt: '数字智能' },
];

const ANCHOR_X = [21.8, 41.1, 59.5, 77.7];
const BASE_ANGLE = [-0.13, 0.055, -0.045, 0.12];
const SCROLL_DIRECTION = [-1, 0.55, -0.65, 1];

type CardBody = {
  element: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  dragging: boolean;
  pointerId: number | null;
  grabX: number;
  grabY: number;
  lastPointerX: number;
  lastPointerY: number;
  lastPointerTime: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function RevealText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      {Array.from(text).map((character, index) => (
        <span className="reveal-character" data-reveal-character key={`${character}-${index}`}>
          {character}
        </span>
      ))}
    </span>
  );
}

export default function SecondScreen() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const cardElements = Array.from(
      stage.querySelectorAll<HTMLElement>('[data-physics-card]'),
    );
    const revealCharacters = Array.from(
      section.querySelectorAll<HTMLElement>('[data-reveal-character]'),
    );
    const subtitle = section.querySelector<HTMLElement>('[data-second-subtitle]');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const bodies: CardBody[] = cardElements.map((element) => ({
      element,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
      dragging: false,
      pointerId: null,
      grabX: 0,
      grabY: 0,
      lastPointerX: 0,
      lastPointerY: 0,
      lastPointerTime: performance.now(),
    }));

    let animationFrame = 0;
    let scrollFrame = 0;
    let previousFrameTime = performance.now();
    let previousScrollY = window.scrollY;
    let previousScrollTime = performance.now();
    let sectionVisible = false;

    const getAnchor = (index: number) => {
      const width = stage.clientWidth;
      const height = Math.min(stage.clientHeight, window.innerHeight);
      const xPercent = ANCHOR_X[index];
      const normalized = (xPercent - 50) / 50;

      return {
        x: width * (xPercent / 100),
        y: height * (0.103 - normalized * normalized * 0.1),
      };
    };

    const renderBody = (body: CardBody, index: number) => {
      const anchor = getAnchor(index);
      const attachmentOffset = body.element.offsetHeight * 0.058;
      const left = anchor.x - body.element.offsetWidth / 2 + body.x;
      const top = anchor.y - attachmentOffset + body.y;
      const angle = BASE_ANGLE[index] + body.angle;

      body.element.style.transform = `translate3d(${left.toFixed(2)}px, ${top.toFixed(2)}px, 0) rotate(${angle.toFixed(4)}rad)`;
    };

    const renderAllBodies = () => {
      bodies.forEach(renderBody);
    };

    const updateReveal = () => {
      scrollFrame = 0;
      const rect = section.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight, 1);
      const revealProgress = clamp(
        (viewportHeight - rect.top) / Math.max(viewportHeight * 0.72, 1),
        0,
        1,
      );
      const reducedMotion = reducedMotionQuery.matches;

      revealCharacters.forEach((character, index) => {
        const start = (index / Math.max(revealCharacters.length - 1, 1)) * 0.42;
        const localProgress = reducedMotion
          ? revealProgress > 0.02 ? 1 : 0
          : clamp((revealProgress - start) / 0.42, 0, 1);
        const eased = 1 - Math.pow(1 - localProgress, 3);

        character.style.opacity = eased.toFixed(3);
        character.style.transform = `translate3d(0, ${((1 - eased) * 34).toFixed(2)}px, 0)`;
        character.style.filter = `blur(${((1 - eased) * 7).toFixed(2)}px)`;
      });

      if (subtitle) {
        const subtitleProgress = reducedMotion
          ? revealProgress > 0.05 ? 1 : 0
          : clamp((revealProgress - 0.52) / 0.34, 0, 1);
        const subtitleEased = 1 - Math.pow(1 - subtitleProgress, 3);
        subtitle.style.opacity = subtitleEased.toFixed(3);
        subtitle.style.transform = `translate3d(0, ${((1 - subtitleEased) * 24).toFixed(2)}px, 0)`;
      }

      const now = performance.now();
      const elapsed = Math.max(now - previousScrollTime, 8);
      const scrollDelta = window.scrollY - previousScrollY;
      const scrollSpeed = clamp(scrollDelta / elapsed, -3.2, 3.2);
      const sectionIsNear = rect.bottom > -window.innerHeight * 0.15 && rect.top < window.innerHeight * 1.15;

      if (sectionIsNear && !reducedMotion && Math.abs(scrollSpeed) > 0.025) {
        const impulse = scrollSpeed * 210;
        bodies.forEach((body, index) => {
          if (body.dragging) return;
          body.vy += impulse * 0.24;
          body.vx += impulse * SCROLL_DIRECTION[index] * 0.075;
          body.angularVelocity += impulse * SCROLL_DIRECTION[index] * 0.0012;
        });
      }

      previousScrollY = window.scrollY;
      previousScrollTime = now;
      renderAllBodies();
    };

    const scheduleReveal = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(updateReveal);
    };

    const animate = (now: number) => {
      const dt = Math.min(Math.max((now - previousFrameTime) / 1000, 0.001), 0.033);
      previousFrameTime = now;

      if (sectionVisible) {
        const reducedMotion = reducedMotionQuery.matches;

        bodies.forEach((body, index) => {
          if (!body.dragging) {
            const spring = reducedMotion ? 22 : 13.5;
            const damping = reducedMotion ? 9 : 4.8;
            const accelerationX = -spring * body.x - damping * body.vx;
            const accelerationY = -spring * body.y - damping * body.vy;

            body.vx += accelerationX * dt;
            body.vy += accelerationY * dt;
            body.x += body.vx * dt;
            body.y += body.vy * dt;

            const width = Math.max(stage.clientWidth, 1);
            const targetAngle = clamp(body.x / (width * 0.3), -0.25, 0.25);
            const angularAcceleration =
              -10.5 * (body.angle - targetAngle) - 4.2 * body.angularVelocity + body.vx * 0.002;
            body.angularVelocity += angularAcceleration * dt;
            body.angle += body.angularVelocity * dt;

            if (
              Math.abs(body.x) < 0.01 &&
              Math.abs(body.y) < 0.01 &&
              Math.abs(body.vx) < 0.03 &&
              Math.abs(body.vy) < 0.03 &&
              Math.abs(body.angle) < 0.0002 &&
              Math.abs(body.angularVelocity) < 0.0002
            ) {
              body.x = 0;
              body.y = 0;
              body.vx = 0;
              body.vy = 0;
              body.angle = 0;
              body.angularVelocity = 0;
            }
          }

          renderBody(body, index);
        });
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const pointerDownHandlers = bodies.map((body, index) => (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      event.preventDefault();

      const stageRect = stage.getBoundingClientRect();
      const anchor = getAnchor(index);
      const pointerX = event.clientX - stageRect.left;
      const pointerY = event.clientY - stageRect.top;

      body.dragging = true;
      body.pointerId = event.pointerId;
      body.grabX = pointerX - (anchor.x + body.x);
      body.grabY = pointerY - (anchor.y + body.y);
      body.lastPointerX = pointerX;
      body.lastPointerY = pointerY;
      body.lastPointerTime = performance.now();
      body.element.classList.add('is-dragging');
      body.element.setPointerCapture(event.pointerId);
    });

    const handlePointerMove = (event: PointerEvent) => {
      const bodyIndex = bodies.findIndex(
        (body) => body.dragging && body.pointerId === event.pointerId,
      );
      if (bodyIndex < 0) return;

      const body = bodies[bodyIndex];
      const stageRect = stage.getBoundingClientRect();
      const anchor = getAnchor(bodyIndex);
      const pointerX = event.clientX - stageRect.left;
      const pointerY = event.clientY - stageRect.top;
      const now = performance.now();
      const elapsed = Math.max((now - body.lastPointerTime) / 1000, 0.008);
      const nextX = clamp(
        pointerX - anchor.x - body.grabX,
        -stage.clientWidth * 0.29,
        stage.clientWidth * 0.29,
      );
      const nextY = clamp(
        pointerY - anchor.y - body.grabY,
        -stage.clientHeight * 0.22,
        stage.clientHeight * 0.34,
      );

      body.vx = clamp((nextX - body.x) / elapsed, -1900, 1900);
      body.vy = clamp((nextY - body.y) / elapsed, -1900, 1900);
      body.x = nextX;
      body.y = nextY;
      body.angle = clamp(body.x / Math.max(stage.clientWidth * 0.32, 1), -0.45, 0.45);
      body.angularVelocity = clamp(body.vx * 0.0013, -2.4, 2.4);
      body.lastPointerX = pointerX;
      body.lastPointerY = pointerY;
      body.lastPointerTime = now;
      renderBody(body, bodyIndex);
    };

    const releasePointer = (event: PointerEvent) => {
      const body = bodies.find(
        (item) => item.dragging && item.pointerId === event.pointerId,
      );
      if (!body) return;

      body.dragging = false;
      body.pointerId = null;
      body.angularVelocity += clamp(body.vx * 0.00055, -1.2, 1.2);
      body.element.classList.remove('is-dragging');
      if (body.element.hasPointerCapture(event.pointerId)) {
        body.element.releasePointerCapture(event.pointerId);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionVisible = entry.isIntersecting;
        if (sectionVisible) previousFrameTime = performance.now();
      },
      { rootMargin: '20% 0px 20% 0px' },
    );

    cardElements.forEach((element, index) => {
      element.addEventListener('pointerdown', pointerDownHandlers[index]);
    });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', releasePointer);
    window.addEventListener('pointercancel', releasePointer);
    window.addEventListener('scroll', scheduleReveal, { passive: true });
    window.addEventListener('resize', renderAllBodies);
    reducedMotionQuery.addEventListener('change', scheduleReveal);
    observer.observe(section);

    updateReveal();
    renderAllBodies();
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      observer.disconnect();
      cardElements.forEach((element, index) => {
        element.removeEventListener('pointerdown', pointerDownHandlers[index]);
      });
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', releasePointer);
      window.removeEventListener('pointercancel', releasePointer);
      window.removeEventListener('scroll', scheduleReveal);
      window.removeEventListener('resize', renderAllBodies);
      reducedMotionQuery.removeEventListener('change', scheduleReveal);
    };
  }, []);

  return (
    <div ref={sectionRef} className="second-third-flow">
      <section className="next-panel second-screen" aria-labelledby="second-screen-title">
        <div className="second-copy">
          <h2 id="second-screen-title" className="second-title" aria-label="从一个创意到完整落地">
            <span className="second-title-line">
              <RevealText text="从一个" />
              <RevealText text="创意" className="second-title-lime" />
            </span>
            <span className="second-title-line second-title-line-bottom">
              <span className="second-title-orbit" aria-hidden="true">
                <span className="reveal-character" data-reveal-character>到</span>
              </span>
              <RevealText text="完整落地" />
            </span>
          </h2>

          <p className="second-subtitle" data-second-subtitle>
            <span>不提供孤立的单项执行</span>
            <span>我们把策略、内容、设计、技术和现场串成同一条品牌链路</span>
          </p>
        </div>
      </section>

      <ThirdScreen />

      <div ref={stageRef} className="physics-stage" aria-label="可拖拽的服务卡片">
        {CARD_ITEMS.map((item) => (
          <article className="physics-card" data-physics-card key={item.src}>
            <img src={item.src} alt={item.alt} draggable={false} />
          </article>
        ))}
      </div>
    </div>
  );
}
