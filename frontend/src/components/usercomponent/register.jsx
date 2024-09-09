import "./register.css";
import { useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Dna } from "react-loader-spinner";
import { config } from "../../config/config";
const Register = () => {
  const name = useRef();
  const email = useRef();
  const password = useRef();
  const [isClicked, setisClicked] = useState(false);
  const [result, setresult] = useState("");
  const register = async () => {
    setisClicked(true);
    const data = {
      name: name?.current?.value,
      email: email?.current?.value,
      password: password?.current?.value,
    };
    try {
      const res = await axios.post(
        `${config.backendBaseURLForUser}/register`,
        JSON.stringify(data),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setresult(res.data);
      setisClicked(false);
      setTimeout(() => {
        setresult("");
      }, 5000);
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
          {result?.status ? "Successfully Registered!!!" : result?.error}
        </div>
        <div>
          Already have an account!!! <Link to="/login">Login</Link>{" "}
        </div>
      </div>
    </>
  );
};

export default Register;
