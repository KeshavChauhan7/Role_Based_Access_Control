import axios from "axios";
import React, { useRef } from "react";
import { useState } from "react";
import { Dna } from "react-loader-spinner";
import { config } from "../../config/config";
const Reset = () => {
  const email = useRef();
  const [isClicked, setisClicked] = useState(false);
  const [result, setresult] = useState();
  const Email = async () => {
    setisClicked(true);
    const data = { email: email.current.value };
    const result = await axios.post(
      `${config.backendBaseUrlForAdmin}/reset/password`,
      JSON.stringify(data),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    setresult(result.data);

    setisClicked(false);
  };
  return (
    <div className="registration-form">
      <h2>Reset </h2>

      <div className="form-group">
        <label for="email">Enter your email</label>
        <input ref={email} type="email" id="email" className="p" />
      </div>

      <div className="form-group">
        <button disabled={isClicked} onClick={Email} id="submit">
          Email Me &nbsp;
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
    </div>
  );
};

export default Reset;
