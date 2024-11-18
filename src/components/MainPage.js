import React from 'react';
import './css/MainPage.css';
import Sidebar from './Sidebar';
import Dataloggers from './Dataloggers';
import Map from './Map';

function MainPage() {
  return (
    <div className="main-page">
      <Sidebar />
      <div className="main-content">
        <Dataloggers />
        <Map />
      </div>
    </div>
  );
}

export default MainPage;
