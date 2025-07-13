import jwt from "jsonwebtoken";
const generateToken = (id) => {
  console.log("JWT_SECRET:", process.env.JWT_SECRET); // Debug print
  const jwtToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });
  return jwtToken;
};
export default generateToken;
