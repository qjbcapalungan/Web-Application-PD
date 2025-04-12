import React, { useState } from 'react';
import './css/MainPage.css';
import Sidebar from './Sidebar';
import Map from './Map';

function MainPage() {


  // Make the condition true para lumabas yung barchart for dataloggers.6

  return (
    <div className="main-page">
      <Sidebar />
      <div className="main-content">
        <Map />
      </div>
    </div>
  );
}

export default MainPage;
