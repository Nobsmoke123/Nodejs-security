module.exports = function checkLoggedIn(req, res, next) {
  //TODO
  const isLoggedIn = true;
  if (!isLoggedIn) {
    return res.status(401).json({
      error: "You must log in!",
    });
  }
  next();
};
