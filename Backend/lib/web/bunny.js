import https from "https";
import fs from "fs";
import path from "path";

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_STORAGE_HOST = process.env.BUNNY_STORAGE_HOST;
export const BUNNY_PULL_ZONE_URL = process.env.BUNNY_PULL_ZONE_URL;

export async function uploadToBunnyNet(localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(localPath);
    const options = {
      method: "PUT",
      host: BUNNY_STORAGE_HOST,
      path: `/${BUNNY_STORAGE_ZONE}/${remotePath}`,
      headers: {
        AccessKey: BUNNY_API_KEY,
        "Content-Type": "application/octet-stream",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve(`${BUNNY_PULL_ZONE_URL}/${remotePath}`);
        } else {
          reject(new Error(`Bunny upload failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on("error", reject);
    readStream.on("error", reject);
    readStream.pipe(req);
  });
}
