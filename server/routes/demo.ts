import { RequestHandler } from "express";
import { DemoResponse } from "../shared/api"; // ✅ use correct relative path

export const handleDemo: RequestHandler = (req, res) => {
  const response: DemoResponse = {
    message: "Hello from Express server",
  };
  res.status(200).json(response);
};
