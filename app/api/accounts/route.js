import { NextResponse } from "next/server";
import { createAccount } from "@/actions/dashboard";

export async function POST(req) {
  try {
    const data = await req.json();
    const result = await createAccount(data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
