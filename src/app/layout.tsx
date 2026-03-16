import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});




export const metadata: Metadata = {
  title: "EcoNoise SG",
  description:
    "Predictive intelligence for municipal noise and environmental nuisance hotspots in Singapore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.variable}>
        <AuthProvider>{children}</AuthProvider>
      </body>



    </html>
  );
}
