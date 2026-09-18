export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_85%_-10%,hsl(238_70%_92%),transparent_60%),radial-gradient(760px_460px_at_-5%_110%,hsl(292_70%_91%),transparent_60%)]" />
      <div className="absolute -top-32 right-[-10%] h-[440px] w-[440px] rounded-full bg-indigo-400/30 blur-3xl" />
      <div className="absolute bottom-[-12%] left-[-6%] h-[400px] w-[400px] rounded-full bg-sky-400/30 blur-3xl" />
      <div className="absolute top-1/2 left-1/3 h-[320px] w-[320px] rounded-full bg-fuchsia-400/20 blur-3xl" />
      <div className="absolute top-24 right-[18%] h-2 w-2 rounded-full bg-indigo-400/40" />
      <div className="absolute top-1/3 right-[8%] h-1.5 w-1.5 rounded-full bg-sky-400/40" />
      <div className="absolute top-2/3 left-[12%] h-2.5 w-2.5 rounded-full bg-fuchsia-400/30" />
      <div className="absolute bottom-24 right-[28%] h-1.5 w-1.5 rounded-full bg-indigo-400/30" />
      <div className="absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(0,0,0,0.55),transparent_78%)] bg-[linear-gradient(to_right,hsl(220,16%,82%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(220,16%,82%)_1px,transparent_1px)] bg-[size:44px_44px]" />
    </div>
  );
}