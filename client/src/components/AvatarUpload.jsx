import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../lib/firebase";

export default function AvatarUpload({ onUploaded }) {
  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const key = `avatars/${Date.now()}_${file.name}`;
    const r = ref(storage, key);
    const snap = await uploadBytes(r, file);
    const url = await getDownloadURL(snap.ref);
    onUploaded(url);
  }
  return <input type="file" accept="image/*" onChange={handleChange} />;
}