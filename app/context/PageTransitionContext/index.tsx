"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  FC,
  MouseEventHandler,
  ReactNode,
  createContext,
  use,
  useContext,
  useEffect,
  useTransition,
} from "react";
import { DELAY } from "./presets";
import { noop, sleep, smoothScrollToTopOfPage } from "./utils";
import MyThemeContext from "../themeContext";

interface TransitionContextState {
  pending: boolean;
  navigate: (url: string) => void;
}

const TransitionContext = createContext<TransitionContextState>({
  pending: false,
  navigate: noop,
});

interface PageTransitionProviderProps {
  children: ReactNode;
}

export const PageTransitionProvider: FC<PageTransitionProviderProps> = ({
  children,
}) => {
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const router = useRouter();
  const { isDarkTheme } = useContext(MyThemeContext);

  const navigate = (href: string) => {
    start(async () => {
      router.push(href);
      await sleep(DELAY);
    });
  };

  const changeBodyColourForRoute = (route: string) => {
    let colour = isDarkTheme ? "#3F3C38" : "#DAD7CB";
    document.body.style.backgroundColor = colour;
  };

  const onClick: MouseEventHandler<HTMLDivElement> = (e) => {
    const a = (e.target as Element).closest("a");
    if (a) {
      const href = a.getAttribute("href");
      const isSameHref = href && href === pathname;
      const isExternalLink = href && !href.startsWith("/");
      if (!isExternalLink) {
        e.preventDefault();

        if (!isSameHref) {
          changeBodyColourForRoute(href);
          navigate(href);
        } else {
          smoothScrollToTopOfPage();
        }
      }
    }
  };

  return (
    <TransitionContext.Provider value={{ pending, navigate }}>
      <div onClickCapture={onClick}>{children}</div>
    </TransitionContext.Provider>
  );
};

export const usePageTransitionContext = () => {
  const context = use(TransitionContext);
  if (!context)
    throw new Error(
      "useLogoAnimationRefContext must be used within a LogoAnimationRefProvider"
    );
  return context;
};
