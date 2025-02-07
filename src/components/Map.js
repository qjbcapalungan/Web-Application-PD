import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./css/ModalViewer.css"; // Corrected import path for the CSS file

const ModelViewer = () => {
  const containerRef = useRef(null); // Reference for the container
  const cameraRef = useRef(null); // Reference to the camera

  useEffect(() => {
    // Create scene
    const scene = new THREE.Scene();

    // Set up camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 5); // Adjusted for better visibility
    cameraRef.current = camera; // Store camera reference

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);  // Make renderer size match window dimensions
    containerRef.current.appendChild(renderer.domElement);  // Add the renderer to the container

    // Add lighting
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load GLB Model
    const loader = new GLTFLoader();
    loader.load("/JEMAS.glb", (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.5, 0.5, 0.5); // Scale down the model
      model.position.set(0, -1, 0); // Lower it by decreasing the Y value
      scene.add(model);
      animate();
    });

    // Add Orbit Controls for rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth rotation
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 1;
    controls.enableZoom = false; // Disable zoom if not needed
    controls.update();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Update rotation
      renderer.render(scene, camera);
    };

    // Handle resizing
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Handle scroll to zoom out (change camera's Z position)
    const handleScroll = (event) => {
      const zoomSpeed = 0.1; // Adjust speed of zoom
      const currentCameraZ = camera.position.z;

      // If scrolling down, zoom out by moving the camera further away
      if (event.deltaY > 0) {
        camera.position.z += zoomSpeed;
      } else {
        // If scrolling up, zoom in by moving the camera closer
        if (currentCameraZ > 1) {
          camera.position.z -= zoomSpeed;
        }
      }
    };

    window.addEventListener("wheel", handleScroll);

    return () => {
      containerRef.current.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("wheel", handleScroll);
    };
  }, []);

  return <div ref={containerRef} className="model-container" />; // Attach the ref to the div
};

export default ModelViewer;
