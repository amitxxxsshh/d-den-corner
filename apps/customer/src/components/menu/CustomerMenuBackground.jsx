"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Aspect ratios of the original WebP background assets.
 * Desktop: 1672 x 941 (width / height = 1.776833)
 * Mobile:  941 x 1672 (width / height = 0.562799)
 */
const DESKTOP_ASPECT = 1672 / 941;
const MOBILE_ASPECT = 941 / 1672;

/**
 * Foliage cluster configuration defining localized 3D interaction zones.
 * Coordinates are normalized (0 to 1) relative to each tile scene.
 * Realistic branch pivots (transformOrigin) preserve physical attachment to stems.
 */
const FOLIAGE_3D_CLUSTERS = [
  {
    id: "canopy",
    name: "Top Canopy Hanging Vines",
    cx: 0.50,
    cy: 0.08,
    radius: 0.38,
    depth: 0.50,
    transformOrigin: "50% 0%",
    maskStyle: {
      WebkitMaskImage:
        "radial-gradient(ellipse 46% 16% at 50% 8%, #000 20%, rgba(0,0,0,0.85) 55%, transparent 100%)",
      maskImage:
        "radial-gradient(ellipse 46% 16% at 50% 8%, #000 20%, rgba(0,0,0,0.85) 55%, transparent 100%)",
    },
    calc3DTarget: (normX, normY, vx, vy, p, depth) => {
      const rotX = Math.max(-10, Math.min(10, vy * 12 + (normY - 0.08) * 10)) * p * depth;
      const rotZ = Math.max(-7, Math.min(7, vx * 10 + (normX - 0.50) * 8)) * p * depth;
      const z = -Math.abs(rotX) * 1.5;
      return { rotateX: rotX, rotateZ: rotZ, z, rotateY: 0, skewY: 0 };
    },
  },
  {
    id: "left",
    name: "Left Monstera & Palm Fronds",
    cx: 0.16,
    cy: 0.44,
    radius: 0.34,
    depth: 0.85,
    transformOrigin: "0% 85%", // Anchored at bottom-left branch stem
    maskStyle: {
      WebkitMaskImage:
        "radial-gradient(ellipse 26% 42% at 16% 44%, #000 20%, rgba(0,0,0,0.85) 55%, transparent 100%)",
      maskImage:
        "radial-gradient(ellipse 26% 42% at 16% 44%, #000 20%, rgba(0,0,0,0.85) 55%, transparent 100%)",
    },
    calc3DTarget: (normX, normY, vx, vy, p, depth) => {
      // 3D pitch, roll, and yaw rotation around stem axis
      const rotY = Math.max(-16, Math.min(16, (normX - 0.16) * 30 + vx * 15)) * p * depth;
      const rotX = Math.max(-11, Math.min(11, vy * 12 + (normY - 0.44) * 12)) * p * depth;
      const rotZ = Math.max(-8, Math.min(8, (0.44 - normY) * 16)) * p * depth;
      const z = Math.max(-16, Math.min(26, -rotY * 1.5));
      const skewY = rotY * 0.14; // Curved surface flex
      return { rotateX: rotX, rotateY: rotY, rotateZ: rotZ, z, skewY };
    },
  },
  {
    id: "right",
    name: "Right Terracotta & Tropical Fronds",
    cx: 0.84,
    cy: 0.44,
    radius: 0.34,
    depth: 0.85,
    transformOrigin: "100% 80%", // Anchored at bottom-right branch stem
    maskStyle: {
      WebkitMaskImage:
        "radial-gradient(ellipse 26% 42% at 84% 44%, #000 20%, rgba(0,0,0,0.85) 55%, transparent 100%)",
      maskImage:
        "radial-gradient(ellipse 26% 42% at 84% 44%, #000 20%, rgba(0,0,0,0.85) 55%, transparent 100%)",
    },
    calc3DTarget: (normX, normY, vx, vy, p, depth) => {
      // 3D pitch, roll, and yaw rotation around stem axis
      const rotY = Math.max(-16, Math.min(16, (normX - 0.84) * 30 + vx * 15)) * p * depth;
      const rotX = Math.max(-11, Math.min(11, vy * 12 + (normY - 0.44) * 12)) * p * depth;
      const rotZ = Math.max(-8, Math.min(8, (normY - 0.44) * 16)) * p * depth;
      const z = Math.max(-16, Math.min(26, rotY * 1.5));
      const skewY = -rotY * 0.14; // Curved surface flex
      return { rotateX: rotX, rotateY: rotY, rotateZ: rotZ, z, skewY };
    },
  },
  {
    id: "planter",
    name: "Planter Box Foreground Shrubbery",
    cx: 0.50,
    cy: 0.72,
    radius: 0.32,
    depth: 0.95,
    transformOrigin: "50% 100%", // Anchored at bottom planter soil base
    maskStyle: {
      WebkitMaskImage:
        "radial-gradient(ellipse 44% 15% at 50% 72%, #000 20%, rgba(0,0,0,0.85) 55%, transparent 100%)",
      maskImage:
        "radial-gradient(ellipse 44% 15% at 50% 72%, #000 20%, rgba(0,0,0,0.85) 55%, transparent 100%)",
    },
    calc3DTarget: (normX, normY, vx, vy, p, depth) => {
      // 3D forward projection towards viewer
      const rotX = Math.max(-14, Math.min(8, (0.72 - normY) * 24 + vy * 12)) * p * depth;
      const rotZ = Math.max(-6, Math.min(6, vx * 9)) * p * depth;
      const z = Math.max(0, Math.min(25, -rotX * 1.8)); // Pops into positive Z space
      return { rotateX: rotX, rotateZ: rotZ, z, rotateY: 0, skewY: 0 };
    },
  },
];

/**
 * Common responsive picture element referencing the unchanged WebP assets.
 */
function BackgroundImage({ isFirst = false }) {
  return (
    <picture className="block w-full h-full">
      <source
        media="(min-width: 768px)"
        srcSet="/images/customer/d-den-corner-menu-bg-desktop.webp"
      />
      <img
        src="/images/customer/d-den-corner-menu-bg-mobile.webp"
        alt=""
        className="block h-full w-full object-cover object-center select-none pointer-events-none"
        loading={isFirst ? "eager" : "lazy"}
        fetchPriority={isFirst ? "high" : "auto"}
      />
    </picture>
  );
}

/**
 * Individual repeating restaurant scenery tile.
 * - Tile 0 (hero) preserves the original circular D DEN CORNER wall emblem.
 * - Subsequent tiles (index > 0) apply a feathered wall-tone patch over the central emblem
 *   so that the restaurant scenery and foliage repeat continuously without redundant branding.
 * - 3D foliage layers feature true perspective, preserve-3d, and branch stem pivot origins.
 */
function BackgroundTile({
  index,
  tileHeight,
  isDesktop,
  foliageRefs,
}) {
  const isFirstTile = index === 0;

  // Feathered radial patch concealing repeated emblem on subsequent tiles
  const emblemMaskStyle = isDesktop
    ? {
        background:
          "radial-gradient(circle at 52.5% 42%, rgba(206, 182, 148, 0.96) 0%, rgba(192, 169, 137, 0.93) 48%, rgba(170, 148, 120, 0.72) 68%, transparent 80%)",
      }
    : {
        background:
          "radial-gradient(circle at 50% 45%, rgba(206, 182, 148, 0.96) 0%, rgba(192, 169, 137, 0.93) 48%, rgba(170, 148, 120, 0.72) 68%, transparent 80%)",
      };

  return (
    <div
      style={{
        height: `${tileHeight}px`,
        perspective: "1200px",
        transformStyle: "preserve-3d",
      }}
      className="relative w-full overflow-hidden pointer-events-none select-none"
    >
      {/* 1. Base restaurant scenery artwork (anchored background) */}
      <div className="relative w-full h-full">
        <BackgroundImage isFirst={isFirstTile} />
      </div>

      {/* 2. Seamless wall patch for subsequent repeats (conceals redundant central emblem) */}
      {!isFirstTile && (
        <div
          style={emblemMaskStyle}
          className="absolute inset-0 pointer-events-none select-none"
          aria-hidden="true"
        />
      )}

      {/* 3. Real 3D interactive foliage layers animated with GSAP */}
      {FOLIAGE_3D_CLUSTERS.map((cluster) => {
        const refKey = `${cluster.id}-${index}`;
        return (
          <div
            key={cluster.id}
            ref={(el) => {
              if (foliageRefs && foliageRefs.current) {
                foliageRefs.current[refKey] = el;
              }
            }}
            style={{
              ...cluster.maskStyle,
              transformOrigin: cluster.transformOrigin,
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              willChange: "transform",
            }}
            className="foliage-interactive-layer absolute inset-0 pointer-events-none select-none"
          >
            <BackgroundImage isFirst={false} />
          </div>
        );
      })}

      {/* 4. Atmospheric seam blending between vertical repeats */}
      {/* Top canopy shadow blend (on all tiles after the first) */}
      {!isFirstTile && (
        <div
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#151716]/65 via-[#151716]/30 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Bottom floor vignette blend transitioning into the next tile */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-[#151716]/35 to-[#151716]/65 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

export default function CustomerMenuBackground() {
  const containerRef = useRef(null);
  const foliageRefs = useRef({});

  // Dynamic layout measurements to adapt repetition to any content height
  const [layout, setLayout] = useState({
    tileCount: 6, // Default baseline for initial render
    tileHeight: 850,
    isDesktop: false,
    measured: false,
  });

  // 1. Dynamic Measurement & Vertical Repetition Calculation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const parent = container.parentElement;
    if (!parent) return;

    function measureAndCalculate() {
      const parentRect = parent.getBoundingClientRect();
      const width = parentRect.width || window.innerWidth;
      const totalHeight = Math.max(parent.offsetHeight, parentRect.height, window.innerHeight);

      const isDesktop = width >= 768;
      const aspect = isDesktop ? DESKTOP_ASPECT : MOBILE_ASPECT;
      const tileHeight = Math.max(200, Math.round(width / aspect));

      // Calculate exact number of repeats needed to span 100% of the document content
      const count = Math.max(1, Math.ceil(totalHeight / tileHeight));

      setLayout({
        tileCount: count,
        tileHeight,
        isDesktop,
        measured: true,
      });
    }

    // Initial measurement
    measureAndCalculate();

    // ResizeObserver watches the parent document wrapper for any height expansion
    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        measureAndCalculate();
      });
      resizeObserver.observe(parent);
    }

    window.addEventListener("resize", measureAndCalculate, { passive: true });

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", measureAndCalculate);
    };
  }, []);

  // 2. Real 3D Foliage Interaction Animated with GSAP
  useEffect(() => {
    const currentRefs = foliageRefs.current;

    // Check prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = motionQuery.matches;

    const handleMotionChange = (e) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        // Immediately reset all 3D transforms
        Object.values(foliageRefs.current).forEach((el) => {
          if (el) {
            gsap.set(el, {
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              z: 0,
              skewY: 0,
              clearProps: "transform",
            });
          }
        });
      }
    };

    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", handleMotionChange);
    } else if (typeof motionQuery.addListener === "function") {
      motionQuery.addListener(handleMotionChange);
    }

    let lastPointerX = null;
    let lastPointerY = null;
    let lastPointerTime = null;

    function apply3DImpulse(clientX, clientY) {
      if (prefersReducedMotion) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const currentTileHeight = layout.tileHeight || 800;

      // Pointer position relative to container
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;

      const normX = relX / rect.width;
      // Normalized Y inside whichever vertical repeat tile the pointer is currently over
      const normYInTile = (relY % currentTileHeight) / currentTileHeight;

      if (normX < -0.1 || normX > 1.1) return;

      const now = performance.now();
      let vx = 0;
      let vy = 0;

      if (lastPointerX !== null && lastPointerTime !== null) {
        const dt = Math.max(0.016, (now - lastPointerTime) / 1000);
        vx = ((normX - lastPointerX) / dt) * 0.8;
        vy = ((normYInTile - lastPointerY) / dt) * 0.8;
      }

      lastPointerX = normX;
      lastPointerY = normYInTile;
      lastPointerTime = now;

      // Animate each foliage cluster using GSAP 3D tweens
      FOLIAGE_3D_CLUSTERS.forEach((cluster) => {
        const dx = (normX - cluster.cx) * 1.15;
        const dy = normYInTile - cluster.cy;
        const dist = Math.hypot(dx, dy);

        if (dist < cluster.radius) {
          const proximity = Math.pow(1 - dist / cluster.radius, 1.6);
          const target3D = cluster.calc3DTarget(
            normX,
            normYInTile,
            vx,
            vy,
            proximity,
            cluster.depth,
          );

          // Animate across all repeating tiles with GSAP
          for (let i = 0; i < layout.tileCount; i++) {
            const el = foliageRefs.current[`${cluster.id}-${i}`];
            if (el) {
              gsap.to(el, {
                ...target3D,
                duration: 0.4,
                ease: "power2.out",
                overwrite: "auto",
              });
            }
          }
        }
      });
    }

    function returnToRest() {
      if (prefersReducedMotion) return;

      lastPointerX = null;
      lastPointerY = null;
      lastPointerTime = null;

      // Smoothly return all foliage clusters to resting 3D posture with GSAP elastic/back settling
      FOLIAGE_3D_CLUSTERS.forEach((cluster) => {
        const ease =
          cluster.id === "canopy"
            ? "elastic.out(1.1, 0.4)"
            : "back.out(1.7)";

        for (let i = 0; i < layout.tileCount; i++) {
          const el = foliageRefs.current[`${cluster.id}-${i}`];
          if (el) {
            gsap.to(el, {
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              z: 0,
              skewY: 0,
              duration: 1.4,
              ease,
              overwrite: "auto",
            });
          }
        }
      });
    }

    const onPointerMove = (e) => apply3DImpulse(e.clientX, e.clientY);
    const onPointerLeave = () => returnToRest();

    const onTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        apply3DImpulse(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        apply3DImpulse(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => returnToRest();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      // Kill all active GSAP tweens on unmount
      if (currentRefs) {
        Object.values(currentRefs).forEach((el) => {
          if (el) gsap.killTweensOf(el);
        });
      }

      if (typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", handleMotionChange);
      } else if (typeof motionQuery.removeListener === "function") {
        motionQuery.removeListener(handleMotionChange);
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [layout.tileCount, layout.tileHeight]);

  // Generate array of tile indexes to render
  const tiles = Array.from({ length: layout.tileCount }, (_, i) => i);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="customer-menu-bg-repeat pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      {/* Repeating Restaurant Scenery Column */}
      <div className="relative w-full flex flex-col pointer-events-none select-none">
        {tiles.map((tileIndex) => (
          <BackgroundTile
            key={tileIndex}
            index={tileIndex}
            tileHeight={layout.tileHeight}
            isDesktop={layout.isDesktop}
            foliageRefs={foliageRefs}
          />
        ))}
      </div>

      {/* Subtle readability overlay so background is visible while preserving foreground legibility */}
      <div className="absolute inset-0 bg-cream-soft/20 pointer-events-none" />
    </div>
  );
}
