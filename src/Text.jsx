import * as THREE from "three";
import React, { useMemo } from "react";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import fontJson from "./resources/firasans_regular.json";

const font = new FontLoader().parse(fontJson);

const geom = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
  (number) =>
    new THREE.TextGeometry(number, {
      font,
      size: 5,
      height: 0.1,
    })
);

export default function Text({ color, children, ...props }) {
  const array = useMemo(() => [...children], [children]);

  return (
    <group {...props} dispose={null}>
      {array.map((char, index) => (
        <mesh
          key={index}
          position={[
            -(array.length / 2) * 3.5 + index * 3.5,
            0, // y position
            0, // z position
          ]}
          geometry={geom[parseInt(char)]}
        >
          <meshBasicMaterial
            attach="material"
            color={color || "white"}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
