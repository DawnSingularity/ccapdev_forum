import { PropsWithChildren } from "react";


export const PageLayout = (props: PropsWithChildren<{}>)=>{
    return(
        <div className="flex justify-center h-screen textColor">
          <div className="h-full w-full md:max-w-4xl border border-slate-500">
            {props.children}
          </div>
        </div>    
    );
};