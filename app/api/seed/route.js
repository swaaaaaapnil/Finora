import { seedTransactions } from '@/actions/seed.js';

export async function GET() {
    const result = await seedTransactions(); // Replace with actual account ID
    return Response.json(result);
}