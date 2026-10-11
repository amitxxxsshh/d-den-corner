"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";

const INTRO_VIDEO_PATH = "/videos/d-den-corner-intro.mp4";
const LOGO_IMAGE_PATH = "/images/d-den-corner-logo.png";

// --- Flames & Chingari Particle Engine Helpers ---
const SPARK_PALETTES = [
  "rgba(255, 248, 220, ", // Radiant white-gold incandescent
  "rgba(255, 222, 120, ", // Brilliant golden yellow
  "rgba(255, 175, 45, ",  // Warm amber gold
  "rgba(255, 125, 20, ",  // Fiery golden orange
];

function createFlameParticle(width, height) {
  const centerX = width * 0.5;
  const spread = width * 0.58;
  const x = centerX + (Math.random() - 0.5) * spread;
  const y = height * (0.82 + Math.random() * 0.18);
  const maxLife = 40 + Math.random() * 35;
  return {
    x,
    y,
    baseX: x,
    vx: (Math.random() - 0.5) * 0.9,
    vy: -(2.0 + Math.random() * 3.2),
    size: (width < 640 ? 32 : 48) + Math.random() * 32,
    maxLife,
    age: Math.random() * maxLife * 0.7,
    swayFreq: 0.04 + Math.random() * 0.04,
    swayAmp: 1.4 + Math.random() * 2.0,
    seed: Math.random() * 100,
  };
}

function resetFlameParticle(p, width, height) {
  const centerX = width * 0.5;
  const spread = width * 0.58;
  p.x = centerX + (Math.random() - 0.5) * spread;
  p.y = height * (0.84 + Math.random() * 0.16);
  p.baseX = p.x;
  p.vx = (Math.random() - 0.5) * 0.9;
  p.vy = -(2.0 + Math.random() * 3.2);
  p.size = (width < 640 ? 32 : 48) + Math.random() * 32;
  p.maxLife = 40 + Math.random() * 35;
  p.age = 0;
  p.swayFreq = 0.04 + Math.random() * 0.04;
  p.swayAmp = 1.4 + Math.random() * 2.0;
  p.seed = Math.random() * 100;
}

function createSparkParticle(width, height) {
  const centerX = width * 0.5;
  const spread = width * 0.65;
  const x = centerX + (Math.random() - 0.5) * spread;
  const y = height * (0.76 + Math.random() * 0.24);
  const maxLife = 35 + Math.random() * 45;
  return {
    x,
    y,
    prevX: x,
    prevY: y,
    vx: (Math.random() - 0.5) * 4.2,
    vy: -(4.2 + Math.random() * 6.5),
    size: 1.1 + Math.random() * 1.8,
    maxLife,
    age: Math.random() * maxLife * 0.8,
    color: SPARK_PALETTES[Math.floor(Math.random() * SPARK_PALETTES.length)],
    turbulencePhase: Math.random() * Math.PI * 2,
    swirl: (Math.random() - 0.5) * 0.4,
  };
}

function resetSparkParticle(p, width, height) {
  const centerX = width * 0.5;
  const spread = width * 0.65;
  p.x = centerX + (Math.random() - 0.5) * spread;
  p.y = height * (0.80 + Math.random() * 0.20);
  p.prevX = p.x;
  p.prevY = p.y;
  p.vx = (Math.random() - 0.5) * 4.2;
  p.vy = -(4.2 + Math.random() * 6.5);
  p.size = 1.1 + Math.random() * 1.8;
  p.maxLife = 35 + Math.random() * 45;
  p.age = 0;
  p.color = SPARK_PALETTES[Math.floor(Math.random() * SPARK_PALETTES.length)];
  p.turbulencePhase = Math.random() * Math.PI * 2;
  p.swirl = (Math.random() - 0.5) * 0.4;
}

function createEmberParticle(width, height) {
  const centerX = width * 0.5;
  const spread = width * 0.72;
  const x = centerX + (Math.random() - 0.5) * spread;
  const y = height * (0.72 + Math.random() * 0.28);
  const maxLife = 60 + Math.random() * 60;
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 2.2,
    vy: -(1.2 + Math.random() * 2.8),
    size: 2.2 + Math.random() * 2.8,
    maxLife,
    age: Math.random() * maxLife * 0.8,
    flickerFreq: 0.15 + Math.random() * 0.15,
    flickerPhase: Math.random() * Math.PI * 2,
    swayFreq: 0.03 + Math.random() * 0.04,
    swayAmp: 1.2 + Math.random() * 1.6,
  };
}

function resetEmberParticle(p, width, height) {
  const centerX = width * 0.5;
  const spread = width * 0.72;
  p.x = centerX + (Math.random() - 0.5) * spread;
  p.y = height * (0.78 + Math.random() * 0.22);
  p.vx = (Math.random() - 0.5) * 2.2;
  p.vy = -(1.2 + Math.random() * 2.8);
  p.size = 2.2 + Math.random() * 2.8;
  p.maxLife = 60 + Math.random() * 60;
  p.age = 0;
  p.flickerFreq = 0.15 + Math.random() * 0.15;
  p.flickerPhase = Math.random() * Math.PI * 2;
  p.swayFreq = 0.03 + Math.random() * 0.04;
  p.swayAmp = 1.2 + Math.random() * 1.6;
}

/**
 * CinematicIntro plays the vertical cinematic Earth intro video while
 * table connection occurs concurrently in the background.
 *
 * At the golden cosmic finale, GSAP orchestrates an ultra-fast 3D Y-axis
 * logo spin (1440°/s = 4.0 rev/sec sustained for 1.25s) with CSS perspective,
 * smooth quadratic deceleration to a brief forward-facing settle (rotateY: 0deg),
 * accompanied by premium golden-orange flames & flying chingari,
 * and a smooth dissolve into the authenticated menu.
 */
export default function CinematicIntro({
  isConnected = false,
  onComplete,
  onSkip,
  onFallback,
}) {
  const overlayRef = useRef(null);
  const videoRef = useRef(null);
  const logoRef = useRef(null);
  const glowRef = useRef(null);
  const statusRef = useRef(null);
  const timelineRef = useRef(null);
  const canvasRef = useRef(null);

  const flameRafRef = useRef(null);
  const flameParamsRef = useRef({
    intensity: 0,
    speed: 1.0,
    turbulence: 1.0,
  });
  const flameRunningRef = useRef(false);
  const flameParticlesRef = useRef({
    flames: [],
    sparks: [],
    embers: [],
  });

  const [videoDuration, setVideoDuration] = useState(10);
  const [logoAnimationFinished, setLogoAnimationFinished] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const isConnectedRef = useRef(isConnected);
  const onCompleteRef = useRef(onComplete);
  const onSkipRef = useRef(onSkip);
  const onFallbackRef = useRef(onFallback);
  const logoAnimationStartedRef = useRef(false);
  const logoAnimationFinishedRef = useRef(false);
  const dissolvingRef = useRef(false);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onSkipRef.current = onSkip;
  }, [onSkip]);

  useEffect(() => {
    onFallbackRef.current = onFallback;
  }, [onFallback]);

  const stopFlameSystem = useCallback(() => {
    flameRunningRef.current = false;
    if (flameRafRef.current) {
      cancelAnimationFrame(flameRafRef.current);
      flameRafRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startFlameSystem = useCallback(() => {
    if (flameRunningRef.current) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const container = overlayRef.current;
    const width = container?.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 800);
    const height = container?.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 1000);

    const isMobile = width < 640;
    const numFlames = isMobile ? 28 : 48;
    const numSparks = isMobile ? 55 : 110;
    const numEmbers = isMobile ? 25 : 42;

    const flames = [];
    for (let i = 0; i < numFlames; i++) {
      flames.push(createFlameParticle(width, height));
    }
    const sparks = [];
    for (let i = 0; i < numSparks; i++) {
      sparks.push(createSparkParticle(width, height));
    }
    const embers = [];
    for (let i = 0; i < numEmbers; i++) {
      embers.push(createEmberParticle(width, height));
    }

    flameParticlesRef.current = { flames, sparks, embers };
    flameRunningRef.current = true;

    function renderLoop() {
      if (!flameRunningRef.current) return;

      const canvas = canvasRef.current;
      const overlayEl = overlayRef.current;
      if (!canvas || !overlayEl) {
        flameRafRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

      const params = flameParamsRef.current;
      const intensity = params.intensity;

      const rect = overlayEl.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);

      if (
        canvas.width !== Math.round(w * dpr) ||
        canvas.height !== Math.round(h * dpr)
      ) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (intensity > 0.005) {
        ctx.globalCompositeOperation = "lighter";

        // 1. Bottom Hearth Warm Horizon Glow
        const baseGlowHeight = Math.min(h * 0.45, 340);
        const baseGrad = ctx.createRadialGradient(
          w * 0.5,
          h + 25,
          10,
          w * 0.5,
          h + 25,
          baseGlowHeight,
        );
        baseGrad.addColorStop(0, `rgba(255, 160, 30, ${0.32 * intensity})`);
        baseGrad.addColorStop(0.4, `rgba(215, 75, 10, ${0.14 * intensity})`);
        baseGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, h - baseGlowHeight, w, baseGlowHeight);

        // 2. Render Flame Plumes
        const activeFlames = flameParticlesRef.current.flames;
        for (let i = 0; i < activeFlames.length; i++) {
          const p = activeFlames[i];
          p.age += 1;
          if (p.age >= p.maxLife) {
            resetFlameParticle(p, w, h);
          }

          const progress = p.age / p.maxLife;
          p.y += p.vy * params.speed;
          p.x = p.baseX + Math.sin(p.age * p.swayFreq + p.seed) * p.swayAmp * params.turbulence;

          const currentRadius = p.size * (0.85 + 0.5 * progress);
          const lifeAlpha =
            (progress < 0.2 ? progress / 0.2 : (1 - progress) ** 1.6) * 0.42 * intensity;

          if (lifeAlpha > 0.005 && p.y > -currentRadius) {
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius);
            grad.addColorStop(0, `rgba(255, 238, 185, ${lifeAlpha * 0.95})`);
            grad.addColorStop(0.3, `rgba(255, 155, 25, ${lifeAlpha * 0.7})`);
            grad.addColorStop(0.65, `rgba(215, 65, 5, ${lifeAlpha * 0.3})`);
            grad.addColorStop(1, "rgba(140, 20, 0, 0)");

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 3. Render Embers (Floating Glowing Particles)
        const activeEmbers = flameParticlesRef.current.embers;
        for (let i = 0; i < activeEmbers.length; i++) {
          const p = activeEmbers[i];
          p.age += 1;
          if (p.age >= p.maxLife || p.y < -20) {
            resetEmberParticle(p, w, h);
          }

          const progress = p.age / p.maxLife;
          p.vy -= 0.035 * params.speed;
          p.vx += Math.cos(p.age * p.swayFreq + p.flickerPhase) * 0.28 * params.turbulence;
          p.vx *= 0.99;
          p.x += p.vx * params.speed;
          p.y += p.vy * params.speed;

          const flicker = 0.75 + 0.25 * Math.sin(p.age * p.flickerFreq + p.flickerPhase);
          const alpha =
            (progress < 0.15 ? progress / 0.15 : (1 - progress)) * flicker * 0.85 * intensity;

          if (alpha > 0.01) {
            const glowRadius = p.size * 2.6;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
            grad.addColorStop(0, `rgba(255, 215, 80, ${alpha * 0.95})`);
            grad.addColorStop(0.35, `rgba(255, 115, 20, ${alpha * 0.6})`);
            grad.addColorStop(1, "rgba(180, 30, 0, 0)");

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 4. Render Chingari (Fine Flying Sparks with Motion Trails)
        const activeSparks = flameParticlesRef.current.sparks;
        for (let i = 0; i < activeSparks.length; i++) {
          const p = activeSparks[i];
          p.age += 1;
          if (p.age >= p.maxLife || p.y < -20) {
            resetSparkParticle(p, w, h);
          }

          p.prevX = p.x;
          p.prevY = p.y;

          p.vy -= 0.08 * params.speed;
          p.vx += (Math.sin(p.age * 0.12 + p.turbulencePhase) * 0.45 + p.swirl) * params.turbulence;
          p.vx *= 0.985;
          p.vy *= 0.99;

          p.x += p.vx * params.speed;
          p.y += p.vy * params.speed;

          const progress = p.age / p.maxLife;
          const alpha = (1 - progress) * 0.95 * intensity;

          if (alpha > 0.02) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 1.8, p.y - p.vy * 1.8);
            ctx.strokeStyle = `${p.color}${alpha})`;
            ctx.lineWidth = p.size;
            ctx.lineCap = "round";
            ctx.stroke();

            ctx.fillStyle = `rgba(255, 255, 235, ${alpha})`;
            ctx.fillRect(p.x - p.size * 0.4, p.y - p.size * 0.4, p.size * 0.8, p.size * 0.8);
          }
        }
      }

      ctx.restore();

      flameRafRef.current = requestAnimationFrame(renderLoop);
    }

    flameRafRef.current = requestAnimationFrame(renderLoop);
  }, []);

  // Handle dissolve once both animation is finished and connection is established
  const triggerDissolve = useCallback(() => {
    if (dissolvingRef.current || !overlayRef.current) {
      return;
    }
    dissolvingRef.current = true;
    setDissolving(true);

    if (flameParamsRef.current) {
      gsap.to(flameParamsRef.current, {
        intensity: 0,
        duration: 0.65,
        ease: "power2.inOut",
      });
    }

    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.65,
      ease: "power2.inOut",
      onComplete: () => {
        stopFlameSystem();
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      },
    });
  }, [stopFlameSystem]);

  // If logo animation has finished (or was skipped) and connection is ready, dissolve into menu
  useEffect(() => {
    if (
      (logoAnimationFinished || logoAnimationFinishedRef.current || skipped) &&
      isConnected &&
      !dissolvingRef.current
    ) {
      triggerDissolve();
    }
  }, [logoAnimationFinished, isConnected, skipped, triggerDissolve]);

  // GSAP 3D Logo Spin and Reveal
  const playLogoReveal = useCallback(() => {
    if (logoAnimationStartedRef.current || !logoRef.current) {
      return;
    }
    logoAnimationStartedRef.current = true;

    // Ignite flames & chingari particle engine exclusively during final black-background reveal
    startFlameSystem();

    const tl = gsap.timeline();
    timelineRef.current = tl;

    // Reset initial pose: 6 full revolutions (-2160 degrees).
    // -2160 deg is congruent to 0 deg, so the logo begins facing forward.
    gsap.set(logoRef.current, {
      opacity: 0,
      scale: 0.6,
      rotationY: -2160,
    });

    // 0. Coordinate golden-orange flames & chingari ignition with logo reveal
    tl.to(
      flameParamsRef.current,
      {
        intensity: 1.0,
        speed: 1.25,
        turbulence: 1.5,
        duration: 0.4,
        ease: "power2.out",
      },
      0,
    );

    // 1. Entrance reveal: Opacity & scale blossom quickly
    tl.to(
      logoRef.current,
      {
        opacity: 1,
        duration: 0.22,
        ease: "power2.out",
      },
      0,
    );

    tl.to(
      logoRef.current,
      {
        scale: 1.0,
        duration: 0.38,
        ease: "power2.out",
      },
      0,
    );

    // 2. Cosmic golden radiance bloom expanding behind the spinning logo
    if (glowRef.current) {
      tl.fromTo(
        glowRef.current,
        {
          opacity: 0,
          scale: 0.4,
        },
        {
          opacity: 0.95,
          scale: 1.45,
          duration: 1.25,
          ease: "power2.out",
        },
        0.05,
      );
    }

    // 3. Sustained rapid 3D Y-axis spin:
    // Traverses 1800° (5 full 360° revolutions) over 1.25s at 1440°/sec (4.0 rev/sec).
    // Extremely fast and dynamic, yet crisp and coherent without stroboscopic aliasing.
    tl.to(
      logoRef.current,
      {
        rotationY: -360,
        duration: 1.25,
        ease: "none",
      },
      0,
    );

    // Peak turbulence during rapid spin
    tl.to(
      flameParamsRef.current,
      {
        turbulence: 1.8,
        speed: 1.3,
        duration: 0.8,
        ease: "sine.inOut",
      },
      0.2,
    );

    // 4. Smooth deceleration to rest:
    // Traverses the final 360° (1 revolution) over 0.50s with quadratic deceleration.
    // Initial velocity: 2 * 360 / 0.5 = 1440°/sec, seamlessly matching the sustained spin velocity.
    // Settles cleanly at rotateY(0deg).
    tl.to(
      logoRef.current,
      {
        rotationY: 0,
        duration: 0.5,
        ease: "power2.out",
      },
      1.25,
    );

    // Settling flame intensity to warm steady glow & gentle sparks
    tl.to(
      flameParamsRef.current,
      {
        intensity: 0.88,
        speed: 0.9,
        turbulence: 0.9,
        duration: 0.5,
        ease: "power2.out",
      },
      1.25,
    );

    // 5. Brief readable forward-facing hold (0.35s)
    tl.to({}, { duration: 0.35 });

    // 6. Sequence complete -> dissolve into menu if table connection is ready
    tl.call(() => {
      logoAnimationFinishedRef.current = true;
      setLogoAnimationFinished(true);
      if (isConnectedRef.current) {
        triggerDissolve();
      } else if (statusRef.current) {
        // Show subtle waiting indicator while table connection completes
        gsap.to(statusRef.current, {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        });
      }
    });
  }, [startFlameSystem, triggerDissolve]);

  // Video metadata and playback events
  const handleLoadedMetadata = useCallback((e) => {
    const dur = e.currentTarget.duration;
    if (Number.isFinite(dur) && dur > 0) {
      setVideoDuration(dur);
    }
  }, []);

  const handleTimeUpdate = useCallback(
    (e) => {
      const current = e.currentTarget.currentTime;
      // Golden cosmic finale starts around ~2.75 seconds before the video ends
      const finaleStartTime = Math.max(0, (videoDuration || 10) - 2.75);

      if (current >= finaleStartTime && !logoAnimationStartedRef.current) {
        playLogoReveal();
      }
    },
    [videoDuration, playLogoReveal],
  );

  const handleVideoEnded = useCallback(() => {
    if (!logoAnimationStartedRef.current) {
      playLogoReveal();
    }
  }, [playLogoReveal]);

  const handleVideoError = useCallback(() => {
    if (onFallbackRef.current) {
      onFallbackRef.current();
    }
  }, []);

  // Attempt inline autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented playback, fall back gracefully
        if (onFallbackRef.current) {
          onFallbackRef.current();
        }
      });
    }
  }, []);

  // Safety watchdog: ensure intro never hangs indefinitely if playback stalls
  useEffect(() => {
    const revealTimeout = setTimeout(() => {
      if (!logoAnimationStartedRef.current) {
        playLogoReveal();
      }
    }, 11500);

    const maxTimeout = setTimeout(() => {
      if (onFallbackRef.current) {
        onFallbackRef.current();
      }
    }, 15000);

    return () => {
      clearTimeout(revealTimeout);
      clearTimeout(maxTimeout);
    };
  }, [playLogoReveal]);

  // Clean up GSAP timelines on unmount
  useEffect(() => {
    const overlay = overlayRef.current;
    const logo = logoRef.current;
    const glow = glowRef.current;
    const status = statusRef.current;
    const flameParams = flameParamsRef.current;

    return () => {
      stopFlameSystem();
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      if (flameParams) {
        gsap.killTweensOf(flameParams);
      }
      if (overlay) {
        gsap.killTweensOf(overlay);
      }
      if (logo) {
        gsap.killTweensOf(logo);
      }
      if (glow) {
        gsap.killTweensOf(glow);
      }
      if (status) {
        gsap.killTweensOf(status);
      }
    };
  }, [stopFlameSystem]);

  const handleSkipClick = () => {
    if (skipped) {
      return;
    }
    setSkipped(true);
    stopFlameSystem();

    if (flameParamsRef.current) {
      gsap.killTweensOf(flameParamsRef.current);
    }
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }

    if (onSkipRef.current) {
      onSkipRef.current();
    }

    if (isConnectedRef.current) {
      triggerDissolve();
    } else if (statusRef.current) {
      gsap.to(statusRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-charcoal-deep text-cream-soft select-none ${
        dissolving ? "pointer-events-none" : "touch-none"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      {/* 1. Fullscreen Cinematic Vertical Video */}
      <video
        ref={videoRef}
        src={INTRO_VIDEO_PATH}
        playsInline
        muted
        autoPlay
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none"
      />

      {/* 2. Top Bar: Subtle D Den Corner branding & Skip Intro Button */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2 rounded-full bg-charcoal-deep/60 backdrop-blur-md border border-amber-warm/30 px-3 py-1 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-warm animate-ping" />
          <span className="text-[10px] font-semibold tracking-widest text-cream-warm uppercase">
            D Den Corner
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkipClick}
          disabled={skipped}
          className="flex items-center gap-1.5 rounded-full border border-amber-warm/40 bg-charcoal-deep/70 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-cream-soft hover:bg-charcoal-deep hover:border-amber-warm transition shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
          aria-label="Skip intro animation"
        >
          <span>Skip Intro</span>
          <svg
            className="h-3.5 w-3.5 text-amber-warm"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Cinematic Golden-Orange Flames & Chingari Particle Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 z-[6] pointer-events-none h-full w-full"
      />

      {/* 3. 3D Perspective Logo Reveal Layer */}
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-6"
        style={{
          perspective: "1200px",
          WebkitPerspective: "1200px",
          perspectiveOrigin: "center center",
          WebkitPerspectiveOrigin: "center center",
        }}
      >
        {/* Cosmic Golden Radiance Bloom behind logo */}
        <div
          ref={glowRef}
          className="absolute h-72 w-72 rounded-full bg-amber-warm/35 blur-3xl pointer-events-none opacity-0"
        />

        {/* Single rigid rotating wrapper containing the complete logo */}
        <div
          ref={logoRef}
          style={{
            transformOrigin: "center center",
            WebkitTransformOrigin: "center center",
            backfaceVisibility: "visible",
            WebkitBackfaceVisibility: "visible",
            willChange: "transform, opacity",
          }}
          className="relative flex items-center justify-center opacity-0 select-none pointer-events-none"
        >
          <Image
            src={LOGO_IMAGE_PATH}
            alt="D Den Corner"
            width={216}
            height={216}
            priority
            unoptimized
            className="h-44 w-44 sm:h-52 sm:w-52 object-contain pointer-events-none select-none"
          />
        </div>

        {/* Status pill appearing only if video finishes while waiting for network connection */}
        <div
          ref={statusRef}
          className="absolute bottom-12 inset-x-0 flex flex-col items-center justify-center text-center opacity-0 pointer-events-none px-4"
        >
          <div className="flex items-center gap-2 rounded-full bg-charcoal-deep/85 backdrop-blur-md border border-amber-warm/40 px-4 py-2 shadow-xl">
            <div className="h-2 w-2 rounded-full bg-amber-warm animate-ping" />
            <span className="text-xs font-semibold tracking-wider text-amber-gold uppercase">
              Finalizing Table Connection...
            </span>
          </div>
        </div>
      </div>

      {/* 4. Subtle Bottom Branding */}
      <div
        className="relative z-20 pointer-events-none pb-4 text-center opacity-70"
        aria-hidden="true"
      >
        <span className="text-[10px] tracking-widest uppercase text-cream-warm/60">
          Rooftop Dining & Lounge
        </span>
      </div>
    </div>
  );
}
