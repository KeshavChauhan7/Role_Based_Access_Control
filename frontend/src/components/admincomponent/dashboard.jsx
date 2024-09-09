import React, { useEffect, useState } from "react";
import axios from "axios";
import "./dashboard.css";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import Toast from "../../toast";
import { config } from "../../config/config";

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const inputFile = useRef();
  const navigate = useNavigate();
  const name = useRef();
  const email = useRef();
  const password = useRef();
  const [msg, setmsg] = useState();
  const [deletestatus, setdeletestatus] = useState(false);
  const [isdeleteclicked, setisdeleteclicked] = useState(false);
  const [iscreateclicked, setiscreateclicked] = useState(false);
  const [createstatus, setcreatestatus] = useState(false);
  const [status, setstatus] = useState(null);
  const [isAuth, setisAuth] = useState(false);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const result = await axios.get(
          `${config.backendBaseUrlForAdmin}/admin/users`,
          {
            headers: {
              token: localStorage.getItem("__admin__token"),
            },
          }
        );
        if (!result.data.status) {
          if (
            result.data.error === "token is invalid" ||
            result.data.error === "u are not admin!!!" ||
            result.data.error === "this Admin does not exist in db"
          )
            return navigate(`/admin/${process.env.REACT_APP_SECRET}/login`);
        }
        setisAuth(true);
        setUsers(result.data.result);
      } catch (error) {
        // console.log(error);
      }
    };
    getUsers();
  }, [deletestatus, createstatus]);

  const selectall = () => {
    const form = document.getElementById("form");
    if (document.querySelector('input[name="selectAll"]').checked) {
      const permissionCheckboxes = form.querySelectorAll(
        'input[name="permission"]'
      );
      permissionCheckboxes.forEach((checkbox) => {
        checkbox.checked = true;
      });
    } else {
      const permissionCheckboxes = form.querySelectorAll(
        'input[name="permission"]'
      );
      permissionCheckboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
    }
  };

  const True = (status, message) => {
    setstatus(status);
    setmsg(message);
  };
  const False = (status, error) => {
    setstatus(status);
    setmsg(error);
  };
  // const getUserDetail = async (uuid) => {
  //   try {
  //     const result = await axios.get(
  //       `${config.backendBaseUrlForAdmin}/admin/user/${uuid}`,
  //       {
  //         headers: {
  //           token: localStorage.getItem("__admin__token"),
  //         },
  //       }
  //     );
  //     console.log(result.data);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  const create = () => {
    const form = document.getElementById("form");
    form.style.display = "flex";
  };

  const uploaddata = async (event) => {
    setiscreateclicked(true);
    event.preventDefault();
    const form = document.getElementById("form");
    let roles = [];
    let role = document.getElementById("role").value;
    if (role === "none") return alert("Select a role");
    roles.push(role);

    //  if click on single then it selects all
    const permissionNodelist = form.querySelectorAll(
      'input[name="permission"]:checked'
    );
    let permissions = Array.from(permissionNodelist).map((e) => e.value);

    let data = {
      name: name.current.value,
      email: email.current.value,
      password: password.current.value,
      roles: roles,
      permissions: permissions,
    };

    const result = await axios.post(
      `${config.backendBaseUrlForAdmin}/admin/create/user`,
      JSON.stringify(data),
      {
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("__admin__token"),
        },
      }
    );

    result.data.status
      ? True(result.data.status, "Created!!!")
      : False(result.data.status, result.data.error);
    //  console.log(result.data)
    // result.data.status?setmsg("Created"):setmsg(result.data.error);

    setiscreateclicked(false);
    setcreatestatus(!createstatus);
  };
  const Delete = async (uuid) => {
    setisdeleteclicked(true);
    const result = await axios.delete(
      `${config.backendBaseUrlForAdmin}/admin/delete/${uuid}`,
      {
        headers: {
          token: localStorage.getItem("__admin__token"),
        },
      }
    );

    // result.data.status?setmsg("Deleted!!!"):setmsg(result.data.error);
    result.data.status
      ? True(result.data.status, "Deleted!!!")
      : False(result.data.status, result.data.error);

    setisdeleteclicked(false);
    setdeletestatus(!deletestatus);
  };
  const deleteall = async () => {
    setisdeleteclicked(true);
    const result = await axios.delete(
      `${config.backendBaseUrlForAdmin}/admin/delete/all/users`,
      {
        headers: {
          token: localStorage.getItem("__admin__token"),
        },
      }
    );
    result.data.status
      ? True(true, "Deleted!!!")
      : False(false, result.data.error);
    setisdeleteclicked(false);
    setdeletestatus(!deletestatus);
  };
  const logout = async () => {
    const result = await axios.get(
      `${config.backendBaseUrlForAdmin}/admin/logout`,
      {
        headers: {
          token: localStorage.getItem("__admin__token"),
        },
      }
    );
    const log = () => {
      localStorage.removeItem("__admin__token");
      navigate(`/admin/${process.env.REACT_APP_SECRET}/login`);
    };
    result.data.status ? log() : False(false, result.data.error);
  };
  return (
    <>
      {isAuth ? (
        <>
          <br />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button onClick={create}>Create new user</button>&nbsp;&nbsp;
            <button onClick={deleteall}>Delete All user(s)</button>&nbsp;&nbsp;
            <button onClick={logout}>Logout</button>
          </div>

          <form style={{ display: "none" }} id="form">
            <input ref={name} type="text" placeholder="Enter Name" />
            <input ref={email} type="email" placeholder="Enter email" />
            <input
              ref={password}
              type="password"
              placeholder="Enter password"
            />
            <div class="form-group">
              <label for="role">Roles:</label>
              <select id="role">
                <option value="none">Select</option>
                <option value="user" selected>
                  User
                </option>
              </select>
            </div>
            <div>
              <label>Permissions:</label>
              Select All{" "}
              <input
                onClick={selectall}
                style={{ border: "1px solid red" }}
                type="checkbox"
                name="selectAll"
              />
              <label>
                View
                <input type="checkbox" name="permission" value="view" />
              </label>
              <label>
                Delete
                <input type="checkbox" name="permission" value="delete" />
              </label>
              <label>
                Upload
                <input type="checkbox" name="permission" value="upload" />
              </label>
              <label>
                Generate
                <input type="checkbox" name="permission" value="shareable" />
              </label>
              <label>
                Download
                <input type="checkbox" name="permission" value="download" />
              </label>
              <label>
                Reset Password
                <input
                  type="checkbox"
                  name="permission"
                  value="reset-password"
                />
              </label>
            </div>
            <button disabled={iscreateclicked} onClick={uploaddata}>
              Create
            </button>
          </form>

          <h1
            style={{
              display: "flex",
              justifyContent: "center",
              backgroundColor: "rgb(0 255 205)",
            }}
          >
            <span>All user(s)</span>
          </h1>
          <div className="dashboard">
            {users?.map((user, index) => (
              <div
                className="user-card"
                key={index}
                onClick={() => {
                  navigate(
                    `/admin/${process.env.REACT_APP_SECRET}/user/${user.uuid}`
                  );
                }}
              >
                <span>Name:</span> <p className="user-info">{user.name}</p>
                <span>Email:</span> <p className="user-info">{user.email}</p>
                <span>Password:</span>{" "}
                <p className="user-info">{user.password}</p>
                <button
                  disabled={isdeleteclicked}
                  onClick={(e) => {
                    e.stopPropagation();
                    Delete(user.uuid);
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div>Authorization...</div>
      )}
      {msg && msg.length > 0 && (
        <Toast msg={msg} setmsg={setmsg} status={status} />
      )}
    </>
  );
};

export default Dashboard;
