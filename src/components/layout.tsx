import type { PropsWithChildren } from "react";

export const PageLayout = (props: PropsWithChildren) => {
  return (
    <main className="overflow-y-auto flex flex-col min-h-screen justify-center textColor">
      <div className="flex-1 w-full max-w-4xl mx-auto border-x border-slate-400">
        {props.children}
      </div>
    </main>
  );
};
