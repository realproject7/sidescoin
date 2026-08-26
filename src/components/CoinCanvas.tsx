"use client";

import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";
import type { MarketSide } from "@/lib/market-types";
import type { CoinCanvasProps } from "./coin-types";

const TAU = Math.PI * 2;

function WaveMark({ z, reversed = false }: { z: number; reversed?: boolean }) {
  const curves = useMemo(
    () =>
      [-0.43, 0, 0.43].map((offset, index) => {
        const points = Array.from({ length: 18 }, (_, pointIndex) => {
          const x = -1.2 + (2.4 * pointIndex) / 17;
          const y = Math.sin(x * 2.4 + index * 0.72) * 0.18 + offset;
          return new THREE.Vector3(x, y, 0);
        });
        return new THREE.CatmullRomCurve3(points);
      }),
    [],
  );

  return (
    <group position={[0, 0, z]} rotation={reversed ? [0, Math.PI, 0] : undefined}>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 72, 0.085, 12, false]} />
          <meshPhysicalMaterial
            color="#7cf6d2"
            emissive="#1bbfbb"
            emissiveIntensity={0.32}
            metalness={0.72}
            roughness={0.22}
            clearcoat={1}
          />
        </mesh>
      ))}
    </group>
  );
}

function CoinModel({ controlRef, onSettled }: CoinCanvasProps) {
  const groupRef = useRef<Group>(null);
  const seenCommand = useRef(0);
  const angularVelocity = useRef(0);
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

    if (control.mode === "holding") {
      const targetVelocity = control.reducedMotion ? 2.4 : 20;
      angularVelocity.current = THREE.MathUtils.lerp(
        angularVelocity.current,
        targetVelocity,
        Math.min(1, delta * 3.4),
      );
      group.rotation.x += angularVelocity.current * delta;
      group.rotation.z += delta * 0.38;
    } else if (control.mode === "landing") {
      const current = landing.current;
      const rawProgress = (state.clock.elapsedTime - current.start) / current.duration;
      const progress = THREE.MathUtils.clamp(rawProgress, 0, 1);
      const eased = 1 - (1 - progress) ** 5;
      group.rotation.x = THREE.MathUtils.lerp(current.from, current.to, eased);
      group.rotation.z += delta * (1 - progress) * 0.42;

      if (progress >= 1) {
        group.rotation.x = current.to;
        angularVelocity.current = 0;
        control.mode = "idle";
        onSettled(current.side);
      }
    } else {
      angularVelocity.current = 0;
      if (!control.reducedMotion) group.rotation.z += delta * 0.085;
      group.rotation.y = -0.34 + Math.sin(state.clock.elapsedTime * 0.48) * 0.055;
      group.position.y = 0.18 + Math.sin(state.clock.elapsedTime * 0.72) * 0.07;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, -0.34, -0.05]} scale={0.92}>
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

      <mesh position={[0, 0, 0.235]}>
        <circleGeometry args={[2.22, 128]} />
        <meshPhysicalMaterial color="#07101f" metalness={0.76} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0, -0.235]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[2.22, 128]} />
        <meshPhysicalMaterial color="#061b28" metalness={0.7} roughness={0.25} />
      </mesh>

      {[0.25, -0.25].map((z) => (
        <mesh key={z} position={[0, 0, z]} rotation={z < 0 ? [0, Math.PI, 0] : undefined}>
          <ringGeometry args={[1.96, 2.16, 128]} />
          <meshPhysicalMaterial color="#d5deec" metalness={1} roughness={0.18} />
        </mesh>
      ))}

      <group position={[0, 0, 0.272]}>
        <mesh>
          <ringGeometry args={[0.57, 1.48, 96, 1, 0.16, Math.PI * 0.82]} />
          <meshPhysicalMaterial
            color="#2867ff"
            emissive="#003de3"
            emissiveIntensity={0.25}
            metalness={0.78}
            roughness={0.18}
            clearcoat={1}
          />
        </mesh>
        <mesh>
          <ringGeometry
            args={[0.57, 1.48, 96, 1, Math.PI + 0.16, Math.PI * 0.82]}
          />
          <meshPhysicalMaterial
            color="#0052ff"
            emissive="#0034bd"
            emissiveIntensity={0.22}
            metalness={0.8}
            roughness={0.2}
            clearcoat={1}
          />
        </mesh>
        <mesh position={[0, 0, -0.006]}>
          <ringGeometry args={[0.43, 0.57, 96]} />
          <meshStandardMaterial color="#b8c6da" metalness={1} roughness={0.2} />
        </mesh>
      </group>

      <WaveMark z={-0.272} reversed />

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
      <ContactShadows
        position={[0, -3.05, -0.4]}
        opacity={0.45}
        scale={7}
        blur={2.8}
        far={5}
        color="#0052ff"
      />
    </Canvas>
  );
}
