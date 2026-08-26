"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";
import type { MarketSide } from "@/lib/market-types";
import type { CoinCanvasProps } from "./coin-types";

const TAU = Math.PI * 2;

function FaceFrame({
  accent,
  image,
  reversed = false,
  z,
}: {
  accent: string;
  image: string;
  reversed?: boolean;
  z: number;
}) {
  const texture = useMemo(() => {
    const nextTexture = new THREE.TextureLoader().load(image);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.minFilter = THREE.LinearMipmapLinearFilter;
    nextTexture.magFilter = THREE.LinearFilter;
    if (reversed) {
      nextTexture.center.set(0.5, 0.5);
      nextTexture.rotation = Math.PI;
    }
    return nextTexture;
  }, [image, reversed]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group position={[0, 0, z]} rotation={reversed ? [0, Math.PI, 0] : undefined}>
      <mesh>
        <circleGeometry args={[2.23, 128]} />
        <meshPhysicalMaterial color="#07101f" metalness={0.82} roughness={0.23} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.018]}>
        <ringGeometry args={[1.82, 2.16, 128]} />
        <meshPhysicalMaterial color="#dce5f3" metalness={1} roughness={0.16} clearcoat={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <ringGeometry args={[1.88, 2.08, 128]} />
        <meshPhysicalMaterial color={accent} emissive={accent} emissiveIntensity={0.18} metalness={0.86} roughness={0.17} />
      </mesh>
      <mesh position={[0, 0, 0.038]}>
        <circleGeometry args={[2.13, 128]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.025}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function CoinModel({ controlRef, onSettled }: CoinCanvasProps) {
  const groupRef = useRef<Group>(null);
  const seenCommand = useRef(0);
  const landing = useRef({
    start: 0,
    from: 0,
    to: 0,
    duration: 1,
    side: "token" as MarketSide,
  });

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const control = controlRef.current;
    if (control.mode === "landing" && control.commandId !== seenCommand.current) {
      seenCommand.current = control.commandId;
      const faceOffset = control.targetSide === "token" ? 0 : Math.PI;
      let target = Math.ceil(group.rotation.x / TAU) * TAU + faceOffset;
      while (target <= group.rotation.x + 0.2) target += TAU;
      target += control.turns * TAU;
      landing.current = {
        start: state.clock.elapsedTime,
        from: group.rotation.x,
        to: target,
        duration: control.duration,
        side: control.targetSide,
      };
    }

    if (control.mode === "landing") {
      const current = landing.current;
      const rawProgress = (state.clock.elapsedTime - current.start) / current.duration;
      const progress = THREE.MathUtils.clamp(rawProgress, 0, 1);
      const eased = 1 - (1 - progress) ** 5;
      group.rotation.x = THREE.MathUtils.lerp(current.from, current.to, eased);
      group.rotation.z += delta * (1 - progress) * 0.42;

      if (progress >= 1) {
        group.rotation.x = current.to;
        control.mode = "idle";
        onSettled(current.side);
      }
    } else if (control.mode === "holding") {
      if (!control.reducedMotion) {
        group.rotation.x += delta * 13.5;
        group.rotation.z += delta * 0.72;
      }
      group.position.y = 0.18;
    } else {
      const restingTilt = -0.04 + Math.sin(state.clock.elapsedTime * 0.31) * 0.018;
      group.rotation.z = THREE.MathUtils.lerp(
        group.rotation.z,
        restingTilt,
        Math.min(1, delta * 3),
      );
      group.rotation.y = -0.18 + Math.sin(state.clock.elapsedTime * 0.48) * 0.1;
      group.position.y = 0.18 + Math.sin(state.clock.elapsedTime * 0.72) * 0.07;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, -0.18, -0.04]} scale={0.98}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[2.55, 2.55, 0.46, 128, 1, false]} />
        <meshPhysicalMaterial
          color="#b9c4d8"
          metalness={1}
          roughness={0.2}
          clearcoat={0.85}
          clearcoatRoughness={0.14}
        />
      </mesh>

      <FaceFrame accent="#2f66ff" image="/janus-price-face.webp" z={0.235} />
      <FaceFrame accent="#21d8c1" image="/janus-volume-face.webp" z={-0.235} reversed />

      <mesh>
        <torusGeometry args={[2.43, 0.07, 18, 128]} />
        <meshPhysicalMaterial
          color="#67cfff"
          emissive="#0052ff"
          emissiveIntensity={0.55}
          metalness={0.92}
          roughness={0.16}
        />
      </mesh>
    </group>
  );
}

export default function CoinCanvas(props: CoinCanvasProps) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0, 8.7], fov: 34, near: 0.1, far: 100 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
    >
      <ambientLight intensity={0.72} />
      <spotLight
        position={[-4, 5, 7]}
        intensity={95}
        angle={0.34}
        penumbra={0.92}
        color="#ffffff"
      />
      <pointLight position={[5, 0, 4]} intensity={42} color="#0052ff" />
      <pointLight position={[-4, -1, 2]} intensity={25} color="#7cf6d2" />
      <CoinModel {...props} />
      <mesh position={[0, -2.7, -0.5]} scale={[2.7, 0.34, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color="#001f88" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </Canvas>
  );
}
