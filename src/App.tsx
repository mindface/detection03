import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

import { PartsFooter } from './components/PartsFooter'
import { PartsHeader } from './components/PartsHeader'
import { ContentPoseDetection } from './components/ContentPoseDetection'
import { ContentPoseTree } from './components/ContentPoseTree'
import { DataProvider } from "./context/data";


function App() {
  const [tab, setTab] = useState("movie");

  const tabAction = (id: string) => {
    setTab(id);
  }
  return (
    <div className="App">
      <DataProvider>
        <PartsHeader tabAction={tabAction} />
        {tab === 'movie' && <ContentPoseDetection />}
        {tab === 'data' && <ContentPoseTree />}
        {tab === 'selectView' && <ContentPoseTree />}
        <PartsFooter />
      </DataProvider>
    </div>
  );
}

export default App;
