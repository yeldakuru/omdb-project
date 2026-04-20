import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) return res.status(401).json({ error: "No token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};

export default auth;