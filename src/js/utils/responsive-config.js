// responsive-config.js
export const BREAKPOINT = 768;

export const ROW_LAYOUTS = [
  { desktop: 1, mobile: 1 },
  { desktop: 2, mobile: 1 },
  { desktop: 3, mobile: 1 },
  { desktop: 4, mobile: 1 },
  { desktop: 6, mobile: 1 },
  { desktop: 2, mobile: 2 },
  { desktop: 4, mobile: 2 },
  { desktop: 6, mobile: 2 },
  { desktop: 3, mobile: 3 },
  { desktop: 6, mobile: 3 },
];

export function getMobileOptionsForDesktop(desktopCols) {
  return ROW_LAYOUTS
    .filter((l) => l.desktop === desktopCols)
    .map((l) => l.mobile);
}

export function getResponsiveClass(desktop, mobile) {
  return `mt-row-d${desktop}-m${mobile}`;
}
