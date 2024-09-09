import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminRoute from './allroutes/adminroutes/adminRoute';
import UserRoute from './allroutes/userroutes/userRoute';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route  exact path="/admin/*" element={<AdminRoute />} />
        <Route exact path="/*" element={<UserRoute />} />
      </Routes>
    </Router>
  );
};

export default App;
