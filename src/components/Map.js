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

  // State to store sensor values
  const [sensorValues, setSensorValues] = useState({
    sensor1: null,
    sensor2: null,
    sensor3: null,
  });

  // Fetch sensor data from the backend
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/sensor-data");
        const data = await response.json();
        setSensorValues({
          sensor1: data.sensor1,
          sensor2: data.sensor2,
          sensor3: data.sensor3,
        });
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    fetchSensorData();
  }, []);

  // Function to update sensor values
  const updateSensorValues = (sensor, value) => {
    setSensorValues((prevValues) => ({
      ...prevValues,
      [sensor]: value,
    }));
  };

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
    loader.load("/jemas2.glb", (gltf) => {
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

    // Create sensor value bar in 3D space
    const createSensorValueBar = () => {
      const sensorValueBar = new THREE.Group();

      const createTextSprite = (message, parameters = {}) => {
        const fontface = parameters.fontface || "Arial";
        const fontsize = parameters.fontsize || 18;
        const borderThickness = parameters.borderThickness || 4;
        const borderColor = parameters.borderColor || { r: 0, g: 0, b: 0, a: 1.0 };
        const backgroundColor = parameters.backgroundColor || { r: 255, g: 255, b: 255, a: 1.0 };

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = `${fontsize}px ${fontface}`;

        const metrics = context.measureText(message);
        const textWidth = metrics.width;

        context.fillStyle = `rgba(${backgroundColor.r},${backgroundColor.g},${backgroundColor.b},${backgroundColor.a})`;
        context.strokeStyle = `rgba(${borderColor.r},${borderColor.g},${borderColor.b},${borderColor.a})`;

        context.lineWidth = borderThickness;
        context.strokeRect(0, 0, textWidth + borderThickness, fontsize * 1.4 + borderThickness);
        context.fillRect(0, 0, textWidth + borderThickness, fontsize * 1.4 + borderThickness);

        context.fillStyle = "rgba(0, 0, 0, 1.0)";
        context.fillText(message, borderThickness, fontsize + borderThickness);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(5, 2.5, 1.0);
        return sprite;
      };

      const sensor1Text = createTextSprite(`Sensor 1: ${sensorValues.sensor1 !== null ? sensorValues.sensor1 : "Loading..."}`);
      sensor1Text.position.set(-10, 5, 0);
      sensorValueBar.add(sensor1Text);

      const sensor2Text = createTextSprite(`Sensor 2: ${sensorValues.sensor2 !== null ? sensorValues.sensor2 : "Loading..."}`);
      sensor2Text.position.set(0, 5, 0);
      sensorValueBar.add(sensor2Text);

      const sensor3Text = createTextSprite(`Sensor 3: ${sensorValues.sensor3 !== null ? sensorValues.sensor3 : "Loading..."}`);
      sensor3Text.position.set(10, 5, 0);
      sensorValueBar.add(sensor3Text);

      scene.add(sensorValueBar);
    };

    createSensorValueBar();

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

  const zoomToSensor = (x, y, z, targetX, targetY, targetZ, sensor) => {
    if (cameraRef.current && controlsRef.current) {
      gsap.to(cameraRef.current.position, { x, y, z, duration: 1.5, ease: "power2.inOut" });
      gsap.to(controlsRef.current.target, { x: targetX, y: targetY, z: targetZ, duration: 1.5, ease: "power2.inOut", onUpdate: () => controlsRef.current.update() });

      // Highlight the selected sensor value
      updateSensorValues(sensor, sensorValues[sensor]);
    }
  };

  const resetView = () => {
    zoomToSensor(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z, -0.56, -1.01, -8.59, "reset");
  };

  return (
    <div className="model-wrapper">
      <div ref={containerRef} className="model-container" />

      <div className="controls">
        <button onClick={() => zoomToSensor(-11.12, 5.20, 3.41, -14.09, 4.57, -0.13, "sensor1")}>Sensor 1</button>
        <button onClick={() => zoomToSensor(11.93, 6.07, 2.57, 5.18, 4.33, 6.81, "sensor2")}>Sensor 2</button>
        <button onClick={() => zoomToSensor(8.85, 5.36, -10.32, -0.21, 3.93, 1.32, "sensor3")}>Sensor 3</button>
        <button onClick={resetView}>Reset View</button>
      </div>
    </div>
  );
};

export default ModelViewer;