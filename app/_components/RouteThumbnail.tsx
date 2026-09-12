import { Map } from "lucide-react";

const RouteThumbnail = ({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) => {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={56}
        height={56}
        className="h-14 w-14 shrink-0 rounded-xl border border-ink/10 object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
      <Map size={20} aria-hidden="true" />
    </div>
  );
};

export default RouteThumbnail;
