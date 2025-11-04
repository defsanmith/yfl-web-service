export default function PrivacyView() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: TBD</p>
      </header>
      <section className="space-y-4 text-sm leading-6 text-foreground/90">
        <p>
          This Privacy Policy describes how we collect, use, and share your
          information when you use the service.
        </p>
        <h2 className="text-xl font-semibold">Information We Collect</h2>
        <p>
          We may collect information that you provide directly and information
          collected automatically through your use of the service.
        </p>
        <h2 className="text-xl font-semibold">How We Use Information</h2>
        <p>
          We use the information to provide, maintain, and improve the service,
          and to communicate with you.
        </p>
        <h2 className="text-xl font-semibold">Your Choices</h2>
        <p>
          You may have choices regarding your information, including access,
          correction, and deletion, subject to applicable law.
        </p>
      </section>
    </div>
  );
}

