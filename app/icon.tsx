import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/svg+xml";

export default function Icon(): ImageResponse {
  return new ImageResponse(
    (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" fill="#1B1A17" />
        <path
          d="M16 6L27 14.5V26H19V19H13V26H5V14.5L16 6Z"
          stroke="#F3F1EC"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
    { ...size }
  );
}
