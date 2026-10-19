import Image from "next/image";
import { cn } from "@/lib/utils";

// As capas já vêm no tamanho certo do CDN da AniList; `unoptimized` evita gastar
// a cota de otimização de imagens da Vercel com milhares de capas.
export function AnimeCover({
  src,
  color,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string | null;
  color?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted relative aspect-[2/3] overflow-hidden rounded-lg",
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized
          className="object-cover"
        />
      )}
    </div>
  );
}
