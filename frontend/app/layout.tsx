import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { DesktopScaleWrapper } from "@/components/desktop-scale-wrapper";
import { CookieConsentPopup } from "@/components/cookie-consent-popup";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MietlyPlus",
  description: "Rental platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} antialiased`}>
        <DesktopScaleWrapper>
          {children}
          <CookieConsentPopup />
        </DesktopScaleWrapper>
      </body>
    </html>
  );
}
