import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const commanderName = searchParams.get("commander");

  if (!commanderName) {
    return NextResponse.json(
      { error: "Commander name is required in query (?commander=...)" },
      { status: 400 }
    );
  }

  // Important: encode the commander name correctly
  const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(
    commanderName
  )}`;

  try {
    const { data } = await axios.get(url);

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch Scryfall card data",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
