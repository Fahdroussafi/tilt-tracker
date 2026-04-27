"use client"

import {
  environmentManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { PropsWithChildren } from "react"

const isDevelopment = process.env.NODE_ENV === "development"

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1 * 60 * 1000,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | null = null

function getQueryClient() {
  if (environmentManager.isServer()) {
    if (isDevelopment) {
      console.log("SSR")
    }

    return createQueryClient()
  }

  if (!browserQueryClient) {
    browserQueryClient = createQueryClient()
  }

  return browserQueryClient
}

export function ReactQueryProvider({
  children,
}: Readonly<PropsWithChildren<unknown>>) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
      {children}
    </QueryClientProvider>
  )
}
