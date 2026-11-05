import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Eilm Academy",
  title: "Eilm Academy | Islamic Education in Islamabad & Online",
  description:
    "Study the Qur’an and Islamic sciences through structured online and onsite programs guided by qualified scholars at Eilm Academy in Islamabad.",
  keywords: [
    "Islamic education Islamabad",
    "Quran learning online",
    "Islamic studies",
    "Fehm e Quran course",
    "Dars e Nizami",
  ],
  authors: [{ name: "Eilm Academy", url: siteUrl }],
  creator: "Eilm Academy",
  publisher: "Eilm Academy",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Eilm Academy",
    title: "Eilm Academy | Islamic Education in Islamabad & Online",
    description:
      "Study the Qur’an and Islamic sciences through structured online and onsite programs guided by qualified scholars at Eilm Academy in Islamabad.",
    locale: "en_PK",
    images: [
      {
        url: "/logo.png",
        width: 656,
        height: 380,
        alt: "Eilm Academy logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eilm Academy | Islamic Education in Islamabad & Online",
    description:
      "Study the Qur’an and Islamic sciences through structured online and onsite programs guided by qualified scholars at Eilm Academy in Islamabad.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${siteUrl}#organization`,
        name: "Eilm Academy",
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        description:
          "Authentic Islamic learning rooted in the Qur’an and Sunnah, with online and onsite programs that nurture understanding, practice, and character.",
        telephone: "+92 315 5090055",
        email: "shah.inamullah999@gmail.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Jamia Masjid Al Mahmoud, Khanqah Darul Eman Wal Taqwa",
          addressLocality: "Islamabad",
          addressCountry: "PK",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: "Eilm Academy",
        publisher: { "@id": `${siteUrl}#organization` },
        inLanguage: "en-PK",
      },
    ],
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
