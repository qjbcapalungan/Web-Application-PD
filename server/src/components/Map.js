import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import "./css/ModalViewer.css";
import { io } from "socket.io-client";
import { useForecastData } from '../hooks/useForecastData';
import { useSensorData } from '../contexts/SensorDataContext';

const ModelViewer = () => {
  const containerRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const valveTextRefs = useRef({
    valve1: null,
    valve2: null,
    valve3: null,
    valve4: null
  });
  const sensorTextRefs = useRef({
    sensor1: null,
    sensor2: null,
    sensor3: null
  });
  let animationFrameId;

  const initialCameraPosition = { x: -21.77, y: 10.68, z: 9.76 };

  const { 
    actualSensorValues, 
    setActualSensorValues, // Make sure to get this from context
    currentIndexes,
    lastUpdate,
    isLoading,
    updateSensorData  // Optional: use the context's update function if available
  } = useSensorData();

  const [valveValues, setValveValues] = React.useState({
    valve1: "Unknown",
    valve2: "Unknown",
    valve3: "Unknown",
    valve4: "Unknown"
  });

  const forecastData = useForecastData();

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'No timestamp';
    const date = new Date(timestamp);
    const formatNumber = (num) => String(num).padStart(2, '0');
    
    return `${date.getUTCFullYear()}-${formatNumber(date.getUTCMonth() + 1)}-${formatNumber(date.getUTCDate())} ${formatNumber(date.getUTCHours())}:${formatNumber(date.getUTCMinutes())}:${formatNumber(date.getUTCSeconds())}`;
  };

  const getSensorStatus = (pressure) => {
    if (pressure === null || pressure === undefined || isNaN(pressure)) return 'unavailable';
    if (pressure < 4) return 'critical';
    if (pressure < 7) return 'warning';
    return 'normal';
  };

  useEffect(() => {
    const fetchActualSensorData = async () => {
      try {
        const response = await fetch("http://178.128.48.126:8081/api/actualsensor-data");
        const data = await response.json();
        
        // Use updateSensorData if available, otherwise use setActualSensorValues
        if (updateSensorData) {
          updateSensorData(data);
        } else {
          setActualSensorValues(prevValues => ({
            ...prevValues,
            actualsensor1: data.actualsensor1?.value[currentIndexes.actualsensor1] || null,
            actualsensor2: data.actualsensor2?.value[currentIndexes.actualsensor2] || null,
            actualsensor3: data.actualsensor3?.value[currentIndexes.actualsensor3] || null,
          }));
        }
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    fetchActualSensorData();
    const interval = setInterval(fetchActualSensorData, 60000);
    return () => clearInterval(interval);
  }, [currentIndexes, setActualSensorValues, updateSensorData]);

  useEffect(() => {
    console.log('Initializing Socket.IO connection...');
    const socket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("valve-update", (updatedValveStates) => {
      console.log("Received valve states:", updatedValveStates);
      setValveValues(updatedValveStates);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    return () => {
      console.log('Cleaning up Socket.IO connection...');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load("/silano4.glb", (gltf) => {
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

    const createTextSprite = (message, key, isValve = false) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const fontsize = isValve ? 24 : 28; // Reduced from 36/40
      const borderThickness = 4; // Reduced from 6
      const borderRadius = 8; // Reduced from 10
      
      let messageLines = [];
      let borderColor, backgroundColor;
      
      if (isValve) {
        const state = valveValues[key];
        if (state === "Unknown") {
          borderColor = "rgba(180, 180, 180, 0.9)"; // Gray for unknown
          backgroundColor = "rgba(240, 240, 240, 0.95)";
        } else if (state === "Open  ") {
          borderColor = "rgba(40, 167, 69, 0.9)";
          backgroundColor = "rgba(235, 255, 235, 0.95)";
        } else if (state === "Closed") {
          borderColor = "rgba(220, 53, 69, 0.9)";
          backgroundColor = "rgba(255, 235, 235, 0.95)";
        }
        messageLines = [`${key}: ${state || 'Loading...'}`];
      } else {
        const sensorNumber = key.slice(-1);
        const actualValue = actualSensorValues[`actualsensor${sensorNumber}`];
        const forecastedValue = forecastData[`sensor${sensorNumber}`];
        
        // Default to gray if no values are available
        if (actualValue === null && forecastedValue === null) {
          borderColor = "rgba(180, 180, 180, 0.9)";
          backgroundColor = "rgba(240, 240, 240, 0.95)";
        } else if (actualValue < 4) {
          borderColor = "rgba(220, 53, 69, 0.9)";
          backgroundColor = "rgba(255, 235, 235, 0.95)";
        } else if (actualValue < 7) {
          borderColor = "rgba(255, 193, 7, 0.9)";
          backgroundColor = "rgba(255, 250, 235, 0.95)";
        } else {
          borderColor = "rgba(40, 167, 69, 0.9)";
          backgroundColor = "rgba(235, 255, 235, 0.95)";
        }
        
        messageLines = [
          `Actual: ${actualValue !== null ? actualValue.toFixed(2) : 'N/A'} PSI`,
          `Forecast: ${forecastedValue !== null ? forecastedValue.toFixed(2) : 'N/A'} PSI`
        ];
      }

      context.font = `bold ${fontsize}px Arial`;
      const metrics = messageLines.map(line => context.measureText(line));
      const textWidth = Math.max(...metrics.map(m => m.width));
      
      canvas.width = textWidth + borderThickness * 4;
      canvas.height = (fontsize * messageLines.length * 1.2) + borderThickness * 3; // Reduced vertical spacing

      context.font = `bold ${fontsize}px Arial`;

      context.shadowColor = 'rgba(0, 0, 0, 0.3)';
      context.shadowBlur = 8;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      
      context.beginPath();
      context.roundRect(0, 0, canvas.width, canvas.height, borderRadius);
      context.fillStyle = backgroundColor;
      context.fill();

      context.shadowColor = 'transparent';
      context.strokeStyle = borderColor;
      context.lineWidth = borderThickness;
      context.stroke();

      context.fillStyle = "rgba(0, 0, 0, 0.9)";
      messageLines.forEach((line, index) => {
        context.fillText(
          line,
          borderThickness * 2,
          fontsize * 0.9 + (index * fontsize * 1.2)
        );
      });

      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;

      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true
      });
      
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(5, isValve ? 1.5 : 2, 1); // Reduced from 6/2
      return { sprite, texture };
    };

    const createSensorValueBar = (sensorPositions) => {
      const sensorValueBar = new THREE.Group();

      Object.entries(sensorPositions).forEach(([key, pos]) => {
        const sensorSprite = createTextSprite("Loading...", key);
        sensorSprite.sprite.position.set(pos.x, pos.y, pos.z);
        sensorTextRefs.current[key] = { sprite: sensorSprite.sprite, texture: sensorSprite.texture };
        sensorValueBar.add(sensorSprite.sprite);
      });

      scene.add(sensorValueBar);
    };

    const createValveValueBar = (valvePositions) => {
      const valveGroup = new THREE.Group();

      Object.entries(valvePositions).forEach(([key, pos]) => {
        const valveSprite = createTextSprite(key, key, true);
        valveSprite.sprite.position.set(pos.x, pos.y, pos.z);
        valveTextRefs.current[key] = { sprite: valveSprite.sprite, texture: valveSprite.texture };
        valveGroup.add(valveSprite.sprite);
      });

      scene.add(valveGroup);
    };

    const sensorPositions = {
      sensor1: { x: -15.8, y: 6.3 + 0.8, z: -1.0102 },
      sensor2: { x: 8.57, y: 6.57 + 0.8, z: 4.47 },
      sensor3: { x: 6.68, y: 6.59 + 0.8, z: -7.44 },
    };

    const valvePositions = {
      valve1: { x: -3.75, y: 5.82, z: 4.57 },
      valve2: { x: -3.79, y: 5.81, z: -7.39 },
      valve3: { x: 18.57, y: 1.28, z: 5.85 },
      valve4: { x: 18.58, y: 1.28, z: -8.85 }
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

    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    
    Object.entries(valveTextRefs.current).forEach(([key, ref]) => {
      if (ref && ref.sprite && ref.texture) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        ref.texture.image = canvas;
        ref.texture.needsUpdate = true;
      }
    });
  }, [valveValues]);

  useEffect(() => {
    if (!sceneRef.current || isLoading) return;
    
    Object.entries(sensorTextRefs.current).forEach(([key, ref]) => {
      if (ref && ref.sprite && ref.texture) {
        // Update text sprites with new data
        ref.texture.needsUpdate = true;
      }
    });
  }, [actualSensorValues, forecastData, lastUpdate]);

  const zoomToSensor = (x, y, z, targetX, targetY, targetZ, sensor) => {
    if (cameraRef.current && controlsRef.current) {
      gsap.to(cameraRef.current.position, { x, y, z, duration: 1.5, ease: "power2.inOut" });
      gsap.to(controlsRef.current.target, { 
        x: targetX, 
        y: targetY, 
        z: targetZ, 
        duration: 1.5, 
        ease: "power2.inOut", 
        onUpdate: () => controlsRef.current.update() 
      });
    }
  };

  const resetView = () => {
    zoomToSensor(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z + 3, -3.56, -5.01, -3.59, "reset");
  };

  return (
    <div className="model-wrapper">
      <div ref={containerRef} className="model-container" />
      <div className="controls">
        <div className="control-group">
          <div className="sensor-value-display">
            {actualSensorValues.actualsensor1 !== null ? (
              <>
                Current: {actualSensorValues.actualsensor1.toFixed(2)} PSI
                <br />
                Reading {currentIndexes.actualsensor1 + 1}
                <br />
              </>
            ) : (
              "No data available"
            )}
          </div>
          <button
            onClick={() => zoomToSensor(-11.12, 5.20, 3.41, -14.09, 4.57, -0.13, "sensor1")}
            className="sensor-btn"
          >
            <i className="fas fa-thermometer-half"></i> Sensor 1
          </button>
        </div>
        
        <div className="control-group">
          <div className="sensor-value-display">
            {actualSensorValues.actualsensor2 !== null ? (
              <>
                Current: {actualSensorValues.actualsensor2.toFixed(2)} PSI
                <br />
                Reading {currentIndexes.actualsensor2 + 1}
                <br />
              </>
            ) : (
              "No data available"
            )}
          </div>
          <button
            onClick={() => zoomToSensor(11.93, 8.07, -2.57, 5.18, 4.33, 6.81, "sensor2")}
            className="sensor-btn"
          >
            <i className="fas fa-thermometer-half"></i> Sensor 2
          </button>
        </div>
        
        <div className="control-group">
          <div className="sensor-value-display">
            {actualSensorValues.actualsensor3 !== null ? (
              <>
                Current: {actualSensorValues.actualsensor3.toFixed(2)} PSI
                <br />
                Reading {currentIndexes.actualsensor3 + 1}
                <br />
              </>
            ) : (
              "No data available"
            )}
          </div>
          <button
            onClick={() => zoomToSensor(8.85, 5.36, -12.32, -0.21, 3.93, 1.70, "sensor3")}
            className="sensor-btn"
          >
            <i className="fas fa-thermometer-half"></i> Sensor 3
          </button>
        </div>
        
        <div className="control-group">
          <div className="sensor-value-display dummy"></div>
          <button
            onClick={resetView}
            className="reset-btn"
          >
            <i className="fas fa-home"></i> Reset View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelViewer;