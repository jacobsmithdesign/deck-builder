import localFont from "next/font/local";
import { EB_Garamond, Inter, Poppins } from "next/font/google";

export const garamond = EB_Garamond({ subsets: ["latin"] });

export const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "800"],
});

export const poppins = Poppins({
  weight: ["100", "200", "300", "400"],
  subsets: ["latin"],
});
