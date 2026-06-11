import crypto from "node:crypto";
import { config } from "../config.js";

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  bytes?: number;
  width?: number;
  height?: number;
  error?: {
    message?: string;
  };
};

export async function uploadToCloudinary(file: Express.Multer.File, folder: string) {
  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureBase = `folder=${folder}&timestamp=${timestamp}${config.cloudinaryApiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");
  const formData = new FormData();

  formData.set("file", new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
  formData.set("api_key", config.cloudinaryApiKey);
  formData.set("timestamp", String(timestamp));
  formData.set("folder", folder);
  formData.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`, {
    method: "POST",
    body: formData
  });

  const data = (await response.json().catch(() => null)) as CloudinaryUploadResponse | null;

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Unable to upload image to Cloudinary.");
  }

  if (!data?.secure_url || !data.public_id) {
    throw new Error("Cloudinary did not return an uploaded image URL.");
  }

  return {
    url: data.secure_url,
    path: data.public_id,
    bytes: typeof data.bytes === "number" ? data.bytes : file.size,
    width: typeof data.width === "number" ? data.width : null,
    height: typeof data.height === "number" ? data.height : null
  };
}
