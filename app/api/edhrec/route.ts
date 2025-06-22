import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const commanderSlug = searchParams.get("commander");

  if (!commanderSlug) {
    return NextResponse.json(
      { error: "Commander name is required in query (?commander=...)" },
      { status: 400 }
    );
  }

  const url = `https://json.edhrec.com/pages/commanders/${commanderSlug}.json`;

  try {
    const { data } = await axios.get(url);

    return NextResponse.json({
      data,
      commanderSlug: commanderSlug,
      /* commander: commanderName, topCards */
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch EDHREC data",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
