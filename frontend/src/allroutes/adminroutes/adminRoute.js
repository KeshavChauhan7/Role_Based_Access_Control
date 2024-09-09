import React from "react";
import { Route, Routes } from "react-router-dom";
import AdminRegister from "../../components/admincomponent/adminregister";
import AdminLogin from "../../components/admincomponent/adminlogin";
import Dashboard from "../../components/admincomponent/dashboard";
import Auser from "../../components/admincomponent/auser";
import Reset from "../../components/admincomponent/reset";

const AdminRoute = () => {
    return (
    <Routes>
      <Route exact path={`${process.env.REACT_APP_SECRET}/register`} element=
       {<AdminRegister />} />
       <Route  path={`${process.env.REACT_APP_SECRET}/login`}  element={<AdminLogin />}  />
       <Route  path={`${process.env.REACT_APP_SECRET}/dashboard`}  element={<Dashboard />}  />
       <Route path={`${process.env.REACT_APP_SECRET}/user/:uuid`}  element={<Auser />}/>
       <Route path={`${process.env.REACT_APP_SECRET}/reset-password`}  element={<Reset />}/>

          <Route path="/*" element={<div>OOPS something went wrong!!!</div>} />
    </Routes>
    );
    };

    export  default  AdminRoute;
