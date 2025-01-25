import * as THREE from "three";
import React, { Suspense, useRef, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics, useSphere, useBox, usePlane } from "@react-three/cannon";
import { useGLTF, Text, PerspectiveCamera } from "@react-three/drei";
import { Html } from "@react-three/drei"; 
import lerp from "lerp";
import clamp from "lodash-es/clamp";
import create from "zustand";
import pingSound from "./resources/ping.mp3";

const ping = new Audio(pingSound);
const [useStore] = create((set) => ({
  count: 0,
  welcome: true,
  api: {
    pong(velocity) {
      ping.currentTime = 0;
      ping.volume = clamp(velocity / 20, 0, 1);
      ping.play();
      if (velocity > 4) set((state) => ({ count: state.count + 1 }));
    },
    reset: (welcome) => set((state) => ({ welcome, count: welcome ? state.count : 0 })),
  },
}));

function Paddle() {
  const { nodes, materials } = useGLTF("/pingpong.glb");
  const { pong } = useStore((state) => state.api);
  const welcome = useStore((state) => state.welcome);
  const count = useStore(state => state.count);
  const model = useRef();
  const [ref, api] = useBox(() => ({
    type: "Kinematic",
    args: [1.5, 0.4, 1.6],
    onCollide: (e) => pong(e.contact.impactVelocity),
    material: {
      restitution: 0.5,
      friction: 0.8,
    },
  }));

  const values = useRef([0, 0]);
  useFrame((state) => {
    values.current[0] = lerp(values.current[0], (state.mouse.x * Math.PI) / 5, 0.2);
    values.current[1] = lerp(values.current[1], (state.mouse.x * Math.PI) / 5, 0.2);
    
    api.position.set(state.mouse.x * 10, state.mouse.y * 5, 0);
    api.rotation.set(0, 0, values.current[1]);
    
    api.wakeUp();
    
    model.current.rotation.x = lerp(model.current.rotation.x, welcome ? Math.PI / 2 : 0, 0.2);
    model.current.rotation.y = values.current[0];
  });

  return (
    <>
      <Html position={[-8, 5, 0]} style={{ position: "absolute", top: "10px", left: "10px", color: "white", fontSize: "20px" }}>
        Score: {count}
      </Html>
    <mesh ref={ref} dispose={null}>
      <group ref={model} position={[-0.05, 0.37, 0.3]} scale={[0.15, 0.15, 0.15]}>
      <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.5, 2]} color="white" size={1} children={count.toString()} />
        <group rotation={[1.877, -0.345, 2.323]} scale={2.968}>
          <primitive object={nodes.Bone} />
          <primitive object={nodes.Bone003} />
          <primitive object={nodes.Bone006} />
          <primitive object={nodes.Bone010} />
          <skinnedMesh
            geometry={nodes.arm.geometry}
            material={materials.glove}
            skeleton={nodes.arm.skeleton}
          />
        </group>
        <group position={[0.405, 0, -0.373]} rotation={[0, -0.038, 0]} scale={141.943}>
          <mesh geometry={nodes.mesh.geometry} material={materials.wood} />
          <mesh geometry={nodes.mesh_1.geometry} material={materials.side} />
          <mesh geometry={nodes.mesh_2.geometry} material={materials.foam} />
          <mesh geometry={nodes.mesh_3.geometry} material={materials.lower} />
          <mesh geometry={nodes.mesh_4.geometry} material={materials.upper} />
        </group>
      </group>
    </mesh>
    </>
  );
}

function Ball() {
  const { nodes, materials } = useGLTF("/bubble.glb");
  const [ref] = useSphere(() => ({
    mass: 1,
    args: [0.5],
    position: [0, 5, 0],
    material: {
      restitution: 0.8,
      friction: 0.3,
    },
    collisionFilterGroup: 1,
    collisionResponse: true,
  }));

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <group scale={[0.5, 0.5, 0.5]}>
        <mesh
          geometry={nodes.Sphere.geometry}
          material={materials['Material.002']}
          material-transparent
          material-opacity={0.8}
        />
      </group>
    </mesh>
  );
}

function ContactGround() {
  const { reset } = useStore((state) => state.api);
  usePlane(() => ({
    type: "Static",
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -10, 0],
    onCollide: () => reset(true),
  }));
  return null;
}

export default function App() {
  const welcome = useStore((state) => state.welcome);
  const { reset } = useStore((state) => state.api);
  const onClick = useCallback(() => welcome && reset(false), [welcome, reset]);

  return (
    <div style={{ width: "100vw", height: "100vh" }} onClick={onClick}>
      <Canvas shadows camera={{ position: [0, 5, 12], fov: 50 }}>
        <color attach="background" args={["#f0f0f0"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[-10, -10, -10]} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <Physics
          iterations={20}
          tolerance={0.0001}
          defaultContactMaterial={{
            friction: 0.9,
            restitution: 0.7,
            contactEquationStiffness: 1e7,
            contactEquationRelaxation: 1,
            frictionEquationStiffness: 1e7,
            frictionEquationRelaxation: 2,
          }}
          gravity={[0, -40, 0]}
          allowSleep={false}>
          <mesh position={[0, 0, -10]} receiveShadow>
            <planeBufferGeometry attach="geometry" args={[1000, 1000]} />
            <meshPhongMaterial attach="material" color="#f26b84" />
          </mesh>
          <ContactGround />
          {!welcome && <Ball />}
          <Suspense fallback={null}>
            <Paddle />
          </Suspense>
        </Physics>
      </Canvas>
      {welcome && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "white" }}>
          Click to start
        </div>
      )}
    </div>
  );
}

useGLTF.preload("/pingpong.glb");
useGLTF.preload("/bubble.glb");