import { useEffect, useState } from "react";
import AvatarUpload from "../../components/AvatarUpload";
import { authedFetch } from "../../lib/utils";

export default function HirerProfile() {
  const [form, setForm] = useState({});
  useEffect(() => { (async () => {
    const res = await authedFetch("/api/auth/me"); const json = await res.json();
    if (json.user) setForm(json.user);
  })(); }, []);

  async function save() {
    await authedFetch("/api/users", { method: "PATCH", body: JSON.stringify(form) });
    alert("Saved");
  }

  return (
    <div className="max-w-2xl mx-auto bg-white border rounded-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Hirer Profile</h1>
      <AvatarUpload onUploaded={(url) => setForm(prev => ({ ...prev, avatarUrl: url }))} />
      <input className="w-full border rounded px-3 py-2" placeholder="Name" value={form.name||""} onChange={(e)=>setForm(p=>({...p, name:e.target.value}))}/>
      <input className="w-full border rounded px-3 py-2" placeholder="City" value={form.city||""} onChange={(e)=>setForm(p=>({...p, city:e.target.value}))}/>
      <textarea className="w-full border rounded px-3 py-2" placeholder="About" value={form.about||""} onChange={(e)=>setForm(p=>({...p, about:e.target.value}))}/>
      <button className="bg-black text-white rounded px-4 py-2" onClick={save}>Save</button>
    </div>
  );
}