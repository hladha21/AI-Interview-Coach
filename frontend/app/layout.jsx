export const metadata = {
  title: "PrepAI — AI Interview Coach",
  description: "Practice interviews with AI feedback",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0f0f12" }}>
        {children}
      </body>
    </html>
  );
}