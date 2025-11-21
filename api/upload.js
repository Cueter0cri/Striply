import formidable from "formidable";
import fs from "fs/promises";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload error" });

    const file = files.file;

    const data = await fs.readFile(file.filepath);
    const filename = Date.now() + "_" + file.originalFilename;

    await fs.writeFile(`./public/images/${filename}`, data);

    res.status(200).json({ url: `/images/${filename}` });
  });
}
