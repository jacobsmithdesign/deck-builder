"use client";
import { createContext, JSX, ReactElement, useEffect, useState } from "react";

const MyThemeContext = createContext({
  isDarkTheme: true,
  toggleThemeHandler: () => {},
});

interface ThemePropsInterface {
  children?: JSX.Element | Array<JSX.Element>;
}

export function MyThemeContextProvider(
  props: ThemePropsInterface
): ReactElement {
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    const isDarkThemeFromLocalStorage = localStorage.getItem("isDarkTheme");
    if (isDarkThemeFromLocalStorage === null) {
      localStorage.setItem("isDarkTheme", `false`);
      document.documentElement.classList.add("dark");
    } else {
      const isDarkTheme = JSON.parse(isDarkThemeFromLocalStorage);
      if (isDarkTheme) {
        document.documentElement.classList.add("dark");
      }
      setIsDarkTheme(isDarkTheme);
    }
  }, []);

  const toggleThemeHandler = (): void => {
    setIsDarkTheme((prevTheme) => {
      const newTheme = !prevTheme;
      localStorage.setItem("isDarkTheme", `${newTheme}`);
      if (newTheme) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newTheme;
    });
  };

  return (
    <MyThemeContext.Provider value={{ isDarkTheme, toggleThemeHandler }}>
      {props.children}
    </MyThemeContext.Provider>
  );
}

export default MyThemeContext;
