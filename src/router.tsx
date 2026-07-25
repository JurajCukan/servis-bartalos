import { QueryClient } from "@tanstack/react-query";
import { createRouter, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const isFileProtocol =
    typeof window !== "undefined" &&
    (window.location.protocol === "file:" || !!window.electronAPI);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: isFileProtocol ? createHashHistory() : undefined,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
