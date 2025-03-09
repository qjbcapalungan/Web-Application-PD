import React, { useState } from 'react';
import './css/MainPage.css';
import Sidebar from './Sidebar';
import Dataloggers from './Dataloggers';
import Map from './Map';

function MainPage() {


  // Make the condition true para lumabas yung barchart for dataloggers.6
  const [showDataloggers, setShowDataloggers] = useState(false); // Initially hidden

  return (
    <div className="main-page">
      <Sidebar />
      <div className="main-content">
        {showDataloggers && <Dataloggers />}
        <Map />
      </div>
    </div>
  );
}

export default MainPage;
