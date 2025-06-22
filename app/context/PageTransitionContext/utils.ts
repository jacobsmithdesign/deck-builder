export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
export const noop = () => {};

export const smoothScrollToTopOfPage = (): void => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
}
