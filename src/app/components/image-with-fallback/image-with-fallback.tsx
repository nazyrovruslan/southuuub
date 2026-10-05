import { useState } from 'react';
import Image, { ImageProps, StaticImageData } from 'next/image';

type Props = ImageProps & {
  altSrc: string | StaticImageData;
  className?: string;
};

export const ImageWithFallback = ({ altSrc, className, ...options }: Props) => {
  const [imgSrc, setImgSrc] = useState(options.src);

  return (
    <Image
      src={imgSrc}
      alt={options.alt}
      width={options.width}
      height={options.height}
      sizes={options.sizes}
      loading={options.loading}
      onError={() => {
        setImgSrc(altSrc);
      }}
      className={className}
      style={{
        objectFit: 'cover'
      }}
    />
  );
}