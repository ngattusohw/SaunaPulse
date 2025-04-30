import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for authentication and chat
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isStaff: boolean("is_staff").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isStaff: true,
});

// Facility schema for temperature tracking
export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  currentTemp: real("current_temp").notNull(),
  minTemp: real("min_temp").notNull(),
  maxTemp: real("max_temp").notNull(),
  icon: text("icon").notNull(),
  colorClass: text("color_class").notNull(),
  lastUpdate: timestamp("last_update").defaultNow(),
});

export const insertFacilitySchema = createInsertSchema(facilities).pick({
  name: true,
  currentTemp: true,
  minTemp: true,
  maxTemp: true,
  icon: true,
  colorClass: true,
});

// Temperature history for charts
export const temperatureHistory = pgTable("temperature_history", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull(),
  temperature: real("temperature").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertTemperatureHistorySchema = createInsertSchema(temperatureHistory).pick({
  facilityId: true,
  temperature: true,
});

// Feedback schema for crowd-sourced ratings
export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull(),
  userId: integer("user_id"),
  rating: text("rating").notNull(), // "too-cold", "perfect", "too-hot"
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedbacks).pick({
  facilityId: true,
  userId: true,
  rating: true,
});

// Chat message schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  username: text("username").notNull(),
  isStaff: boolean("is_staff").default(false),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  username: true,
  isStaff: true,
  message: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;

export type TemperatureHistory = typeof temperatureHistory.$inferSelect;
export type InsertTemperatureHistory = z.infer<typeof insertTemperatureHistorySchema>;

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Aggregated feedback counts with percentages
export type FeedbackCounts = {
  tooCold: number;
  tooColdPercent: number;
  perfect: number;
  perfectPercent: number;
  tooHot: number;
  tooHotPercent: number;
};

// Temperature readings with voting
export const temperatureReadings = pgTable("temperature_readings", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull(),
  userId: integer("user_id"),
  username: text("username").notNull(),
  temperature: real("temperature").notNull(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertTemperatureReadingSchema = createInsertSchema(temperatureReadings).pick({
  facilityId: true,
  userId: true,
  username: true,
  temperature: true,
});

// Votes on temperature readings
export const temperatureVotes = pgTable("temperature_votes", {
  id: serial("id").primaryKey(),
  readingId: integer("reading_id").notNull(),
  userId: integer("user_id"),
  username: text("username").notNull(),
  isUpvote: boolean("is_upvote").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertTemperatureVoteSchema = createInsertSchema(temperatureVotes).pick({
  readingId: true,
  userId: true,
  username: true,
  isUpvote: true,
});

export type TemperatureReading = typeof temperatureReadings.$inferSelect;
export type InsertTemperatureReading = z.infer<typeof insertTemperatureReadingSchema>;

export type TemperatureVote = typeof temperatureVotes.$inferSelect;
export type InsertTemperatureVote = z.infer<typeof insertTemperatureVoteSchema>;

// Augmented temperature reading with weighted score
export type WeightedTemperatureReading = TemperatureReading & {
  weightedScore: number;
  timeSinceSubmission: string;
};

// Facility with feedback counts
export type FacilityWithFeedback = Facility & {
  feedback: FeedbackCounts;
  totalVotes: number;
  satisfactionPercent: number;
  recentReadings?: WeightedTemperatureReading[];
};
