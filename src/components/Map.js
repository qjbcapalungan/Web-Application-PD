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

  // State to store valve values
  const [valveValues, setValveValues] = useState({
    valve1: null,
    valve2: null,
    valve3: null,
    valve4: null,
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

  // Fetch valve data from the backend
  useEffect(() => {
    const fetchValveData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/valve-data");
        const data = await response.json();
        setValveValues({
          valve1: data.valve1,
          valve2: data.valve2,
          valve3: data.valve3,
          valve4: data.valve4,
        });
      } catch (error) {
        console.error("Error fetching valve data:", error);
      }
    };

    fetchValveData();
  }, []);

  // Function to update sensor values
  const updateSensorValues = (sensor, value) => {
    setSensorValues((prevValues) => ({
      ...prevValues,
      [sensor]: value,
    }));
  };

  // Function to update valve values
  const updateValveValues = (valve, value) => {
    setValveValues((prevValues) => ({
      ...prevValues,
      [valve]: value,
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
    const createSensorValueBar = (sensorPositions) => {
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
      sensor1Text.position.set(sensorPositions.sensor1.x, sensorPositions.sensor1.y, sensorPositions.sensor1.z);
      sensorValueBar.add(sensor1Text);

      const sensor2Text = createTextSprite(`Sensor 2: ${sensorValues.sensor2 !== null ? sensorValues.sensor2 : "Loading..."}`);
      sensor2Text.position.set(sensorPositions.sensor2.x, sensorPositions.sensor2.y, sensorPositions.sensor2.z);
      sensorValueBar.add(sensor2Text);

      const sensor3Text = createTextSprite(`Sensor 3: ${sensorValues.sensor3 !== null ? sensorValues.sensor3 : "Loading..."}`);
      sensor3Text.position.set(sensorPositions.sensor3.x, sensorPositions.sensor3.y, sensorPositions.sensor3.z);
      sensorValueBar.add(sensor3Text);

      // Log the world positions of the sensor texts
      sensor1Text.getWorldPosition(new THREE.Vector3());
      console.log(`Sensor 1 world position: x=${sensor1Text.position.x}, y=${sensor1Text.position.y}, z=${sensor1Text.position.z}`);
      sensor2Text.getWorldPosition(new THREE.Vector3());
      console.log(`Sensor 2 world position: x=${sensor2Text.position.x}, y=${sensor2Text.position.y}, z=${sensor2Text.position.z}`);
      sensor3Text.getWorldPosition(new THREE.Vector3());
      console.log(`Sensor 3 world position: x=${sensor3Text.position.x}, y=${sensor3Text.position.y}, z=${sensor3Text.position.z}`);

      scene.add(sensorValueBar);
    };

    // Create valve value bar in 3D space
    const createValveValueBar = (valvePositions) => {
      const valveValueBar = new THREE.Group();

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

      const valve1Text = createTextSprite(`Valve 1: ${valveValues.valve1 !== null ? valveValues.valve1 : "Loading..."}`);
      valve1Text.position.set(valvePositions.valve1.x, valvePositions.valve1.y, valvePositions.valve1.z);
      valveValueBar.add(valve1Text);

      const valve2Text = createTextSprite(`Valve 2: ${valveValues.valve2 !== null ? valveValues.valve2 : "Loading..."}`);
      valve2Text.position.set(valvePositions.valve2.x, valvePositions.valve2.y, valvePositions.valve2.z);
      valveValueBar.add(valve2Text);

      const valve3Text = createTextSprite(`Valve 3: ${valveValues.valve3 !== null ? valveValues.valve3 : "Loading..."}`);
      valve3Text.position.set(valvePositions.valve3.x, valvePositions.valve3.y, valvePositions.valve3.z);
      valveValueBar.add(valve3Text);

      const valve4Text = createTextSprite(`Valve 4: ${valveValues.valve4 !== null ? valveValues.valve4 : "Loading..."}`);
      valve4Text.position.set(valvePositions.valve4.x, valvePositions.valve4.y, valvePositions.valve4.z);
      valveValueBar.add(valve4Text);

      scene.add(valveValueBar);
    };

    const sensorPositions = {
      sensor1: { x: -15.8, y: 6.3, z: -1.0102 },
      sensor2: { x: 8.57, y: 6.57, z: 4.47 },
      sensor3: { x: 6.68, y: 6.59, z: -7.44 },
    };

    const valvePositions = {
      valve1: { x: -3.75, y: 4.82, z: 4.57 },
      valve2: { x: -3.79, y: 4.81, z: -7.39},
      valve3: { x: 18.57, y: -0.72, z: 4.55},
      valve4: { x: 18.58, y: -0.72, z: -7.55},
    };

    createSensorValueBar(sensorPositions);
    createValveValueBar(valvePositions);

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

    const logCoordinates = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const { x, y, z } = intersects[0].point;
        console.log(`Clicked coordinates: x=${x}, y=${y}, z=${z}`);

        // Create a visual indicator at the clicked position
        const geometry = new THREE.SphereGeometry(0.1, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        scene.add(sphere);

        // Log the world position of the sphere
        const worldPosition = new THREE.Vector3();
        sphere.getWorldPosition(worldPosition);
        console.log(`World position of indicator: x=${worldPosition.x}, y=${worldPosition.y}, z=${worldPosition.z}`);

        // Remove the indicator after a short delay
        setTimeout(() => {
          scene.remove(sphere);
        }, 2000);
      }
    };

    renderer.domElement.addEventListener("click", logCoordinates);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", logCoordinates);
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