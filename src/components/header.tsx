import Menu from "~/components/menu";

export default function Header() {
  return (
    <header className="flex min-h-24 flex-col items-center justify-center gap-4 p-8">
      <p className="text-center text-2xl font-bold">Jamais Vu</p>
      <Menu />
    </header>
  );
}
