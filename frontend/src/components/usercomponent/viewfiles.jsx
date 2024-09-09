import axios from "axios";
import "./viewfile.css";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../toast";
import { Dna } from "react-loader-spinner";
import { config } from "../../config/config";
const Viewfiles = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isAuth, setisAuth] = useState(false);
  const [files, setfiles] = useState();
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setstatus] = useState(null);
  const [uploadstatus, setuploadstatus] = useState(false);
  const [msg, setmsg] = useState();
  const [link, setlink] = useState();
  const [deletedstatus, setdeletedstatus] = useState(false);
  const [progress, setprogress] = useState();
  const [clickon, setclickon] = useState(false);
  const [isuploadClicked, setisuploadClicked] = useState(false);
  const [filesfordisplay, setfilesfordisplay] = useState();
  const [isdeleteClicked, setisdeleteClicked] = useState(false);
  const [isdownloadClicked, setisdownloadClicked] = useState(false);
  const [isgenerateClicked, setisgenerateClicked] = useState(false);
  const [idfortoggle, setidfortoggle] = useState("");
  const [idfortoggleA, setidfortoggleA] = useState("");
  const [idfortoggleB, setidfortoggleB] = useState("");
  const [basicdetails, setbasicdetails] = useState();
  const handleFileChange = () => {
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
      // console.log(e)
    }
  };

  useEffect(() => {
    getFiles();
  }, [uploadstatus, deletedstatus]);
  const True = (status, message) => {
    setstatus(status);
    setmsg(message);
  };
  const False = (status, error) => {
    setstatus(status);
    setmsg(error);
  };
  const getFiles = async () => {
    if (!localStorage.getItem("token")) {
      return navigate("/login");
    }

    try {
      const result = await axios.get(`${config.backendBaseURLForUser}/files`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });

      const fn = () => {
        setisAuth(true);
        setbasicdetails({
          name: result.data.user.name,
          email: result.data.user.email,
          password: result.data.user.password,
          roles: result.data.user.roles[0].roles,
          permissions: result.data.user.permissions[0].permissions,
        });
        if (!result.data.result || result.data.result.length === 0) {
          setmsg("No file uploaded");
          setfiles(result.data.result);
          return;
        }
        setfiles(result.data.result);
      };

      const servererr = () => {
        if (
          result.data.error === "token is invalid" ||
          result.data.error === "this USER does not exist in db"
        )
          return navigate("/login");
        else {
          setisAuth(true);
          setmsg(result.data.error);
          setbasicdetails({
            name: result.data.user.name,
            email: result.data.user.email,
            password: result.data.user.password,
            roles: result.data.user.roles[0].roles,
            permissions: result.data.user.permissions[0].permissions,
          });
        }
      };
      result.data.status ? fn() : servererr();
    } catch (e) {
      // console.log(e)
    }
  };

  const Download = async (id, file) => {
    if (!basicdetails?.permissions?.includes("download"))
      return False(false, "You are not allowed to download the file!!!");
    setidfortoggleA(id);
    setisdownloadClicked(true);
    const token = localStorage.getItem("token");
    const url = `${config.backendBaseURLForUser}/download/${id}/${token}`;
    window.location.href = url;
    // try {
    //   const response = await axios.get(`${config.backendBaseURLForUser}/download/${id}`, {
    //     headers: {
    //       token: localStorage.getItem("token"),
    //     },
    //     responseType: "blob",
    //   });

    //   if (response.data) {
    //     // Create a download link
    //     const url = window.URL.createObjectURL(new Blob([response.data]));
    //     const link = document.createElement("a");
    //     link.href = url;
    //     link.setAttribute("download", file);
    //     document.body.appendChild(link);
    //     link.click();
    //   } else {
    //     setmsg("Failed to download the file");
    //   }
    // } catch (error) {
    //   console.error("Failed to download file:", error);
    // }
    setisdownloadClicked(false);
  };

  const Delete = async (id) => {
    if (!basicdetails?.permissions?.includes("delete"))
      return False(false, "You are not allowed to delete the file!!!");
    setidfortoggleB(id);
    setisdeleteClicked(true);
    try {
      const result = await axios.delete(
        `${config.backendBaseURLForUser}/delete/${id}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      if (result.data.status) {
        setdeletedstatus(!deletedstatus);
        // setmsg("Deleted");
        True(result.data.status, "Deleted!!!");
      } else {
        // setmsg(result.data.error);
        False(result.data.status, result.data.error);
      }
    } catch (e) {
      // console.log(e)
    }

    setisdeleteClicked(false);
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // setmsg("Copied!!!")
      True(true, "Copied!!!");
      // console.log('Text copied to clipboard:', text);
    } catch (error) {
      // console.error('Failed to copy text to clipboard:', error);
    }
  };
  const view = () => {
    return files?.map((e, index) => {
      let sizeinbytes = e.size;
      let sizeinkb = (parseFloat(sizeinbytes) / 1024).toFixed(2);
      let sizeinmb = (parseFloat(sizeinbytes) / (1024 * 1024)).toFixed(2);
      let time = new Date(e.expireIn * 1000).toLocaleString();
      return (
        <div className="file-card" key={index}>
          <p>
            Filename: <span>{e.file_name}</span>{" "}
          </p>
          <p>
            Type: <span>{e.mimetype}</span>{" "}
          </p>
          <p>
            Size: <span>{`${sizeinkb} Kb || ${sizeinmb} Mb`} Mb</span>{" "}
          </p>
          <p>
            ExpireIn: <span>{time}</span>{" "}
          </p>
          <p>
            File id: <span>{e.id}</span>{" "}
          </p>
          <p>
            Shareable mode: <span>{JSON.stringify(e.isShareable)}</span>{" "}
          </p>
          <button disabled={isgenerateClicked} onClick={() => generate(e.id)}>
            Generate &nbsp;{" "}
            {idfortoggle && idfortoggle === e.id && (
              <Dna
                visible={isgenerateClicked}
                height="20"
                width="20"
                ariaLabel="dna-loading"
                wrapperStyle={{ position: "relative", bottom: "-5px" }}
                wrapperClass="dna-wrapper"
              />
            )}{" "}
          </button>
          &nbsp;
          <button disabled={isdeleteClicked} onClick={() => Delete(e.id)}>
            Delete &nbsp;
            {idfortoggleB && idfortoggleB === e.id && (
              <Dna
                visible={isdeleteClicked}
                height="20"
                width="20"
                ariaLabel="dna-loading"
                wrapperStyle={{ position: "relative", bottom: "-5px" }}
                wrapperClass="dna-wrapper"
              />
            )}
          </button>
          &nbsp;
          <button
            disabled={isdownloadClicked}
            onClick={() => Download(e.id, e.file_name)}
          >
            Download &nbsp;{" "}
            {idfortoggleA && idfortoggleA === e.id && (
              <Dna
                visible={isdownloadClicked}
                height="20"
                width="20"
                ariaLabel="dna-loading"
                wrapperStyle={{ position: "relative", bottom: "-5px" }}
                wrapperClass="dna-wrapper"
              />
            )}
          </button>
          {link && link.includes(e.id) && (
            <p style={{ overflowX: "clip" }}>
              Link: {link} &nbsp;{" "}
              <button
                onClick={() => {
                  copy(link);
                }}
                className="copy"
              >
                Copy
              </button>
            </p>
          )}
        </div>
      );
    });
  };

  const generate = async (id) => {
    if (!basicdetails?.permissions?.includes("shareable"))
      return False(false, "You are not allowed to generate link !!!");
    setidfortoggle(id);
    setisgenerateClicked(true);

    try {
      const result = await axios.get(
        `${config.backendBaseURLForUser}/generate/${id}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      const generatedlink = () => {
        setlink(
          `${
            config.backendBaseURLForUser
          }/download/share/${localStorage.getItem("token")}/${id}`
        );
        True(true, "Generated!!!");
      };

      result.data.status ? generatedlink() : False(false, result.data.error);
    } catch (e) {
      // console.log(e)
    }

    setisgenerateClicked(false);
  };

  const upload = async () => {
    if (!basicdetails?.permissions?.includes("upload"))
      return False(false, "You are not allowed to upload the file!!!");
    if (!(selectedFile && selectedFile.length > 0))
      return alert("Choose a file !!!");

    setisuploadClicked(true); // block button
    try {
      let result;
      for (var i = 0; i < selectedFile.length; i++) {
        setclickon(true); //  show uploading text
        let formData = new FormData();
        formData.append("sampleFile", selectedFile[i]);
        result = await axios.post(
          `${config.backendBaseURLForUser}/upload`,
          formData,
          {
            headers: {
              token: localStorage.getItem("token"),
            },
            onUploadProgress: (progressEvent) => {
              const pro = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setprogress(`${selectedFile[i].name} ::: ${pro}`);
            },
          }
        );
        setclickon(false);
        result.data.status
          ? True(true, `uploaded ${selectedFile[i].name}!!!`)
          : False(false, result.data.error);
      }

      setfilesfordisplay(null);
      fileInputRef.current.value = "";
      setisuploadClicked(false);
      setuploadstatus(!uploadstatus);
    } catch (e) {
      console.log(e);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
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
  const renderRoles = () => {
    return basicdetails?.roles?.map((role, index) => (
      <span className="role" key={index}>
        {role}
      </span>
    ));
  };

  const renderPermissions = () => {
    return basicdetails?.permissions?.map((permission, index) => (
      <span className="permission" key={index}>
        "{permission}"&nbsp;&nbsp;&nbsp;&nbsp;
      </span>
    ));
  };
  return (
    <>
      {isAuth ? (
        <>
          <div className="auser">
            <div className="user-details">
              <div className="detail">
                <span className="label">Name:</span>
                <span className="value">{basicdetails?.name}</span>
              </div>
              <div className="detail">
                <span className="label">Email:</span>
                <span className="value">{basicdetails?.email}</span>
              </div>
              <div className="detail">
                <span className="label">Password:</span>
                <span className="value">{basicdetails?.password}</span>
              </div>
              <div className="user-roles">
                <span className="label">Roles:</span>
                <span className="value">{renderRoles()}</span>
              </div>
              <div className="user-permissions">
                <span className="label">Permissions:</span>
                <span className="value">{renderPermissions()}</span>
              </div>
            </div>
          </div>
          <br />
          <div className="upload-container">
            <input
              type="file"
              id="file-input"
              className="upload-input"
              multiple="multiple"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <label htmlFor="file-input" className="upload-label">
              Select File
            </label>{" "}
            &nbsp;
            <button
              disabled={isuploadClicked}
              onClick={upload}
              className="upload-button"
            >
              Upload
            </button>
            &nbsp;
            <button onClick={logout}>logout</button>
          </div>
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
          {clickon && (
            <div
              style={{ color: "green", fontSize: "22px", fontWeight: "600" }}
            >
              {progress}% Uploading
            </div>
          )}

          {view()}
        </>
      ) : (
        <div className="authorization-msg">Authorization...</div>
      )}

      {msg && msg.length > 0 && (
        <Toast msg={msg} setmsg={setmsg} status={status} />
      )}
    </>
  );
};

export default Viewfiles;
