import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "finora",
    name: "Finora",
    retryFunction: async (attempt) => ({
        delay: Math.pow(2, attempt) * 1000, // Exponential backoff
        maxAttempts: 3, // Maximum number of retry attempts
    }),
});