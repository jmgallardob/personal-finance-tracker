export default function HomePage() {
  return (
    <section
      aria-labelledby="page-title"
      className="border-border bg-surface-raised w-full max-w-2xl rounded-[20px] border p-8 sm:p-12"
    >
      <p className="bg-primary mb-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold">
        Finanzas personales
      </p>
      <h1
        id="page-title"
        className="max-w-xl text-4xl leading-tight font-medium tracking-tight sm:text-5xl"
      >
        Tu espacio financiero está en camino.
      </h1>
      <p className="text-text-muted mt-6 max-w-xl text-base leading-7 sm:text-lg">
        Estamos preparando una forma rápida y privada de registrar tus
        movimientos y entender mejor tus ingresos y gastos cotidianos.
      </p>
    </section>
  );
}
