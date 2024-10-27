import Menu from "~/components/menu";

export default function Explore() {
  return (
    <>
      <header className="flex min-h-24 flex-row items-center justify-center">
        <Menu />
      </header>
      <main className="m-8 flex min-h-[60svh] flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-8">
          <p className="text-center text-4xl font-bold">Coming Soon</p>
        </div>
      </main>
    </>
  );
}
