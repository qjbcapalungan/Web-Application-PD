import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import "./css/ModalViewer.css";

const ModelViewer = () => {
  const containerRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  let animationFrameId;

  const initialCameraPosition = { x: -21.77, y: 10.68, z: 9.76 };

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load("/JEMAS.glb", (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.5, 0.5, 0.5);
      model.position.set(2.8, -1, 0);
      scene.add(model);
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 1;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const zoomToSensor = (x, y, z, targetX, targetY, targetZ) => {
    if (cameraRef.current && controlsRef.current) {
      gsap.to(cameraRef.current.position, { x, y, z, duration: 1.5, ease: "power2.inOut" });
      gsap.to(controlsRef.current.target, { x: targetX, y: targetY, z: targetZ, duration: 1.5, ease: "power2.inOut", onUpdate: () => controlsRef.current.update() });
    }
  };

  const resetView = () => {
    zoomToSensor(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z, -0.56, -1.01, -8.59);
  };

  return (
    <div className="model-wrapper">
      <div ref={containerRef} className="model-container" />

      <div className="controls">
        <button onClick={() => zoomToSensor(-11.12, 5.20, 3.41, -14.09, 4.57, -0.13)}>Sensor 1</button>
        <button onClick={() => zoomToSensor(11.93, 6.07, 2.57, 5.18, 4.33, 6.81)}>Sensor 2</button>
        <button onClick={() => zoomToSensor(8.85, 5.36, -10.32, -0.21, 3.93, 1.32)}>Sensor 3</button>
        <button onClick={resetView}>Reset View</button>
      </div>
    </div>
  );
};

export default ModelViewer;
