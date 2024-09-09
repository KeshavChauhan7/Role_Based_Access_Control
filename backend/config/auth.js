const { compareToken } = require("./tokenGenCom");
module.exports = function auth(req, res, next) {
  const token = req.headers["token"];
  const tokenInfo = compareToken(token);
  if (tokenInfo.status) {
    req.decode = tokenInfo.decode;
    next();
  } else {
    return res.json({ status: false, error: "token is invalid" });
  }
};
