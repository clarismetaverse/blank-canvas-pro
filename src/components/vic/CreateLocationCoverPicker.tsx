import { ImagePlus } from "lucide-react";

type CreateLocationCoverPickerProps = {
  coverUrl: string;
  onChange: (value: string) => void;
};

export default function CreateLocationCoverPicker({ coverUrl, onChange }: CreateLocationCoverPickerProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Cover (optional)</p>
      {coverUrl ? (
        <div className="relative h-36 w-full overflow-hidden rounded-xl">
          <img src={coverUrl} alt="Location cover preview" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-500">
          <span className="inline-flex items-center gap-2 text-xs font-medium">
            <ImagePlus className="h-4 w-4" />
            Add a cover image URL
          </span>
        </div>
      )}
      <input
        value={coverUrl}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://..."
        className="w-full rounded-xl border border-neutral-200 bg-[#FAFAF8] px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
      />
    </div>
  );
}
