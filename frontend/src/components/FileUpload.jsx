import { useState } from "react";
import api from "../services/api";

export default function FileUpload({ onUploaded, receiver }) {
  const [loading, setLoading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("receiver", receiver);
      const { data } = await api.post("/messages/upload", formData);
      onUploaded(data.analytics);
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error.response?.data?.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="cursor-pointer rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold transition hover:bg-emerald-500">
      {loading ? "Uploading..." : "📎"}
      <input type="file" className="hidden" onChange={handleFile} />
    </label>
  );
}
