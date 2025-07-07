import https from "https";
import fs from "fs";

const BUNNY_STORAGE_ZONE = "stayfinder";
const BUNNY_API_KEY = "1a334013-01cf-4f55-85cb5038c396-403e-4338";
const BUNNY_STORAGE_HOST = "storage.bunnycdn.com";
export const BUNNY_PULL_ZONE_URL = "https://stayfinder.b-cdn.net";

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
          console.error("Bunny.net upload error:", res.statusCode, data);
          reject(new Error(`Bunny upload failed: ${res.statusCode} - ${data}`));
        }
      });
    });
    req.on("error", (error) => {
      console.error("Bunny.net upload request error:", error);
      reject(error);
    });
    readStream.on("error", (err) => {
      console.error("File read error:", err);
      reject(err);
    });
    readStream.pipe(req);
  });
}
