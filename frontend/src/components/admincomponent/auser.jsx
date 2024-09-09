import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./auser.css";
import Toast from "../../toast";
import { config } from "../../config/config";

const Auser = () => {
  const params = useParams();
  const [res, setRes] = useState();
  const expiretime = useRef();
  const [isDeleteClicked, setisDeleteClicked] = useState(false);
  const [deletestatus, setdeletestatus] = useState(false);
  const [msg, setmsg] = useState();
  const [uploadstatus, setuploadstatus] = useState(false);
  const [isuploadclicked, setisuploadclicked] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setprogress] = useState();
  const [toggleID, settoggleID] = useState();
  const [status, setstatus] = useState(null);
  const name = useRef();
  const email = useRef();
  const password = useRef();
  const [isAuth, setisAuth] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [filesfordisplay, setfilesfordisplay] = useState();

  const True = (status, message) => {
    setstatus(status);
    setmsg(message);
  };
  const False = (status, error) => {
    setstatus(status);
    setmsg(error);
  };
  const getUser = async () => {
    try {
      const result = await axios.get(
        `${config.backendBaseUrlForAdmin}/admin/user/${params.uuid}`,
        {
          headers: {
            token: localStorage.getItem("__admin__token"),
          },
        }
      );
      if (!result.data.status) {
        if (
          result.data.error === "this Admin does not exist in db" ||
          result.data.error === "token is invalid" ||
          result.data.error === "u  do not have permission to view"
        )
          return navigate(`/admin/${process.env.REACT_APP_SECRET}/login`);
        else {
          False(false, result.data.error);
          setTimeout(
            navigate(`/admin/${process.env.REACT_APP_SECRET}/dashboard`),
            4000
          );
        }
      }
      setRes(result.data.result[0]);
      setisAuth(true);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getUser();
  }, [deletestatus, uploadstatus]);

  const renderRoles = () => {
    return res?.roles[0]?.roles?.map((role, index) => (
      <span className="role" key={index}>
        {role}
      </span>
    ));
  };

  const renderPermissions = () => {
    return res?.permissions[0]?.permissions?.map((permission, index) => (
      <span className="permission" key={index}>
        "{permission}"&nbsp;&nbsp;&nbsp;&nbsp;
      </span>
    ));
  };
  const Delete = async (id) => {
    setisDeleteClicked(true);
    try {
      const result = await axios.delete(
        `${config.backendBaseUrlForAdmin}/admin/delete/file/${params.uuid}/${id}`,
        {
          headers: {
            token: localStorage.getItem("__admin__token"),
          },
        }
      );
      setdeletestatus(!deletestatus);
      // setmsg(result.data.status ? "Deleted" : result.data.error);
      result.data.status
        ? True(result.data.status, "Deleted!!!")
        : False(result.data.status, result.data.error);
    } catch (e) {
      // console.log(e)
    }

    setisDeleteClicked(false);
  };

  const updatefile = async (id) => {
    settoggleID(id);
  };
  const updateTime = async (id) => {
    try {
      const result = await axios.put(
        `${config.backendBaseUrlForAdmin}/admin/update/file/${params.uuid}/${id}`,
        JSON.stringify({ expireIn: expiretime?.current?.value }),
        {
          headers: {
            token: localStorage.getItem("__admin__token"),
            "Content-Type": "application/json",
          },
        }
      );
      // result.data.status?setmsg("Time updated!!!"):setmsg(result.data.error)
      result.data.status
        ? True(result.data.status, "Time Updated!!!")
        : False(result.data.status, result.data.error);
    } catch (e) {
      // console.log(e)
    }
  };
  const download = async (id) => {
    const token = localStorage.getItem("__admin__token");
    const url = `${config.backendBaseUrlForAdmin}/admin/download/${params.uuid}/${id}/${token}`;
    window.location.href = url;
  };
  const renderFile = () => {
    return res?.filedatas[0]?.details?.map((file, index) => {
      let time = new Date(file.expireIn * 1000).toLocaleString();
      let sizeinbytes = file.size;
      let sizeinkb = (parseFloat(sizeinbytes) / 1024).toFixed(2);
      let sizeinmb = (parseFloat(sizeinbytes) / (1024 * 1024)).toFixed(2);
      return (
        <div className="user-card" key={index}>
          <span>FIleName:</span> <p className="user-info">{file.file_name} </p>
          <p>
            Type: <span>{file.mimetype}</span>{" "}
          </p>
          <p>
            Size: <span>{`${sizeinkb} Kb || ${sizeinmb} Mb`}</span>{" "}
          </p>
          <span>ExpireIn:</span> <p className="user-info">{time}</p>
          <span>Shareable Mode:</span>{" "}
          <p className="user-info">{JSON.stringify(file.isShareable)}</p>
          <span>Id :</span> <p className="user-info">{file.id}</p>
          <button
            onClick={() => {
              updatefile(file.id);
            }}
          >
            Update
          </button>{" "}
          &nbsp;&nbsp;
          <button
            disabled={isDeleteClicked}
            onClick={() => {
              Delete(file.id);
            }}
          >
            Delete
          </button>
          &nbsp;&nbsp;
          <button
            onClick={() => {
              download(file.id);
            }}
          >
            Download
          </button>
          <br />
          {toggleID && toggleID.includes(file.id) && (
            <div>
              <input
                type="numeric"
                placeholder="Enter expire time in days "
                ref={expiretime}
              />{" "}
              <button
                onClick={() => {
                  updateTime(file.id);
                }}
              >
                Update Expire Time
              </button>{" "}
            </div>
          )}
        </div>
      );
    });
  };
  const handleFileChange = (event) => {
    // setSelectedFile(event.target.files[0]);
    try {
      setSelectedFile(fileInputRef.current.files);
      let file = [];
      let fileObj = { name: "", size: "", type: "" };
      for (var i = 0; i < fileInputRef.current.files.length; i++) {
        file.push({
          ...fileObj,
          name: fileInputRef.current.files[i].name,
          size: fileInputRef.current.files[i].size,
          type: fileInputRef.current.files[i].type,
        });
      }
      setfilesfordisplay(file);
    } catch (e) {
      console.log(e);
    }
  };
  const upload = async () => {
    if (!(selectedFile && selectedFile.length > 0))
      return alert("Choose a file !!!");
    setisuploadclicked(true);
    try {
      let result;
      for (var i = 0; i < selectedFile.length; i++) {
        let formData = new FormData();
        formData.append("sampleFile", selectedFile[i]);
        result = await axios.post(
          `${config.backendBaseUrlForAdmin}/admin/upload/${params.uuid}`,
          formData,
          {
            headers: {
              token: localStorage.getItem("__admin__token"),
            },
            onUploadProgress: (progressEvent) => {
              const pro = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setprogress(`${selectedFile[i].name} ::: ${pro}`);
            },
          }
        );
        result.data.status
          ? True(true, `uploaded ${selectedFile[i].name}!!!`)
          : False(false, result.data.error);
      }

      setfilesfordisplay(null);
      fileInputRef.current.value = "";
      setisuploadclicked(false);
      setuploadstatus(!uploadstatus);
    } catch (e) {
      // console.log(e)
    }
  };

  const updateformshow = () => {
    try {
      const form = document.getElementById("form");
      form.style.display = "flex";
      name.current.value = res?.name;
      email.current.value = res?.email;
      password.current.value = res?.password;
      const permissions = res?.permissions?.[0].permissions;

      if (permissions && permissions.length > 0) {
        const permissionCheckboxes = form.querySelectorAll(
          'input[name="permission"]'
        );
        permissionCheckboxes.forEach((checkbox) => {
          if (permissions.includes(checkbox.value)) {
            checkbox.checked = true;
          }
        });
      }
    } catch (e) {
      // console.log(e)
    }
  };
  const update = async (event) => {
    // setiscreateclicked(true);
    event.preventDefault();
    try {
      const form = document.getElementById("form");
      let roles = [];
      let role = document.getElementById("role").value;
      if (role === "none") return alert("Select a role");
      roles.push(role);

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
      const result = await axios.put(
        `${config.backendBaseUrlForAdmin}/admin/update/${params.uuid}`,
        JSON.stringify(data),
        {
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("__admin__token"),
          },
        }
      );

      result.data.status
        ? True(true, "Updated!!!")
        : False(false, result.data.error);
    } catch (e) {
      // console.log(e)
    }

    //  console.log(result.data)
    // result.data.status?setmsg("Created"):setmsg(result.data.error);

    // setiscreateclicked(false)
    // setcreatestatus(!createstatus)
  };
  const showFiles = () => {
    return filesfordisplay?.map((e, index) => {
      return (
        <p key={index}>
          {index + 1} :::
          {e?.name}
        </p>
      );
    });
  };
  return (
    <>
      {isAuth ? (
        <>
          {" "}
          <div className="auser">
            <div className="user-details">
              <div className="detail">
                <span className="label">Name:</span>
                <span className="value">{res?.name}</span>
              </div>
              <div className="detail">
                <span className="label">Email:</span>
                <span className="value">{res?.email}</span>
              </div>
              <div className="detail">
                <span className="label">Password:</span>
                <span className="value">{res?.password}</span>
              </div>
              <div className="detail">
                <span className="label">Uuid:</span>
                <span className="value">{res?.uuid}</span>
              </div>
              <div className="user-roles">
                <span className="label">Roles:</span>
                <span className="value">{renderRoles()}</span>
              </div>
              <div className="user-permissions">
                <span className="label">Permissions:</span>
                <span className="value">{renderPermissions()}</span>
              </div>
              <br />
              <div className="upload-container">
                <input
                  type="file"
                  id="file-input"
                  multiple="multiple"
                  className="upload-input"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <label htmlFor="file-input" className="upload-label">
                  Select File
                </label>{" "}
                &nbsp;
                <button onClick={upload} className="upload-button">
                  Upload
                </button>
                &nbsp;
                <button onClick={updateformshow}>Update Profile</button>
              </div>
              <form style={{ display: "none" }} id="form">
                <input ref={name} type="text" placeholder="Enter Name" />
                <input ref={email} type="email" placeholder="Enter email" />
                <input
                  ref={password}
                  type="text"
                  placeholder="Enter password"
                />
                <div class="form-group">
                  <label for="role">Roles:</label>
                  <select defaultValue="user" id="role">
                    <option value="none">Select</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div>
                  <label>Permissions:</label>
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
                    <input
                      type="checkbox"
                      name="permission"
                      value="shareable"
                    />
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
                <button onClick={update}>Update</button>
              </form>
              <div>
                <div style={{ fontWeight: "700" }}>
                  {" "}
                  {filesfordisplay ? (
                    <div>
                      {" "}
                      Selected File(s) <br /> {showFiles()}{" "}
                    </div>
                  ) : (
                    ""
                  )}
                </div>
                {isuploadclicked && (
                  <div style={{ color: "green", fontWeight: "700" }}>
                    {progress} % Uploading...
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="filedatas">{renderFile()}</div>
        </>
      ) : (
        "Authorization..."
      )}

      {msg && msg.length > 0 && (
        <Toast msg={msg} setmsg={setmsg} status={status} />
      )}
    </>
  );
};

export default Auser;
