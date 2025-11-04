export default function TermsView() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: TBD</p>
      </header>
      <section className="space-y-4 text-sm leading-6 text-foreground/90">
        <p>
          These Terms of Service ("Terms") govern your access to and use of the
          service. By accessing or using the service, you agree to be bound by
          these Terms.
        </p>
        <h2 className="text-xl font-semibold">Use of Service</h2>
        <p>
          You agree to use the service only for lawful purposes and in
          accordance with these Terms.
        </p>
        <h2 className="text-xl font-semibold">Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your
          account and for all activities that occur under your account.
        </p>
        <h2 className="text-xl font-semibold">Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use constitutes
          acceptance of the revised Terms.
        </p>
      </section>
    </div>
  );
}

