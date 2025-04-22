// app/desktop/page.js
"use client"; // Add this if LinuxDesktopLayout or its children use client hooks

import LinuxDesktopLayout from '../components/LinuxDesktopLayout'; // Adjust path if necessary

export default function DesktopPage() {
  // This page simply renders the main desktop layout.
  // The layout itself handles the taskbar, windows, etc.
  return <LinuxDesktopLayout />;
}