"use client";
import type { AppProps } from "next/app";
import "../styles/global.css";
import { ApolloProvider } from "@apollo/client";
import createApolloClient from "@/apollo-client";
import { Inter } from "next/font/google";
import ReduxProvider from "@/store/redux-provider";
import { ChakraProvider } from "@chakra-ui/react";
import WithSubnavigation from "@/components/navbar";
import { AppStore } from "@/store/store";
import { useRef } from "react";
import "leaflet/dist/leaflet.css";

const inter = Inter({ subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
  const client = createApolloClient();
  const storeRef = useRef<AppStore | null>(null);

  console.info("Starting App");
  return (
    <div
      className={inter.className}
      style={{
        margin: 0,
        height: "calc(100vh)",
      }}
    >
      <ReduxProvider storeRef={storeRef}>
        <ApolloProvider client={client}>
          <ChakraProvider>
            <WithSubnavigation />
            <Component {...pageProps} />
          </ChakraProvider>
        </ApolloProvider>
      </ReduxProvider>
    </div>
  );
}
