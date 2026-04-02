import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata = {
  title: "BikeCare Tracker — Track Your Bike Health Smartly",
  description: "Track your daily rides and never miss an oil change. BikeCare Tracker helps you monitor bike health with smart km-based reminders.",
  keywords: "bike tracker, oil change reminder, motorcycle maintenance, daily ride tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <div className="bg-mesh" aria-hidden="true" />
          <div className="relative z-10">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
