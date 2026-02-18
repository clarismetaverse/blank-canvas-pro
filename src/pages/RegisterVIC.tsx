import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChipInput } from "@/components/vic-onboarding/ChipInput";
import { GalleryUploader } from "@/components/vic-onboarding/GalleryUploader";
import { VisibilityToggle } from "@/components/vic-onboarding/VisibilityToggle";
import { setAuthToken } from "@/services";
import {
  fetchVicProfileByToken,
  getApplyDraft,
  loginVic,
  signupVic,
  type VicApplyRole,
  type VicSignupPayload,
} from "@/services/vicOnboarding";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export default function RegisterVIC() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState<VicApplyRole | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [minibio, setMinibio] = useState("");
  const [homebase, setHomebase] = useState("");
  const [language, setLanguage] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [discoverable, setDiscoverable] = useState(true);
  const [membersClub, setMembersClub] = useState("");
  const [canHostAtClub, setCanHostAtClub] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [social, setSocial] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [avatarFiles, setAvatarFiles] = useState<File[]>([]);
  const [number, setNumber] = useState("");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = getApplyDraft();
    if (!draft) {
      return;
    }

    setRole(draft.Role);
    setDiscoverable(Boolean(draft.discoverable));
    setMembersClub(draft.MembersClub ?? "");
    setCanHostAtClub(Boolean(draft.CanHostAtClub));
    setInvitationCode(draft.InvitationCode ?? "");
  }, []);

  const isClubHostDisabled = useMemo(() => !membersClub.trim(), [membersClub]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const gallery = await Promise.all(galleryFiles.map(fileToDataUrl));
      const avatar = avatarFiles[0] ? await fileToDataUrl(avatarFiles[0]) : undefined;

      const payload: VicSignupPayload = {
        Name: name,
        email,
        password,
        bio: bio || undefined,
        minibio: minibio || undefined,
        Homebase: homebase || undefined,
        language: language || undefined,
        Interests: interests.length ? interests : undefined,
        Social: social.length ? social : undefined,
        InvitationCode: invitationCode || undefined,
        discoverable,
        MembersClub: membersClub.trim() || undefined,
        CanHostAtClub: isClubHostDisabled ? undefined : canHostAtClub,
        Gallery: gallery.length ? gallery : undefined,
        Picture: avatar,
        Role: role || undefined,
        // TODO: confirm DB fields for number, age and nationality before sending upstream.
      };

      await signupVic(payload);
      const token = await loginVic(email, password);
      setAuthToken(token);
      await fetchVicProfileByToken(token);
      navigate("/");
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Unable to complete VIC registration.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f4f4f5_42%,#f1f5f9_100%)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 22, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_20px_55px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
      >
        <h1 className="text-3xl font-semibold text-neutral-900">Create VIC profile</h1>
        <p className="mt-2 text-sm text-neutral-500">Complete your host registration to unlock curated access.</p>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">Name</Label>
              <Input className="rounded-2xl border-neutral-200 bg-white/90" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">Role</Label>
              <Input className="rounded-2xl border-neutral-200 bg-neutral-100" value={role} onChange={(event) => setRole(event.target.value as VicApplyRole)} placeholder="VIC Host" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">Email</Label>
              <Input className="rounded-2xl border-neutral-200 bg-white/90" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">Homebase</Label>
              <Input className="rounded-2xl border-neutral-200 bg-white/90" value={homebase} onChange={(event) => setHomebase(event.target.value)} placeholder="City / base" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">language</Label>
              <Input className="rounded-2xl border-neutral-200 bg-white/90" value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="English, French..." />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">InvitationCode</Label>
              <Input className="rounded-2xl border-neutral-200 bg-white/90" value={invitationCode} onChange={(event) => setInvitationCode(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">Password</Label>
              <div className="relative">
                <Input
                  className="rounded-2xl border-neutral-200 bg-white/90 pr-10"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-2.5 text-neutral-500">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">Confirm password</Label>
              <div className="relative">
                <Input
                  className="rounded-2xl border-neutral-200 bg-white/90 pr-10"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-3 top-2.5 text-neutral-500"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-600">bio</Label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-neutral-200 bg-white/90 p-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-600">minibio</Label>
            <Input className="rounded-2xl border-neutral-200 bg-white/90" value={minibio} onChange={(event) => setMinibio(event.target.value)} />
          </div>

          <ChipInput label="Interests" placeholder="Art collector" values={interests} onChange={setInterests} />
          <ChipInput label="Social" placeholder="@instagram / link" values={social} onChange={setSocial} />

          <VisibilityToggle discoverable={discoverable} onChange={setDiscoverable} />

          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-600">MembersClub</Label>
            <Input className="rounded-2xl border-neutral-200 bg-white/90" value={membersClub} onChange={(event) => setMembersClub(event.target.value)} />
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={canHostAtClub}
                disabled={isClubHostDisabled}
                onChange={(event) => setCanHostAtClub(event.target.checked)}
              />
              CanHostAtClub
            </label>
          </div>

          <GalleryUploader label="Gallery" files={galleryFiles} onChange={setGalleryFiles} />
          <GalleryUploader label="Picture" files={avatarFiles} onChange={setAvatarFiles} multiple={false} />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">number</Label>
              <Input className="rounded-2xl border-neutral-200 bg-white/90" value={number} onChange={(event) => setNumber(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">age</Label>
              <Input className="rounded-2xl border-neutral-200 bg-white/90" value={age} onChange={(event) => setAge(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">nationality</Label>
              <Input className="rounded-2xl border-neutral-200 bg-white/90" value={nationality} onChange={(event) => setNationality(event.target.value)} />
            </div>
          </div>

          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] disabled:opacity-60"
          >
            {isSubmitting ? "Creating profile..." : "Create VIC account"}
          </button>

          <p className="text-center text-sm text-neutral-500">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-neutral-900 hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
