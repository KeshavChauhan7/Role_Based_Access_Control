import React from "react";
import { Routes, Route } from "react-router-dom";
import Register from "../../components/usercomponent/register";
import Login from "../../components/usercomponent/login";
import Viewfiles from "../../components/usercomponent/viewfiles";
import Reset from "../../components/usercomponent/reset";
const UserRoute = () => {
  return (
    <Routes>
      <Route exact path="/" element={<Viewfiles />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login></Login>} />
      <Route path="/reset" element={<Reset />} />
      <Route path="*" element={<>oops something went wrong!!!</>}></Route>
    </Routes>
  );
};

export default UserRoute;
