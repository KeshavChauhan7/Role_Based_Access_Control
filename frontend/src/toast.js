import React from 'react';

const Toast = ({ msg,setmsg,status}) => {
  setTimeout(() => {
    setmsg("");

  }, 3000);
  return (
    <div
      style={{
        fontSize: ".9em",
        fontWeight:"600",
        color:status?"green":"red",
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "10px",
        background: "rgba(255, 255, 255, 0.8)",
        borderRadius: "5px",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)",
      }}
    >
      {msg}
    </div>
  );
}

export default Toast;
