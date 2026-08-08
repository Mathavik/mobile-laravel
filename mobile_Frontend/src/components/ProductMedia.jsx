import { useState } from "react";
import { resolveMediaUrl, FALLBACK_IMAGE } from "../services/api";

/**
 * Shared product media renderer.
 *
 * Video-first: when a valid `product_video` (also read from the API's
 * `video_url` field) is available it is rendered, otherwise the product image
 * is shown as the fallback. Every page (ProductCard, Cart, Wishlist, Orders,
 * search suggestions, home cards) uses this single component so the media
 * selection logic stays consistent application-wide.
 */
export default function ProductMedia({
  product,
  image,
  video,
  alt,
  className = "w-full h-full object-cover",
  videoClassName,
  imageClassName,
  loading = "lazy",
}) {
  const imageSrc = image ?? product?.image;
  const videoSrc = video ?? product?.video_url;

  const resolvedImage = imageSrc ? resolveMediaUrl(imageSrc) : null;
  const resolvedVideo = videoSrc ? resolveMediaUrl(videoSrc) : null;

  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Show the video whenever a valid one exists; only fall back to the product
  // image when there is no usable video.
  if (resolvedVideo && !videoFailed) {
    return (
      <video
        src={resolvedVideo}
        className={videoClassName || className}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setVideoFailed(true)}
      />
    );
  }

  return (
    <img
      src={imageFailed ? FALLBACK_IMAGE : resolvedImage || FALLBACK_IMAGE}
      alt={alt || product?.product_name || "Product"}
      className={imageClassName || className}
      onError={() => setImageFailed(true)}
      loading={loading}
    />
  );
}