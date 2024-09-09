import React from "react";
import { useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Dna } from "react-loader-spinner";
import { config } from "../../config/config";
const AdminLogin = () => {
  const name = useRef();
  const password = useRef();
  const navigate = useNavigate();
  const [isClicked, setisClicked] = useState(false);
  const [result, setresult] = useState("");
  const login = async () => {
    setisClicked(true);
    const data = {
      name: name?.current?.value,
      password: password?.current?.value,
    };
    try {
      const res = await axios.post(
        `${config.backendBaseUrlForAdmin}/admin/login`,
        JSON.stringify(data),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      localStorage.setItem("__admin__token", res.data.result);
      setresult(res.data);
      setisClicked(false);
      setTimeout(() => {
        setresult("");
      }, 5000);
      setTimeout(() => {
        res.data.status
          ? navigate(`/admin/${process.env.REACT_APP_SECRET}/dashboard`)
          : navigate(`/admin/${process.env.REACT_APP_SECRET}/login`);
      }, 1000);
    } catch (e) {
      // console.log(e)
    }
  };

  return (
    <>
      <div class="registration-form">
        <h2>Login </h2>

        <div class="form-group">
          <label for="name">Name</label>
          <input
            ref={name}
            type="text"
            id="name"
            name="name"
            className="n"
            required
          />
          <span class="error" id="name-error"></span>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            ref={password}
            type="password"
            id="password"
            name="password"
            className="p"
            required
          />
          <span class="error" id="password-error"></span>
        </div>

        <div class="form-group">
          <button disabled={isClicked} onClick={login} id="submit">
            Login &nbsp;
            <Dna
              visible={isClicked}
              height="20"
              width="20"
              ariaLabel="dna-loading"
              wrapperStyle={{ position: "relative", bottom: "-5px" }}
              wrapperClass="dna-wrapper"
            />
          </button>
        </div>
        <div
          style={{
            color: result?.status ? "green" : "red",
            fontSize: "15px",
            fontWeight: "600",
          }}
        >
          {result?.status ? "Successfully Login!!!" : result?.error}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Link to={`/admin/${process.env.REACT_APP_SECRET}/reset-password`}>
            Forget Password?
          </Link>
        </div>

        <div>
          Do not have an account!!!{" "}
          <Link to={`/admin/${process.env.REACT_APP_SECRET}/register`}>
            Register
          </Link>{" "}
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
