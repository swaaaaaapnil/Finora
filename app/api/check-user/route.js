import { NextResponse } from 'next/server';
import { checkUser } from '@/lib/checkuser';

export async function GET() {
  try {
    const user = await checkUser();
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
