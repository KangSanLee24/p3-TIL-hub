import express from "express";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    console.log("Hello World!");
    return res.status(200).json({ status: 200, message: "Hello World!" });
  } catch (error) {
    next(error);
  }
});

export default router;
