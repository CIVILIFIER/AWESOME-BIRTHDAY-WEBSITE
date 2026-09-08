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

/* =========================================================
   PHOTO CARD
========================================================= */

function PhotoCard({
  src,
  number,
  title,
  caption,
}: {
  src: string;
  number: string;
  title: string;
  caption: string;
}) {
  const card =
    useRef<HTMLDivElement>(null);

  const handleMove = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!card.current)
      return;

    const rect =
      card.current.getBoundingClientRect();

    const x =
      event.clientX -
      rect.left;

    const y =
      event.clientY -
      rect.top;

    const rotateY =
      ((x / rect.width) -
        0.5) *
      14;

    const rotateX =
      ((y / rect.height) -
        0.5) *
      -14;

    gsap.to(card.current, {
      rotateX,
      rotateY,
      scale: 1.035,
      duration: 0.45,
      ease: "power3.out",
    });
  };

  const handleLeave = () => {
    if (!card.current)
      return;

    gsap.to(card.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.7,
      ease: "expo.out",
    });
  };

  return (
    <div
      ref={card}
      className="photo-card"
      onMouseMove={
        handleMove
      }
      onMouseLeave={
        handleLeave
      }
    >
      <div className="photo-number">
        {number}
      </div>

      <div className="photo-image-wrap">
        <img
          src={src}
          alt={`Uzma memory ${number}`}
          className="photo-image" data-photo-image
        />

        <div className="photo-shine" />
      </div>

      <div className="photo-info">
        <div className="photo-title">
          {title}
        </div>

        <div className="photo-caption">
          {caption}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   WISH CARD
========================================================= */

function WishCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  const [active, setActive] =
    useState(false);

  return (
    <button
      className={`wish-card ${
        active
          ? "wish-active"
          : ""
      }`}
      onClick={() =>
        setActive(!active)
      }
    >
      <span className="wish-number">
        {number}
      </span>

      <span className="wish-title">
        {title}
      </span>

      <span className="wish-text">
        {text}
      </span>

      <span className="wish-arrow">
        {active
          ? "×"
          : "+"}
      </span>
    </button>
  );
}



/* =========================================================
   BIRTHDAY CAKE CELEBRATION
========================================================= */

function CakeCelebration() {
  const [entered, setEntered] = useState(false);
  const [ready, setReady] = useState(false);
  const [lit, setLit] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          window.setTimeout(() => setReady(true), 3000);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={wrapRef} className={`slide cake-celebration-slide ${entered ? "cake-entered" : ""} ${lit ? "cake-lit" : ""}`}>
      <div className="cake-bg-word" aria-hidden="true">BIRTHDAY</div>
      <div className="cake-stars" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} style={{
            left: `${8 + seededRandom(i, 51) * 84}%`,
            top: `${7 + seededRandom(i, 52) * 78}%`,
            animationDelay: `${seededRandom(i, 53) * 2.5}s`,
          }} />
        ))}
      </div>

      <div className="cake-stage">
        <div className="cake-piece piece-one" />
        <div className="cake-piece piece-two" />
        <div className="cake-piece piece-three" />
        <div className="cake-piece piece-four" />
        <div className="cake-piece piece-five" />
        <div className="cake-piece piece-six" />

        <div className="cake-assembled" aria-label="Birthday cake">
          <div className="cake-top-glow" />
          <div className="cake-layer cake-layer-top" />
          <div className="cake-layer cake-layer-mid" />
          <div className="cake-layer cake-layer-bottom" />
          <div className="cake-frosting frosting-one" />
          <div className="cake-frosting frosting-two" />
          <div className="cake-candle">
            <div className="candle-body" />
            <div className="candle-flame" />
          </div>
        </div>

        <div className="cake-shadow" />
      </div>

      {!lit && (
        <div className={`cake-light-ui ${ready ? "is-ready" : ""}`}>
          <div className="cake-ready-text">THE CAKE IS READY</div>
          <button
            className="light-cake-button"
            onClick={() => ready && setLit(true)}
            disabled={!ready}
          >
            <span>✦ LIGHT THE CANDLES ✦</span>
          </button>
        </div>
      )}

      {lit && (
        <div className="cake-sky-celebration" aria-live="polite">
          <div className="cake-celebration-wash" />
          <div className="cake-celebration-title">
            <div className="cake-celebration-small">THE SKY IS YOURS ✦</div>
            <h3>HAPPY<br /><span>BIRTHDAY</span></h3>
            <div className="cake-celebration-name">UZMA ♡</div>
          </div>

          <div className="sky-firework fw-one"><i/><b/><em/></div>
          <div className="sky-firework fw-two"><i/><b/><em/></div>
          <div className="sky-firework fw-three"><i/><b/><em/></div>
          <div className="sky-firework fw-four"><i/><b/><em/></div>
          <div className="sky-firework fw-five"><i/><b/><em/></div>
          <div className="sky-firework fw-six"><i/><b/><em/></div>
          <div className="sky-firework fw-seven"><i/><b/><em/></div>
          <div className="sky-firework fw-eight"><i/><b/><em/></div>
          <div className="sky-firework fw-nine"><i/><b/><em/></div>
          <div className="sky-firework fw-ten"><i/><b/><em/></div>
          <div className="sky-firework fw-eleven"><i/><b/><em/></div>
          <div className="sky-firework fw-twelve"><i/><b/><em/></div>
          <div className="cake-balloons" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                className={`cake-balloon balloon-${(i % 6) + 1}`}
                style={{
                  ['--balloon-x' as string]: `${2 + seededRandom(i, 71) * 96}%`,
                  ['--balloon-delay' as string]: `${seededRandom(i, 72) * 3.8}s`,
                  ['--balloon-scale' as string]: `${0.72 + seededRandom(i, 73) * 0.48}`,
                  ['--balloon-drift' as string]: `${(seededRandom(i, 74) - 0.5) * 120}px`,
                } as React.CSSProperties}
              >
                <i />
              </span>
            ))}
          </div>
          <div className="sky-confetti" aria-hidden="true">
            {Array.from({ length: 32 }, (_, i) => <span key={i} style={{ ['--confetti-x' as string]: `${seededRandom(i, 61) * 100}%`, ['--confetti-y' as string]: `${seededRandom(i, 62) * 100}%`, ['--confetti-delay' as string]: `${seededRandom(i, 63) * 1.2}s` } as React.CSSProperties} />)}
          </div>
          <div className="cake-next-hint">keep scrolling ↓</div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   MAKI — PRIVATE SURPRISE
========================================================= */

function MakiSection() {
  const [revealed, setRevealed] = useState(false);

  return (
    <section className={`slide maki-slide ${revealed ? 'maki-is-open' : ''}`}>
      <div className="maki-bg-word" aria-hidden="true">SECRET</div>
      <div className="maki-header">
        <div className="mini-label">CHAPTER 04 · The GOAT</div>
        <h2>One more thing.<br /><span>Just for you.</span></h2>
        <p>{revealed ? 'Okay… you found the surprise. 🌚' : 'There may or may not be something hidden behind this.'}</p>
      </div>

      {!revealed ? (
        <button type="button" className="maki-lock" onClick={() => setRevealed(true)} aria-label="Reveal the surprise">
          <span className="maki-lock-icon">⌁</span>
          <strong>UNLOCK SURPRISE</strong>
          <small>tap if you dare</small>
        </button>
      ) : (
        <div className="maki-reveal">
          <div className="maki-image-wrap">
            <img src="/maki.jpg" alt="Maki" className="maki-image" />
            <div className="maki-image-glow" />
            <div className="maki-scanline" />
          </div>
          <div className="maki-caption">
            <span>✦ SPECIAL DELIVERY</span>
            <strong>🌚</strong>
            <small>Okay, now u need to start(ikyk)</small>
          </div>
          <button type="button" className="maki-reset" onClick={() => setRevealed(false)}>HIDE IT AGAIN</button>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   A LETTER THAT WRITES ITSELF — INTERACTIVE
========================================================= */

function LetterSection() {
  const fullLetter = `Dear Uzma,\n\nI could have just written “happy birthday” and called it a day. But that felt a little too ordinary for you.\n\nSo I made this tiny corner of the internet instead with stars, fireworks and little surprises, because sometimes the best way to say “you matter” is to actually build something for someone.\n\nI hope this year brings you the kind of days you secretly wish for soft ones, chaotic ones, unforgettable ones. And I hope you always remember that there are people who are genuinely happy that you exist.\n\nHappy 19th birthday, Uzma. ❤️`;

  const [opened, setOpened] = useState(false);
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    if (!opened) {
      setVisibleChars(0);
      return;
    }
    const timer = window.setInterval(() => {
      setVisibleChars((current) => {
        if (current >= fullLetter.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 2;
      });
    }, 24);
    return () => window.clearInterval(timer);
  }, [opened, fullLetter.length]);

  const shownLetter = fullLetter.slice(0, visibleChars);

  return (
    <section className={`slide letter-slide ${opened ? 'letter-is-open' : ''}`}>
      <div className="letter-bg-word" aria-hidden="true">DEAR</div>
      <div className="letter-header">
        <div className="mini-label">CHAPTER 05 · ONE LAST THING</div>
        <h2>A letter<br /><span>for you.</span></h2>
        <p>Just a little thing I made because a normal birthday message wasn't enough.</p>
      </div>

      {!opened ? (
        <button type="button" className="letter-envelope" onClick={() => setOpened(true)} aria-label="Open your birthday letter">
          <div className="letter-envelope-flap" />
          <div className="letter-seal">♡</div>
          <div className="letter-envelope-label">TO · UZMA</div>
          <strong>OPEN MY LETTER</strong>
          <small>tap to unfold</small>
        </button>
      ) : (
        <div className="letter-paper-wrap">
          <div className="letter-paper">
            <div className="letter-paper-top">
              <span>SEPTEMBER 14</span>
              <span>19 ✦</span>
            </div>
            <div className="letter-writing">
              {shownLetter.split('\n').map((line, index) => (
                <Fragment key={`${index}-${line}`}>
                  {index > 0 && <br />}
                  {line}
                </Fragment>
              ))}
              {visibleChars < fullLetter.length && <span className="letter-caret">|</span>}
            </div>
            <div className="letter-signature">— Adnan ♡</div>
            <button type="button" className="letter-close" onClick={() => setOpened(false)}>FOLD IT BACK UP</button>
          </div>
          <div className="letter-petal petal-a">✿</div>
          <div className="letter-petal petal-b">♡</div>
          <div className="letter-spark spark-a">✦</div>
          <div className="letter-spark spark-b">✧</div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function Page() {
  const [launched, setLaunched] =
    useState(false);

  const [introComplete, setIntroComplete] =
    useState(false);

  const [finalBurst, setFinalBurst] =
    useState(false);

  const [fireworks, setFireworks] =
    useState<FireworkData[]>([]);

  const [wishMessageVisible, setWishMessageVisible] =
    useState(false);

  const [selectedWish, setSelectedWish] =
    useState<"happiness" | "memories" | "dreams">("happiness");
  const [wishText, setWishText] = useState("");
  const [wishSealed, setWishSealed] = useState(false);

  // Phones use a lightweight CSS experience instead of continuous WebGL.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const fireworkId = useRef(1);

  const scrollProgress =
    useRef(0);

  const introProgress =
    useRef(0);

  const launchProgress =
    useRef(0);

  const motionFrame =
    useRef<number | null>(null);

  const motionLastScroll =
    useRef(0);

  const motionLastTime =
    useRef(0);

  const removeFirework = (id: number) => {
    setFireworks((items) =>
      items.filter((item) => item.id !== id)
    );
  };

  const spawnFirework = (
    position: Vec3,
    color?: string,
    power = 1
  ) => {
    const colors = [
      "#ffffff",
      "#7df9ff",
      "#b9a2ff",
      "#ff8fdd",
      "#ffd37d",
      "#8fffcf",
    ];

    const id = fireworkId.current++;

    setFireworks((items) => [
      ...items,
      {
        id,
        position,
        color: color ?? colors[Math.floor(Math.random() * colors.length)],
        power,
      },
    ].slice(-12));
  };

  const makeWish = () => {
    setWishMessageVisible(true);

    window.setTimeout(() => {
      setWishMessageVisible(false);
    }, 9000);

    spawnFirework([0, 0.2, -7], "#ffffff", 1.5);
    window.setTimeout(() => spawnFirework([-3, 1.3, -8], "#ff8fdd", 0.9), 120);
    window.setTimeout(() => spawnFirework([3, 1.1, -8], "#7df9ff", 0.9), 260);
    window.setTimeout(() => spawnFirework([-2.5, -1.3, -8], "#b9a2ff", 0.8), 400);
    window.setTimeout(() => spawnFirework([2.5, -1.2, -8], "#ffd37d", 0.8), 540);
  };

  /* =======================================================
     LENIS
  ======================================================= */

  useEffect(() => {
    if (!introComplete)
      return;

    // Native scrolling on phones. Lenis is reserved for desktop.
    const lenis = isMobile
      ? null
      : new Lenis({
          duration: 0.8,
          smoothWheel: true,
          syncTouch: false,
        });

    const update = () => {
      ScrollTrigger.update();
    };

    if (lenis) lenis.on("scroll", update);

    const ticker = (time: number) => {
      lenis?.raf(time * 1000);
    };

    if (lenis) gsap.ticker.add(ticker);

    const trigger = ScrollTrigger.create({
      trigger: ".experience",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollProgress.current = self.progress;
        if (self.progress > 0.92) {
          setFinalBurst(true);
        }
      },
    });

    return () => {
      lenis?.destroy();
      if (lenis) gsap.ticker.remove(ticker);
      trigger.kill();
    };
  }, [introComplete, isMobile]);

  /* =======================================================
     SCROLL FADE / REVEAL
  ======================================================= */

  useEffect(() => {
    if (!introComplete)
      return;

    const elements =
      document.querySelectorAll(
        ".reveal"
      );

    const animations: gsap.core.Tween[] =
      [];

    elements.forEach(
      (element) => {
        const chars =
          element.querySelectorAll(
            ".kinetic-char"
          );

        const tween =
          gsap.fromTo(
            chars,
            {
              opacity: 0,
              y: 70,
              rotateX: -70,
              z: -120,
              scale: 0.75,
            },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              z: 0,
              scale: 1,

              duration: 1,

              stagger: 0.025,

              ease:
                "expo.out",

              scrollTrigger: {
                trigger:
                  element,

                start:
                  "top 85%",

                toggleActions:
                  "play reverse play reverse",
              },
            }
          );

        animations.push(
          tween
        );
      }
    );

    return () => {
      animations.forEach(
        (animation) =>
          animation.kill()
      );
    };
  }, [introComplete, isMobile]);

  /* =======================================================
     MEMORY JOURNEY MOTION
     One RAF powers image parallax, zoom-through transitions,
     and copy movement for all five memories.
  ======================================================= */

  useEffect(() => {
    const memories = Array.from(document.querySelectorAll<HTMLElement>('.memory-slide'));
    if (!memories.length) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const viewport = window.innerHeight || 1;

      memories.forEach((slide) => {
        const stage = slide.querySelector<HTMLElement>('.memory-stage');
        const image = slide.querySelector<HTMLElement>('.photo-image');
        const card = slide.querySelector<HTMLElement>('.photo-card');
        const copy = slide.querySelector<HTMLElement>('.memory-copy');
        if (!stage || !image || !card || !copy) return;

        const rect = slide.getBoundingClientRect();
        const slideLength = Math.max(rect.height - viewport, 1);
        const progress = THREE.MathUtils.clamp(-rect.top / slideLength, 0, 1);

        // The image behaves like the giant background word:
        // it enters small and soft, becomes fully present, then exits upward
        // so the following memory can take its place.
        const enter = THREE.MathUtils.clamp(progress / 0.24, 0, 1);
        const hold = THREE.MathUtils.clamp((progress - 0.16) / 0.68, 0, 1);
        const exit = THREE.MathUtils.clamp((progress - 0.72) / 0.28, 0, 1);

        const easeOut = (n: number) => 1 - Math.pow(1 - n, 3);
        const easedEnter = easeOut(enter);
        const easedExit = easeOut(exit);

        // Keep the photo fully visible at all times.
        // Only position/scale changes create the entrance/exit, so there is
        // never a black placeholder while the memory is approaching.
        const imageY = 150 - easedEnter * 150 - easedExit * 170;
        const imageScale = 0.84 + easedEnter * 0.16 + easedExit * 0.10;
        const imageOpacity = 1;
        const imageBlur = 0;

        const focus = THREE.MathUtils.clamp(
          Math.min(easedEnter * 1.35, 1),
          0,
          1
        );

        // Copy appears after the image settles, then fades as the image leaves.
        const copyIn = THREE.MathUtils.clamp((progress - 0.36) / 0.24, 0, 1);
        const copyOut = THREE.MathUtils.clamp((progress - 0.83) / 0.17, 0, 1);
        const copyOpacity = easeOut(copyIn);
        const copyY = 46 - easeOut(copyIn) * 46 - copyOut * 24;

        const overlayOpacity = 0.04 + focus * 0.12;

        image.style.setProperty('--memory-image-y', `${imageY.toFixed(1)}px`);
        image.style.setProperty('--memory-image-scale', imageScale.toFixed(4));
        image.style.setProperty('--memory-image-opacity', imageOpacity.toFixed(3));
        image.style.setProperty('--memory-image-blur', `${imageBlur.toFixed(1)}px`);
        image.style.setProperty('--scroll-drift', `${(-focus * 16).toFixed(1)}px`);
        card.style.setProperty('--memory-depth', `${((1 - focus) * 26 - easedExit * 22).toFixed(1)}px`);
        card.style.setProperty('--memory-card-scale', (0.92 + focus * 0.08).toFixed(4));
        card.style.setProperty('--memory-card-opacity', '1');
        stage.style.setProperty('--memory-focus', focus.toFixed(3));
        copy.style.setProperty('--memory-copy-y', `${copyY.toFixed(1)}px`);
        copy.style.setProperty('--memory-copy-opacity', copyOpacity.toFixed(3));
        stage.style.setProperty('--memory-glow', overlayOpacity.toFixed(3));

        slide.style.setProperty('--memory-progress', progress.toFixed(3));
      });
    };

    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [introComplete]);

  /* =======================================================
     CURSOR / TOUCH REPULSION + SECTION REVEALS
     Lightweight DOM-only interaction. No per-element GSAP loops.
  ======================================================= */

  useEffect(() => {
    if (!introComplete) return;

    const root = document.querySelector<HTMLElement>('.experience');
    if (!root) return;

    const revealGroups: Array<{ selector: string; variant: string }> = [
      { selector: '.hero-slide .mini-label, .hero-slide .hero-title, .hero-slide .hero-copy, .hero-slide .scroll-hint', variant: 'rise' },
      { selector: '.chapter-slide .mini-label, .chapter-slide h2, .chapter-slide p', variant: 'blur' },
      { selector: '.memory-slide .memory-copy .mini-label, .memory-slide .memory-copy h2, .memory-slide .memory-copy p, .memory-slide .memory-scroll-mark', variant: 'slide' },
      { selector: '.memory-slide .photo-card', variant: 'zoom' },
      { selector: '.wishes-slide .mini-label, .wishes-slide h2, .wishes-slide .wish-intro', variant: 'zoom' },
      { selector: '.wishes-slide .wish-card', variant: 'cards' },
      { selector: '.interactive-wish-slide .mini-label, .interactive-wish-slide h2, .interactive-wish-slide > p, .interactive-wish-slide .firework-button, .interactive-wish-slide .wish-wishes', variant: 'float' },
      { selector: '.sky-slide .sky-message span, .sky-slide .sky-message strong, .sky-slide .sky-message small', variant: 'focus' },
      { selector: '.support-slide .mini-label, .support-slide h2', variant: 'rise' },
      { selector: '.support-slide .support-lines p', variant: 'lines' },
      { selector: '.message-slide .mini-label, .message-slide .message-big, .message-slide p', variant: 'focus' },
      { selector: '.final-slide .mini-label, .final-slide h2, .final-slide h3, .final-slide > .final-content > p, .final-slide .final-message, .final-slide .final-ikyk, .final-slide .final-end', variant: 'final' },
    ];

    const revealItems: HTMLElement[] = [];
    revealGroups.forEach(({ selector, variant }) => {
      root.querySelectorAll<HTMLElement>(selector).forEach((el, index) => {
        el.classList.add('scroll-reveal', `scroll-reveal-${variant}`);
        el.style.setProperty('--reveal-delay', `${Math.min(index * 0.08, 0.36)}s`);
        revealItems.push(el);
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('is-visible');
        }
      });
    }, { root: null, threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((el) => observer.observe(el));

    const repelSelector = [
      '.photo-card',
      '.wish-card',
      '.wish-launch-panel',
      '.support-lines p',
    ].join(',');

    let pointerX = -9999;
    let pointerY = -9999;
    let raf = 0;
    let touching = false;

    const updateRepel = () => {
      raf = 0;
      const items = root.querySelectorAll<HTMLElement>(repelSelector);
      items.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const maxDist = Math.max(150, Math.min(rect.width, rect.height) * 0.72);
        const dx = cx - pointerX;
        const dy = cy - pointerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDist && distance > 0.5 && (touching || window.matchMedia('(hover: hover)').matches)) {
          const strength = Math.pow(1 - distance / maxDist, 2) * 18;
          el.style.setProperty('--repel-x', `${((dx / distance) * strength).toFixed(1)}px`);
          el.style.setProperty('--repel-y', `${((dy / distance) * strength).toFixed(1)}px`);
        } else {
          el.style.setProperty('--repel-x', '0px');
          el.style.setProperty('--repel-y', '0px');
        }
      });
    };

    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(updateRepel);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      touching = event.pointerType === 'touch' || touching;
      schedule();
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      touching = event.pointerType === 'touch';
      schedule();
    };

    const onPointerUp = () => {
      touching = false;
      pointerX = -9999;
      pointerY = -9999;
      schedule();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });

    schedule();

    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      if (raf) window.cancelAnimationFrame(raf);
      revealItems.forEach((el) => {
        el.classList.remove('scroll-reveal', 'is-visible');
        el.style.removeProperty('--reveal-delay');
        el.style.removeProperty('--repel-x');
        el.style.removeProperty('--repel-y');
      });
    };
  }, [introComplete]);

  /* =======================================================
     AMBIENT SCROLL MOTION
     One RAF-driven DOM update powers background typography
     and scroll velocity effects without per-element GSAP loops.
  ======================================================= */

  useEffect(() => {
    if (!introComplete) return;

    const root =
      document.querySelector<HTMLElement>(".experience");
    if (!root) return;

    const update = () => {
      motionFrame.current = null;

      const scrollY = window.scrollY || 0;
      const now = performance.now();
      const previousY = motionLastScroll.current;
      const previousTime = motionLastTime.current || now;
      const dt = Math.max(16, now - previousTime);

      const velocity =
        THREE.MathUtils.clamp(
          (scrollY - previousY) / dt,
          -2.5,
          2.5
        );

      const progress =
        THREE.MathUtils.clamp(
          scrollY /
            Math.max(
              1,
              document.documentElement.scrollHeight -
                window.innerHeight
            ),
          0,
          1
        );

      root.style.setProperty("--scroll-progress", progress.toFixed(4));
      root.style.setProperty("--ambient-shift", `${(velocity * -26).toFixed(1)}px`);
      root.style.setProperty("--ambient-tilt", `${(velocity * 1.8).toFixed(2)}deg`);

      motionLastScroll.current = scrollY;
      motionLastTime.current = now;
    };

    const schedule = () => {
      if (motionFrame.current === null) {
        motionFrame.current =
          window.requestAnimationFrame(update);
      }
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);

      if (motionFrame.current !== null) {
        window.cancelAnimationFrame(motionFrame.current);
        motionFrame.current = null;
      }
    };
  }, [introComplete]);

  /* =======================================================
     ROCKET LAUNCH
  ======================================================= */

  const startMission =
    () => {
      if (launched)
        return;

      setLaunched(true);

      document.body.style.overflow =
        "hidden";

      const tl =
        gsap.timeline();

      /*
        1.
        Name expands.
      */

      tl.to(
        ".intro-name",
        {
          letterSpacing:
            "0.28em",

          duration: 1.2,

          ease:
            "expo.inOut",
        }
      );

      /*
        2.
        Launch UI fades.
      */

      tl.to(
        ".launch-ui",
        {
          opacity: 0,
          scale: 0.8,
          duration: 0.35,
        },
        "<"
      );

      /*
        3.
        Rocket acceleration.
      */

      tl.to(
        launchProgress,
        {
          current: 1,
          duration: 3,
          ease:
            "power4.in",
        },
        "-=0.1"
      );

      /*
        4.
        Camera follows.
      */

      tl.to(
        introProgress,
        {
          current: 1,
          duration: 2.8,
          ease:
            "power3.inOut",
        },
        "<"
      );

      /*
        5.
        Intro disappears.
      */

      tl.to(
        ".intro",
        {
          opacity: 0,
          scale: 1.25,
          filter:
            "blur(25px)",
          duration: 1.3,
          ease:
            "power3.inOut",
        },
        "-=1.2"
      );

      /*
        6.
        Unlock scrolling.
      */

      tl.call(() => {
        setIntroComplete(
          true
        );

        document.body.style.overflow =
          "auto";

        window.scrollTo(
          0,
          0
        );

        requestAnimationFrame(
          () => {
            ScrollTrigger.refresh();
          }
        );
      });
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="page">

      {/* ===================================================
          CANVAS
      =================================================== */}

      <div className="canvas">
        <Canvas
          camera={{
            position: [0, -2, 8],
            fov: isMobile ? 62 : 55,
            near: 0.1,
            far: 100,
          }}
          dpr={isMobile ? [0.75, 1] : [1, 1]}
          performance={{
            min: isMobile ? 0.35 : 0.5,
          }}
          gl={{
            antialias: false,
            powerPreference: "low-power",
          }}
        >
          <Suspense fallback={null}>
            <SpaceScene
              scrollProgress={scrollProgress}
              introProgress={introProgress}
              launchProgress={launchProgress}
              fireworks={fireworks}
              removeFirework={removeFirework}
              isMobile={isMobile}
              onObjectTouch={(position) =>
                spawnFirework(position, undefined, 0.8)
              }
            />
          </Suspense>
        </Canvas>
      </div>

      {/* ===================================================
          INTRO
      =================================================== */}

      {!introComplete && (
        <section className="intro grand-intro">

          <div className="intro-orbit intro-orbit-one" aria-hidden="true" />
          <div className="intro-orbit intro-orbit-two" aria-hidden="true" />
          <div className="intro-glow" aria-hidden="true" />
          <div className="intro-particles" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <span
                key={i}
                style={{
                  left: `${seededRandom(i, 91) * 100}%`,
                  top: `${18 + seededRandom(i, 92) * 64}%`,
                  animationDelay: `${seededRandom(i, 93) * 3}s`,
                  animationDuration: `${2.4 + seededRandom(i, 94) * 2.5}s`,
                }}
              />
            ))}
          </div>

          <div className="intro-content grand-intro-content">

            <div className="eyebrow intro-eyebrow">
              SEPTEMBER 14 · A SPECIAL TRANSMISSION
            </div>

            <div className="birthday-kicker">
              ✦ IT'S YOUR DAY ✦
            </div>

            <div className="birthday-wordmark" aria-label="Happy Birthday">
              <span>HAPPY</span>
              <span>BIRTHDAY</span>
            </div>

            <div className="intro-age-wrap">
              <div className="intro-age">19</div>
              <div className="intro-age-label">YEARS OF MAGIC</div>
            </div>

            <h1 className="intro-name">
              UZMA SADAIN
            </h1>

            <p className="intro-date">
              SEPTEMBER 14
              <span>·</span>
              YOUR 19TH CHAPTER
            </p>

            <p className="intro-small">
              A little universe,
              built for the GOAT.
            </p>

            <button
              className="launch-ui grand-launch"
              onClick={startMission}
              disabled={launched}
            >
              <span>{launched ? "ENTERING YOUR UNIVERSE" : "ENTER THE CELEBRATION"}</span>
              <i>✦</i>
            </button>

            <div className="launch-caption">
              SCROLLING OPENS THE NEXT CHAPTER
            </div>

            <div className="launch-line" />

          </div>

        </section>
      )}

      {/* ===================================================
          EXPERIENCE
      =================================================== */}

      <div
        className="experience"
        style={{
          pointerEvents:
            introComplete
              ? "auto"
              : "none",
        }}
      >

        {/* =================================================
            SLIDE 01
        ================================================= */}

        <section className="slide hero-slide">

          <div className="slide-inner center">

            <div className="mini-label">
              TRANSMISSION 01
            </div>

            <h2 className="hero-title">
              <span>
                19 YEARS
              </span>

              <span className="outline">
                OF MAGIC
              </span>
            </h2>

            <p className="hero-copy">
              Today the universe
              pauses for the GOAT.
            </p>

            <div className="scroll-hint">
              SCROLL TO ENTER
              <span>↓</span>
            </div>

          </div>

        </section>

        {/* =================================================
            SLIDE 02
        ================================================= */}

        <section className="slide chapter-slide">

          <div className="slide-inner">

            <div className="mini-label">
              CHAPTER 01
            </div>

            <h2 className="reveal">
              <span className="kinetic-text">
                Chapter 19:
                The Cosmos Aligns
              </span>
            </h2>

            <p>
              Nineteen isn't just
              another number.

              <br />

              It's the beginning
              of another beautiful
              chapter.
            </p>

          </div>

        </section>

        {/* =================================================
            MEMORY JOURNEY — FIVE PHOTOS
        ================================================= */}

        <section className="slide photo-slide memory-slide" data-memory="01">
          <div className="memory-sequence">
            <div className="memory-stage">
              <div className="memory-orbit" aria-hidden="true" />
              <PhotoCard src="/uzma1.jpg" number="01" title="THE BEGINNING" caption="Every beautiful journey starts with a moment." />
              <div className="memory-zoom" aria-hidden="true" />
            </div>
            <div className="memory-copy">
              <div className="mini-label">MEMORY 01 · THE BEGINNING</div>
              <h2>One moment.<br /><span>Infinite memories.</span></h2>
              <p>Some moments don't need a reason to be special.</p>
              <div className="memory-scroll-mark">KEEP GOING <span>↓</span></div>
            </div>
          </div>
        </section>

        <section className="slide photo-slide memory-slide" data-memory="02">
          <div className="memory-sequence">
            <div className="memory-stage">
              <div className="memory-orbit" aria-hidden="true" />
              <PhotoCard src="/uzma2.jpg" number="02" title="STILL SHINING" caption="Some people naturally bring light wherever they go." />
              <div className="memory-zoom" aria-hidden="true" />
            </div>
            <div className="memory-copy">
              <div className="mini-label">MEMORY 02 · STILL SHINING</div>
              <h2>Keep<br /><span>shining.</span></h2>
              <p>There is something beautiful about watching someone become more themselves every year.</p>
              <div className="memory-scroll-mark">NEXT MEMORY <span>↓</span></div>
            </div>
          </div>
        </section>

        <section className="slide photo-slide memory-slide" data-memory="03">
          <div className="memory-sequence">
            <div className="memory-stage">
              <div className="memory-orbit" aria-hidden="true" />
              <PhotoCard src="/uzma3.jpg" number="03" title="THE LITTLE THINGS" caption="The smallest memories often become the biggest ones." />
              <div className="memory-zoom" aria-hidden="true" />
            </div>
            <div className="memory-copy">
              <div className="mini-label">MEMORY 03 · THE LITTLE THINGS</div>
              <h2>Don't rush<br /><span>the journey.</span></h2>
              <p>There is no perfect timeline.<br />Just keep moving toward the life you want.</p>
              <div className="memory-scroll-mark">NEXT MEMORY <span>↓</span></div>
            </div>
          </div>
        </section>

        <section className="slide photo-slide memory-slide" data-memory="04">
          <div className="memory-sequence">
            <div className="memory-stage">
              <div className="memory-orbit" aria-hidden="true" />
              <PhotoCard src="/uzma4.jpg" number="04" title="ADVENTURE" caption="Here's to every place you haven't discovered yet." />
              <div className="memory-zoom" aria-hidden="true" />
            </div>
            <div className="memory-copy">
              <div className="mini-label">MEMORY 04 · ADVENTURE</div>
              <h2>More<br /><span>adventures.</span></h2>
              <p>May there always be another place to go, another dream to chase, and another reason to smile.</p>
              <div className="memory-scroll-mark">NEXT MEMORY <span>↓</span></div>
            </div>
          </div>
        </section>

        <section className="slide photo-slide memory-slide" data-memory="05">
          <div className="memory-sequence">
            <div className="memory-stage">
              <div className="memory-orbit" aria-hidden="true" />
              <PhotoCard src="/uzma5.jpg" number="05" title="THE NEXT CHAPTER" caption="The best chapters are often the ones we haven't written yet." />
              <div className="memory-zoom" aria-hidden="true" />
            </div>
            <div className="memory-copy">
              <div className="mini-label">MEMORY 05 · THE NEXT CHAPTER</div>
              <h2>And this<br /><span>is only 19.</span></h2>
              <p>Imagine everything waiting for you.</p>
              <div className="memory-scroll-mark">CHAPTER COMPLETE <span>↓</span></div>
            </div>
          </div>
        </section>

        {/* =================================================
            SLIDE 08 — WISHES
        ================================================= */}

        <section className="slide wishes-slide">

          <div className="wishes-container">

            <div className="mini-label">
              CHAPTER 02 · WISHES
            </div>

            <h2>
              Things I wish
              <br />
              <span>for you.</span>
            </h2>

            <p className="wish-intro">
              Tap a card.
              Some wishes deserve
              to be opened slowly.
            </p>

            <div className="wish-grid">

              <WishCard
                number="01"
                title="HAPPY MOMENTS"
                text="I wish this year gives you so many little reasons to smile that you lose count."
              />

              <WishCard
                number="02"
                title="GOOD PEOPLE"
                text="I wish you people who make you laugh until your stomach hurts and who stay for the memories."
              />

              <WishCard
                number="03"
                title="BEAUTIFUL DAYS"
                text="I wish your 19th year is filled with days you wish you could replay just one more time."
              />

              <WishCard
                number="04"
                title="BIG LAUGHS"
                text="I wish there are countless stupid jokes, latenight conversations, and moments that become our favourite memories."
              />

              <WishCard
                number="05"
                title="EVERYTHING GOOD"
                text="I wish the things you quietly hope for find their way to you at exactly the right time."
              />

              <WishCard
                number="06"
                title="ONE MORE WISH"
                text="Most of all, I wish you happiness that feels effortless, genuine, and completely yours."
              />

            </div>

          </div>

        </section>

        <CakeCelebration />

        {/* =================================================
            SLIDE 10 — WISH + FIREWORKS
        ================================================= */}

        <section className="slide interactive-wish-slide">
          <div className={`wish-launch-panel ${wishMessageVisible ? "wish-message-open" : ""}`}>
            <div className="wish-petal petal-one">✽</div>
            <div className="wish-petal petal-two">✽</div>
            <div className="wish-cat">🐈</div>

            <div className="wish-orbit" aria-hidden="true">
              <span className="wish-orbit-ring ring-one" />
              <span className="wish-orbit-ring ring-two" />
              <span className="wish-orbit-ring ring-three" />
              <span className="wish-orbit-core">✦</span>
            </div>

            <div className="mini-label">A PRIVATE LITTLE UNIVERSE</div>
            <h2>MAKE A WISH.</h2>
            <p className="wish-choice-copy">
              Choose what you want this year to hold, then send it into the sky.
            </p>

            <div className="wish-choice-dock" role="group" aria-label="Choose a wish">
              <button
                type="button"
                className={`wish-choice ${selectedWish === "happiness" ? "selected" : ""}`}
                aria-pressed={selectedWish === "happiness"}
                onClick={() => setSelectedWish("happiness")}
              >
                <span>01</span> HAPPINESS
              </button>
              <button
                type="button"
                className={`wish-choice ${selectedWish === "memories" ? "selected" : ""}`}
                aria-pressed={selectedWish === "memories"}
                onClick={() => setSelectedWish("memories")}
              >
                <span>02</span> MEMORIES
              </button>
              <button
                type="button"
                className={`wish-choice ${selectedWish === "dreams" ? "selected" : ""}`}
                aria-pressed={selectedWish === "dreams"}
                onClick={() => setSelectedWish("dreams")}
              >
                <span>03</span> DREAMS
              </button>
            </div>

            <div className="wish-chosen-line" aria-live="polite">
              <span>YOUR WISH</span>
              <strong>{selectedWish === "happiness" ? "MORE HAPPINESS, ALWAYS." : selectedWish === "memories" ? "MORE MOMENTS WORTH KEEPING." : "MORE DREAMS WORTH CHASING."}</strong>
            </div>

            <div className={`wish-capsule ${wishSealed ? "sealed" : ""}`}>
              {!wishSealed ? (
                <>
                  <div className="wish-capsule-label">OR WRITE ONE OF YOUR OWN</div>
                  <div className="wish-capsule-row">
                    <input
                      value={wishText}
                      onChange={(event) => setWishText(event.target.value.slice(0, 72))}
                      placeholder="type a secret wish…"
                      aria-label="Write a secret wish"
                    />
                    <button
                      type="button"
                      className="wish-seal-button"
                      onClick={() => setWishSealed(true)}
                      disabled={!wishText.trim()}
                    >
                      SEAL IT
                    </button>
                  </div>
                </>
              ) : (
                <div className="wish-sealed-note">
                  <span>✦ SEALED FOR THE UNIVERSE</span>
                  <strong>“{wishText.trim()}”</strong>
                  <button type="button" onClick={() => setWishSealed(false)}>EDIT</button>
                </div>
              )}
            </div>

            <button className={`firework-button ${wishSealed ? "wish-ready-button" : ""}`} onClick={makeWish}>
              {wishSealed ? "✦ SEND IT TO THE STARS ✦" : "✦ MAKE MY WISH ✦"}
            </button>

            <div className="wish-wishes" aria-live="polite">
              <div className="wish-wishes-kicker">JUST A FEW THINGS I WISH FOR YOU</div>
              <h3>MORE LAUGHTER.<br /><span>MORE MOMENTS.</span></h3>
              <p>
                I wish you a year full of soft mornings, random laughs,
                beautiful surprises, good people, unforgettable memories,
                and all the little things that make you genuinely happy.
              </p>
              <div className="wish-tags">
                <span>SMILES</span>
                <span>LAUGHTER</span>
                <span>GOOD DAYS</span>
                <span>MEMORIES</span>
              </div>
              <div className="wish-signature">✽ and yes… I wish to see you be maki (ikyk) haha ✽</div>
            </div>
          </div>
        </section>

        {/* =================================================
            SLIDE 10 — INTERACTIVE STAR SKY
        ================================================= */}

        <section className="slide sky-slide">
          <InteractiveSky />
          <div className="sky-cat cat-left" aria-hidden="true">🐈</div>
          <div className="sky-cat cat-right" aria-hidden="true">🐈</div>
          <div className="dandelion dandelion-one" aria-hidden="true">✽</div>
          <div className="dandelion dandelion-two" aria-hidden="true">✽</div>
          <div className="dandelion dandelion-three" aria-hidden="true">✽</div>
          <div className="sky-footer">Touch anywhere · every touch creates a firework</div>
        </section>

        {/* =================================================
            SLIDE 11 — MORE WISHES
        ================================================= */}

        <section className="slide support-slide">
          <div className="support-container wish-wall">
            <div className="mini-label">CHAPTER 03 · MORE WISHES</div>
            <h2>One more thing.<br /><span>Actually… a lot.</span></h2>
            <div className="support-lines">
              <p>I wish you mornings that start with a smile.</p>
              <p>I wish you nights filled with laughter.</p>
              <p>I wish you tiny surprises that become favourite memories.</p>
              <p>I wish you beautiful places, good food, crazy plans and even crazier stories.</p>
              <p className="bright">And I wish you 19 years worth of happiness — and then some more. ♡</p>
            </div>
          </div>
        </section>

        <MakiSection />

        <LetterSection />

        {/* =================================================
            SLIDE 10 — SPECIAL MESSAGE
        ================================================= */}

        <section className="slide message-slide">

          <div className="message-container">

            <div className="mini-label">
              TRANSMISSION 19
            </div>

            <div className="message-big">
              For Uzma.
            </div>

            <p>
              I wish 19 brings you the kind of days
              you remember with a smile.

              <br />
              <br />

              I wish you endless reasons to laugh,
              beautiful surprises, latenight talks,
              unforgettable memories, and people
              who make every ordinary day feel special.

              <br />
              <br />

              Most of all, I just wish you
              a genuinely happy year. ♡
            </p>

          </div>

        </section>

        {/* =================================================
            SLIDE 11 — FINAL
        ================================================= */}

        <section className="slide final-slide">
          <div className="final-flash" aria-hidden="true" />
          <div className="final-firework-rings" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <div className="final-content">
            <div className="final-orbit"><span /><span /><span /></div>
            <div className="mini-label">ONE LAST WISH</div>
            <h2>HAPPY<br /><span>19TH</span></h2>
            <h3>UZMA SADAIN</h3>
            <p>SEPTEMBER 14</p>
            <div className="final-message">
              I hope this year gives you<br />
              more moments than you can count.
              <br /><br />
              More reasons to smile.<br />
              More reasons to laugh.<br />
              More memories to keep.
            </div>
            <div className="final-ikyk">and yes… I wish to see you be a next maki🌚🫠 <span>(ikyk) haha</span> ♡</div>
            <div className="final-end">THIS IS YOUR NIGHT ✦</div>
          </div>
          {finalBurst && (
            <div className="celebration">
              {Array.from({ length: 36 }, (_, i) => (
                <span key={i} style={{
                  "--x": `${seededRandom(i, 21) * 100}%`,
                  "--y": `${seededRandom(i, 22) * 100}%`,
                  "--delay": `${seededRandom(i, 23) * 2}s`,
                } as React.CSSProperties} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ===================================================
          GLOBAL CSS
      =================================================== */}

      <style jsx global>{`

        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap");

        * {
          box-sizing: border-box;
        }

        html {
          background: #03020a;
          scroll-behavior: auto;
        }

        body {
          margin: 0;
          padding: 0;
          background: #03020a;
          color: white;

          font-family:
            "DM Sans",
            "Helvetica Neue",
            Helvetica,
            Arial,
            sans-serif;
        }

        button {
          font-family: inherit;
        }

        h1,
        h2,
        h3,
        .hero-title,
        .final-content h2,
        .message-big {
          font-family:
            "Space Grotesk",
            "DM Sans",
            sans-serif;
          font-weight: 500;
          letter-spacing: -0.035em;
        }

        ::selection {
          background:
            rgba(
              150,
              120,
              255,
              0.35
            );
        }

        /* =================================================
           CANVAS
        ================================================= */

        .canvas {
          position: fixed;
          inset: 0;

          z-index: 1;

          background:
            radial-gradient(
              circle at 50% 55%,
              rgba(
                80,
                55,
                170,
                0.15
              ),
              transparent 42%
            ),

            #03020a;
        }

        .canvas::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 2px;
          height: calc(var(--scroll-progress, 0) * 100vh);
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,.7),
            rgba(156,125,255,.08)
          );
          box-shadow: 0 0 18px rgba(157,124,255,.38);
          opacity: .32;
          pointer-events: none;
        }

        /* =================================================
           INTRO
        ================================================= */

        .intro {
          position: fixed;
          inset: 0;

          z-index: 20;

          display: flex;
          align-items: center;
          justify-content: center;

          text-align: center;

          background:
            radial-gradient(
              circle at 50% 70%,
              rgba(
                100,
                65,
                200,
                0.14
              ),
              transparent 45%
            ),

            #03020a;
        }

        .intro-content {
          width: 100%;
          padding: 30px;
        }

        .eyebrow {
          font-size: 10px;
          letter-spacing: 0.45em;

          opacity: 0.45;

          margin-bottom: 28px;
        }

        .intro-name {
          margin: 0;

          font-size:
            clamp(
              48px,
              9vw,
              150px
            );

          line-height: 0.85;

          font-weight: 500;

          letter-spacing: 0.08em;

          background:
            linear-gradient(
              110deg,
              #ffffff,
              #c2b1ff,
              #71efff,
              #ffffff
            );

          -webkit-background-clip:
            text;

          background-clip: text;

          -webkit-text-fill-color:
            transparent;

          filter:
            drop-shadow(
              0 0 35px
              rgba(
                130,
                100,
                255,
                0.35
              )
            );
        }

        .intro-date {
          margin-top: 32px;

          font-size: 11px;

          letter-spacing: 0.35em;

          opacity: 0.45;
        }

        .intro-date span {
          margin:
            0 10px;
        }

        .intro-small {
          max-width: 400px;

          margin:
            25px auto 0;

          line-height: 1.8;

          font-size: 13px;

          opacity: 0.4;
        }

        .launch-ui {
          margin-top: 55px;

          padding:
            17px 32px;

          border-radius:
            999px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.3
            );

          background:
            rgba(
              255,
              255,
              255,
              0.035
            );

          color: white;

          font-size: 10px;

          letter-spacing: 0.3em;

          cursor: pointer;

          backdrop-filter:
            blur(12px);

          transition:
            transform 0.4s ease,
            background 0.4s ease,
            border 0.4s ease,
            box-shadow 0.4s ease;
        }

        .launch-ui:hover {
          transform:
            translateY(-4px);

          background:
            rgba(
              255,
              255,
              255,
              0.09
            );

          border-color:
            rgba(
              255,
              255,
              255,
              0.7
            );

          box-shadow:
            0 10px 50px
            rgba(
              120,
              100,
              255,
              0.25
            );
        }

        .launch-ui:active {
          transform:
            scale(0.95);
        }

        .launch-line {
          position: absolute;

          bottom: 7%;
          left: 50%;

          width: 1px;
          height: 70px;

          transform:
            translateX(-50%);

          background:
            linear-gradient(
              transparent,
              rgba(
                255,
                255,
                255,
                0.7
              )
            );

          box-shadow:
            0 0 30px
            rgba(
              130,
              110,
              255,
              0.8
            );
        }

        /* =================================================
           GRAND BIRTHDAY INTRO
        ================================================= */
        .grand-intro {
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(circle at 50% 45%, rgba(126, 104, 255, 0.16), transparent 28%),
            radial-gradient(circle at 50% 85%, rgba(82, 220, 255, 0.10), transparent 32%),
            #03020a;
        }

        .grand-intro::before {
          content: "";
          position: absolute;
          inset: 8%;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 50%;
          transform: scaleY(.45);
          box-shadow: 0 0 70px rgba(130,110,255,.08);
          animation: introBreath 6s ease-in-out infinite;
          pointer-events: none;
        }

        .intro-glow {
          position: absolute;
          width: 34vw;
          height: 34vw;
          min-width: 280px;
          min-height: 280px;
          max-width: 600px;
          max-height: 600px;
          left: 50%;
          top: 48%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(153,133,255,.18), rgba(89,222,255,.04) 38%, transparent 70%);
          filter: blur(6px);
          animation: introGlow 5s ease-in-out infinite;
          pointer-events: none;
        }

        .intro-orbit {
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(76vw, 980px);
          height: min(76vw, 980px);
          border: 1px solid rgba(183,170,255,.10);
          border-radius: 50%;
          transform: translate(-50%, -50%) rotateX(68deg) rotateZ(8deg);
          pointer-events: none;
        }

        .intro-orbit::after {
          content: "";
          position: absolute;
          left: 50%;
          top: -3px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 18px rgba(145,225,255,.9);
        }

        .intro-orbit-one { animation: introOrbitA 18s linear infinite; }
        .intro-orbit-two {
          width: min(50vw, 640px);
          height: min(50vw, 640px);
          opacity: .55;
          transform: translate(-50%, -50%) rotateX(70deg) rotateZ(-18deg);
          animation: introOrbitB 13s linear infinite reverse;
        }

        .intro-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .intro-particles span {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(255,255,255,.85);
          box-shadow: 0 0 12px rgba(175,160,255,.8);
          animation: introParticle 3s ease-in-out infinite;
        }

        .grand-intro-content {
          position: relative;
          z-index: 3;
          transform: translateY(-1vh);
        }

        .intro-eyebrow {
          animation: introFadeDown 1s .1s both;
        }

        .birthday-kicker {
          margin-bottom: 16px;
          font-size: 10px;
          letter-spacing: .38em;
          color: rgba(220,214,255,.7);
          animation: introFadeUp 1s .18s both;
        }

        .birthday-wordmark {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin: 0 auto 8px;
          line-height: .78;
          text-transform: uppercase;
          animation: birthdayReveal 1.35s .25s cubic-bezier(.16,1,.3,1) both;
        }

        .birthday-wordmark span:first-child {
          font-size: clamp(34px, 6vw, 82px);
          font-weight: 300;
          letter-spacing: .24em;
          padding-left: .24em;
          color: rgba(255,255,255,.72);
        }

        .birthday-wordmark span:last-child {
          font-size: clamp(56px, 11vw, 150px);
          font-weight: 700;
          letter-spacing: -.04em;
          background: linear-gradient(100deg, #fff 10%, #c4b5ff 40%, #79efff 68%, #fff 92%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 220% 100%;
          animation: birthdayShimmer 6s linear infinite;
        }

        .intro-age-wrap {
          position: relative;
          width: 140px;
          height: 120px;
          margin: 6px auto -2px;
          animation: ageReveal 1.5s .42s cubic-bezier(.16,1,.3,1) both;
        }

        .intro-age {
          position: absolute;
          inset: -22px 0 0;
          font-size: 118px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: -.08em;
          color: rgba(255,255,255,.08);
          -webkit-text-stroke: 1px rgba(202,194,255,.22);
          text-shadow: 0 0 60px rgba(131,112,255,.20);
        }

        .intro-age-label {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          font-size: 8px;
          letter-spacing: .34em;
          color: rgba(255,255,255,.35);
        }

        .grand-intro .intro-name {
          margin-top: 4px;
          animation: nameRevealGrand 1.25s .62s cubic-bezier(.16,1,.3,1) both;
        }

        .grand-intro .intro-date {
          animation: introFadeUp 1s .8s both;
        }

        .grand-intro .intro-small {
          animation: introFadeUp 1s .94s both;
        }

        .grand-launch {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          min-width: 250px;
          justify-content: center;
          animation: launchReveal 1s 1.08s both;
        }

        .grand-launch::before {
          content: "";
          position: absolute;
          top: 0;
          left: -110%;
          width: 75%;
          height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.25), transparent);
          transform: skewX(-20deg);
          animation: buttonShine 4s 2s infinite;
        }

        .grand-launch i {
          font-style: normal;
          animation: launchStar 1.8s ease-in-out infinite;
        }

        .launch-caption {
          margin-top: 13px;
          font-size: 7px;
          letter-spacing: .27em;
          color: rgba(255,255,255,.28);
          animation: introFadeUp 1s 1.25s both;
        }

        @keyframes introBreath {
          0%,100% { transform: scaleY(.45) scale(1); opacity: .7; }
          50% { transform: scaleY(.48) scale(1.03); opacity: 1; }
        }
        @keyframes introGlow {
          0%,100% { transform: translate(-50%,-50%) scale(.92); opacity: .65; }
          50% { transform: translate(-50%,-50%) scale(1.07); opacity: 1; }
        }
        @keyframes introOrbitA {
          from { transform: translate(-50%,-50%) rotateX(68deg) rotateZ(8deg) rotate(0deg); }
          to { transform: translate(-50%,-50%) rotateX(68deg) rotateZ(8deg) rotate(360deg); }
        }
        @keyframes introOrbitB {
          from { transform: translate(-50%,-50%) rotateX(70deg) rotateZ(-18deg) rotate(0deg); }
          to { transform: translate(-50%,-50%) rotateX(70deg) rotateZ(-18deg) rotate(360deg); }
        }
        @keyframes introParticle {
          0%,100% { opacity: .15; transform: translateY(10px) scale(.7); }
          50% { opacity: .9; transform: translateY(-16px) scale(1.25); }
        }
        @keyframes introFadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes introFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes birthdayReveal {
          from { opacity: 0; transform: translateY(35px) scale(.92); filter: blur(12px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes birthdayShimmer {
          from { background-position: 0% 50%; }
          to { background-position: 220% 50%; }
        }
        @keyframes ageReveal {
          from { opacity: 0; transform: scale(.65) translateY(20px); }
          65% { opacity: 1; transform: scale(1.04) translateY(-3px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes nameRevealGrand {
          from { opacity: 0; transform: translateY(32px); letter-spacing: .28em; }
          to { opacity: 1; transform: translateY(0); letter-spacing: .08em; }
        }
        @keyframes launchReveal {
          from { opacity: 0; transform: translateY(20px) scale(.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes buttonShine {
          0%, 45% { left: -110%; }
          62%, 100% { left: 135%; }
        }
        @keyframes launchStar {
          0%,100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(22deg) scale(1.2); }
        }

        /* =================================================
           EXPERIENCE
        ================================================= */

        .experience {
          position: relative;
          z-index: 5;
          pointer-events: none;
          --scroll-progress: 0;
          --ambient-shift: 0px;
          --ambient-tilt: 0deg;
        }

        .experience button,
        .experience .photo-card,
        .experience .wish-card,
        .experience .interactive-sky {
          pointer-events: auto;
        }

        .slide {
          min-height: 100vh;

          display: flex;

          align-items: center;

          padding:
            8vw;

          position: relative;

          overflow: hidden;
          isolation: isolate;
        }

        /* Large ambient words drift with scroll velocity. */
        .slide::before {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: -1;
          width: max-content;
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(120px, 24vw, 420px);
          font-weight: 500;
          line-height: .7;
          letter-spacing: -.08em;
          white-space: nowrap;
          color: rgba(255,255,255,.022);
          transform:
            translate3d(
              calc(-50% + var(--ambient-shift)),
              -50%,
              0
            )
            rotate(var(--ambient-tilt));
          pointer-events: none;
          user-select: none;
        }

        .hero-slide::before { content: "UZMA"; }

        .chapter-slide::before {
          content: "19";
          font-size: clamp(180px, 38vw, 620px);
          color: rgba(157,124,255,.035);
        }

        .photo-slide:nth-of-type(3n)::before { content: "MEMORIES"; }
        .photo-slide:nth-of-type(3n + 1)::before { content: "MOMENTS"; }
        .photo-slide:nth-of-type(3n + 2)::before { content: "UZMA"; }
        .wishes-slide::before { content: "WISH"; }
        .interactive-wish-slide::before {
          content: "✦";
          color: rgba(125,249,255,.04);
        }
        .sky-slide::before { content: "STARS"; }
        .support-slide::before { content: "MORE"; }
        .message-slide::before { content: "ALWAYS"; }
        .final-slide::before {
          content: "19";
          color: rgba(169,140,255,.05);
        }

        .slide > * {
          position: relative;
          z-index: 1;
        }

        .slide-inner {
          width: 100%;
          max-width: 1200px;
          margin: auto;
        }

        .center {
          text-align: center;
        }

        .mini-label {
          font-size: 10px;

          letter-spacing:
            0.4em;

          opacity: 0.4;

          margin-bottom:
            28px;

          background:
            linear-gradient(
              90deg,
              rgba(255,255,255,.35),
              rgba(255,255,255,.95),
              rgba(255,255,255,.35)
            );
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: labelSheen 5.5s ease-in-out infinite;
        }

        @keyframes labelSheen {
          0%, 65%, 100% { background-position: 120% 0; }
          82% { background-position: -20% 0; }
        }

        /* =================================================
           HERO
        ================================================= */

        .hero-slide {
          min-height: 120vh;
        }

        .hero-title {
          margin: 0;

          font-size:
            clamp(
              70px,
              13vw,
              190px
            );

          line-height: 0.78;

          font-weight: 400;

          letter-spacing:
            -0.06em;
        }

        .hero-title span {
          display: block;
        }

        .hero-title .outline {
          color: transparent;

          -webkit-text-stroke:
            1px
            rgba(
              255,
              255,
              255,
              0.45
            );
        }

        .hero-copy {
          max-width: 450px;

          margin:
            50px auto 0;

          line-height: 1.8;

          opacity: 0.5;
        }

        .scroll-hint {
          margin-top:
            100px;

          font-size: 9px;

          letter-spacing:
            0.35em;

          opacity: 0.35;
        }

        .scroll-hint span {
          display: block;

          font-size: 20px;

          margin-top: 15px;
        }

        /* =================================================
           CHAPTER
        ================================================= */

        .chapter-slide {
          min-height: 110vh;
        }

        .chapter-slide h2 {
          max-width: 1000px;

          font-size:
            clamp(
              55px,
              8vw,
              130px
            );

          line-height: 0.88;

          font-weight: 400;

          letter-spacing:
            -0.045em;

          margin: 0;
        }

        .chapter-slide p {
          max-width: 500px;

          margin-top: 45px;

          line-height: 1.9;

          opacity: 0.5;
        }

        .kinetic-text {
          display: inline-block;

          transform-style:
            preserve-3d;
        }

        .kinetic-char {
          display: inline-block;

          transform-style:
            preserve-3d;

          will-change:
            transform,
            opacity;
        }

        /* =================================================
           PHOTO SLIDES
        ================================================= */

        .photo-slide {
          min-height: 110vh;
        }

        .photo-layout {
          width: 100%;

          max-width:
            1250px;

          margin: auto;

          display: grid;

          grid-template-columns:
            1.1fr
            0.9fr;

          gap: 10vw;

          align-items: center;
        }

        .photo-slide.reverse
          .photo-layout {
          grid-template-columns:
            0.9fr
            1.1fr;
        }

        .photo-card {
          position: relative;

          width: min(
            100%,
            560px
          );

          padding: 12px;

          background:
            rgba(
              255,
              255,
              255,
              0.045
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );

          backdrop-filter:
            blur(15px);

          transform-style:
            preserve-3d;

          transform: translate3d(0, var(--scroll-lift, 0px), 0);

          box-shadow:
            0 30px 100px
            rgba(
              0,
              0,
              0,
              0.45
            );

          transition:
            box-shadow 0.5s ease;
        }

        .photo-card:hover {
          box-shadow:
            0 40px 120px
            rgba(
              100,
              70,
              220,
              0.2
            );
        }

        .photo-number {
          position: absolute;

          top: 25px;
          left: 25px;

          z-index: 2;

          font-size: 9px;

          letter-spacing:
            0.3em;

          background:
            rgba(
              0,
              0,
              0,
              0.45
            );

          padding:
            8px 12px;

          backdrop-filter:
            blur(10px);
        }

        .photo-image-wrap {
          position: relative;

          overflow: hidden;

          aspect-ratio:
            4 / 5;

          background:
            #111;
        }

        .photo-image {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;

          --scroll-drift: 0px;
          transform: scale(1.035) translate3d(0, var(--scroll-drift), 0);
          will-change: transform;
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .photo-card:hover
          .photo-image {
          transform:
            scale(1.06) translate3d(0, var(--scroll-drift), 0);
        }

        .photo-shine {
          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              110deg,
              transparent 25%,
              rgba(
                255,
                255,
                255,
                0.14
              ),
              transparent 65%
            );

          transform:
            translateX(
              -120%
            );

          transition:
            transform 1s ease;

          pointer-events:
            none;
        }

        .photo-card:hover
          .photo-shine {
          transform:
            translateX(
              120%
            );
        }

        .photo-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background:
            linear-gradient(
              125deg,
              transparent 20%,
              rgba(255,255,255,.08) 46%,
              transparent 62%
            );
          transform: translate3d(
            calc(var(--ambient-shift) * .45),
            0,
            0
          );
          opacity: .18;
          mix-blend-mode: screen;
        }

        .photo-info {
          padding:
            20px 10px
            10px;
        }

        .photo-title {
          font-size: 11px;

          letter-spacing:
            0.25em;
        }

        .photo-caption {
          margin-top:
            8px;

          font-size: 11px;

          line-height:
            1.7;

          opacity: 0.4;
        }

        .photo-side-text h2 {
          margin: 0;

          font-size:
            clamp(
              45px,
              6vw,
              95px
            );

          line-height: 0.9;

          font-weight: 400;

          letter-spacing:
            -0.045em;
        }

        .photo-side-text p {
          max-width: 400px;

          margin-top:
            35px;

          line-height: 1.9;

          opacity: 0.5;
        }

        /* =================================================
           WISHES
        ================================================= */

        .wishes-slide {
          min-height:
            130vh;

          align-items:
            flex-start;
        }

        .wishes-container {
          width: 100%;

          max-width:
            1150px;

          margin:
            0 auto;
        }

        .wishes-container h2 {
          margin: 0;

          font-size:
            clamp(
              60px,
              9vw,
              140px
            );

          line-height: 0.82;

          font-weight: 400;

          letter-spacing:
            -0.06em;
        }

        .wishes-container h2 span {
          color: transparent;

          -webkit-text-stroke:
            1px
            rgba(
              255,
              255,
              255,
              0.4
            );
        }

        .wish-intro {
          margin:
            40px 0;

          max-width:
            400px;

          line-height: 1.8;

          opacity: 0.45;
        }

        .wish-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              1fr
            );

          gap: 12px;

          margin-top:
            60px;
        }

        .wish-card {
          position: relative;

          min-height:
            190px;

          padding:
            28px;

          text-align:
            left;

          color: white;

          background:
            rgba(
              255,
              255,
              255,
              0.035
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          cursor: pointer;

          transition:
            background 0.5s ease,
            border 0.5s ease,
            transform 0.5s
              cubic-bezier(
                0.16,
                1,
                0.3,
                1
              );
        }

        .wish-card:hover {
          transform:
            translateY(-5px);

          background:
            rgba(
              255,
              255,
              255,
              0.07
            );
        }

        .wish-active {
          background:
            rgba(
              120,
              90,
              220,
              0.12
            );

          border-color:
            rgba(
              180,
              150,
              255,
              0.4
            );
        }

        .wish-number {
          display: block;

          font-size: 9px;

          letter-spacing:
            0.3em;

          opacity: 0.4;
        }

        .wish-title {
          display: block;

          margin-top:
            30px;

          font-size: 13px;

          letter-spacing:
            0.25em;
        }

        .wish-text {
          display: block;

          max-width:
            430px;

          margin-top:
            15px;

          font-size: 12px;

          line-height: 1.8;

          opacity: 0;

          max-height: 0;

          overflow: hidden;

          transition:
            opacity 0.5s ease,
            max-height 0.7s ease;
        }

        .wish-active
          .wish-text {
          opacity: 0.65;

          max-height:
            150px;
        }

        .wish-arrow {
          position: absolute;

          top: 28px;
          right: 28px;

          font-size: 20px;

          font-weight: 200;

          opacity: 0.5;
        }

        /* =================================================
           SUPPORT
        ================================================= */

        .support-container {
          width: 100%;

          max-width:
            1050px;

          margin: auto;
        }

        .support-container h2 {
          margin: 0;

          font-size:
            clamp(
              60px,
              9vw,
              140px
            );

          line-height: 0.8;

          font-weight: 400;

          letter-spacing:
            -0.06em;
        }

        .support-lines {
          max-width:
            600px;

          margin-top:
            70px;

          margin-left:
            auto;
        }

        .support-lines p {
          margin: 0;

          padding:
            25px 0;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          font-size:
            clamp(
              18px,
              2.5vw,
              30px
            );

          line-height:
            1.4;

          opacity: 0.55;

          transition:
            opacity 0.4s ease,
            transform 0.4s ease;
        }

        .support-lines p:hover {
          opacity: 1;

          transform:
            translateX(
              -10px
            );
        }

        .support-lines
          .bright {
          color: #cfc1ff;

          opacity: 1;

          border-bottom:
            0;
        }

        /* =================================================
           MESSAGE
        ================================================= */

        .message-slide {
          min-height:
            120vh;

          justify-content:
            center;
        }

        .message-container {
          max-width:
            900px;

          margin: auto;
        }

        .message-big {
          font-size:
            clamp(
              70px,
              12vw,
              170px
            );

          line-height: 0.8;

          letter-spacing:
            -0.07em;

          margin-bottom:
            70px;
        }

        .message-container p {
          max-width:
            620px;

          margin-left:
            auto;

          font-size:
            clamp(
              18px,
              2.2vw,
              28px
            );

          line-height:
            1.6;

          opacity: 0.65;
        }

        /* =================================================
           FINAL
        ================================================= */

        .final-slide {
          min-height:
            130vh;

          justify-content:
            center;

          text-align:
            center;
        }

        .final-content {
          position: relative;

          z-index: 5;

          width: 100%;
        }

        .final-content h2 {
          margin: 0;

          font-size:
            clamp(
              90px,
              16vw,
              240px
            );

          line-height:
            0.72;

          font-weight: 400;

          letter-spacing:
            -0.08em;
        }

        .final-content h2 span {
          color: transparent;

          -webkit-text-stroke:
            1px
            rgba(
              255,
              255,
              255,
              0.55
            );
        }

        .final-content h3 {
          margin:
            50px 0 0;

          font-size:
            clamp(
              25px,
              5vw,
              70px
            );

          font-weight:
            300;

          letter-spacing:
            0.05em;
        }

        .final-content > p {
          margin-top:
            25px;

          font-size: 10px;

          letter-spacing:
            0.4em;

          opacity: 0.45;
        }

        .final-message {
          margin:
            60px auto 0;

          max-width:
            400px;

          font-size:
            16px;

          line-height:
            1.8;

          opacity: 0.55;
        }

        .final-end {
          margin-top:
            100px;

          font-size: 9px;

          letter-spacing:
            0.45em;

          opacity: 0.3;
        }

        /* =================================================
           ORBIT
        ================================================= */

        .final-orbit {
          position: absolute;

          width:
            min(
              75vw,
              800px
            );

          height:
            min(
              75vw,
              800px
            );

          border:
            1px solid
            rgba(
              180,
              150,
              255,
              0.12
            );

          border-radius:
            50%;

          left: 50%;
          top: 50%;

          transform:
            translate(
              -50%,
              -50%
            );

          pointer-events:
            none;

          animation:
            orbitSpin
            30s
            linear
            infinite;
        }

        .final-orbit::before {
          content: "";

          position: absolute;

          inset: 15%;

          border:
            1px solid
            rgba(
              100,
              230,
              255,
              0.08
            );

          border-radius:
            50%;
        }

        .final-orbit span {
          position: absolute;

          width: 5px;
          height: 5px;

          border-radius: 50%;

          background:
            #c7b5ff;

          box-shadow:
            0 0 20px
            #9d82ff;
        }

        .final-orbit
          span:nth-child(1) {
          top: 0;
          left: 50%;
        }

        .final-orbit
          span:nth-child(2) {
          bottom: 15%;
          right: 5%;
        }

        .final-orbit
          span:nth-child(3) {
          left: 10%;
          bottom: 20%;
        }

        @keyframes orbitSpin {
          from {
            transform:
              translate(
                -50%,
                -50%
              )
              rotate(0deg);
          }

          to {
            transform:
              translate(
                -50%,
                -50%
              )
              rotate(360deg);
          }
        }

        /* =================================================
           CELEBRATION
        ================================================= */

        .celebration {
          position: absolute;

          inset: 0;

          pointer-events:
            none;

          overflow:
            hidden;
        }

        .celebration span {
          position: absolute;

          left:
            var(--x);

          top:
            var(--y);

          width: 4px;
          height: 4px;

          border-radius: 50%;

          background:
            #ffffff;

          box-shadow:
            0 0 15px
            #a98cff;

          animation:
            celebrationFloat
            3s
            ease-in-out
            infinite;

          animation-delay:
            var(--delay);
        }

        @keyframes celebrationFloat {
          0% {
            transform:
              translateY(
                40px
              )
              scale(0);

            opacity: 0;
          }

          30% {
            opacity: 1;
          }

          70% {
            opacity: 0.8;
          }

          100% {
            transform:
              translateY(
                -100px
              )
              scale(1.5);

            opacity: 0;
          }
        }


        /* =================================================
           INTERACTIVE FIREWORK SLIDES
        ================================================= */

        .interactive-wish-slide {
          justify-content: center;
          text-align: center;
          min-height: 115vh;
        }

        .wish-launch-panel {
          position: relative;
          z-index: 20;
          width: min(560px, 100%);
          padding: 55px 40px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(8,7,22,0.48);
          backdrop-filter: blur(18px);
          box-shadow: 0 30px 100px rgba(0,0,0,0.35);
        }

        .wish-launch-panel h2 {
          margin: 20px 0 15px;
          font-size: clamp(55px, 9vw, 120px);
          line-height: .82;
          letter-spacing: -.07em;
          font-weight: 400;
        }

        .wish-launch-panel p {
          margin: 0 auto;
          max-width: 400px;
          line-height: 1.8;
          opacity: .55;
        }

        .firework-button {
          margin-top: 35px;
          padding: 18px 28px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.35);
          background: rgba(255,255,255,.06);
          color: white;
          cursor: pointer;
          font-size: 10px;
          letter-spacing: .24em;
          transition: transform .3s ease, background .3s ease, box-shadow .3s ease;
          touch-action: manipulation;
        }

        .firework-button:hover {
          transform: translateY(-4px) scale(1.03);
          background: rgba(255,255,255,.12);
          box-shadow: 0 0 50px rgba(160,130,255,.3);
        }

        .firework-button:active {
          transform: scale(.96);
        }

        .wish-orbit {
          position: relative;
          width: 118px;
          height: 118px;
          margin: 0 auto -2px;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .wish-orbit-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 100%;
          height: 100%;
          border: 1px solid rgba(190, 170, 255, .16);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: wishOrbitSpin 12s linear infinite;
        }

        .wish-orbit-ring::after {
          content: "";
          position: absolute;
          left: 8%;
          top: 50%;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 14px rgba(190, 170, 255, .8);
        }

        .ring-two {
          width: 76%;
          height: 76%;
          animation-duration: 8s;
          animation-direction: reverse;
          border-color: rgba(125, 249, 255, .12);
        }

        .ring-three {
          width: 54%;
          height: 54%;
          animation-duration: 6s;
          border-color: rgba(255, 143, 221, .13);
        }

        .wish-orbit-core {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          color: white;
          font-size: 12px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.18);
          box-shadow: 0 0 32px rgba(169, 140, 255, .22);
          animation: wishCorePulse 3s ease-in-out infinite;
        }

        .wish-choice-dock {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 24px;
        }

        .wish-choice {
          appearance: none;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.58);
          padding: 9px 11px;
          font-size: 8px;
          letter-spacing: .16em;
          cursor: pointer;
          transition: transform .35s cubic-bezier(.16,1,.3,1), border-color .35s ease, color .35s ease, background .35s ease;
        }

        .wish-choice span {
          opacity: .35;
          margin-right: 6px;
        }

        .wish-choice:hover,
        .wish-choice.selected {
          color: white;
          border-color: rgba(185, 162, 255, .42);
          background: rgba(145, 115, 255, .08);
          transform: translateY(-2px);
        }

        .wish-chosen-line {
          margin: 20px auto 0;
          display: grid;
          gap: 8px;
          min-height: 34px;
        }

        .wish-chosen-line span {
          font-size: 8px;
          letter-spacing: .32em;
          opacity: .28;
        }

        .wish-chosen-line strong {
          font-size: 11px;
          letter-spacing: .12em;
          font-weight: 400;
          color: rgba(255,255,255,.82);
          animation: wishChosenIn .45s ease both;
        }

        @keyframes wishOrbitSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes wishCorePulse {
          0%,100% { transform: scale(.92); opacity: .7; }
          50% { transform: scale(1.12); opacity: 1; }
        }

        @keyframes wishChosenIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .wish-choice-copy {
          min-height: 3.6em;
        }

        .wish-capsule {
          width: min(500px, 100%);
          margin: 28px auto 0;
          padding: 14px;
          border: 1px solid rgba(255,255,255,.09);
          background: rgba(255,255,255,.018);
          transition: border-color .5s ease, background .5s ease, box-shadow .5s ease;
        }

        .wish-capsule.sealed {
          border-color: rgba(184,162,255,.3);
          background: rgba(145,115,255,.05);
          box-shadow: 0 0 45px rgba(145,115,255,.08);
        }

        .wish-capsule-label {
          font-size: 8px;
          letter-spacing: .24em;
          opacity: .3;
          margin-bottom: 10px;
        }

        .wish-capsule-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .wish-capsule-row input {
          width: 100%;
          min-width: 0;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(0,0,0,.16);
          color: white;
          padding: 12px 13px;
          outline: none;
          font: inherit;
          font-size: 11px;
          letter-spacing: .03em;
        }

        .wish-capsule-row input:focus {
          border-color: rgba(185,162,255,.45);
          box-shadow: 0 0 24px rgba(185,162,255,.08);
        }

        .wish-capsule-row input::placeholder { color: rgba(255,255,255,.25); }

        .wish-seal-button {
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.05);
          color: rgba(255,255,255,.75);
          padding: 0 14px;
          font-size: 8px;
          letter-spacing: .15em;
          cursor: pointer;
          transition: all .35s ease;
        }

        .wish-seal-button:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,.32);
          background: rgba(255,255,255,.1);
        }

        .wish-seal-button:disabled { opacity: .22; cursor: not-allowed; }

        .wish-sealed-note {
          display: grid;
          gap: 10px;
          text-align: left;
          animation: wishSealIn .65s cubic-bezier(.16,1,.3,1) both;
        }

        .wish-sealed-note > span { font-size: 8px; letter-spacing: .22em; color: rgba(255,230,130,.68); }
        .wish-sealed-note strong { font-size: 13px; line-height: 1.5; font-weight: 400; color: rgba(255,255,255,.9); }
        .wish-sealed-note button { justify-self: start; border: 0; background: none; color: rgba(255,255,255,.28); padding: 0; font-size: 7px; letter-spacing: .18em; cursor: pointer; }

        @keyframes wishSealIn {
          from { opacity: 0; transform: translateY(12px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .wish-ready-button {
          animation: wishReadyPulse 1.8s ease-in-out infinite;
        }

        @keyframes wishReadyPulse {
          0%,100% { box-shadow: 0 0 0 rgba(169,140,255,0); }
          50% { box-shadow: 0 0 34px rgba(169,140,255,.22); }
        }

        .wish-petal {
          position: absolute;
          color: rgba(255, 230, 130, .65);
          font-size: 32px;
          pointer-events: none;
          animation: dandelionDrift 5s ease-in-out infinite;
        }

        .petal-one {
          left: 8%;
          top: 14%;
          animation-delay: -1s;
        }

        .petal-two {
          right: 9%;
          bottom: 18%;
          font-size: 22px;
          animation-delay: -3s;
        }

        .wish-cat {
          position: absolute;
          right: 7%;
          top: 8%;
          font-size: 30px;
          filter: grayscale(1) brightness(1.8);
          opacity: .55;
          pointer-events: none;
          animation: catFloat 4s ease-in-out infinite;
        }

        .wish-wishes {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateY(18px);
          transition: max-height 1s ease, opacity .8s ease, transform .8s ease;
          margin-top: 0;
        }

        .wish-message-open .wish-wishes {
          max-height: 520px;
          opacity: 1;
          transform: translateY(0);
          margin-top: 42px;
        }

        .wish-wishes-kicker {
          font-size: 9px;
          letter-spacing: .28em;
          opacity: .42;
          margin-bottom: 16px;
        }

        .wish-wishes h3 {
          margin: 0;
          font-size: clamp(30px, 4vw, 52px);
          line-height: .92;
          letter-spacing: -.05em;
          font-weight: 400;
        }

        .wish-wishes h3 span {
          color: transparent;
          -webkit-text-stroke: 1px rgba(255,255,255,.48);
        }

        .wish-wishes p {
          margin-top: 22px;
          max-width: 470px;
          font-size: 12px;
          line-height: 1.8;
          opacity: .62;
        }

        .wish-tags {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 24px;
        }

        .wish-tags span {
          padding: 8px 11px;
          border: 1px solid rgba(255, 255, 255, .14);
          background: rgba(255, 255, 255, .035);
          font-size: 8px;
          letter-spacing: .18em;
          opacity: .75;
        }

        .wish-signature {
          margin-top: 22px;
          font-size: 10px;
          letter-spacing: .12em;
          color: rgba(255, 230, 130, .7);
        }

        @keyframes dandelionDrift {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: .35; }
          50% { transform: translate3d(14px, -18px, 0) rotate(18deg); opacity: .8; }
        }

        @keyframes catFloat {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }

        .sky-slide {
          min-height: 125vh;
          padding: 0;
          position: relative;
          z-index: 40;
        }

        .interactive-sky {
          position: absolute;
          inset: 0;
          z-index: 30;
          overflow: hidden;
          cursor: crosshair;
          touch-action: manipulation;
          background:
            radial-gradient(circle at 50% 50%, rgba(70,70,170,.16), transparent 45%),
            radial-gradient(circle at 20% 30%, rgba(180,80,190,.08), transparent 35%),
            rgba(1, 2, 9, 0.35);
        }

        .sky-message {
          position: absolute;
          z-index: 5;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
          width: 90%;
        }

        .sky-message span {
          display: block;
          margin-bottom: 15px;
          font-size: 10px;
          letter-spacing: .35em;
          opacity: .5;
        }

        .sky-message strong {
          display: block;
          font-size: clamp(38px, 7vw, 95px);
          line-height: .85;
          letter-spacing: -.07em;
          font-weight: 400;
        }

        .sky-message small {
          display: block;
          margin-top: 25px;
          font-size: 10px;
          letter-spacing: .16em;
          opacity: .4;
        }

        .css-star {
          position: absolute;
          display: block;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 7px #fff, 0 0 16px rgba(130,180,255,.8);
          animation: skyTwinkle infinite ease-in-out;
          pointer-events: none;
        }

        @keyframes skyTwinkle {
          0%,100% { opacity: .15; transform: scale(.7); }
          50% { opacity: 1; transform: scale(1.35); }
        }

        .sky-cat,
        .dandelion {
          position: absolute;
          z-index: 35;
          pointer-events: none;
        }

        .sky-cat {
          font-size: 30px;
          opacity: .35;
          filter: grayscale(1) brightness(1.8);
          animation: catFloat 5s ease-in-out infinite;
        }

        .cat-left {
          left: 8%;
          bottom: 22%;
        }

        .cat-right {
          right: 8%;
          top: 18%;
          animation-delay: -2.2s;
        }

        .dandelion {
          color: rgba(255, 235, 155, .7);
          font-size: 34px;
          opacity: .5;
          animation: dandelionDrift 6s ease-in-out infinite;
        }

        .dandelion-one { left: 17%; top: 18%; }
        .dandelion-two { right: 18%; bottom: 20%; font-size: 25px; animation-delay: -2s; }
        .dandelion-three { left: 48%; bottom: 12%; font-size: 20px; animation-delay: -4s; }

        .sky-footer {
          position: absolute;
          z-index: 40;
          bottom: 35px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 8px;
          letter-spacing: .22em;
          opacity: .3;
          pointer-events: none;
        }

        .touch-fireworks {
          position: absolute;
          inset: 0;
          z-index: 45;
          pointer-events: none;
          overflow: hidden;
        }

        .touch-burst {
          position: absolute;
          width: 1px;
          height: 1px;
          pointer-events: none;
        }

        .touch-burst-core {
          position: absolute;
          width: 7px;
          height: 7px;
          left: -3.5px;
          top: -3.5px;
          border-radius: 50%;
          background: var(--burst-color);
          box-shadow: 0 0 12px var(--burst-color), 0 0 28px var(--burst-color);
          animation: touchCore .5s ease-out forwards;
        }

        .touch-burst-ring {
          position: absolute;
          left: -10px;
          top: -10px;
          width: 20px;
          height: 20px;
          border: 1px solid var(--burst-color);
          border-radius: 50%;
          opacity: .8;
          animation: touchRing .85s cubic-bezier(.15,.75,.2,1) forwards;
        }

        .touch-burst i {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--particle-size);
          height: var(--particle-size);
          margin-left: calc(var(--particle-size) * -0.5);
          margin-top: calc(var(--particle-size) * -0.5);
          border-radius: 50%;
          background: var(--particle-color);
          box-shadow:
            0 0 4px var(--particle-color),
            0 0 9px var(--particle-color),
            0 0 18px color-mix(in srgb, var(--particle-color) 75%, transparent);
          transform: rotate(var(--angle)) translateY(0) scale(.3);
          animation: touchParticle .95s cubic-bezier(.08,.72,.18,1) var(--delay) forwards;
        }

        .touch-burst i::before,
        .touch-burst i::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 1px;
          height: 9px;
          margin-left: -0.5px;
          margin-top: -4.5px;
          border-radius: 999px;
          background: var(--particle-color);
          box-shadow: 0 0 6px var(--particle-color);
          opacity: .9;
        }

        .touch-burst i::after {
          transform: rotate(90deg);
        }

        @keyframes touchCore {
          0% { transform: scale(.6); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }

        @keyframes touchRing {
          0% { transform: scale(.2); opacity: .9; }
          100% { transform: scale(5.8); opacity: 0; }
        }

        @keyframes touchParticle {
          0% { opacity: 0; transform: rotate(var(--angle)) translateY(0) scale(.25); }
          12% { opacity: 1; transform: rotate(var(--angle)) translateY(calc(var(--distance) * -0.12)) scale(1); }
          72% { opacity: 1; transform: rotate(var(--angle)) translateY(calc(var(--distance) * -0.78)) scale(.92); }
          100% { opacity: 0; transform: rotate(var(--angle)) translateY(calc(var(--distance) * -1)) scale(.35); }
        }


        /* =================================================
           BIRTHDAY CAKE CELEBRATION
        ================================================= */
        .cake-celebration-slide {
          position: relative;
          min-height: 180vh;
          overflow: hidden;
          justify-content: flex-start;
          align-items: center;
          text-align: center;
          background:
            radial-gradient(circle at 50% 44%, rgba(150,110,255,.13), transparent 26%),
            radial-gradient(circle at 20% 70%, rgba(125,249,255,.05), transparent 25%),
            #03020a;
        }
        .cake-bg-word {
          position: absolute;
          left: 50%;
          top: 36%;
          transform: translate(-50%,-50%);
          font-size: clamp(90px,18vw,270px);
          letter-spacing: -.09em;
          color: rgba(255,255,255,.025);
          white-space: nowrap;
          pointer-events: none;
          transition: transform 2.2s cubic-bezier(.16,1,.3,1), opacity 1.8s ease;
        }
        .cake-entered .cake-bg-word { transform: translate(-50%,-50%) scale(1.08); opacity: .78; }
        .cake-stage {
          position: relative;
          z-index: 4;
          width: min(88vw, 620px);
          height: min(72vw, 460px);
          margin: 10vh auto 0;
        }
        .cake-piece,
        .cake-assembled,
        .cake-shadow { position: absolute; left: 50%; top: 50%; }
        .cake-piece {
          width: 104px;
          height: 66px;
          border-radius: 16px 16px 10px 10px;
          background: linear-gradient(180deg,#ffe8f4 0%,#f3b9d5 48%,#bf7cac 100%);
          border: 1px solid rgba(255,255,255,.22);
          box-shadow: 0 10px 38px rgba(255,140,220,.12);
          opacity: 0;
          transform: translate(-50%,-50%) scale(.55) rotate(0deg);
        }
        .piece-one { --fx:-260px; --fy:-150px; --fr:-24deg; }
        .piece-two { --fx:250px; --fy:-165px; --fr:20deg; }
        .piece-three { --fx:-290px; --fy:70px; --fr:-14deg; }
        .piece-four { --fx:280px; --fy:75px; --fr:15deg; }
        .piece-five { --fx:-170px; --fy:185px; --fr:-9deg; }
        .piece-six { --fx:170px; --fy:190px; --fr:8deg; }
        .cake-entered .cake-piece { animation: cakePieceAssemble 2.2s cubic-bezier(.16,1,.3,1) forwards; }
        .cake-entered .piece-two { animation-delay:.08s; }
        .cake-entered .piece-three { animation-delay:.16s; }
        .cake-entered .piece-four { animation-delay:.24s; }
        .cake-entered .piece-five { animation-delay:.32s; }
        .cake-entered .piece-six { animation-delay:.4s; }
        @keyframes cakePieceAssemble {
          0% { opacity: 0; transform: translate(calc(-50% + var(--fx)), calc(-50% + var(--fy))) scale(.55) rotate(var(--fr)); }
          22% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(.9) rotate(0); }
        }
        .cake-assembled {
          width: min(80vw, 600px);
          height: min(58vw, 370px);
          transform: translate(-50%,-44%) scale(.72);
          opacity: 0;
        }
        .cake-entered .cake-assembled {
          opacity: 1;
          animation: cakeBuild 2.4s 1.1s cubic-bezier(.16,1,.3,1) forwards;
        }
        @keyframes cakeBuild {
          0% { opacity: 0; transform: translate(-50%,-44%) scale(.68) translateY(42px); }
          65% { opacity: 1; transform: translate(-50%,-44%) scale(1.03) translateY(-3px); }
          100% { opacity: 1; transform: translate(-50%,-44%) scale(1) translateY(0); }
        }
        .cake-layer { position:absolute; left:50%; transform:translateX(-50%); border-radius:18px; }
        .cake-layer-top { top:12%; width:58%; height:23%; background:linear-gradient(180deg,#f6c5df,#c986ae); }
        .cake-layer-mid { top:31%; width:76%; height:26%; background:linear-gradient(180deg,#d78fb8,#aa6d9f); }
        .cake-layer-bottom { top:54%; width:92%; height:29%; background:linear-gradient(180deg,#b978a8,#7c537f); }
        .cake-frosting { position:absolute; left:50%; transform:translateX(-50%); height:16px; border-radius:999px; background:#fff1f8; box-shadow:0 0 20px rgba(255,255,255,.2); }
        .frosting-one { top:38%; width:68%; }
        .frosting-two { top:62%; width:84%; }
        .cake-candle { position:absolute; left:50%; top:-6%; transform:translateX(-50%); width:34px; height:92px; }
        .candle-body { position:absolute; left:50%; bottom:0; transform:translateX(-50%); width:24px; height:72px; border-radius:5px; background:linear-gradient(90deg,#fff,#f3d7ff 50%,#c39ae6); }
        .candle-flame { position:absolute; left:50%; top:-18px; width:22px; height:36px; transform:translateX(-50%) scale(.65); border-radius:60% 40% 60% 40%; background:radial-gradient(circle at 50% 68%,#fff 0 18%,#ffb46c 36%,#ff70d6 70%,transparent 71%); filter:drop-shadow(0 0 13px rgba(255,150,210,.9)); opacity:.35; animation:candleFlicker 1s ease-in-out infinite; }
        @keyframes candleFlicker { 50%{ transform:translateX(-50%) scale(.82) rotate(-4deg); } }
        .cake-top-glow { position:absolute; left:50%; top:-14%; width:120px; height:120px; transform:translateX(-50%); border-radius:50%; background:rgba(255,154,217,.08); filter:blur(20px); }
        .cake-shadow { width:56%; height:16px; margin-top:112px; border-radius:50%; background:rgba(0,0,0,.35); transform:translateX(-50%); opacity:0; }
        .cake-entered .cake-shadow { opacity:1; animation:shadowIn 1.6s 1.5s ease forwards; }
        @keyframes shadowIn { from{transform:translateX(-50%) scale(.6);opacity:0} to{transform:translateX(-50%) scale(1);opacity:1} }
        .cake-light-ui { position:relative; z-index:10; margin-top:1vh; opacity:0; transform:translateY(30px); transition:opacity .8s ease, transform .8s ease; }
        .cake-light-ui.is-ready { opacity:1; transform:translateY(0); }
        .cake-ready-text { font-size:9px; letter-spacing:.36em; opacity:.4; margin-bottom:18px; }
        .light-cake-button { min-width:240px; padding:16px 22px; border-radius:999px; border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.03); color:#fff; font:inherit; font-size:10px; letter-spacing:.24em; cursor:pointer; transition:transform .35s ease, background .35s ease, box-shadow .35s ease, border-color .35s ease; }
        .light-cake-button:disabled { opacity:.26; cursor:default; }
        .light-cake-button:not(:disabled) { animation:lightPulse 1.8s ease-in-out infinite; }
        .light-cake-button:not(:disabled):hover { transform:translateY(-2px) scale(1.02); background:rgba(255,255,255,.08); box-shadow:0 0 30px rgba(211,172,255,.2); }
        @keyframes lightPulse { 50%{box-shadow:0 0 36px rgba(211,172,255,.12);} }
        .cake-sky-celebration { position:absolute; inset:0; z-index:16; background:radial-gradient(circle at center, rgba(91,61,179,.22), transparent 42%),linear-gradient(180deg,rgba(3,2,10,.2),rgba(3,2,10,.92)); animation:skyReveal 1.4s ease forwards; }
        @keyframes skyReveal { from{opacity:0;transform:scale(1.05)} to{opacity:1;transform:scale(1)} }
        .cake-celebration-wash { position:absolute; inset:0; background:radial-gradient(circle at center, rgba(255,255,255,.11), transparent 22%); animation:washPulse 3.4s ease-in-out infinite; }
        @keyframes washPulse { 50%{opacity:.5;transform:scale(1.12)} }
        .cake-celebration-title { position:absolute; left:50%; top:24%; transform:translate(-50%,-50%); z-index:40; text-align:center; width:92%; animation:bdayTitleIn 1.8s cubic-bezier(.16,1,.3,1) .3s both; text-shadow:0 0 28px rgba(255,171,224,.18); }
        @keyframes bdayTitleIn { from{opacity:0;transform:translate(-50%,-50%) scale(.78);letter-spacing:-.08em} to{opacity:1;transform:translate(-50%,-50%) scale(1);letter-spacing:normal} }
        .cake-celebration-small { font-size:9px; letter-spacing:.35em; opacity:.45; margin-bottom:28px; }
        .cake-celebration-title h3 { margin:0; font-size:clamp(52px,10vw,132px); line-height:.72; font-weight:400; letter-spacing:-.08em; }
        .cake-celebration-title h3 span { color:transparent; -webkit-text-stroke:1px rgba(255,255,255,.62); }
        .cake-celebration-name { margin-top:20px; font-size:clamp(20px,4vw,46px); letter-spacing:.2em; }
        .sky-firework { position:absolute; width:10px; height:10px; left:var(--fx); top:var(--fy); transform:translate(-50%,-50%); opacity:0; }
        .fw-one { --fx:12%; --fy:25%; animation:fwBurst 3.6s .25s ease-out infinite; }
        .fw-two { --fx:28%; --fy:18%; animation:fwBurst 3.6s .65s ease-out infinite; }
        .fw-three { --fx:50%; --fy:13%; animation:fwBurst 3.6s 1.05s ease-out infinite; }
        .fw-four { --fx:72%; --fy:18%; animation:fwBurst 3.6s 1.45s ease-out infinite; }
        .fw-five { --fx:89%; --fy:27%; animation:fwBurst 3.6s 1.85s ease-out infinite; }
        .fw-six { --fx:18%; --fy:43%; animation:fwBurst 3.6s 2.25s ease-out infinite; }
        .fw-seven { --fx:82%; --fy:43%; animation:fwBurst 3.6s 2.65s ease-out infinite; }
        .fw-eight { --fx:31%; --fy:57%; animation:fwBurst 3.6s 3.05s ease-out infinite; }
        .fw-nine { --fx:69%; --fy:56%; animation:fwBurst 3.6s 3.35s ease-out infinite; }
        .fw-ten { --fx:8%; --fy:67%; animation:fwBurst 3.6s 3.65s ease-out infinite; }
        .fw-eleven { --fx:92%; --fy:66%; animation:fwBurst 3.6s 3.95s ease-out infinite; }
        .fw-twelve { --fx:50%; --fy:43%; animation:fwBurst 3.6s 4.25s ease-out infinite; }
        .sky-firework::before, .sky-firework::after, .sky-firework i, .sky-firework b, .sky-firework em { content:""; position:absolute; left:0; top:0; width:2px; height:2px; border-radius:50%; background:#fff; box-shadow:0 0 9px #fff; }
        .sky-firework i { transform:rotate(0deg) translateY(-56px); }
        .sky-firework b { transform:rotate(45deg) translateY(-46px); }
        .sky-firework em { transform:rotate(90deg) translateY(-54px); }
        .sky-firework::after { transform:rotate(135deg) translateY(-46px); }
        .sky-firework::before { transform:scale(1.8); }
        @keyframes fwBurst { 0%,12%{opacity:0;transform:translate(-50%,-50%) scale(.15)} 22%{opacity:1} 46%{opacity:.9;transform:translate(-50%,-50%) scale(1)} 72%{opacity:.1} 100%{opacity:0;transform:translate(-50%,-50%) scale(1.15)} }
        .cake-balloons { position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:12; }
        .cake-balloon {
          --balloon-x: 50%;
          --balloon-delay: 0s;
          --balloon-scale: 1;
          --balloon-drift: 0px;
          position:absolute;
          left:var(--balloon-x);
          top:-90px;
          width:34px;
          height:46px;
          border-radius:50% 50% 47% 47%;
          opacity:0;
          transform:translateX(-50%) scale(var(--balloon-scale));
          animation:balloonFall 8.5s var(--balloon-delay) cubic-bezier(.18,.78,.26,1) infinite;
          filter:drop-shadow(0 10px 18px rgba(255,255,255,.12));
        }
        .cake-balloon::before {
          content:"";
          position:absolute;
          inset:0;
          border-radius:inherit;
          background:radial-gradient(circle at 30% 24%, rgba(255,255,255,.72) 0 7%, rgba(255,255,255,.18) 8% 19%, transparent 20%), linear-gradient(145deg, rgba(255,255,255,.16), rgba(255,255,255,0) 36%);
          border:1px solid rgba(255,255,255,.2);
          box-shadow:inset -6px -8px 14px rgba(0,0,0,.12), inset 5px 5px 12px rgba(255,255,255,.12), 0 0 18px rgba(255,255,255,.07);
        }
        .cake-balloon::after {
          content:"";
          position:absolute;
          left:50%;
          bottom:-5px;
          width:8px;
          height:9px;
          transform:translateX(-50%) rotate(45deg);
          border-radius:2px;
          background:inherit;
        }
        .cake-balloon i {
          position:absolute;
          left:50%;
          top:calc(100% + 3px);
          width:1px;
          height:76px;
          transform-origin:top center;
          background:linear-gradient(180deg, rgba(255,255,255,.62), rgba(255,255,255,.08));
          box-shadow:0 0 4px rgba(255,255,255,.16);
        }
        .balloon-1::before { background-color:rgba(255,129,207,.72); }
        .balloon-2::before { background-color:rgba(135,224,255,.68); }
        .balloon-3::before { background-color:rgba(194,157,255,.72); }
        .balloon-4::before { background-color:rgba(255,208,116,.72); }
        .balloon-5::before { background-color:rgba(152,255,209,.66); }
        .balloon-6::before { background-color:rgba(255,166,183,.7); }
        @keyframes balloonFall {
          0% { opacity:0; transform:translate3d(calc(-50% + var(--balloon-drift)), -40px, 0) rotate(-8deg) scale(var(--balloon-scale)); }
          8% { opacity:.96; }
          42% { opacity:.96; transform:translate3d(calc(-50% + var(--balloon-drift) * -0.35), 48vh, 0) rotate(7deg) scale(var(--balloon-scale)); }
          72% { opacity:.9; transform:translate3d(calc(-50% + var(--balloon-drift) * 0.55), 92vh, 0) rotate(-5deg) scale(var(--balloon-scale)); }
          100% { opacity:0; transform:translate3d(calc(-50% + var(--balloon-drift)), 118vh, 0) rotate(9deg) scale(calc(var(--balloon-scale) * .94)); }
        }
        .sky-confetti { position:absolute; inset:0; pointer-events:none; }
        .sky-confetti span { position:absolute; left:var(--confetti-x); top:var(--confetti-y); width:2px; height:10px; border-radius:99px; background:rgba(255,255,255,.72); animation:confettiDrop 2.8s var(--confetti-delay) ease-out infinite; opacity:0; }
        @keyframes confettiDrop { 0%{opacity:0;transform:translateY(-10px) rotate(0)} 18%{opacity:.8} 100%{opacity:0;transform:translateY(130px) rotate(160deg)} }
        .cake-next-hint { position:absolute; left:50%; bottom:8vh; transform:translateX(-50%); font-size:9px; letter-spacing:.32em; opacity:.35; animation:hintFloat 2s ease-in-out infinite; }
        @keyframes hintFloat { 50%{transform:translate(-50%,5px)} }
        .cake-lit .cake-stage { z-index: 30; opacity: 1; }
        .cake-lit .cake-kicker,.cake-lit .cake-title,.cake-lit .cake-subtitle,.cake-lit .cake-light-ui { opacity:0; pointer-events:none; transition:opacity .8s ease; }
        .cake-lit .cake-assembled { transform: translate(-50%,-44%) scale(1.18) translateY(0); filter: drop-shadow(0 0 28px rgba(255,180,235,.28)); }
        .cake-lit .cake-top-glow { width: 250px; height: 250px; top: -28%; background: radial-gradient(circle, rgba(255,206,244,.45) 0%, rgba(255,152,221,.22) 28%, rgba(255,128,211,.06) 55%, transparent 72%); filter: blur(10px); animation: cakeLightBloom 1.6s ease-out forwards, cakeLightPulse 2.4s 1.6s ease-in-out infinite; }
        .cake-lit .candle-flame { opacity: 1; transform: translateX(-50%) scale(1); animation: candleFlicker .75s ease-in-out infinite, flameGlow 1.2s ease-in-out infinite; }
        .cake-lit .candle-body { box-shadow: 0 0 16px rgba(255,225,249,.45); }
        .cake-lit .cake-shadow { box-shadow: 0 0 35px rgba(255,134,214,.18); }
        @keyframes cakeLightBloom { 0% { transform:translateX(-50%) scale(.2); opacity:0; } 60% { opacity:1; } 100% { transform:translateX(-50%) scale(1); opacity:1; } }
        @keyframes cakeLightPulse { 50% { transform:translateX(-50%) scale(1.12); opacity:.82; } }
        @keyframes flameGlow { 50% { filter:drop-shadow(0 0 24px rgba(255,168,224,1)); } }

        @media (max-width: 768px) {
          .cake-celebration-slide { min-height: 190vh; }
          .cake-stage { width: 98vw; height: 72vw; max-height: 430px; margin-top: 18vh; }
          .cake-assembled { width: min(94vw, 500px); height: min(62vw, 310px); }
          .cake-piece { width: 82px; height: 52px; }
          .cake-celebration-title { top: 22%; width: 96%; }
          .cake-celebration-title h3 { font-size: clamp(48px, 15vw, 82px); line-height: .76; }
          .cake-celebration-name { font-size: clamp(20px, 6vw, 32px); margin-top: 14px; }
          .cake-celebration-small { margin-bottom: 16px; font-size: 8px; letter-spacing: .28em; }
          .cake-lit .cake-assembled { transform: translate(-50%,-44%) scale(1.10); }
          .cake-lit .cake-top-glow { width: 210px; height: 210px; top: -34%; }
          .cake-balloon { width:30px; height:41px; }
          .cake-balloon i { height:58px; }
          .cake-next-hint { bottom: 5vh; }
        }

        /* =================================================
           FINAL DRAMATIC CELEBRATION
        ================================================= */
        .final-slide {
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at center, rgba(102,75,220,.16), transparent 38%);
        }
        .final-content {
          position: relative;
          z-index: 8;
          text-align: center;
        }
        .final-flash {
          position: absolute;
          inset: -20%;
          z-index: 1;
          pointer-events: none;
          background: radial-gradient(circle, rgba(255,255,255,.32), transparent 45%);
          opacity: 0;
          animation: finalFlash 5s ease-in-out infinite;
        }
        .final-firework-rings {
          position: absolute;
          left: 50%; top: 50%;
          width: min(80vw, 850px); height: min(80vw, 850px);
          transform: translate(-50%, -50%);
          pointer-events: none; z-index: 2;
        }
        .final-firework-rings span {
          position: absolute; inset: 15%;
          border: 1px solid rgba(190,165,255,.28);
          border-radius: 50%;
          transform: scale(.15); opacity: 0;
          animation: finalRing 4.5s cubic-bezier(.1,.7,.2,1) infinite;
        }
        .final-firework-rings span:nth-child(2){animation-delay:.8s}
        .final-firework-rings span:nth-child(3){animation-delay:1.6s}
        .final-firework-rings span:nth-child(4){animation-delay:2.4s}
        .final-ikyk {
          margin: 35px auto 28px;
          max-width: 650px;
          font-size: clamp(15px,2vw,22px);
          line-height: 1.6;
          color: rgba(255,255,255,.86);
          letter-spacing: .02em;
        }
        .final-ikyk span { color: rgba(207,193,255,.9); }
        .final-slide .final-message {
          font-size: clamp(16px,2.1vw,25px);
          line-height: 1.65;
        }
        @keyframes finalRing {
          0% { transform: scale(.12); opacity: 0; }
          12% { opacity: .8; }
          75% { opacity: .12; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes finalFlash {
          0%, 84%, 100% { opacity: 0; }
          86% { opacity: .75; }
          89% { opacity: 0; }
          91% { opacity: .35; }
          94% { opacity: 0; }
        }

        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 800px) {
          .slide {
            min-height: 100svh;
            padding: 28px 18px;
          }

          .slide-inner,
          .wishes-container,
          .support-container,
          .message-container,
          .final-content {
            width: 100%;
            max-width: 100%;
          }

          .mini-label {
            margin-top: 18px;
            font-size: 8px;
            letter-spacing: .24em;
          }

          .hero-slide {
            padding: 24px 20px;
          }

          .hero-copy,
          .chapter-slide p,
          .photo-side-text p,
          .wish-intro,
          .support-lines p,
          .message-container p {
            max-width: 320px;
            font-size: 13px;
            line-height: 1.8;
          }

          .photo-slide {
            min-height: auto;
            padding-top: 78px;
            padding-bottom: 78px;
          }

          .photo-layout,
          .photo-slide.reverse .photo-layout {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 28px;
            width: 100%;
          }

          .photo-side-text {
            order: 2;
            width: 100%;
            text-align: center;
          }

          .photo-side-text h2 {
            max-width: 320px;
            margin: 10px auto 0;
            font-size: clamp(38px, 11vw, 54px);
            line-height: .94;
          }

          .photo-card,
          .photo-slide.reverse .photo-card {
            order: 1;
            width: min(86vw, 330px);
            padding: 7px;
            margin: 0 auto;
            border-radius: 16px;
            backdrop-filter: blur(7px);
            box-shadow: 0 20px 55px rgba(0,0,0,.38);
          }

          .photo-image-wrap {
            aspect-ratio: 4 / 5;
            border-radius: 11px;
          }

          .photo-number {
            top: 15px;
            left: 15px;
            font-size: 8px;
            padding: 6px 9px;
          }

          .photo-info {
            padding: 13px 7px 7px;
          }

          .photo-title {
            font-family: "Space Grotesk", sans-serif;
            font-size: 10px;
            letter-spacing: .18em;
          }

          .photo-caption {
            font-size: 10px;
            line-height: 1.55;
            margin-top: 5px;
          }

          .wish-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .wish-card {
            min-height: 145px;
            padding: 22px 20px;
          }

          .wishes-slide {
            min-height: 100svh;
          }

          .support-lines {
            margin-left: 0;
            margin-top: 32px;
          }

          .support-lines p {
            margin: 12px 0;
          }

          .message-container p {
            margin-left: 0;
            text-align: center;
          }

          .final-content {
            padding: 0 8px;
          }

          .final-orbit {
            width: 76vw;
            height: 76vw;
            max-width: 310px;
            max-height: 310px;
          }

          .final-content h3 {
            font-size: 14px;
            letter-spacing: .28em;
          }

          .final-message {
            font-size: 12px;
            line-height: 1.8;
          }

          .final-ikyk {
            font-size: 11px;
            line-height: 1.6;
          }

          .final-end {
            font-size: 8px;
            letter-spacing: .22em;
          }
        }

        @media (max-width: 768px) {
          .grand-intro-content {
            padding-left: 18px;
            padding-right: 18px;
            transform: translateY(-2vh);
          }
          .birthday-wordmark span:first-child {
            font-size: 27px;
            letter-spacing: .20em;
            padding-left: .20em;
          }
          .birthday-wordmark span:last-child {
            font-size: clamp(44px, 13vw, 76px);
          }
          .intro-age-wrap {
            width: 112px;
            height: 94px;
          }
          .intro-age {
            font-size: 92px;
          }
          .intro-orbit {
            width: 140vw;
            height: 140vw;
          }
          .intro-orbit-two {
            width: 90vw;
            height: 90vw;
          }
          .intro-glow {
            width: 75vw;
            height: 75vw;
          }
          .grand-launch {
            min-width: 225px;
            padding-left: 22px;
            padding-right: 22px;
          }
        }

        @media (max-width: 500px) {
          .intro-content {
            padding: 22px 18px;
          }

          .intro-name {
            font-size: clamp(38px, 12vw, 52px);
            line-height: .9;
            letter-spacing: .035em;
          }

          .intro-date {
            margin-top: 22px;
            font-size: 8px;
            letter-spacing: .22em;
          }

          .hero-title {
            font-size: clamp(48px, 15vw, 66px);
            line-height: .9;
          }

          .chapter-slide h2 {
            font-size: clamp(42px, 13vw, 58px);
            line-height: .92;
          }

          .wishes-container h2,
          .support-container h2 {
            font-size: clamp(46px, 14vw, 62px);
            line-height: .9;
          }

          .message-big {
            font-size: clamp(56px, 18vw, 78px);
            line-height: .88;
          }

          .final-content h2 {
            font-size: clamp(68px, 21vw, 94px);
            line-height: .82;
          }
        }


/* =========================================================
   MEMORY JOURNEY — IMAGE FIRST, THEN STORY
   ========================================================= */
.memory-slide {
  min-height: 170vh;
  align-items: flex-start;
  justify-content: center;
  padding: 10vh 0 16vh;
}

.memory-sequence {
  width: min(92vw, 980px);
  min-height: 145vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8vh;
}

.memory-stage {
  --memory-focus: 0;
  --memory-glow: .08;
  width: min(78vw, 640px);
  min-height: min(72vh, 680px);
  display: grid;
  place-items: center;
  position: relative;
  isolation: isolate;
}

.memory-stage::before {
  content: "";
  position: absolute;
  width: 92%;
  height: 92%;
  border-radius: 40px;
  border: 1px solid rgba(255,255,255,.1);
  transform: scale(calc(.92 + var(--memory-focus) * .08));
  opacity: calc(.16 + var(--memory-focus) * .42);
  transition: opacity .25s ease, transform .25s ease;
  z-index: -2;
}

.memory-stage::after {
  content: "";
  position: absolute;
  inset: 7%;
  border-radius: 32px;
  background: radial-gradient(circle at 50% 45%, rgba(155,134,255,var(--memory-glow)), transparent 68%);
  filter: blur(18px);
  z-index: -3;
  pointer-events: none;
}

.memory-orbit {
  position: absolute;
  width: 108%;
  height: 76%;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 50%;
  transform: rotate(-12deg) scaleX(calc(.94 + var(--memory-focus) * .06));
  opacity: calc(.18 + var(--memory-focus) * .36);
}

.memory-orbit::after {
  content: "";
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  top: 2%;
  left: 50%;
  background: #fff;
  box-shadow: 0 0 24px rgba(255,255,255,.75);
}

.memory-stage .photo-card {
  width: min(82vw, 560px);
  opacity: var(--memory-card-opacity, 1);
  transform: translate3d(0, var(--memory-depth, 0px), 0) scale(var(--memory-card-scale, 1));
  transition: box-shadow .45s ease;
}

.memory-stage .photo-image {
  --memory-image-y: 0px;
  --memory-image-scale: 1;
  --memory-image-opacity: 1;
  --memory-image-blur: 0px;
  transform: translate3d(0, calc(var(--memory-image-y) + var(--scroll-drift)), 0) scale(var(--memory-image-scale));
  opacity: var(--memory-image-opacity);
  filter: blur(var(--memory-image-blur));
  transition: none;
}

.memory-stage .photo-image-wrap {
  transform: translateZ(0);
}

.memory-zoom {
  position: absolute;
  inset: 7px;
  border-radius: 17px;
  border: 1px solid rgba(255,255,255, calc(.06 + var(--memory-focus) * .2));
  transform: scale(calc(.985 + var(--memory-focus) * .015));
  pointer-events: none;
}

.memory-copy {
  width: min(88vw, 680px);
  text-align: center;
  opacity: var(--memory-copy-opacity, 0);
  transform: translate3d(0, var(--memory-copy-y, 52px), 0);
  transition: opacity .28s ease, transform .28s cubic-bezier(.16,1,.3,1);
}

.memory-copy h2 {
  margin: 0;
  font-size: clamp(52px, 7vw, 105px);
  line-height: .86;
  letter-spacing: -.055em;
  font-weight: 400;
}

.memory-copy h2 span {
  color: transparent;
  -webkit-text-stroke: 1px rgba(255,255,255,.42);
}

.memory-copy p {
  max-width: 520px;
  margin: 34px auto 0;
  font-size: 14px;
  line-height: 1.9;
  opacity: .56;
}

.memory-scroll-mark {
  margin-top: 42px;
  font-size: 8px;
  letter-spacing: .34em;
  opacity: .35;
}

.memory-scroll-mark span {
  display: inline-block;
  margin-left: 12px;
  font-size: 15px;
  animation: memoryArrow 1.8s ease-in-out infinite;
}

@keyframes memoryArrow {
  0%,100% { transform: translateY(0); opacity: .35; }
  50% { transform: translateY(5px); opacity: .9; }
}

@media (max-width: 768px) {
  .memory-slide {
    min-height: 155vh;
    padding: 9vh 0 13vh;
  }

  .memory-sequence {
    width: 100%;
    min-height: 140vh;
    gap: 5vh;
  }

  .memory-stage {
    width: 100%;
    min-height: 65vh;
  }

  .memory-stage .photo-card {
    width: min(82vw, 335px);
    padding: 7px;
  }

  .memory-stage .photo-image {
    transform: translate3d(0, calc(var(--memory-image-y) + var(--scroll-drift)), 0) scale(var(--memory-image-scale));
  }

  .memory-orbit {
    width: 108vw;
    height: 58vh;
  }

  .memory-copy {
    width: min(88vw, 360px);
    padding-bottom: 8vh;
  }

  .memory-copy h2 {
    font-size: clamp(42px, 13vw, 58px);
    line-height: .9;
  }

  .memory-copy p {
    font-size: 12px;
    line-height: 1.8;
    margin-top: 24px;
  }

  .memory-scroll-mark {
    margin-top: 30px;
  }
}

/* =========================================================
   WORD-BY-WORD STYLE REVEALS
   ========================================================= */

.scroll-reveal.is-visible {
  animation: revealSoftIn .85s cubic-bezier(.16, 1, .3, 1) both;
}

.scroll-reveal-lines.is-visible {
  animation: revealLineIn .75s cubic-bezier(.16, 1, .3, 1) both;
}

.scroll-reveal-cards.is-visible {
  animation: revealCardIn .8s cubic-bezier(.16, 1, .3, 1) both;
}

@keyframes revealSoftIn {
  0% {
    opacity: 0;
    letter-spacing: -.015em;
  }
  100% {
    opacity: 1;
    letter-spacing: inherit;
  }
}

@keyframes revealLineIn {
  0% { opacity: 0; clip-path: inset(0 100% 0 0); }
  100% { opacity: 1; clip-path: inset(0 0 0 0); }
}

@keyframes revealCardIn {
  0% { opacity: 0; transform: translate3d(0, 24px, 0) scale(.96); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

/* =========================================================
   CINEMATIC SCROLL + REPULSION EFFECTS
   ========================================================= */

.scroll-reveal {
  opacity: 0;
  will-change: transform, opacity;
  transition-property: opacity, transform, filter;
  transition-duration: 0.9s;
  transition-timing-function: cubic-bezier(.16, 1, .3, 1);
  transition-delay: var(--reveal-delay, 0s);
}

.scroll-reveal-rise {
  transform: translate3d(0, 52px, 0);
}

.scroll-reveal-blur {
  transform: translate3d(0, 36px, 0) scale(.97);
  filter: blur(12px);
}

.scroll-reveal-slide {
  transform: translate3d(42px, 0, 0);
}

.photo-slide.reverse .scroll-reveal-slide {
  transform: translate3d(-42px, 0, 0);
}

.scroll-reveal-zoom {
  transform: translate3d(0, 24px, 0) scale(.92);
}

.scroll-reveal-cards {
  transform: translate3d(0, 42px, 0) scale(.96);
}

.scroll-reveal-float {
  transform: translate3d(0, 35px, 0);
}

.scroll-reveal-focus {
  transform: translate3d(0, 22px, 0) scale(.985);
  filter: blur(7px);
}

.scroll-reveal-lines {
  transform: translate3d(65px, 0, 0);
}

.scroll-reveal-final {
  transform: translate3d(0, 34px, 0) scale(.94);
}

.scroll-reveal-rise.is-visible { animation: revealRise .95s cubic-bezier(.16,1,.3,1) both; }
.scroll-reveal-blur.is-visible { animation: revealBlur 1.05s cubic-bezier(.16,1,.3,1) both; }
.scroll-reveal-slide.is-visible { animation: revealSlide .9s cubic-bezier(.16,1,.3,1) both; }
.scroll-reveal-zoom.is-visible { animation: revealZoom .95s cubic-bezier(.16,1,.3,1) both; }
.scroll-reveal-focus.is-visible { animation: revealFocus 1s cubic-bezier(.16,1,.3,1) both; }
.scroll-reveal-final.is-visible { animation: revealFinal 1.2s cubic-bezier(.16,1,.3,1) both; }

@keyframes revealRise {
  0% { opacity: 0; transform: translate3d(0,48px,0) scale(.985); }
  70% { opacity: 1; transform: translate3d(0,-3px,0) scale(1); }
  100% { opacity: 1; transform: translate3d(0,0,0) scale(1); }
}

@keyframes revealBlur {
  0% { opacity: 0; filter: blur(10px); transform: translate3d(0,35px,0) scale(.965); }
  100% { opacity: 1; filter: blur(0); transform: translate3d(0,0,0) scale(1); }
}

@keyframes revealSlide {
  0% { opacity: 0; transform: translate3d(42px,8px,0); }
  100% { opacity: 1; transform: translate3d(0,0,0); }
}

@keyframes revealZoom {
  0% { opacity: 0; transform: translate3d(0,30px,0) scale(.88); }
  60% { opacity: 1; transform: translate3d(0,-3px,0) scale(1.015); }
  100% { opacity: 1; transform: translate3d(0,0,0) scale(1); }
}

@keyframes revealFocus {
  0% { opacity: 0; filter: blur(7px); letter-spacing: .03em; transform: translate3d(0,24px,0); }
  100% { opacity: 1; filter: blur(0); letter-spacing: inherit; transform: translate3d(0,0,0); }
}

@keyframes revealFinal {
  0% { opacity: 0; transform: translate3d(0,40px,0) scale(.9); filter: blur(4px); }
  65% { opacity: 1; transform: translate3d(0,-4px,0) scale(1.015); filter: blur(0); }
  100% { opacity: 1; transform: translate3d(0,0,0) scale(1); }
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: none;
  filter: none;
}

.photo-card,
.wish-card,
.wish-launch-panel,
.support-lines p {
  --repel-x: 0px;
  --repel-y: 0px;
  translate: var(--repel-x) var(--repel-y);
}

.photo-card,
.wish-card,
.wish-launch-panel,
.support-lines p {
  transition:
    translate .28s cubic-bezier(.16, 1, .3, 1),
    box-shadow .5s ease,
    background .5s ease,
    border-color .5s ease;
}

.photo-card:hover,
.wish-card:hover {
  box-shadow: 0 25px 85px rgba(125, 90, 255, .16);
}

@media (max-width: 768px) {
  .scroll-reveal-rise {
    transform: translate3d(0, 34px, 0) scale(.985);
  }

  .scroll-reveal-blur {
    transform: translate3d(0, 28px, 0) scale(.975);
    filter: blur(8px);
  }

  .scroll-reveal-slide {
    transform: translate3d(34px, 18px, 0);
  }

  .photo-slide.reverse .scroll-reveal-slide {
    transform: translate3d(-34px, 18px, 0);
  }

  .scroll-reveal-zoom {
    transform: translate3d(0, 28px, 0) scale(.90);
  }

  .scroll-reveal-cards {
    transform: translate3d(0, 34px, 0) scale(.94);
  }

  .scroll-reveal-float {
    transform: translate3d(0, 40px, 0) rotate(1deg);
  }

  .scroll-reveal-focus {
    transform: translate3d(0, 25px, 0) scale(.985);
    filter: blur(6px);
  }

  .scroll-reveal-lines {
    transform: translate3d(26px, 0, 0);
  }

  .scroll-reveal-final {
    transform: translate3d(0, 36px, 0) scale(.92);
  }

  .scroll-reveal.is-visible {
    transform: none;
    filter: none;
  }

  .photo-card,
  .wish-card,
  .wish-launch-panel,
  .support-lines p {
    translate: var(--repel-x) var(--repel-y);
  }
}

/* =========================================================
   MOBILE PERFORMANCE MODE — SAME EXPERIENCE, LOWER COST
   ========================================================= */

@media (max-width: 768px) {
  html { scroll-behavior: auto; }
  body { overflow-x: hidden; }
  .canvas { display: block !important; }
  .experience { perspective: 900px; }
  .slide { will-change: auto !important; }
  .photo-card, .wish-card { backface-visibility: hidden; }
  .photo-card { transform: translate3d(0, var(--scroll-lift, 0px), 0) !important; }
  .photo-image { --scroll-drift: 0px; transition: transform .55s cubic-bezier(.16, 1, .3, 1) !important; }
  .photo-card:hover .photo-image,
  .photo-image { transform: scale(1.035) translate3d(0, var(--scroll-drift), 0) !important; }
  .interactive-sky { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .css-star { animation-duration: 4s !important; }
  .final-flash { animation: mobileFinalFlash 7s ease-in-out infinite !important; }
  .final-firework-rings span { animation-duration: 6s !important; }
  .celebration { display: none !important; }
}

@keyframes mobileFinalFlash {
  0%, 88%, 100% { opacity: 0; }
  91% { opacity: .38; }
  94% { opacity: 0; }
}

        @media (max-width: 768px) {
          .wish-orbit { width: 92px; height: 92px; }
          .wish-launch-panel { padding: 44px 18px; }
          .wish-choice-dock { gap: 6px; }
          .wish-choice { font-size: 7px; padding: 8px 9px; }
          .wish-chosen-line strong { font-size: 9px; }
          .wish-capsule-row { grid-template-columns: 1fr; }
          .wish-seal-button { min-height: 42px; }
        }



/* =========================================================
   CREATIVE ADD-ON — MAKI PRIVATE SURPRISE
========================================================= */
.maki-slide { min-height:145vh; justify-content:center; overflow:hidden; text-align:center; position:relative; }
.maki-bg-word { position:absolute; top:18%; left:50%; transform:translateX(-50%); font:600 clamp(90px,19vw,290px)/.8 "Space Grotesk",sans-serif; letter-spacing:-.09em; color:rgba(255,255,255,.022); pointer-events:none; }
.maki-header { position:relative; z-index:4; max-width:680px; margin:0 auto 22px; padding:0 18px; }
.maki-header h2 { margin:14px 0 10px; font:500 clamp(45px,7vw,84px)/.9 "Space Grotesk",sans-serif; letter-spacing:-.06em; }
.maki-header h2 span { color:transparent; -webkit-text-stroke:1px rgba(255,255,255,.72); }
.maki-header p { max-width:500px; margin:0 auto; color:rgba(255,255,255,.56); font:400 14px/1.7 "DM Sans",sans-serif; }
.maki-lock { position:relative; z-index:5; width:min(470px,88vw); min-height:250px; margin:12px auto 0; border:1px solid rgba(255,255,255,.14); background:radial-gradient(circle at 50% 35%,rgba(255,120,210,.08),rgba(8,7,22,.65) 68%); color:#fff; cursor:pointer; box-shadow:0 32px 110px rgba(0,0,0,.4); transition:transform .5s cubic-bezier(.16,1,.3,1),border-color .4s ease,box-shadow .4s ease; }
.maki-lock:hover { transform:translateY(-7px) scale(1.015); border-color:rgba(255,255,255,.3); box-shadow:0 45px 125px rgba(0,0,0,.48),0 0 70px rgba(255,120,210,.08); }
.maki-lock::before { content:""; position:absolute; inset:18px; border:1px dashed rgba(255,255,255,.09); pointer-events:none; }
.maki-lock-icon { display:block; font-size:46px; opacity:.7; margin-bottom:22px; transform:rotate(-12deg); }
.maki-lock strong { display:block; font:600 10px/1 "DM Sans",sans-serif; letter-spacing:.3em; }
.maki-lock small { display:block; margin-top:11px; color:rgba(255,255,255,.3); font:400 9px/1 "DM Sans",sans-serif; letter-spacing:.1em; }
.maki-reveal { position:relative; z-index:5; width:min(590px,92vw); margin:5px auto 0; animation:makiReveal .85s cubic-bezier(.16,1,.3,1); }
.maki-image-wrap { position:relative; width:min(420px,78vw); aspect-ratio:9 / 16; margin:0 auto; overflow:hidden; border:1px solid rgba(255,255,255,.18); background:#090816; box-shadow:0 35px 120px rgba(0,0,0,.52),0 0 80px rgba(255,100,200,.1); }
.maki-image { width:100%; height:100%; display:block; object-fit:cover; object-position:center; filter:saturate(1.03) contrast(1.03); animation:makiImageIn 1s cubic-bezier(.16,1,.3,1); }
.maki-image-glow { position:absolute; inset:-20%; background:radial-gradient(circle,rgba(255,120,210,.18),transparent 55%); mix-blend-mode:screen; pointer-events:none; animation:makiGlow 3.5s ease-in-out infinite; }
.maki-scanline { position:absolute; left:0; right:0; top:-10%; height:30%; background:linear-gradient(to bottom,transparent,rgba(255,255,255,.07),transparent); filter:blur(6px); animation:makiScan 3.2s ease-in-out infinite; pointer-events:none; }
.maki-caption { margin:18px auto 0; }
.maki-caption span { display:block; color:rgba(255,255,255,.4); font:600 8px/1 "DM Sans",sans-serif; letter-spacing:.25em; }
.maki-caption strong { display:block; margin-top:10px; font:500 clamp(21px,3.5vw,31px)/1.15 "Space Grotesk",sans-serif; }
.maki-caption small { display:block; margin-top:8px; color:rgba(255,255,255,.42); font:400 11px/1.5 "DM Sans",sans-serif; }
.maki-reset { margin-top:16px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.03); color:rgba(255,255,255,.5); padding:9px 14px; cursor:pointer; font:600 7px/1 "DM Sans",sans-serif; letter-spacing:.2em; }
.maki-reset:hover { color:#fff; border-color:rgba(255,255,255,.3); }
@keyframes makiReveal { from { opacity:0; transform:translateY(34px) scale(.96); } to { opacity:1; transform:none; } }
@keyframes makiImageIn { from { transform:scale(1.08); filter:brightness(.55) blur(8px); } to { transform:scale(1); filter:saturate(1.03) contrast(1.03); } }
@keyframes makiGlow { 0%,100% { opacity:.35; transform:scale(.92); } 50% { opacity:.8; transform:scale(1.02); } }
@keyframes makiScan { 0% { transform:translateY(-120%); opacity:0; } 20% { opacity:.4; } 75% { opacity:.25; } 100% { transform:translateY(500%); opacity:0; } }

@media (max-width:768px) {
  .maki-slide { min-height:128vh; }
  .maki-header p { font-size:12px; }
  .maki-lock { min-height:220px; }
  .maki-image-wrap { width:min(360px,82vw); }
}

/* =========================================================
   CREATIVE ADD-ON — A LETTER THAT WRITES ITSELF
========================================================= */
.letter-slide { min-height:145vh; justify-content:center; overflow:hidden; text-align:center; position:relative; }
.letter-bg-word { position:absolute; top:18%; left:50%; transform:translateX(-50%); font:600 clamp(110px,20vw,300px)/.8 "Space Grotesk",sans-serif; letter-spacing:-.09em; color:rgba(255,255,255,.025); pointer-events:none; }
.letter-header { position:relative; z-index:4; max-width:680px; margin:0 auto 18px; padding:0 18px; }
.letter-header h2 { margin:14px 0 10px; font:500 clamp(45px,7vw,84px)/.9 "Space Grotesk",sans-serif; letter-spacing:-.06em; }
.letter-header h2 span { color:transparent; -webkit-text-stroke:1px rgba(255,255,255,.72); }
.letter-header p { max-width:490px; margin:0 auto; color:rgba(255,255,255,.56); font:400 14px/1.7 "DM Sans",sans-serif; }
.letter-envelope { position:relative; z-index:5; width:min(560px,90vw); min-height:310px; margin:5px auto 0; border:1px solid rgba(255,255,255,.16); background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(10,8,25,.65)); color:white; cursor:pointer; box-shadow:0 30px 110px rgba(0,0,0,.38); overflow:hidden; transition:transform .6s cubic-bezier(.16,1,.3,1), box-shadow .5s ease, border-color .4s ease; }
.letter-envelope:hover { transform:translateY(-8px) rotate(-.4deg); border-color:rgba(255,255,255,.3); box-shadow:0 45px 130px rgba(0,0,0,.48),0 0 70px rgba(255,120,210,.07); }
.letter-envelope-flap { position:absolute; top:-1px; left:0; right:0; height:55%; background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.025)); clip-path:polygon(0 0,100% 0,50% 100%); border-bottom:1px solid rgba(255,255,255,.08); }
.letter-seal { position:absolute; left:50%; top:43%; transform:translate(-50%,-50%); width:58px; height:58px; border-radius:50%; display:grid; place-items:center; border:1px solid rgba(255,150,220,.35); background:rgba(255,120,200,.08); box-shadow:0 0 35px rgba(255,100,200,.12); font-size:23px; }
.letter-envelope-label { position:absolute; top:72%; left:50%; transform:translateX(-50%); font:600 8px/1 "DM Sans",sans-serif; letter-spacing:.28em; color:rgba(255,255,255,.45); }
.letter-envelope strong { position:absolute; left:50%; bottom:32px; transform:translateX(-50%); white-space:nowrap; font:600 9px/1 "DM Sans",sans-serif; letter-spacing:.28em; }
.letter-envelope small { position:absolute; left:50%; bottom:15px; transform:translateX(-50%); color:rgba(255,255,255,.3); font:400 9px/1 "DM Sans",sans-serif; letter-spacing:.08em; }
.letter-paper-wrap { position:relative; width:min(740px,94vw); margin:4px auto 0; z-index:5; }
.letter-paper { position:relative; width:min(650px,94vw); margin:0 auto; padding:32px 40px 26px; text-align:left; background:linear-gradient(145deg,rgba(247,241,234,.98),rgba(228,220,211,.98)); color:#28242a; box-shadow:0 35px 110px rgba(0,0,0,.5); transform:rotate(-.7deg); animation:letterOpen .75s cubic-bezier(.16,1,.3,1); }
.letter-paper::before { content:""; position:absolute; inset:10px; border:1px solid rgba(70,55,65,.12); pointer-events:none; }
.letter-paper-top { position:relative; z-index:1; display:flex; justify-content:space-between; color:rgba(40,36,42,.46); font:600 8px/1 "DM Sans",sans-serif; letter-spacing:.2em; }
.letter-writing { position:relative; z-index:1; margin:30px auto 24px; white-space:pre-wrap; max-width:560px; min-height:410px; font:400 16px/1.9 "Georgia",serif; }
.letter-caret { display:inline-block; margin-left:2px; animation:letterCaret .8s steps(1) infinite; }
.letter-signature { position:relative; z-index:1; padding-top:18px; border-top:1px solid rgba(50,40,48,.12); color:rgba(40,36,42,.55); font:400 11px/1.6 "DM Sans",sans-serif; }
.letter-close { position:relative; z-index:1; margin-top:19px; border:0; background:transparent; color:rgba(40,36,42,.48); cursor:pointer; font:600 7px/1 "DM Sans",sans-serif; letter-spacing:.2em; }
.letter-close:hover { color:#28242a; }
.letter-petal,.letter-spark { position:absolute; z-index:7; pointer-events:none; text-shadow:0 0 18px rgba(255,120,210,.2); }
.letter-petal { color:rgba(255,170,220,.65); font-size:24px; animation:letterFloat 4.8s ease-in-out infinite; } .petal-a { left:4%; top:25%; } .petal-b { right:3%; bottom:19%; animation-delay:1.4s; }
.letter-spark { color:rgba(255,255,255,.72); font-size:18px; animation:tinyTwinkle 2.2s ease-in-out infinite; } .spark-a { right:9%; top:18%; } .spark-b { left:8%; bottom:22%; animation-delay:.8s; }
@keyframes letterOpen { from { opacity:0; transform:translateY(25px) rotate(-2deg) scale(.97); } to { opacity:1; transform:rotate(-.7deg) scale(1); } }
@keyframes letterCaret { 50% { opacity:0; } }
@keyframes letterFloat { 0%,100% { transform:translateY(0) rotate(0deg); } 50% { transform:translateY(-12px) rotate(7deg); } }

@media (max-width:768px) {
  .tiny-universe-slide,.letter-slide { min-height:128vh; }
  .tiny-universe-stage { width:100vw; height:108vw; max-height:510px; }
  .tiny-universe-planet { width:112px; height:112px; }
  .tiny-universe-planet strong { font-size:24px; }
  .tiny-universe-planet small { font-size:6px; }
  .tiny-world button { width:48px; height:48px; font-size:18px; }
  .world-heart { left:5%; top:26%; } .world-moon { right:5%; top:24%; } .world-flower { left:10%; bottom:13%; } .world-star { right:11%; bottom:12%; } .world-ribbon { top:4%; }
  .tiny-universe-header p,.letter-header p { font-size:12px; }
  .tiny-universe-note { padding:14px 14px 15px; }
  .tiny-universe-note p { font-size:12px; min-height:57px; }
  .tiny-universe-dock { gap:5px; }
  .tiny-universe-dock button { padding:8px 9px; font-size:7px; }
  .letter-envelope { min-height:270px; }
  .letter-paper { padding:26px 22px 22px; }
  .letter-writing { font-size:13px; line-height:1.8; min-height:460px; margin-top:25px; }
  .letter-signature { font-size:10px; }
  .letter-petal { display:none; }
}

      `}

</style>

    </main>
  );
}