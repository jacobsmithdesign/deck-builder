import axios from "axios";
import { get } from "http";
import { NextResponse } from "next/server";

export const fetchEDHREC = async ({ slug }: { slug: string | undefined }) => {
  try {
    const response = await fetch(`/api/edhrec?commander=${slug}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      return {
        data: null,
        error: "Error fetching EDHREC data, unknown commander name.",
      };
      throw new Error("Error fetching commander data.");
    }
    const data = await response.json();
    return data;
  } catch (error) {}
};

export const fetchScryfall = async ({
  commanderName,
}: {
  commanderName: string | null;
}) => {
  try {
    const response = await fetch(`/api/scryfall?commander=${commanderName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      return {
        data: null,
        error: "Error fetching EDHREC data, unknown commander name.",
      };
      throw new Error("Error fetching Scryfall data.");
    }
    const data = await response.json();
    return data;
  } catch (error) {}
};
