import jwt from "jsonwebtoken";
const generateToken = (userId) => {
  const jwtToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });
  return jwtToken;
};
export default generateToken;
