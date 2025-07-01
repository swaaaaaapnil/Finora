import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();
  if (!user) return null;
  
  const email = user.emailAddresses[0].emailAddress;

  // First check if user exists by clerk ID
  const existingUserByClerkId = await db.user.findUnique({
    where: { clerkUserId: user.id },
  });

  if (existingUserByClerkId) return existingUserByClerkId;

  // If not found by clerk ID, check if email is already used
  // This handles cases where the user might have been created with a different clerk ID
  const existingUserByEmail = await db.user.findUnique({
    where: { email },
  });

  if (existingUserByEmail) {
    // Option 1: Return the existing user (allows multiple clerk IDs to map to same user)
    // return existingUserByEmail;
    
    // Option 2: Update the existing user with the new clerk ID (recommended)
    return await db.user.update({
      where: { id: existingUserByEmail.id },
      data: { clerkUserId: user.id },
    });
  }

  // If user doesn't exist at all, create a new one
  try {
    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        imageUrl: user.imageUrl,
        email,
      },
    });
    
    return newUser;
  } catch (error) {
    // Handle potential race conditions where the user might have been created
    // between our check and create operations
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      // User was created with this email in another request, fetch and return
      const userByEmail = await db.user.findUnique({
        where: { email },
      });
      
      if (userByEmail) return userByEmail;
    }
    
    // For other errors, rethrow
    throw error;
  }
};
