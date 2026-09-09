"use client";

import {
  Fragment,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import * as THREE from "three";

import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";

import { Text } from "@react-three/drei";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   TYPES
========================================================= */

type Vec3 = [number, number, number];

type FireworkData = {
  id: number;
  position: Vec3;
  color: string;
  power: number;
};

type FloatingCatProps = {
  position: Vec3;
  scale: number;
  index: number;
  lowDetail?: boolean;
  onTouch?: (position: Vec3) => void;
};

/* =========================================================
   FLOATING CATS
   Replaces the old random glass shapes around UZMA.
========================================================= */

function FloatingCat({
  position,
  scale,
  index,
  lowDetail = false,
  onTouch,
}: FloatingCatProps) {
  const group = useRef<THREE.Group>(null);
  const hitMesh = useRef<THREE.Mesh>(null);
  const worldPosition = useRef(new THREE.Vector3());
  const repelOffset = useRef(new THREE.Vector3());
  const [hovered, setHovered] = useState(false);

  const basePosition = useMemo(() => new THREE.Vector3(...position), [position]);

  const palette = [
    { fur: '#fff7fb', accent: '#ffb8dc', eye: '#2a2130' },
    { fur: '#dfeaff', accent: '#a9bbff', eye: '#202235' },
    { fur: '#e9dcff', accent: '#c3a3ff', eye: '#292033' },
  ];
  const colors = palette[index % palette.length];

  const tailCurve = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.58, -0.05, 0.06),
      new THREE.Vector3(-0.92, -0.03, 0.08),
      new THREE.Vector3(-1.08, 0.30, 0.05),
      new THREE.Vector3(-0.88, 0.62, 0.02),
    ]);
    return new THREE.TubeGeometry(
      curve,
      lowDetail ? 5 : 7,
      0.075,
      lowDetail ? 4 : 5,
      false
    );
  }, [lowDetail]);

  useFrame((state, delta) => {
    if (!group.current || !hitMesh.current) return;

    const time = state.clock.elapsedTime;
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.getWorldPosition(worldPosition.current).project(state.camera);

    const dx = worldPosition.current.x - px;
    const dy = worldPosition.current.y - py;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = 0.48;

    let repelX = 0;
    let repelY = 0;
    if (distance > 0.001 && distance < radius) {
      const force = Math.pow(1 - distance / radius, 2) * 0.72;
      repelX = (dx / distance) * force;
      repelY = (dy / distance) * force;
    }

    repelOffset.current.x = THREE.MathUtils.damp(repelOffset.current.x, repelX, 7, delta);
    repelOffset.current.y = THREE.MathUtils.damp(repelOffset.current.y, repelY, 7, delta);

    group.current.position.x = basePosition.x + Math.sin(time * 0.28 + index * 1.4) * 0.16 + repelOffset.current.x;
    group.current.position.y = basePosition.y + Math.sin(time * 0.38 + index * 0.9) * 0.24 + repelOffset.current.y;
    group.current.position.z = basePosition.z + Math.cos(time * 0.22 + index) * 0.14;

    const target = hovered ? scale * 1.09 : scale;
    const next = THREE.MathUtils.damp(group.current.scale.x, target, 5, delta);
    group.current.scale.setScalar(next);

    group.current.rotation.z = Math.sin(time * 0.42 + index) * 0.035;
    group.current.rotation.y = Math.sin(time * 0.26 + index * 0.7) * 0.10;
  });

  const furMat = {
    color: colors.fur,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  };

  return (
    <group ref={group} position={position}>
      {/* Invisible hit area */}
      <mesh
        ref={hitMesh}
        scale={[1.05, 1.15, 0.72]}
        onPointerDown={(event) => {
          event.stopPropagation();
          onTouch?.([
            group.current?.position.x ?? position[0],
            group.current?.position.y ?? position[1],
            group.current?.position.z ?? position[2],
          ]);
        }}
        onPointerEnter={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.75, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Seated body */}
      <mesh position={[0, -0.02, 0]} scale={[0.62, 0.82, 0.48]}>
        <sphereGeometry args={[0.72, lowDetail ? 8 : 10, lowDetail ? 6 : 8]} />
        <meshBasicMaterial {...furMat} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.76, -0.01]} scale={[0.70, 0.62, 0.52]}>
        <sphereGeometry args={[0.72, lowDetail ? 8 : 10, lowDetail ? 6 : 8]} />
        <meshBasicMaterial {...furMat} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.40, 1.26, 0]} rotation={[0, 0, -0.18]} scale={[0.30, 0.46, 0.28]}>
        <coneGeometry args={[0.62, 1.0, 4]} />
        <meshBasicMaterial {...furMat} />
      </mesh>
      <mesh position={[0.40, 1.26, 0]} rotation={[0, 0, 0.18]} scale={[0.30, 0.46, 0.28]}>
        <coneGeometry args={[0.62, 1.0, 4]} />
        <meshBasicMaterial {...furMat} />
      </mesh>

      {/* Inner ears */}
      <mesh position={[-0.40, 1.25, -0.26]} rotation={[0, 0, -0.18]} scale={[0.14, 0.25, 0.10]}>
        <coneGeometry args={[0.62, 1.0, 4]} />
        <meshBasicMaterial color={colors.accent} transparent opacity={0.58} depthWrite={false} />
      </mesh>
      <mesh position={[0.40, 1.25, -0.26]} rotation={[0, 0, 0.18]} scale={[0.14, 0.25, 0.10]}>
        <coneGeometry args={[0.62, 1.0, 4]} />
        <meshBasicMaterial color={colors.accent} transparent opacity={0.58} depthWrite={false} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.24, 0.80, -0.50]} scale={0.075}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={colors.eye} transparent opacity={0.95} />
      </mesh>
      <mesh position={[0.24, 0.80, -0.50]} scale={0.075}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={colors.eye} transparent opacity={0.95} />
      </mesh>

      {/* Nose + tiny muzzle */}
      <mesh position={[0, 0.64, -0.54]} scale={[0.065, 0.045, 0.045]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={colors.accent} transparent opacity={0.95} />
      </mesh>
      <mesh position={[-0.075, 0.60, -0.53]} scale={0.06}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={colors.fur} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0.075, 0.60, -0.53]} scale={0.06}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={colors.fur} transparent opacity={0.92} />
      </mesh>

      {/* Paws */}
      <mesh position={[-0.26, -0.53, -0.28]} scale={[0.20, 0.32, 0.22]}>
        <sphereGeometry args={[0.75, 7, 6]} />
        <meshBasicMaterial {...furMat} />
      </mesh>
      <mesh position={[0.26, -0.53, -0.28]} scale={[0.20, 0.32, 0.22]}>
        <sphereGeometry args={[0.75, 7, 6]} />
        <meshBasicMaterial {...furMat} />
      </mesh>

      {/* Curled tail */}
      <mesh geometry={tailCurve} position={[0, 0, 0]}>
        <meshBasicMaterial color={colors.fur} transparent opacity={0.66} depthWrite={false} />
      </mesh>
    </group>
  );
}
/* =========================================================
   ROCKET
========================================================= */

function Rocket({
  launchProgress,
}: {
  launchProgress: React.MutableRefObject<number>;
}) {
  const rocket =
    useRef<THREE.Group>(null);

  const flame =
    useRef<THREE.Group>(null);

  const exhaust = useMemo(
    () =>
      Array.from(
        { length: 35 },
        (_, i) => ({
          id: i,
          x:
            (seededRandom(i, 11) - 0.5) *
            0.5,
          y:
            -seededRandom(i, 12) * 3,
          z:
            (seededRandom(i, 13) - 0.5) *
            0.5,
          size:
            0.015 +
            seededRandom(i, 14) *
              0.035,
        })
      ),
    []
  );

  useFrame((state) => {
    if (!rocket.current)
      return;

    const p =
      launchProgress.current;

    rocket.current.position.y =
      THREE.MathUtils.lerp(
        -4.8,
        17,
        p
      );

    rocket.current.rotation.z =
      Math.sin(
        state.clock.elapsedTime *
          1.5
      ) * 0.015;

    if (flame.current) {
      const pulse =
        1 +
        Math.sin(
          state.clock.elapsedTime *
            20
        ) *
          0.08;

      flame.current.scale.set(
        pulse,
        pulse *
          (1 + p * 0.5),
        pulse
      );
    }
  });

  return (
    <group ref={rocket}>
      {/* Body */}

      <mesh
        rotation={[
          0,
          0,
          Math.PI / 2,
        ]}
      >
        <cylinderGeometry
          args={[
            0.38,
            0.5,
            1.9,
            16,
          ]}
        />

        <meshBasicMaterial color="#eeeeff" />
      </mesh>

      {/* Nose */}

      <mesh position={[0, 1.15, 0]}>
        <coneGeometry
          args={[
            0.38,
            0.75,
            16,
          ]}
        />

        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Window */}

      <mesh
        position={[
          0,
          0.15,
          -0.39,
        ]}
      >
        <sphereGeometry
          args={[0.16, 16, 16]}
        />

        <meshBasicMaterial
          color="#6df4ff"
        />
      </mesh>

      {/* Flame */}

      <group
        ref={flame}
        position={[0, -1.25, 0]}
      >
        <mesh>
          <coneGeometry
            args={[
              0.35,
              2.5,
              12,
            ]}
          />

          <meshBasicMaterial
            color="#9d7cff"
            transparent
            opacity={0.75}
          />
        </mesh>

        <mesh scale={0.55}>
          <coneGeometry
            args={[
              0.35,
              2.8,
              10,
            ]}
          />

          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>

      {/* Exhaust */}

      <group>
        {exhaust.map((particle) => (
          <mesh
            key={particle.id}
            position={[
              particle.x,
              particle.y,
              particle.z,
            ]}
          >
            <sphereGeometry
              args={[
                particle.size,
                5,
                5,
              ]}
            />

            <meshBasicMaterial
              color={
                particle.id % 2 === 0
                  ? "#8ceeff"
                  : "#b98cff"
              }
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* =========================================================
   FLOATING UZMA
========================================================= */

function FloatingName() {
  const ref =
    useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current)
      return;

    const t =
      state.clock.elapsedTime;

    ref.current.rotation.y =
      Math.sin(t * 0.25) *
      0.08;

    ref.current.position.y =
      Math.sin(t * 0.4) *
      0.12;
  });

  return (
    <Text
      ref={ref}
      position={[0, 0.2, -6]}
      fontSize={2}
      letterSpacing={0.08}
      anchorX="center"
      anchorY="middle"
    >
      UZMA

      <meshBasicMaterial
        color="#ffffff"
        toneMapped={false}
      />
    </Text>
  );
}

/* =========================================================
   GIANT 19
========================================================= */

function Giant19() {
  const group =
    useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;

    // Very light rotation: no transmission/refraction calculations.
    group.current.rotation.y += delta * 0.025;
    group.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.22) * 0.025;
  });

  return (
    <group
      ref={group}
      position={[0, 0, -12]}
    >
      <Text
        fontSize={7}
        letterSpacing={-0.08}
        anchorX="center"
        anchorY="middle"
      >
        19

        <meshBasicMaterial
          color="#9b86ff"
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </Text>
    </group>
  );
}

/* =========================================================
   CAMERA
========================================================= */

function CameraController({
  scrollProgress,
  introProgress,
}: {
  scrollProgress: React.MutableRefObject<number>;
  introProgress: React.MutableRefObject<number>;
}) {
  const { camera } =
    useThree();

  const target =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const lookTarget =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  useFrame((_, delta) => {
    const intro =
      introProgress.current;

    const scroll =
      scrollProgress.current;

    if (intro < 1) {
      target.set(
        Math.sin(
          intro * Math.PI
        ) * 0.8,

        THREE.MathUtils.lerp(
          -1,
          11,
          intro
        ),

        THREE.MathUtils.lerp(
          8,
          2,
          intro
        )
      );
    } else if (scroll < 0.125) {
      /*
        CHAPTER 1
        Enter the birthday universe.
      */

      const p =
        scroll / 0.125;

      target.set(
        THREE.MathUtils.lerp(
          0,
          1,
          p
        ),

        THREE.MathUtils.lerp(
          0,
          0.4,
          p
        ),

        THREE.MathUtils.lerp(
          5,
          -5,
          p
        )
      );
    } else if (scroll < 0.25) {
      /*
        CHAPTER 2
        Move toward the giant 19.
      */

      const p =
        (scroll - 0.125) /
        0.125;

      target.set(
        THREE.MathUtils.lerp(
          1,
          0,
          p
        ),

        THREE.MathUtils.lerp(
          0.4,
          0,
          p
        ),

        THREE.MathUtils.lerp(
          -5,
          -10,
          p
        )
      );
    } else if (scroll < 0.5) {
      /*
        PHOTO MEMORY SECTION
      */

      const p =
        (scroll - 0.25) /
        0.25;

      const angle =
        p * Math.PI * 1.5;

      const radius = 5;

      target.set(
        Math.sin(angle) *
          radius,

        Math.sin(
          p * Math.PI
        ) * 1.2,

        -12 +
          Math.cos(angle) *
            radius
      );
    } else if (scroll < 0.72) {
      /*
        WISHES
      */

      const p =
        (scroll - 0.5) /
        0.22;

      target.set(
        THREE.MathUtils.lerp(
          0,
          -2,
          p
        ),

        THREE.MathUtils.lerp(
          0,
          1,
          p
        ),

        THREE.MathUtils.lerp(
          -10,
          -18,
          p
        )
      );
    } else {
      /*
        FINAL REVEAL
      */

      const p =
        (scroll - 0.72) /
        0.28;

      target.set(
        0,
        THREE.MathUtils.lerp(
          1,
          -1,
          p
        ),
        THREE.MathUtils.lerp(
          -18,
          9,
          p
        )
      );
    }

    camera.position.lerp(
      target,
      1 -
        Math.pow(
          0.001,
          delta
        )
    );

    /*
      Slightly change where the camera looks
      during the journey.
    */

    lookTarget.set(
      0,
      0,
      scroll > 0.25
        ? -10
        : -4
    );

    camera.lookAt(
      lookTarget
    );

    const desiredFov =
      intro < 1
        ? THREE.MathUtils.lerp(
            55,
            45,
            intro
          )
        : scroll < 0.25
        ? 45
        : scroll < 0.7
        ? 48
        : THREE.MathUtils.lerp(
            48,
            68,
            (scroll - 0.7) /
              0.3
          );

    const perspective =
      camera as THREE.PerspectiveCamera;

    perspective.fov =
      THREE.MathUtils.damp(
        perspective.fov,
        desiredFov,
        3,
        delta
      );

    perspective.updateProjectionMatrix();
  });

  return null;
}

/* =========================================================
   FIREWORK PARTICLES
========================================================= */

function Firework({
  firework,
  onDone,
}: {
  firework: FireworkData;
  onDone: (id: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    return Array.from({ length: 18 }, () => {
      const v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();
      const speed = (0.045 + Math.random() * 0.085) * firework.power;
      return {
        position: new THREE.Vector3(),
        velocity: v.multiplyScalar(speed),
        life: 1,
        scale: 0.018 + Math.random() * 0.035,
      };
    });
  }, [firework.id, firework.power]);

  useFrame(() => {
    if (!group.current) return;
    let alive = false;

    group.current.children.forEach((child, i) => {
      const particle = particles[i];
      if (!particle) return;

      particle.velocity.y -= 0.0016;
      particle.position.add(particle.velocity);
      particle.velocity.multiplyScalar(0.982);
      particle.life -= 0.012;

      child.position.copy(particle.position);

      if (child instanceof THREE.Mesh) {
        const material = child.material;
        if (material instanceof THREE.MeshBasicMaterial) {
          material.opacity = Math.max(0, particle.life);
        }
      }

      if (particle.life > 0) alive = true;
    });

    if (!alive) onDone(firework.id);
  });

  return (
    <group ref={group} position={firework.position}>
      {particles.map((particle, i) => (
        <mesh key={i} scale={particle.scale}>
          <sphereGeometry args={[1, 5, 5]} />
          <meshBasicMaterial
            color={firework.color}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   DETERMINISTIC VISUAL RANDOMNESS
   Keeps SSR and browser hydration identical.
========================================================= */
function seededRandom(index: number, salt = 0): number {
  const x = Math.sin((index + 1) * 12.9898 + (salt + 1) * 78.233) * 43758.5453;
  const value = x - Math.floor(x);
  // Keep deterministic values identical in server/client markup.
  return Math.round(value * 10000) / 10000;
}

/* =========================================================
   INTERACTIVE STAR SKY
========================================================= */

function InteractiveSky() {
  const skyRef = useRef<HTMLDivElement>(null);
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  const stars = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        id: i,
        left: seededRandom(i, 1) * 100,
        top: seededRandom(i, 2) * 100,
        size: 1 + seededRandom(i, 3) * 2.5,
        delay: seededRandom(i, 4) * 4,
        duration: 2 + seededRandom(i, 5) * 4,
      })),
    []
  );

  const colors = [
    '#ffffff', '#7df9ff', '#b9a2ff', '#ff8fdd', '#ffd37d', '#8fffcf',
  ];

  const triggerBurst = (clientX: number, clientY: number) => {
    if (!skyRef.current) return;
    const rect = skyRef.current.getBoundingClientRect();
    const x = THREE.MathUtils.clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = THREE.MathUtils.clamp((clientY - rect.top) / rect.height, 0, 1);
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const color = colors[Math.floor(Math.random() * colors.length)];

    setBursts((items) => [...items.slice(-5), { id, x, y, color }]);
    window.setTimeout(() => {
      setBursts((items) => items.filter((item) => item.id !== id));
    }, 900);
  };

  return (
    <div
      ref={skyRef}
      className="interactive-sky"
      onPointerDown={(event) => triggerBurst(event.clientX, event.clientY)}
    >
      <div className="sky-message">
        <span>TOUCH THE SKY</span>
        <strong>TAP ANYWHERE</strong>
        <small>Every touch creates fireworks ✦</small>
      </div>
      {stars.map((star) => (
        <span
          key={star.id}
          className="css-star"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}

      <div className="touch-fireworks" aria-hidden="true">
        {bursts.map((burst) => (
          <div
            key={burst.id}
            className="touch-burst"
            style={{
              left: `${burst.x * 100}%`,
              top: `${burst.y * 100}%`,
              ['--burst-color' as string]: burst.color,
            } as React.CSSProperties}
          >
            <span className="touch-burst-core" />
            <span className="touch-burst-ring" />
            {Array.from({ length: 28 }, (_, i) => (
              <i
                key={i}
                style={{
                  ['--angle' as string]: `${i * (360 / 28) + (seededRandom(i, burst.id % 31) - 0.5) * 8}deg`,
                  ['--distance' as string]: `${44 + seededRandom(i, burst.id % 97) * 86}px`,
                  ['--delay' as string]: `${seededRandom(i, burst.id % 53) * 0.1}s`,
                  ['--particle-color' as string]: colors[(i + Math.floor(seededRandom(i, burst.id % 71) * colors.length)) % colors.length],
                  ['--particle-size' as string]: `${2.2 + seededRandom(i, burst.id % 113) * 2.3}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   3D SPACE SCENE
========================================================= */

function SpaceScene({
  scrollProgress,
  introProgress,
  launchProgress,
  fireworks,
  removeFirework,
  isMobile,
  onObjectTouch,
}: {
  scrollProgress: React.MutableRefObject<number>;
  introProgress: React.MutableRefObject<number>;
  launchProgress: React.MutableRefObject<number>;
  fireworks: FireworkData[];
  removeFirework: (id: number) => void;
  isMobile: boolean;
  onObjectTouch: (position: Vec3) => void;
}) {
  const objects = useMemo(
    () => [
      {
        position: [-5, 3, -4] as Vec3,
        scale: 0.39,
        type: "cat" as const,
      },
      {
        position: [4, 2, -5] as Vec3,
        scale: 0.31,
        type: "cat" as const,
      },
      {
        position: [-4, -2, -8] as Vec3,
        scale: 0.53,
        type: "cat" as const,
      },
      {
        position: [5, -2, -10] as Vec3,
        scale: 0.42,
        type: "cat" as const,
      },
      {
        position: [-6, 1, -13] as Vec3,
        scale: 0.28,
        type: "cat" as const,
      },
      {
        position: [6, 3, -15] as Vec3,
        scale: 0.46,
        type: "cat" as const,
      },
    ],
    []
  );
  return (
    <>
      <CameraController
        scrollProgress={
          scrollProgress
        }
        introProgress={
          introProgress
        }
      />

      <ambientLight
        intensity={0.25}
      />

      <pointLight
        position={[3, 3, 2]}
        intensity={12}
        distance={25}
        color="#8d7aff"
      />

      <pointLight
        position={[-5, -3, -8]}
        intensity={8}
        distance={20}
        color="#5eeaff"
      />


      {objects.map((object, index) => (
        <FloatingCat
          key={index}
          position={object.position}
          scale={object.scale}
          index={index}
          lowDetail={isMobile}
          onTouch={onObjectTouch}
        />
      ))}

      <FloatingName />

      <Giant19 />

      <Rocket
        launchProgress={
          launchProgress
        }
      />

      {fireworks.map((firework) => (
        <Firework
          key={firework.id}
          firework={firework}
          onDone={removeFirework}
        />
      ))}
    </>
  );
}


export default SpaceScene;
