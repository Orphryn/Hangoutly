import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ProfileSetup() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  async function handleSave(e) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let avatarUrl = "";

    if (avatar) {
      const fileExt = avatar.name.split(".").pop();

      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatar);

      if (uploadError) {
        setMessage(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      avatarUrl = data.publicUrl;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      username,
      display_name: displayName,
      bio,
      avatar_url: avatarUrl,
      avatar_type: avatar?.type === "image/gif" ? "gif" : "image",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-4xl font-bold mb-2 text-center">
          Create Your Profile
        </h1>

        <p className="text-slate-400 text-center mb-8">
          Customize your Hangoutly identity.
        </p>

        <form
          onSubmit={handleSave}
          className="flex flex-col gap-4"
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-violet-500"
          />

          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-violet-500"
          />

          <textarea
            placeholder="Your bio..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-violet-500 min-h-[100px]"
          />

          <input
            type="file"
            accept="image/*,.gif"
            onChange={(e) => setAvatar(e.target.files[0])}
            className="text-slate-300"
          />

          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-500 transition rounded-xl p-3 font-semibold"
          >
            Save Profile
          </button>
        </form>

        {message && (
          <p className="text-red-400 mt-4 text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}