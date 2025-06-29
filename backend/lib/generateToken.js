import jwt from "jsonwebtoken";
const generateToken = (id) => {
  const jwtToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });
  return jwtToken;
};
export default generateToken;
