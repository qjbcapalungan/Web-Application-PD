import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import "./css/ModalViewer.css";
import { io } from "socket.io-client";

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

  // State to store sensor values
  const [sensorValues, setSensorValues] = useState({
    sensor1: null,
    sensor2: null,
    sensor3: null,
  });

  // State to store valve values (connected to MQTT broker)
  const [valveValues, setValveValues] = useState({
    valve1: null,
    valve2: null,
    valve3: null,
    valve4: null
  });
  
  // State to store current displayed actual sensor values
  const [actualSensorValues, setActualSensorValues] = useState({
    actualsensor1: null,
    actualsensor2: null,
    actualsensor3: null,
  });

  // State to store all actual sensor data arrays
  const [actualSensorData, setActualSensorData] = useState({
    actualsensor1: [],
    actualsensor2: [],
    actualsensor3: [],
  });

  // State to store the current index for each sensor
  const [currentIndexes, setCurrentIndexes] = useState(() => {
    const savedIndexes = localStorage.getItem('sensorIndexes');
    return savedIndexes ? JSON.parse(savedIndexes) : {
      actualsensor1: 0,
      actualsensor2: 0,
      actualsensor3: 0,
    };
  });

  // Save indexes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sensorIndexes', JSON.stringify(currentIndexes));
  }, [currentIndexes]);

  // State to store sensor values timestamps
  const [sensorTimestamps, setSensorTimestamps] = useState({
    actualsensor1: null,
    actualsensor2: null,
    actualsensor3: null,
  });

  // Utility function to check if data is stale (older than 15 minutes)
  const isDataStale = (timestamp) => {
    if (!timestamp) return true;

    // Convert timestamp string to Date object in Philippine time (UTC+8)
    const timestampDate = new Date(timestamp);
    const philippineTime = new Date(Date.now() + (8 * 60 * 60 * 1000)); // UTC+8

    // Get timestamps in milliseconds, adjusted for Philippine time
    const timestampMs = timestampDate.getTime();
    const currentMs = philippineTime.getTime();

    // Calculate difference in minutes
    const diffMinutes = (currentMs - timestampMs) / (1000 * 60);
    
    console.log('Timestamp (UTC):', timestampDate.toISOString());
    console.log('Current time (PHT):', philippineTime.toISOString());
    console.log('Difference in minutes:', diffMinutes);

    return diffMinutes > 15;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'No timestamp';
    // Simply format the timestamp from the API directly
    const date = new Date(timestamp);
    const formatNumber = (num) => String(num).padStart(2, '0');
    
    return `${date.getUTCFullYear()}-${formatNumber(date.getUTCMonth() + 1)}-${formatNumber(date.getUTCDate())} ${formatNumber(date.getUTCHours())}:${formatNumber(date.getUTCMinutes())}:${formatNumber(date.getUTCSeconds())}`;
  };

  // Fetch sensor data from the backend
  useEffect(() => {
    const fetchActualSensorData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/actualsensor-data");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Received sensor data:", data); // Debug log

        // Store timestamps and validate data freshness
        const timestamps = {
          actualsensor1: data.actualsensor1?.timestamp || null,
          actualsensor2: data.actualsensor2?.timestamp || null,
          actualsensor3: data.actualsensor3?.timestamp || null,
        };
        setSensorTimestamps(timestamps);

        // Only set data if it's not stale
        const newSensorData = {
          actualsensor1: !isDataStale(timestamps.actualsensor1) ? data.actualsensor1?.value || [] : [],
          actualsensor2: !isDataStale(timestamps.actualsensor2) ? data.actualsensor2?.value || [] : [],
          actualsensor3: !isDataStale(timestamps.actualsensor3) ? data.actualsensor3?.value || [] : [],
        };

        console.log("Processed sensor data:", newSensorData); // Debug log
        setActualSensorData(newSensorData);
        
        // Set initial values only for fresh data
        setActualSensorValues({
          actualsensor1: !isDataStale(timestamps.actualsensor1) ? newSensorData.actualsensor1[0] || null : null,
          actualsensor2: !isDataStale(timestamps.actualsensor2) ? newSensorData.actualsensor2[0] || null : null,
          actualsensor3: !isDataStale(timestamps.actualsensor3) ? newSensorData.actualsensor3[0] || null : null,
        });

        setCurrentIndexes({
          actualsensor1: 0,
          actualsensor2: 0,
          actualsensor3: 0,
        });
      } catch (error) {
        console.error("Error fetching actual sensor data:", error);
        setActualSensorValues({
          actualsensor1: null,
          actualsensor2: null,
          actualsensor3: null,
        });
      }
    };

    fetchActualSensorData();
    const dataInterval = setInterval(fetchActualSensorData, 15 * 60 * 1000);

    return () => clearInterval(dataInterval);
  }, []);

  // Cycle through PSI values every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndexes(prevIndexes => {
        // Only cycle if we have fresh data
        if ((actualSensorData.actualsensor1.length > 0 && !isDataStale(sensorTimestamps.actualsensor1)) || 
            (actualSensorData.actualsensor2.length > 0 && !isDataStale(sensorTimestamps.actualsensor2)) || 
            (actualSensorData.actualsensor3.length > 0 && !isDataStale(sensorTimestamps.actualsensor3))) {
          
          const newIndexes = {
            actualsensor1: !isDataStale(sensorTimestamps.actualsensor1) ? 
              (prevIndexes.actualsensor1 + 1) % (actualSensorData.actualsensor1.length || 1) : 0,
            actualsensor2: !isDataStale(sensorTimestamps.actualsensor2) ? 
              (prevIndexes.actualsensor2 + 1) % (actualSensorData.actualsensor2.length || 1) : 0,
            actualsensor3: !isDataStale(sensorTimestamps.actualsensor3) ? 
              (prevIndexes.actualsensor3 + 1) % (actualSensorData.actualsensor3.length || 1) : 0,
          };
          
          // Update the displayed values, setting to null if data is stale
          setActualSensorValues({
            actualsensor1: !isDataStale(sensorTimestamps.actualsensor1) ? 
              actualSensorData.actualsensor1[newIndexes.actualsensor1] : null,
            actualsensor2: !isDataStale(sensorTimestamps.actualsensor2) ? 
              actualSensorData.actualsensor2[newIndexes.actualsensor2] : null,
            actualsensor3: !isDataStale(sensorTimestamps.actualsensor3) ? 
              actualSensorData.actualsensor3[newIndexes.actualsensor3] : null,
          });
          
          return newIndexes;
        }
        return prevIndexes;
      });
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(interval);
  }, [actualSensorData, sensorTimestamps]);

  // Fetch forecasted sensor data from the backend
  useEffect(() => {
    const fetchForecastedSensorData = async () => {
      try {
        const response = await fetch("http://localhost:5001/forecasted_psi");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.status === 'ready') {
          setSensorValues({
            sensor1: data.sensor1?.[0] ?? null,
            sensor2: data.sensor2?.[0] ?? null,
            sensor3: data.sensor3?.[0] ?? null,
          });
        } else if (data.status === 'collecting') {
          console.log('Still collecting data:', data.progress.message);
        }
      } catch (error) {
        console.error("Error fetching forecasted sensor data:", error);
        setSensorValues({ sensor1: null, sensor2: null, sensor3: null });
      }
    };

    fetchForecastedSensorData();
    const interval = setInterval(fetchForecastedSensorData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Socket.IO connection for valve updates
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    socket.on("valve-update", (updatedValveStates) => {
      console.log("Received valve-update:", updatedValveStates);
      setValveValues(prev => ({
        ...prev,
        ...updatedValveStates
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Update valve text sprites when valveValues change
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;

    const updateValveTextSprites = () => {
      Object.keys(valveTextRefs.current).forEach(valveKey => {
        const ref = valveTextRefs.current[valveKey];
        if (ref && ref.sprite && ref.texture) {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          const fontsize = 18;
          const borderThickness = 4;
          const message = `Valve ${valveKey.slice(-1)}: ${valveValues[valveKey] !== null ? valveValues[valveKey].trim() : "Loading..."}`;
          
          // Determine border color based on valve state
          const borderColor = valveValues[valveKey] === "Open  " ? 
            "rgba(0, 180, 0, 1)" : // Darker green for open
            "rgba(200, 0, 0, 1)";   // Darker red for closed

          context.font = `${fontsize}px Arial`;
          const metrics = context.measureText(message);
          const textWidth = metrics.width;

          canvas.width = textWidth + borderThickness * 2;
          canvas.height = fontsize * 1.4 + borderThickness * 2;

          // Draw solid white background first
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);

          // Then draw the colored border
          context.strokeStyle = borderColor;
          context.lineWidth = borderThickness;
          context.strokeRect(0, 0, canvas.width, canvas.height);

          // Finally draw the text
          context.fillStyle = "rgba(0, 0, 0, 1)";
          context.font = `${fontsize}px Arial`;
          context.fillText(message, borderThickness, fontsize + borderThickness);

          ref.texture.image = canvas;
          ref.texture.needsUpdate = true;
        }
      });
    };

    updateValveTextSprites();
  }, [valveValues]);

  // Update sensor text sprites when sensorValues change
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;

    const updateSensorTextSprites = () => {
      Object.keys(sensorTextRefs.current).forEach(sensorKey => {
        const ref = sensorTextRefs.current[sensorKey];
        if (ref) {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          const fontsize = 18;
          const borderThickness = 4;
          
          // Get actual sensor value from state
          const actualValue = actualSensorValues[`actualsensor${sensorKey.slice(-1)}`];
          const forecastedValue = sensorValues[sensorKey];
          
          const messageLines = [
            `Actual Value: ${actualValue !== null ? actualValue.toFixed(2) : "Loading..."}`,
            `Forecasted Value: ${forecastedValue !== null ? forecastedValue.toFixed(2) : "Loading..."}`
          ];
          
          // Determine border color based on forecasted value
          let borderColor;
          if (forecastedValue === null) {
            borderColor = "rgba(100, 100, 100, 1)"; // Gray for loading/undefined
          } else {
            borderColor = forecastedValue < 7 ? 
              "rgba(200, 0, 0, 1)" : // Red for below 7
              "rgba(0, 180, 0, 1)";  // Green for 7 or above
          }

          context.font = `${fontsize}px Arial`;
          const metrics = messageLines.map(line => context.measureText(line));
          const textWidth = Math.max(...metrics.map(m => m.width));

          canvas.width = textWidth + borderThickness * 2;
          canvas.height = (fontsize * messageLines.length * 1.4) + borderThickness * 2;

          // Draw solid white background first
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);

          // Then draw the colored border
          context.strokeStyle = borderColor;
          context.lineWidth = borderThickness;
          context.strokeRect(0, 0, canvas.width, canvas.height);

          // Finally draw the text lines
          context.fillStyle = "rgba(0, 0, 0, 1)";
          context.font = `${fontsize}px Arial`;
          messageLines.forEach((line, index) => {
            context.fillText(
              line,
              borderThickness,
              fontsize + borderThickness + (index * fontsize * 1.4)
            );
          });

          ref.texture.image = canvas;
          ref.texture.needsUpdate = true;
        }
      });
    };

    updateSensorTextSprites();
  }, [sensorValues, actualSensorValues]);

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
    loader.load("/silano3.glb", (gltf) => {
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

      const createTextSprite = (message, sensorValue, sensorKey) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const fontsize = 18;
        const borderThickness = 4;
        
        // Get actual sensor value from state
        const actualValue = actualSensorValues[`actualsensor${sensorKey.slice(-1)}`];
        const forecastedValue = sensorValue;
        
        const messageLines = [
          `Actual Value: ${actualValue !== null ? actualValue.toFixed(2) : "Loading..."}`,
          `Forecasted Value: ${forecastedValue !== null ? forecastedValue.toFixed(2) : "Loading..."}`
        ];
        
        // Determine border color based on forecasted value
        let borderColor;
        if (forecastedValue === null) {
          borderColor = "rgba(100, 100, 100, 1)"; // Gray for loading/undefined
        } else {
          borderColor = forecastedValue < 7 ? 
            "rgba(200, 0, 0, 1)" : // Red for below 7
            "rgba(0, 180, 0, 1)";  // Green for 7 or above
        }

        context.font = `${fontsize}px Arial`;
        const metrics = messageLines.map(line => context.measureText(line));
        const textWidth = Math.max(...metrics.map(m => m.width));

        canvas.width = textWidth + borderThickness * 2;
        canvas.height = (fontsize * messageLines.length * 1.4) + borderThickness * 2;

        // Draw solid white background first
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Then draw the colored border
        context.strokeStyle = borderColor;
        context.lineWidth = borderThickness;
        context.strokeRect(0, 0, canvas.width, canvas.height);

        // Finally draw the text lines
        context.fillStyle = "rgba(0, 0, 0, 1)";
        context.font = `${fontsize}px Arial`;
        messageLines.forEach((line, index) => {
          context.fillText(
            line,
            borderThickness,
            fontsize + borderThickness + (index * fontsize * 1.4)
          );
        });

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(4, 2, 1); // Increased y-scale to accommodate two lines
        return { sprite, texture };
      };

      // Sensor 1
      const sensor1 = createTextSprite(
        `Sensor 1: ${sensorValues.sensor1 !== null ? sensorValues.sensor1 : "Loading..."}`,
        sensorValues.sensor1,
        "sensor1"
      );
      sensor1.sprite.position.set(sensorPositions.sensor1.x, sensorPositions.sensor1.y, sensorPositions.sensor1.z);
      sensorTextRefs.current.sensor1 = { sprite: sensor1.sprite, texture: sensor1.texture };
      sensorValueBar.add(sensor1.sprite);

      // Sensor 2
      const sensor2 = createTextSprite(
        `Sensor 2: ${sensorValues.sensor2 !== null ? sensorValues.sensor2 : "Loading..."}`,
        sensorValues.sensor2,
        "sensor2"
      );
      sensor2.sprite.position.set(sensorPositions.sensor2.x, sensorPositions.sensor2.y, sensorPositions.sensor2.z);
      sensorTextRefs.current.sensor2 = { sprite: sensor2.sprite, texture: sensor2.texture };
      sensorValueBar.add(sensor2.sprite);

      // Sensor 3
      const sensor3 = createTextSprite(
        `Sensor 3: ${sensorValues.sensor3 !== null ? sensorValues.sensor3 : "Loading..."}`,
        sensorValues.sensor3,
        "sensor3"
      );
      sensor3.sprite.position.set(sensorPositions.sensor3.x, sensorPositions.sensor3.y, sensorPositions.sensor3.z);
      sensorTextRefs.current.sensor3 = { sprite: sensor3.sprite, texture: sensor3.texture };
      sensorValueBar.add(sensor3.sprite);

      scene.add(sensorValueBar);
    };

    // Create valve value bar in 3D space
    const createValveValueBar = (valvePositions) => {
      const valveGroup = new THREE.Group();
      scene.add(valveGroup);

      Object.keys(valvePositions).forEach(valveKey => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const fontsize = 18;
        const borderThickness = 4;

        let stateText = "Loading";
        let borderColor = "rgba(128, 128, 128, 1)"; // Default gray for loading

        if (valveValues[valveKey] === "Open  ") {
          stateText = "Open  ";
          borderColor = "rgba(0, 180, 0, 1)";
        } else if (valveValues[valveKey] === "Closed") {
          stateText = "Closed";
          borderColor = "rgba(200, 0, 0, 1)";
        }

        const message = `Valve ${valveKey.slice(-1)}: ${stateText}`;
        
        context.font = `${fontsize}px Arial`;
        const metrics = context.measureText(message);
        const textWidth = metrics.width;

        canvas.width = textWidth + borderThickness * 2;
        canvas.height = fontsize * 1.4 + borderThickness * 2;

        // Draw solid white background first
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Then draw the colored border
        context.strokeStyle = borderColor;
        context.lineWidth = borderThickness;
        context.strokeRect(0, 0, canvas.width, canvas.height);

        // Finally draw the text
        context.fillStyle = "rgba(0, 0, 0, 1)";
        context.font = `${fontsize}px Arial`;
        context.fillText(message, borderThickness, fontsize + borderThickness);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial({ 
          map: texture,
          depthTest: false
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(4, 1, 1);
        sprite.position.set(
          valvePositions[valveKey].x,
          valvePositions[valveKey].y,
          valvePositions[valveKey].z
        );

        valveTextRefs.current[valveKey] = { sprite, texture };
        valveGroup.add(sprite);
      });
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

        const geometry = new THREE.SphereGeometry(0.1, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        scene.add(sphere);

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
      
      // Clean up valve group
      if (sceneRef.current) {
        const valveGroup = sceneRef.current.children.find(child => child instanceof THREE.Group);
        if (valveGroup) {
          sceneRef.current.remove(valveGroup);
        }
      }
    };
  }, []);

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
                Reading {currentIndexes.actualsensor1 + 1} of {actualSensorData.actualsensor1.length}
                <br />
                <span className="timestamp">
                  Last Updated: {formatTimestamp(sensorTimestamps.actualsensor1)}
                </span>
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
                Reading {currentIndexes.actualsensor2 + 1} of {actualSensorData.actualsensor2.length}
                <br />
                <span className="timestamp">
                  Last Updated: {formatTimestamp(sensorTimestamps.actualsensor2)}
                </span>
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
                Reading {currentIndexes.actualsensor3 + 1} of {actualSensorData.actualsensor3.length}
                <br />
                <span className="timestamp">
                  Last Updated: {formatTimestamp(sensorTimestamps.actualsensor3)}
                </span>
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