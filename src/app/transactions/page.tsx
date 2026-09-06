export default function TransactionsPage() {
  return (
    <section aria-labelledby="transactions-title" className="w-full max-w-2xl">
      <h1
        id="transactions-title"
        className="text-heading-sm text-text font-medium"
      >
        Movimientos
      </h1>
      <p className="text-body text-text-muted mt-3">
        El historial de movimientos se conectará cuando el registro esté
        disponible.
      </p>
    </section>
  );
}
