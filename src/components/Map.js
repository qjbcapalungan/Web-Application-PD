import React from 'react';
import './css/Map.css'; 


function Map() {
  return (
    <div className="map-container">
      <titlemap>Digital Twin</titlemap>
      <div className="map-content">
        <img 
          src={process.env.PUBLIC_URL + '/westzoneofmetromanila.jpg'} 
          alt="West Zone of Metro Manila" 
          className="map-image"
        />
      </div>
    </div>
  );
}

export default Map;
