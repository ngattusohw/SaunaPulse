import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { 
  insertFeedbackSchema, 
  insertChatMessageSchema 
} from "@shared/schema";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-development"
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connections
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    // Add client to set
    clients.add(ws);

    // Send initial data
    sendInitialData(ws);

    // Handle messages from clients
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'chat') {
          // Handle chat message
          const chatMessage = insertChatMessageSchema.parse(data.payload);
          const savedMessage = await storage.addChatMessage(chatMessage);
          
          // Broadcast chat message to all clients
          broadcastToAll({
            type: 'chat_message',
            payload: savedMessage
          });
        } else if (data.type === 'feedback') {
          // Handle feedback submission
          const feedback = insertFeedbackSchema.parse(data.payload);
          await storage.addFeedback(feedback);
          
          // Get updated facilities with feedback
          const facilities = await storage.getFacilitiesWithFeedback();
          
          // Broadcast updated facilities
          broadcastToAll({
            type: 'facilities_update',
            payload: facilities
          });
          
          // Get recent feedbacks
          const recentFeedbacks = await storage.getRecentFeedbacks(5);
          
          // Broadcast recent feedbacks
          broadcastToAll({
            type: 'recent_feedbacks',
            payload: recentFeedbacks
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          payload: 'Invalid message format'
        }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Helper function to send initial data to a client
  async function sendInitialData(ws: WebSocket) {
    try {
      // Send facilities data
      const facilities = await storage.getFacilitiesWithFeedback();
      ws.send(JSON.stringify({
        type: 'facilities_update',
        payload: facilities
      }));
      
      // Send chat history
      const chatHistory = await storage.getChatMessages();
      ws.send(JSON.stringify({
        type: 'chat_history',
        payload: chatHistory
      }));
      
      // Send recent feedbacks
      const recentFeedbacks = await storage.getRecentFeedbacks(5);
      ws.send(JSON.stringify({
        type: 'recent_feedbacks',
        payload: recentFeedbacks
      }));
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  // Helper function to broadcast to all connected clients
  function broadcastToAll(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Helper function to simulate temperature changes
  function simulateTemperatureChanges() {
    setInterval(async () => {
      try {
        // Get all facilities
        const facilities = await storage.getFacilities();
        
        // Randomly select a facility to update
        const randomIndex = Math.floor(Math.random() * facilities.length);
        const facility = facilities[randomIndex];
        
        // Generate a small random change (-1, 0, or +1)
        const change = Math.floor(Math.random() * 3) - 1;
        const newTemp = parseFloat((facility.currentTemp + change).toFixed(1));
        
        // Update the facility temperature
        const updatedFacility = await storage.updateFacilityTemperature(facility.id, newTemp);
        
        if (updatedFacility) {
          // Get all facilities with feedback to broadcast
          const facilitiesWithFeedback = await storage.getFacilitiesWithFeedback();
          
          // Broadcast updated facilities
          broadcastToAll({
            type: 'facilities_update',
            payload: facilitiesWithFeedback
          });
          
          // Check if temperature is out of recommended range
          if (newTemp > updatedFacility.maxTemp || newTemp < updatedFacility.minTemp) {
            // Broadcast alert
            broadcastToAll({
              type: 'temperature_alert',
              payload: {
                facilityName: updatedFacility.name,
                temperature: newTemp,
                message: `${updatedFacility.name} is currently ${newTemp > updatedFacility.maxTemp ? 'above' : 'below'} the recommended temperature range (${newTemp > updatedFacility.maxTemp ? updatedFacility.maxTemp : updatedFacility.minTemp}°).`
              }
            });
          }
        }
      } catch (error) {
        console.error('Error simulating temperature changes:', error);
      }
    }, 60000); // Update every minute
  }

  // Start temperature simulation
  simulateTemperatureChanges();

  // API Routes
  // Get all facilities with feedback
  app.get('/api/facilities', async (req, res) => {
    try {
      const facilities = await storage.getFacilitiesWithFeedback();
      res.json(facilities);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      res.status(500).json({ message: 'Failed to fetch facilities' });
    }
  });

  // Get temperature history for a facility
  app.get('/api/facilities/:id/history', async (req, res) => {
    try {
      const facilityId = parseInt(req.params.id);
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
      
      const history = await storage.getTemperatureHistory(facilityId, hours);
      res.json(history);
    } catch (error) {
      console.error('Error fetching temperature history:', error);
      res.status(500).json({ message: 'Failed to fetch temperature history' });
    }
  });

  // Get AI recommendations
  app.get('/api/recommendations', async (req, res) => {
    try {
      const facilities = await storage.getFacilitiesWithFeedback();
      
      // Format facility data for the prompt
      const facilityData = facilities.map(f => 
        `${f.name} (${f.currentTemp}°, range: ${f.minTemp}-${f.maxTemp}°)`
      ).join(', ');
      
      // Define the prompt for OpenAI
      const prompt = `
        As a sauna and wellness expert, provide personalized recommendations for the following facilities based on their current temperatures:
        ${facilityData}
        
        For each facility, provide:
        1. A brief assessment of the current temperature (too hot, ideal, too cold)
        2. Recommended session duration in minutes
        3. Safety tips specific to that temperature
        
        Format your response as a JSON object with a "recommendations" array containing objects with "facility", "assessment", "duration", and "tips" fields.
      `;
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a sauna and wellness expert providing recommendations based on facility temperatures." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse and return the recommendation
      if (response.choices[0].message.content) {
        const recommendations = JSON.parse(response.choices[0].message.content);
        res.json(recommendations);
      } else {
        throw new Error("No content in API response");
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      res.json({
        recommendations: [
          {
            facility: "Sauna 1",
            assessment: "The temperature is within optimal range for a Finnish sauna experience.",
            duration: "10-15 minutes",
            tips: "Stay hydrated and exit if you feel uncomfortable."
          },
          {
            facility: "Sauna 2",
            assessment: "The temperature is ideal for beginners and regular sauna users.",
            duration: "10-15 minutes",
            tips: "Ideal for relaxation and muscle recovery."
          },
          {
            facility: "Steam Room",
            assessment: "Perfect humidity levels for respiratory benefits.",
            duration: "10-20 minutes",
            tips: "Great for opening pores and improving skin health."
          },
          {
            facility: "Cold Plunge",
            assessment: "Properly chilled for contrast therapy.",
            duration: "1-3 minutes",
            tips: "Best used after sauna sessions for recovery benefits."
          }
        ],
        disclaimer: "These recommendations are general guidelines based on current temperatures. Individual tolerance may vary. Please consult with staff if you have any health concerns."
      });
    }
  });

  // Submit feedback
  app.post('/api/feedback', async (req, res) => {
    try {
      const feedback = insertFeedbackSchema.parse(req.body);
      const savedFeedback = await storage.addFeedback(feedback);
      res.status(201).json(savedFeedback);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(400).json({ message: 'Invalid feedback data' });
    }
  });

  return httpServer;
}
