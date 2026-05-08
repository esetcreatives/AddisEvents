import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmProvider } from "@/components/confirm-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Addis Events — Premium Event Management for Addis Ababa",
  description:
    "Plan, manage, and execute stunning corporate events and weddings in Addis Ababa. RSVP management, QR check-in, seating charts, ticketing, and more.",
  keywords: [
    "event management",
    "Addis Ababa",
    "wedding planner",
    "corporate events",
    "Ethiopia",
    "RSVP",
    "event planning",
  ],
  openGraph: {
    title: "Addis Events — Premium Event Management",
    description:
      "The all-in-one event management platform for Addis Ababa's finest events.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&f[]=roundo@600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ConfirmProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}
