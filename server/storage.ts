import {
  users,
  facilities,
  temperatureHistory,
  feedbacks,
  chatMessages,
  type User,
  type InsertUser,
  type Facility,
  type InsertFacility,
  type TemperatureHistory,
  type InsertTemperatureHistory,
  type Feedback,
  type InsertFeedback,
  type ChatMessage,
  type InsertChatMessage,
  type FeedbackCounts,
  type FacilityWithFeedback,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Facility operations
  getFacilities(): Promise<Facility[]>;
  getFacility(id: number): Promise<Facility | undefined>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacilityTemperature(id: number, temp: number): Promise<Facility | undefined>;
  getFacilitiesWithFeedback(): Promise<FacilityWithFeedback[]>;

  // Temperature history operations
  getTemperatureHistory(facilityId: number, hours: number): Promise<TemperatureHistory[]>;
  addTemperatureHistory(history: InsertTemperatureHistory): Promise<TemperatureHistory>;

  // Feedback operations
  addFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedbackCounts(facilityId: number): Promise<FeedbackCounts>;
  getRecentFeedbacks(limit: number): Promise<(Feedback & { facilityName: string, username: string })[]>;

  // Chat operations
  getChatMessages(limit: number): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private facilities: Map<number, Facility>;
  private temperatureHistory: TemperatureHistory[];
  private feedbacks: Feedback[];
  private chatMessages: ChatMessage[];
  
  private userId: number;
  private facilityId: number;
  private temperatureHistoryId: number;
  private feedbackId: number;
  private chatMessageId: number;

  constructor() {
    this.users = new Map();
    this.facilities = new Map();
    this.temperatureHistory = [];
    this.feedbacks = [];
    this.chatMessages = [];
    
    this.userId = 1;
    this.facilityId = 1;
    this.temperatureHistoryId = 1;
    this.feedbackId = 1;
    this.chatMessageId = 1;
    
    // Initialize default facilities
    this.initDefaultData();
  }

  private initDefaultData() {
    // Create staff user
    this.createUser({
      username: "Staff",
      password: "staff123",
      isStaff: true
    });

    // Create regular users
    this.createUser({
      username: "Mike T.",
      password: "password",
      isStaff: false
    });
    
    this.createUser({
      username: "Jenny S.",
      password: "password",
      isStaff: false
    });
    
    this.createUser({
      username: "Sarah D.",
      password: "password",
      isStaff: false
    });

    // Create default facilities
    const sauna1 = this.createFacility({
      name: "Sauna 1",
      currentTemp: 95,
      minTemp: 80,
      maxTemp: 100,
      icon: "ri-fire-line",
      colorClass: "bg-warmAccent"
    });
    
    const sauna2 = this.createFacility({
      name: "Sauna 2",
      currentTemp: 85,
      minTemp: 75,
      maxTemp: 95,
      icon: "ri-fire-line",
      colorClass: "bg-warmAccent"
    });
    
    const steamRoom = this.createFacility({
      name: "Steam Room",
      currentTemp: 45,
      minTemp: 40,
      maxTemp: 50,
      icon: "ri-cloud-line",
      colorClass: "bg-slate-600"
    });
    
    const coldPlunge = this.createFacility({
      name: "Cold Plunge",
      currentTemp: 7,
      minTemp: 5,
      maxTemp: 10,
      icon: "ri-snowy-line",
      colorClass: "bg-coolAccent"
    });

    // Add some initial temperature history (24 hours)
    const now = new Date();
    const facilities = [sauna1, sauna2, steamRoom, coldPlunge];
    const saunaData = [92, 93, 90, 91, 92, 94, 95, 94, 93, 92, 91, 92, 94, 94, 93, 92, 93, 94, 95, 96, 95, 94, 93, 95];
    const sauna2Data = [82, 83, 84, 84, 85, 86, 87, 87, 88, 88, 87, 86, 85, 85, 85, 84, 84, 83, 84, 85, 86, 87, 88, 85];
    const steamRoomData = [42, 42, 43, 43, 44, 44, 44, 45, 45, 45, 46, 46, 46, 45, 45, 44, 44, 43, 43, 44, 44, 45, 45, 45];
    const coldPlungeData = [8, 8, 8, 9, 9, 9, 9, 8, 8, 8, 7, 7, 7, 7, 7, 6, 6, 6, 7, 7, 7, 8, 8, 7];
    
    const allData = [saunaData, sauna2Data, steamRoomData, coldPlungeData];
    
    for (let i = 0; i < facilities.length; i++) {
      const facility = facilities[i];
      const data = allData[i];
      
      for (let j = 0; j < 24; j++) {
        const timestamp = new Date(now);
        timestamp.setHours(now.getHours() - (23 - j));
        
        this.addTemperatureHistory({
          facilityId: facility.id,
          temperature: data[j]
        });
        
        // Override timestamp for historical data
        this.temperatureHistory[this.temperatureHistory.length - 1].timestamp = timestamp;
      }
    }
    
    // Add some initial feedback
    this.addFeedback({ facilityId: sauna1.id, userId: 2, rating: "too-hot" });
    this.addFeedback({ facilityId: sauna1.id, userId: 3, rating: "perfect" });
    this.addFeedback({ facilityId: sauna1.id, userId: 4, rating: "perfect" });
    
    this.addFeedback({ facilityId: sauna2.id, userId: 2, rating: "perfect" });
    this.addFeedback({ facilityId: sauna2.id, userId: 3, rating: "perfect" });
    this.addFeedback({ facilityId: sauna2.id, userId: 4, rating: "too-cold" });
    
    this.addFeedback({ facilityId: steamRoom.id, userId: 2, rating: "perfect" });
    this.addFeedback({ facilityId: steamRoom.id, userId: 3, rating: "perfect" });
    this.addFeedback({ facilityId: steamRoom.id, userId: 4, rating: "too-hot" });
    
    this.addFeedback({ facilityId: coldPlunge.id, userId: 2, rating: "perfect" });
    this.addFeedback({ facilityId: coldPlunge.id, userId: 3, rating: "perfect" });
    this.addFeedback({ facilityId: coldPlunge.id, userId: 4, rating: "too-cold" });

    // Add initial chat messages
    this.addChatMessage({
      userId: 1,
      username: "Staff",
      isStaff: true,
      message: "Good morning everyone! We've just refreshed the water in the cold plunge, and it's at an optimal 7°C now. Sauna 1 is running a bit hot today, but we're adjusting it."
    });
    
    this.addChatMessage({
      userId: 2,
      username: "Mike T.",
      isStaff: false,
      message: "Thanks for the update! Sauna 1 is definitely running hot. Just gave my feedback."
    });
    
    this.addChatMessage({
      userId: 3,
      username: "Jenny S.",
      isStaff: false,
      message: "The steam room is perfect today! Really helping with my sinuses. How long is everyone staying in for?"
    });
    
    this.addChatMessage({
      userId: 4,
      username: "Sarah D.",
      isStaff: false,
      message: "I'm doing about 10 mins in the steam room, then heading to the cold plunge. It feels a bit too cold for me today though!"
    });
    
    this.addChatMessage({
      userId: 1,
      username: "Staff",
      isStaff: true,
      message: "Thanks for your feedback! We've adjusted Sauna 1, it should be cooling down now. The cold plunge is at our standard temperature, but we're monitoring all your feedback."
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Facility operations
  async getFacilities(): Promise<Facility[]> {
    return Array.from(this.facilities.values());
  }

  async getFacility(id: number): Promise<Facility | undefined> {
    return this.facilities.get(id);
  }

  async createFacility(insertFacility: InsertFacility): Promise<Facility> {
    const id = this.facilityId++;
    const facility: Facility = { 
      ...insertFacility, 
      id, 
      lastUpdate: new Date() 
    };
    this.facilities.set(id, facility);
    return facility;
  }

  async updateFacilityTemperature(id: number, temp: number): Promise<Facility | undefined> {
    const facility = this.facilities.get(id);
    if (!facility) return undefined;
    
    const updatedFacility = { 
      ...facility, 
      currentTemp: temp,
      lastUpdate: new Date()
    };
    
    this.facilities.set(id, updatedFacility);
    
    // Add to temperature history
    this.addTemperatureHistory({
      facilityId: id,
      temperature: temp
    });
    
    return updatedFacility;
  }

  async getFacilitiesWithFeedback(): Promise<FacilityWithFeedback[]> {
    const facilities = await this.getFacilities();
    
    return Promise.all(facilities.map(async (facility) => {
      const feedback = await this.getFeedbackCounts(facility.id);
      const totalVotes = feedback.tooCold + feedback.perfect + feedback.tooHot;
      const satisfactionPercent = totalVotes > 0 ? Math.round(feedback.perfectPercent) : 0;
      
      return {
        ...facility,
        feedback,
        totalVotes,
        satisfactionPercent
      };
    }));
  }

  // Temperature history operations
  async getTemperatureHistory(facilityId: number, hours: number = 24): Promise<TemperatureHistory[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    return this.temperatureHistory
      .filter(th => 
        th.facilityId === facilityId && 
        th.timestamp >= cutoffTime
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async addTemperatureHistory(insertHistory: InsertTemperatureHistory): Promise<TemperatureHistory> {
    const id = this.temperatureHistoryId++;
    const history: TemperatureHistory = {
      ...insertHistory,
      id,
      timestamp: new Date()
    };
    
    this.temperatureHistory.push(history);
    return history;
  }

  // Feedback operations
  async addFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.feedbackId++;
    const feedback: Feedback = {
      ...insertFeedback,
      id,
      timestamp: new Date()
    };
    
    this.feedbacks.push(feedback);
    return feedback;
  }

  async getFeedbackCounts(facilityId: number): Promise<FeedbackCounts> {
    const facilityFeedbacks = this.feedbacks.filter(f => f.facilityId === facilityId);
    
    const tooCold = facilityFeedbacks.filter(f => f.rating === "too-cold").length;
    const perfect = facilityFeedbacks.filter(f => f.rating === "perfect").length;
    const tooHot = facilityFeedbacks.filter(f => f.rating === "too-hot").length;
    
    const total = tooCold + perfect + tooHot;
    
    return {
      tooCold,
      tooColdPercent: total > 0 ? Math.round((tooCold / total) * 100) : 0,
      perfect,
      perfectPercent: total > 0 ? Math.round((perfect / total) * 100) : 0,
      tooHot,
      tooHotPercent: total > 0 ? Math.round((tooHot / total) * 100) : 0
    };
  }

  async getRecentFeedbacks(limit: number = 5): Promise<(Feedback & { facilityName: string, username: string })[]> {
    // Get recent feedbacks with facility name
    return this.feedbacks
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
      .map(feedback => {
        const facility = this.facilities.get(feedback.facilityId);
        const user = feedback.userId ? this.users.get(feedback.userId) : undefined;
        
        return {
          ...feedback,
          facilityName: facility?.name || "Unknown",
          username: user?.username || "Anonymous"
        };
      });
  }

  // Chat operations
  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    return this.chatMessages
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-limit);
  }

  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date()
    };
    
    this.chatMessages.push(message);
    return message;
  }
}

export const storage = new MemStorage();
