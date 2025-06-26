"use server";

import { db } from "@/lib/drizzle"; // Adjust to your actual db import
import { waitlistUsers } from "@/db/schema"; // Adjust to your schema
import { sql } from "drizzle-orm"; // Assuming you're using Drizzle ORM

const MAX_WAITLIST = 100; // Maximum waitlist capacity

// New function to get the current waitlist count
export async function getWaitlistCount() {
  try {
    // Get current waitlist count from database
    const countResult = await db.select({ 
      count: sql`count(*)` 
    }).from(waitlistUsers);
    
    const currentCount = Number(countResult[0].count);
    
    return {
      count: currentCount,
      remainingSpots: Math.max(0, MAX_WAITLIST - currentCount)
    };
  } catch (error) {
    console.error("Error getting waitlist count:", error);
    return { count: 0, remainingSpots: MAX_WAITLIST };
  }
}

export async function joinWaitlist(prevState: any, formData: FormData) {
  try {
    // Validate the email
    const email = formData.get("email") as string;
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: "Please enter a valid email address",
      };
    }

    // Get current waitlist count from database
    const countResult = await db.select({ 
      count: sql`count(*)` 
    }).from(waitlistUsers);
    
    const currentCount = Number(countResult[0].count);
    
    // Check if waitlist is full
    if (currentCount >= MAX_WAITLIST) {
      return {
        success: false,
        message: "Sorry, the waitlist is currently full.",
      };
    }

    // Check if email already exists
    const existingUser = await db.select()
      .from(waitlistUsers)
      .where(sql`email = ${email}`)
      .limit(1);
      
    if (existingUser.length > 0) {
      return {
        success: false,
        message: "This email is already on our waitlist.",
      };
    }

    // Insert the new waitlist user
    await db.insert(waitlistUsers).values({
      email,
      createdAt: new Date()
    });
    
    // Get updated count
    const newCount = currentCount + 1;
    const remainingSpots = MAX_WAITLIST - newCount;

    return {
      success: true,
      message: "You've been added to our waitlist! We'll be in touch soon.",
      remainingSpots: remainingSpots,
    };
  } catch (error) {
    console.error("Waitlist error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}