import { useRef, useState } from "react";
import { Button, message } from "antd";
import { authedFetch } from "../lib/utils";

export default function AvatarUpload({ onChange, buttonText = "Change photo", className = "" }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      message.error("Max file size: 3MB");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      // 1) get signature & params from our API
      const qs = new URLSearchParams({ filename: file.name, type: file.type });
      const sig = await authedFetch(`/api/uploads/avatar-signature?${qs}`);

      // 2) send file to Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", sig.timestamp);
      fd.append("signature", sig.signature);
      fd.append("folder", sig.folder);
      fd.append("public_id", sig.publicId);

      const r = await fetch(sig.uploadUrl, { method: "POST", body: fd });
      if (!r.ok) throw new Error("Cloudinary upload failed");
      const result = await r.json();
      const publicUrl = result.secure_url || result.url;
      if (!publicUrl) throw new Error("No URL returned");

      // 3) tell parent (your profile page already PATCHes /api/users onChange)
      onChange?.(publicUrl);
      message.success("Photo updated");
    } catch (err) {
      console.error(err);
      message.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        loading={uploading}
        className={className}
      >
        {uploading ? "Uploading…" : buttonText}
      </Button>
    </>
  );
}