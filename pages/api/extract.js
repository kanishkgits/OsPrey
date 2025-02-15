import formidable from "formidable";
import fs from "fs";
import Tesseract from "tesseract.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "File upload failed" });

    const filePath = files.file.filepath;

    try {
      // Perform OCR on the uploaded image
      const { data } = await Tesseract.recognize(filePath, "eng");

      // Send extracted text to frontend
      res.status(200).json({ text: data.text });
    } catch (error) {
      res.status(500).json({ error: "OCR Processing Failed" });
    } finally {
      // Delete temporary file
      fs.unlinkSync(filePath);
    }
  });
}
