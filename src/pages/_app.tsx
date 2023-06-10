import { type AppType } from "next/app";
import { dark } from '@clerk/themes';
import { api } from "~/utils/api";

import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const MyApp: AppType = ({ Component, pageProps }) => {
  return <ClerkProvider
        appearance={{
          baseTheme: dark
        }}
      >
      <Component {...pageProps} />
    </ClerkProvider>;
};

export default api.withTRPC(MyApp);
