import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./css/Map.css";

// Import your GeoJSON file
import geojsonData from "./map.geojson";

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiZGVudmVybWF0ZW8iLCJhIjoiY20zamlmOGF6MDN0NzJ2cTRhbzRrZG4wbSJ9.bCOMerfFUiUVq5-iThc2Lg";

    // Initialize the map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [121.0562, 14.5547], // Center on Metro Manila
      zoom: 12,
      pitch: 45,
      bearing: 0,
      antialias: true,
      dragRotate: true, // Enable drag rotation
    });

    // Add navigation controls (for zooming and rotating)
    const navControl = new mapboxgl.NavigationControl({
      visualizePitch: true,
    });
    mapRef.current.addControl(navControl, "top-right");

    // Add 3D buildings
    mapRef.current.on("style.load", () => {
      const layers = mapRef.current.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === "symbol" && layer.layout["text-field"]
      ).id;

      mapRef.current.addLayer(
        {
          id: "add-3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        labelLayerId
      );
    });

    // Add markers
    const locations = [
      {
        coordinates: [121.0437, 14.5503],
        title: "Makati CBD",
        description: "Business district of Metro Manila.",
      },
      {
        coordinates: [121.0537, 14.6006],
        title: "Quezon City Memorial Circle",
        description: "A national park and shrine.",
      },
      {
        coordinates: [120.9818, 14.5794],
        title: "Intramuros, Manila",
        description: "Historic walled city in Manila.",
      },
    ];

    locations.forEach((location) => {
      const marker = new mapboxgl.Marker()
        .setLngLat(location.coordinates)
        .addTo(mapRef.current);

      marker.getElement().addEventListener("click", () => {
        setModalContent(location); // Set the clicked location as modal content
        setIsModalOpen(true); // Open the modal
      });
    });

    // Add GeoJSON layer for Maynilad-covered areas (boundary lines only)
    mapRef.current.on("load", () => {
      mapRef.current.addSource("maynilad-areas", {
        type: "geojson",
        data: geojsonData, // Use the imported GeoJSON file
      });

      // Add boundary lines for GeoJSON
      mapRef.current.addLayer({
        id: "maynilad-boundaries",
        type: "line",
        source: "maynilad-areas",
        paint: {
          "line-color": "#04364a", // Black outline
          "line-width": 3,
        },
      });
    });

    return () => mapRef.current.remove(); // Cleanup map on unmount
  }, []);

  return (
    <div className="map-container">
      <strong>Maynilad's Area of Concession</strong>
      <div
        className="map-content"
        style={{ position: "relative", height: "100%" }}
      >
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "100%" }}
          className="map-image"
        ></div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{modalContent?.title}</h2>
            <p>{modalContent?.description}</p>
            <button onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
