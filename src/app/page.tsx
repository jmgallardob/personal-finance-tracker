export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-6 py-12">
      <section
        aria-labelledby="page-title"
        className="w-full max-w-2xl rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8 sm:p-12"
      >
        <p className="mb-6 inline-flex rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold">
          Finanzas personales
        </p>
        <h1
          id="page-title"
          className="max-w-xl text-4xl leading-tight font-medium tracking-tight sm:text-5xl"
        >
          Tu espacio financiero está en camino.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
          Estamos preparando una forma rápida y privada de registrar tus
          movimientos y entender mejor tus ingresos y gastos cotidianos.
        </p>
      </section>
    </main>
  );
}
