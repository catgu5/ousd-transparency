import { NextResponse } from "next/server";
import { getOusdData } from "@/lib/dune";

export const revalidate = 3600;

export async function GET() {
  const data = await getOusdData();
  return NextResponse.json(data);
}
