/**
 * Chat Service - Real-time messaging between users
 * Uses tRPC subscriptions for WebSocket communication
 */

import { EventEmitter } from "events";

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  id: number;
  participant1Id: number;
  participant2Id: number;
  participant1Name: string;
  participant2Name: string;
  bookingId?: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

// Global event emitter for chat messages
export const chatEvents = new EventEmitter();

// Track active connections
const activeConnections = new Map<number, Set<string>>();

/**
 * Register user connection
 */
export function registerUserConnection(userId: number, connectionId: string) {
  if (!activeConnections.has(userId)) {
    activeConnections.set(userId, new Set());
  }
  activeConnections.get(userId)!.add(connectionId);
  console.log(`[Chat] User ${userId} connected (${connectionId})`);
}

/**
 * Unregister user connection
 */
export function unregisterUserConnection(userId: number, connectionId: string) {
  const connections = activeConnections.get(userId);
  if (connections) {
    connections.delete(connectionId);
    if (connections.size === 0) {
      activeConnections.delete(userId);
      console.log(`[Chat] User ${userId} disconnected`);
    }
  }
}

/**
 * Check if user is online
 */
export function isUserOnline(userId: number): boolean {
  return activeConnections.has(userId) && (activeConnections.get(userId)?.size ?? 0) > 0;
}

/**
 * Get active connections count
 */
export function getActiveConnectionsCount(): number {
  return activeConnections.size;
}

/**
 * Broadcast message to conversation participants
 */
export function broadcastMessage(
  conversationId: number,
  message: ChatMessage,
  recipientId: number
) {
  const eventKey = `message:${conversationId}`;
  chatEvents.emit(eventKey, message);

  // Also emit to recipient's personal channel
  const userEventKey = `user:${recipientId}:messages`;
  chatEvents.emit(userEventKey, message);

  console.log(`[Chat] Message broadcast to conversation ${conversationId}`);
}

/**
 * Broadcast typing indicator
 */
export function broadcastTyping(
  conversationId: number,
  userId: number,
  userName: string
) {
  const eventKey = `typing:${conversationId}`;
  chatEvents.emit(eventKey, { userId, userName });
}

/**
 * Broadcast online status
 */
export function broadcastOnlineStatus(
  conversationId: number,
  userId: number,
  userName: string,
  isOnline: boolean
) {
  const eventKey = `status:${conversationId}`;
  chatEvents.emit(eventKey, { userId, userName, isOnline });
}

/**
 * Get message event key
 */
export function getMessageEventKey(conversationId: number): string {
  return `message:${conversationId}`;
}

/**
 * Get typing event key
 */
export function getTypingEventKey(conversationId: number): string {
  return `typing:${conversationId}`;
}

/**
 * Get status event key
 */
export function getStatusEventKey(conversationId: number): string {
  return `status:${conversationId}`;
}

/**
 * Get user messages event key
 */
export function getUserMessagesEventKey(userId: number): string {
  return `user:${userId}:messages`;
}
