import "./adminregister.css";
import { useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Dna } from "react-loader-spinner";
import { config } from "../../config/config";
const AdminRegister = () => {
  // these three ref for name , email and password
  const name = useRef();
  const email = useRef();
  const password = useRef();

  const [isClicked, setisClicked] = useState(false);
  const [result, setresult] = useState("");
  const register = async () => {
    setisClicked(true);
    try {
      const data = {
        name: name?.current?.value,
        email: email?.current?.value,
        password: password?.current?.value,
      };
      const res = await axios.post(
        `${config.backendBaseUrlForAdmin}/admin/create/new/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`,
        JSON.stringify(data),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(res.data);
      setresult(res.data);
      setisClicked(false);
      setTimeout(() => {
        setresult("");
      }, 10000);
    } catch (e) {
      // console.log(e)
    }
  };
  return (
    <>
      <div class="registration-form">
        <h2>Register </h2>
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
          <label for="email">Email</label>
          <input
            ref={email}
            type="email"
            id="email"
            name="email"
            className="e"
            required
          />
          <span class="error" id="email-error"></span>
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
          <button disabled={isClicked} onClick={register} id="submit">
            Register &nbsp;&nbsp;{" "}
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
          {result?.status ? result?.result : result?.error}
        </div>
        <div>
          Already have an account!!!{" "}
          <Link to={`/admin/${process.env.REACT_APP_SECRET}/login`}>Login</Link>{" "}
        </div>
      </div>
    </>
  );
};

export default AdminRegister;
