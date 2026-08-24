'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import FourthScreen from './FourthScreen';

const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const TITLE_LINES = [
  [
    { value: '不' }, { value: '只' }, { value: '追' },
    { value: '热', accent: true }, { value: '点', accent: true },
  ],
  [{ value: '更' }, { value: '创' }, { value: '造' }],
  [
    { value: '被' }, { value: '讨' }, { value: '论' }, { value: '的' },
    { value: '内', accent: true }, { value: '容', accent: true },
  ],
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type FallingCharacter = {
  element: HTMLElement;
  body: Matter.Body;
  width: number;
  height: number;
};

export default function ThirdScreen() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const fourthCloseTimerRef = useRef(0);
  const fourthClosingRef = useRef(false);
  const [isFourthOpen, setIsFourthOpen] = useState(false);
  const [isFourthClosing, setIsFourthClosing] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    if (!section || !container) return;

    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-third-row]'));
    const characters = Array.from(container.querySelectorAll<HTMLElement>('[data-third-character]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let phase: 'idle' | 'hold' | 'glitch' | 'physics' = 'idle';
    let holdTimer = 0;
    let glitchTimer = 0;
    let scrollFrame = 0;
    let physicsFrame = 0;
    let previousPhysicsTime = performance.now();
    let engine: Matter.Engine | null = null;
    let fallingCharacters: FallingCharacter[] = [];
    let dragConstraint: Matter.Constraint | null = null;
    let dragBody: Matter.Body | null = null;
    let dragPointerId: number | null = null;
    let lastPointer = Matter.Vector.create(0, 0);
    let lastPointerTime = 0;
    let throwVelocity = Matter.Vector.create(0, 0);

    const revealRows = (progress: number) => {
      rows.forEach((row, index) => {
        const start = index * 0.24;
        const localProgress = reducedMotion.matches
          ? progress > 0.04 ? 1 : 0
          : clamp((progress - start) / 0.3, 0, 1);
        const eased = 1 - Math.pow(1 - localProgress, 3);
        row.style.opacity = eased.toFixed(3);
        row.style.transform = `translate3d(0, ${((1 - eased) * 46).toFixed(2)}px, 0)`;
        row.style.filter = `blur(${((1 - eased) * 8).toFixed(2)}px)`;
      });
    };

    const finishDrag = (shouldThrow: boolean) => {
      if (dragConstraint && engine) {
        Matter.Composite.remove(engine.world, dragConstraint);
      }

      if (dragBody) {
        const draggedCharacter = fallingCharacters.find((item) => item.body === dragBody);
        if (draggedCharacter) draggedCharacter.element.style.removeProperty('z-index');

        if (shouldThrow) {
          const speed = Matter.Vector.magnitude(throwVelocity);
          const velocityScale = speed > 22 ? 22 / speed : 1;
          Matter.Sleeping.set(dragBody, false);
          Matter.Body.setVelocity(dragBody, Matter.Vector.mult(throwVelocity, velocityScale));
          Matter.Body.setAngularVelocity(
            dragBody,
            clamp(throwVelocity.x * 0.006 + (Math.random() - 0.5) * 0.04, -0.18, 0.18),
          );
        }
      }

      const pointerId = dragPointerId;
      dragConstraint = null;
      dragBody = null;
      dragPointerId = null;
      throwVelocity = Matter.Vector.create(0, 0);
      container.classList.remove('is-dragging-character');
      if (pointerId !== null && container.hasPointerCapture(pointerId)) {
        container.releasePointerCapture(pointerId);
      }
    };

    const stopPhysics = () => {
      finishDrag(false);
      if (physicsFrame) window.cancelAnimationFrame(physicsFrame);
      physicsFrame = 0;
      if (engine) Matter.Engine.clear(engine);
      engine = null;
      fallingCharacters = [];
    };

    const resetScene = () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(glitchTimer);
      stopPhysics();
      phase = 'idle';
      section.dataset.phase = 'idle';
      container.classList.remove('is-glitching', 'is-physics');
      characters.forEach((character) => {
        character.style.removeProperty('width');
        character.style.removeProperty('height');
        character.style.removeProperty('transform');
        character.style.removeProperty('opacity');
      });
    };

    const runPhysics = () => {
      if (phase === 'physics' || reducedMotion.matches) return;
      phase = 'physics';
      section.dataset.phase = 'physics';
      container.classList.remove('is-glitching');

      rows.forEach((row) => {
        row.style.opacity = '1';
        row.style.transform = 'none';
        row.style.filter = 'none';
      });

      const containerRect = container.getBoundingClientRect();
      const measurements = characters.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element,
          width: rect.width,
          height: rect.height,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        };
      });

      container.classList.add('is-physics');
      engine = Matter.Engine.create({ enableSleeping: true });
      engine.gravity.y = 1.08;
      engine.gravity.scale = 0.001;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const wallThickness = Math.max(width, height) * 0.08;
      const walls = [
        Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true }),
        Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true }),
        Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width * 2, wallThickness, { isStatic: true }),
        Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width * 2, wallThickness, { isStatic: true }),
      ];

      fallingCharacters = measurements.map((measurement, index) => {
        const collisionWidth = measurement.width * 0.88;
        const collisionHeight = measurement.height * 0.82;
        const body = Matter.Bodies.rectangle(
          measurement.x + (Math.random() - 0.5) * 8,
          measurement.y + (Math.random() - 0.5) * 5,
          collisionWidth,
          collisionHeight,
          {
            restitution: 0.24 + Math.random() * 0.12,
            friction: 0.58,
            frictionStatic: 0.84,
            frictionAir: 0.008,
            density: 0.0016,
            chamfer: { radius: Math.min(collisionWidth, collisionHeight) * 0.055 },
            sleepThreshold: 38,
          },
        );

        Matter.Body.setAngle(body, (Math.random() - 0.5) * 0.075);
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 2.7,
          y: -0.45 - Math.random() * 0.7 - index * 0.025,
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.045);
        measurement.element.style.width = `${measurement.width.toFixed(2)}px`;
        measurement.element.style.height = `${measurement.height.toFixed(2)}px`;
        measurement.element.style.opacity = '1';

        return { ...measurement, body };
      });

      Matter.Composite.add(engine.world, [...walls, ...fallingCharacters.map((item) => item.body)]);
      previousPhysicsTime = performance.now();

      const animatePhysics = (now: number) => {
        if (!engine || phase !== 'physics') return;
        const elapsed = Math.min(Math.max(now - previousPhysicsTime, 8), 50);
        previousPhysicsTime = now;
        const substeps = Math.max(1, Math.ceil(elapsed / 16.667));
        const timestep = elapsed / substeps;
        for (let step = 0; step < substeps; step += 1) {
          Matter.Engine.update(engine, timestep);
        }

        fallingCharacters.forEach(({ element, body, width: itemWidth, height: itemHeight }) => {
          let correctionX = 0;
          let correctionY = 0;
          const edgeInset = 1;
          if (body.bounds.min.x < edgeInset) correctionX = edgeInset - body.bounds.min.x;
          if (body.bounds.max.x > width - edgeInset) correctionX = width - edgeInset - body.bounds.max.x;
          if (body.bounds.min.y < edgeInset) correctionY = edgeInset - body.bounds.min.y;
          if (body.bounds.max.y > height - edgeInset) correctionY = height - edgeInset - body.bounds.max.y;

          if (correctionX || correctionY) {
            Matter.Body.translate(body, { x: correctionX, y: correctionY });
            const correctedVelocity = {
              x: correctionX && Math.sign(body.velocity.x) === -Math.sign(correctionX)
                ? -body.velocity.x * 0.24
                : body.velocity.x,
              y: correctionY && Math.sign(body.velocity.y) === -Math.sign(correctionY)
                ? -body.velocity.y * 0.24
                : body.velocity.y,
            };
            Matter.Body.setVelocity(body, correctedVelocity);
          }

          element.style.transform = `translate3d(${(body.position.x - itemWidth / 2).toFixed(2)}px, ${(body.position.y - itemHeight / 2).toFixed(2)}px, 0) rotate(${body.angle.toFixed(5)}rad)`;
        });
        physicsFrame = window.requestAnimationFrame(animatePhysics);
      };

      physicsFrame = window.requestAnimationFrame(animatePhysics);
    };

    const beginHold = () => {
      if (phase !== 'idle') return;
      rows.forEach((row) => {
        row.style.opacity = '1';
        row.style.transform = 'none';
        row.style.filter = 'none';
      });

      if (reducedMotion.matches) {
        section.dataset.phase = 'settled';
        return;
      }

      phase = 'hold';
      section.dataset.phase = 'hold';
      holdTimer = window.setTimeout(() => {
        if (phase !== 'hold') return;
        phase = 'glitch';
        section.dataset.phase = 'glitch';
        container.classList.add('is-glitching');
        glitchTimer = window.setTimeout(runPhysics, 520);
      }, 1000);
    };

    const updateFromScroll = () => {
      scrollFrame = 0;
      const rect = section.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight, 1);
      const entryProgress = clamp((viewportHeight - rect.top) / (viewportHeight * 0.98), 0, 1);

      if (phase === 'idle') revealRows(entryProgress);
      if (rect.top <= 1 && rect.bottom > viewportHeight * 1.12) beginHold();
      if (rect.top > viewportHeight * 0.52 && phase !== 'idle') {
        resetScene();
        revealRows(entryProgress);
      }
    };

    const scheduleScrollUpdate = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(updateFromScroll);
    };

    const handleResize = () => {
      resetScene();
      scheduleScrollUpdate();
    };

    const localPointerPosition = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return Matter.Vector.create(
        clamp(event.clientX - rect.left, 0, rect.width),
        clamp(event.clientY - rect.top, 0, rect.height),
      );
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (phase !== 'physics' || !engine || event.button !== 0 || dragBody) return;
      const point = localPointerPosition(event);
      const body = Matter.Query.point(fallingCharacters.map((item) => item.body), point).at(-1);
      if (!body) return;

      dragBody = body;
      dragPointerId = event.pointerId;
      lastPointer = point;
      lastPointerTime = performance.now();
      throwVelocity = Matter.Vector.create(0, 0);
      Matter.Sleeping.set(body, false);

      dragConstraint = Matter.Constraint.create({
        pointA: point,
        bodyB: body,
        pointB: Matter.Vector.rotate(Matter.Vector.sub(point, body.position), -body.angle),
        length: 0,
        stiffness: 0.34,
        damping: 0.18,
      });
      Matter.Composite.add(engine.world, dragConstraint);
      const draggedCharacter = fallingCharacters.find((item) => item.body === body);
      if (draggedCharacter) draggedCharacter.element.style.zIndex = '4';
      container.classList.add('is-dragging-character');
      container.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragConstraint || !dragBody || event.pointerId !== dragPointerId) return;
      const point = localPointerPosition(event);
      dragConstraint.pointA = point;
      Matter.Sleeping.set(dragBody, false);

      const now = performance.now();
      const elapsed = Math.max(now - lastPointerTime, 4);
      const instantaneousVelocity = Matter.Vector.mult(
        Matter.Vector.sub(point, lastPointer),
        16.667 / elapsed,
      );
      throwVelocity = Matter.Vector.add(
        Matter.Vector.mult(throwVelocity, 0.48),
        Matter.Vector.mult(instantaneousVelocity, 0.52),
      );
      lastPointer = point;
      lastPointerTime = now;
      event.preventDefault();
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== dragPointerId) return;
      finishDrag(true);
      event.preventDefault();
    };

    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', handleResize);
    reducedMotion.addEventListener('change', handleResize);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerEnd);
    container.addEventListener('pointercancel', handlePointerEnd);
    container.addEventListener('lostpointercapture', handlePointerEnd);
    updateFromScroll();

    return () => {
      window.removeEventListener('scroll', scheduleScrollUpdate);
      window.removeEventListener('resize', handleResize);
      reducedMotion.removeEventListener('change', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerEnd);
      container.removeEventListener('pointercancel', handlePointerEnd);
      container.removeEventListener('lostpointercapture', handlePointerEnd);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      resetScene();
    };
  }, []);

  const openFourthScreen = useCallback(() => {
    window.clearTimeout(fourthCloseTimerRef.current);
    fourthClosingRef.current = false;
    setIsFourthClosing(false);
    setIsFourthOpen(true);
  }, []);

  const closeFourthScreen = useCallback(() => {
    if (!isFourthOpen || fourthClosingRef.current) return;
    fourthClosingRef.current = true;
    setIsFourthClosing(true);
    fourthCloseTimerRef.current = window.setTimeout(() => {
      setIsFourthOpen(false);
      setIsFourthClosing(false);
      fourthClosingRef.current = false;
      window.requestAnimationFrame(() => nextButtonRef.current?.focus());
    }, 1000);
  }, [isFourthOpen]);

  useEffect(() => {
    if (!isFourthOpen) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeFourthScreen();
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.clearTimeout(fourthCloseTimerRef.current);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [closeFourthScreen, isFourthOpen]);

  return (
    <>
      <section ref={sectionRef} className="third-screen" aria-labelledby="third-screen-title" data-phase="idle">
        <div className="third-sticky">
          <div className="third-artboard">
          <img
            className="third-background-art"
            src={`${ASSET_BASE}/third-screen/background.jpg`}
            alt=""
            aria-hidden="true"
          />
          <div ref={containerRef} className="third-title-container">
            <div className="third-title third-title-outline" aria-hidden="true">
              {TITLE_LINES.map((line, lineIndex) => (
                <span className="third-outline-row" key={`outline-${lineIndex}`}>
                  {line.map((character, characterIndex) => (
                    <span className="third-outline-character" key={`outline-${character.value}-${characterIndex}`}>
                      {character.value}
                    </span>
                  ))}
                </span>
              ))}
            </div>

            <h2 id="third-screen-title" className="third-title third-title-physics" aria-label="不只追热点，更创造被讨论的内容">
              {TITLE_LINES.map((line, lineIndex) => (
                <span className="third-title-row" data-third-row key={lineIndex}>
                  {line.map((character, characterIndex) => (
                    <span
                      className={`third-title-character${character.accent ? ' is-accent' : ''}`}
                      data-third-character
                      aria-hidden="true"
                      key={`${character.value}-${characterIndex}`}
                    >
                      <span className="third-title-glyph">{character.value}</span>
                    </span>
                  ))}
                </span>
              ))}
            </h2>
          </div>

            <button
              ref={nextButtonRef}
              className="third-next-button"
              type="button"
              aria-label="进入第四屏"
              aria-haspopup="dialog"
              aria-expanded={isFourthOpen}
              onClick={openFourthScreen}
            >
              <img src={`${ASSET_BASE}/third-screen/arrow-button.png`} alt="" aria-hidden="true" />
              <span>进入第四屏</span>
            </button>

            <aside className="third-aside" aria-label="筑脸文创方法">
              <div className="third-brand-mark" aria-hidden="true">b<span>·</span></div>
              <div className="third-more">See More</div>
              <div className="third-arrow" aria-hidden="true">↙</div>
              <dl className="third-principles">
                <div><dt>CULTURE IS<br />THE UNDERLYING TONE</dt><dd>#文化是底色</dd></div>
                <div><dt>CREATIVITY IS<br />A METHOD</dt><dd>#创意是方法</dd></div>
                <div><dt>GROWTH IS<br />THE RESULT</dt><dd>#增长是结果</dd></div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      {isFourthOpen && (
        <div
          className={`fourth-nested-page${isFourthClosing ? ' is-closing' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="第四屏"
        >
          <FourthScreen onRequestClose={closeFourthScreen} />
        </div>
      )}
    </>
  );
}
