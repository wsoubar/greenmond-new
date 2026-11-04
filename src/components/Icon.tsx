import type { SVGProps } from "react";
const paths = {
  arrowLeft: "M19 12H5m6-6-6 6 6 6",
  arrowRight: "M5 12h14m-6-6 6 6-6 6",
  arrowUpRight: "M7 17 17 7M7 7h10v10",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm4-14-2 6-6 2 2-6 6-2Z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-7.87a4 4 0 0 1 0 7.75",
  book: "M4 3h13a3 3 0 0 1 3 3v15H5a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Zm-2 15a3 3 0 0 1 3-3h15M7 7h8",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8m-8 4h6",
  plus: "M12 5v14M5 12h14",
  save: "m19 21-14 0a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2ZM7 3v6h10V3M7 21v-8h10v8",
  send: "m22 2-7 20-4-9-9-4L22 2ZM11 13 22 2",
  check: "m5 12 4 4L19 6",
  edit: "m16 3 5 5M4 20l4-1L21 6a2.12 2.12 0 0 0-3-3L5 16l-1 4Z",
  archive: "M3 3h18v4H3V3Zm2 4v14h14V7M10 11h4",
  restore: "M3 10a9 9 0 1 1 1 8M3 4v6h6m3-3v5l3 2",
  refresh:
    "M3 10a9 9 0 0 1 15-6l3 3M21 2v5h-5m5 7a9 9 0 0 1-15 6l-3-3m0 5v-5h5",
  login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M3 12h12m-5-5 5 5-5 5",
  logout: "M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4m6-14 5 5-5 5M9 12h11",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  loader: "M21 12a9 9 0 1 1-9-9",
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
