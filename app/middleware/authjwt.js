import jwt from 'jsonwebtoken';
import dotenvFlow from 'dotenv-flow';

dotenvFlow.config();

const verifyToken = (req, res, next) => {
  const authData = req.headers.authorization;

  if (!authData) {
    return res.status(403).send({ message: 'No token provided!' });
  }

  const parts = authData.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).send({ message: 'Unauthorized!' });
  }

  const token = parts[1];

  jwt.verify(token, process.env.APP_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized!' });
    }

    // ✅ bejelentkezett user id a tokenből
    req.userId = decoded?.id;

    if (!req.userId) {
      return res.status(401).send({ message: 'Unauthorized!' });
    }

    next();
  });
};

export default verifyToken;
