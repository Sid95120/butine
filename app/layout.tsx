export const metadata = {
  title: "Vibzz — du rucher à votre table",
  description:
    "Vibzz : le circuit court du miel. Apiculteurs locaux, click & collect, paiement sécurisé.",
  metadataBase: new URL("https://vibzz.fr"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Vibzz",
    description:
      "Miel local en circuit court : trouvez des apiculteurs proches de chez vous.",
    url: "https://vibzz.fr",
    siteName: "Vibzz",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibzz — miel local en circuit court",
    description:
      "Apiculteurs proches de chez vous, click & collect simple.",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
