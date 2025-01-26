import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PsychologistDashboard from './components/PsychologistDashboard';
import ClientBooking from './components/ClientBooking';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ClientBooking />} />
        <Route path="/psychologist" element={<PsychologistDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;