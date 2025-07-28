// server/routes/uploads.ts

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ✅ Ensure uploads/qr directory exists
const qrUploadDir = path.join(__dirname, "../../uploads/qr");
if (!fs.existsSync(qrUploadDir)) {
  fs.mkdirSync(qrUploadDir, { recursive: true });
}

// ✅ Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, qrUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

// ✅ File type filter (images only)
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// ✅ Upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// ✅ QR Upload Route
router.post("/upload-qr", upload.single("qr"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

 const fileUrl = `${req.protocol}://${req.get("host")}/uploads/qr/${req.file.filename}`;


  console.log("✅ Uploaded QR Path:", fileUrl);

  return res.json({
    success: true,
    message: "QR uploaded successfully",
    url: fileUrl,
  });
});


export default router;
