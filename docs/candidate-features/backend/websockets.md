# WebSockets

## Overview

Real-time bidirectional communication system supporting WebSocket connections, Socket.IO, message broadcasting, room management, and scalable event handling.

## Priority

**MEDIUM-HIGH** - Important for real-time features like chat, notifications, live updates

## Dependencies

- `apollo-server` (for GraphQL subscriptions integration)
- `prisma` (for message persistence and user management)

## Feature Description

Complete WebSocket infrastructure supporting real-time communication, room-based messaging, presence detection, message broadcasting, and integration with GraphQL subscriptions for modern real-time applications.

### Key Features

- **WebSocket Server**: Native WebSocket and Socket.IO support
- **Room Management**: Organized communication channels with permissions
- **Message Broadcasting**: One-to-one, one-to-many, and broadcast messaging
- **Presence System**: Online/offline status and user activity tracking
- **Message Persistence**: Chat history, message threading, file sharing
- **Authentication**: Secure WebSocket connections with JWT tokens
- **Scalability**: Redis adapter for horizontal scaling across instances

## Configuration

```typescript
interface WebSocketConfig {
  server: {
    port: number
    path: string
    cors: {
      origin: string | string[]
      credentials: boolean
    }
    transports: ('websocket' | 'polling')[]
  }
  redis: {
    enabled: boolean
    host: string
    port: number
    password?: string
    db: number
  }
  authentication: {
    enabled: boolean
    jwtSecret: string
    tokenExpiry: number
  }
  rooms: {
    maxRoomsPerUser: number
    maxUsersPerRoom: number
    defaultRoomExpiry: number
  }
  messaging: {
    enablePersistence: boolean
    maxMessageLength: number
    maxMessagesPerMinute: number
    enableFileSharing: boolean
    maxFileSize: string
  }
  presence: {
    enabled: boolean
    heartbeatInterval: number
    offlineTimeout: number
  }
  monitoring: {
    enableMetrics: boolean
    metricsInterval: number
    enableLogging: boolean
  }
}
```

## Generated Files

### Backend Implementation

```
api/src/
├── websockets/
│   ├── index.ts                  # WebSocket exports
│   ├── server/
│   │   ├── socketServer.ts       # Socket.IO server setup
│   │   ├── websocketServer.ts    # Native WebSocket server
│   │   └── serverManager.ts      # Server lifecycle management
│   ├── handlers/
│   │   ├── connectionHandler.ts  # Connection/disconnection handling
│   │   ├── messageHandler.ts     # Message processing
│   │   ├── roomHandler.ts        # Room management
│   │   ├── presenceHandler.ts    # Presence tracking
│   │   └── authHandler.ts        # Authentication handling
│   ├── services/
│   │   ├── roomService.ts        # Room management service
│   │   ├── messageService.ts     # Message service
│   │   ├── presenceService.ts    # Presence tracking service
│   │   ├── broadcastService.ts   # Message broadcasting
│   │   └── notificationService.ts # Real-time notifications
│   ├── middleware/
│   │   ├── authMiddleware.ts     # Socket authentication
│   │   ├── rateLimitMiddleware.ts # Rate limiting
│   │   └── validationMiddleware.ts # Message validation
│   ├── adapters/
│   │   ├── redisAdapter.ts       # Redis adapter for scaling
│   │   └── databaseAdapter.ts    # Database persistence adapter
│   ├── resolvers/
│   │   ├── subscriptionResolvers.ts # GraphQL subscriptions
│   │   └── websocketResolvers.ts # WebSocket management resolvers
│   ├── events/
│   │   ├── eventEmitter.ts       # Event system
│   │   ├── eventHandlers.ts      # Event processing
│   │   └── eventTypes.ts         # Event type definitions
│   ├── utils/
│   │   ├── socketUtils.ts        # Socket utilities
│   │   ├── roomUtils.ts          # Room utilities
│   │   └── messageUtils.ts       # Message utilities
│   └── types.ts                  # WebSocket type definitions
```

### Frontend Implementation

```
web/src/
├── websockets/
│   ├── index.ts                  # WebSocket exports
│   ├── client/
│   │   ├── socketClient.ts       # Socket.IO client
│   │   ├── websocketClient.ts    # Native WebSocket client
│   │   └── connectionManager.ts  # Connection management
│   ├── components/
│   │   ├── ChatRoom.tsx          # Chat room component
│   │   ├── MessageList.tsx       # Message display
│   │   ├── MessageInput.tsx      # Message input
│   │   ├── UserList.tsx          # Online users list
│   │   ├── PresenceIndicator.tsx # User presence indicator
│   │   └── NotificationCenter.tsx # Real-time notifications
│   ├── hooks/
│   │   ├── useSocket.ts          # Socket connection hook
│   │   ├── useRoom.ts            # Room management hook
│   │   ├── useMessages.ts        # Message handling hook
│   │   ├── usePresence.ts        # Presence tracking hook
│   │   └── useNotifications.ts   # Real-time notifications hook
│   ├── services/
│   │   ├── socketService.ts      # Socket communication service
│   │   ├── messageService.ts     # Message handling service
│   │   └── presenceService.ts    # Presence management service
│   ├── providers/
│   │   ├── SocketProvider.tsx    # Socket context provider
│   │   └── RoomProvider.tsx      # Room context provider
│   └── utils/
│       ├── socketUtils.ts        # Socket utilities
│       ├── messageUtils.ts       # Message utilities
│       └── roomUtils.ts          # Room utilities
```

## Code Examples

### Socket.IO Server Setup (Backend)

```typescript
// api/src/websockets/server/socketServer.ts
import { Server as SocketIOServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import { ConnectionHandler } from '../handlers/connectionHandler'
import { MessageHandler } from '../handlers/messageHandler'
import { RoomHandler } from '../handlers/roomHandler'
import { PresenceHandler } from '../handlers/presenceHandler'
import { AuthHandler } from '../handlers/authHandler'

export class SocketServer {
  private io: SocketIOServer
  private redisClient?: Redis
  private connectionHandler: ConnectionHandler
  private messageHandler: MessageHandler
  private roomHandler: RoomHandler
  private presenceHandler: PresenceHandler
  private authHandler: AuthHandler

  constructor(
    private httpServer: HttpServer,
    private config: WebSocketConfig,
  ) {
    this.setupSocketServer()
    this.setupRedisAdapter()
    this.setupHandlers()
    this.setupEventListeners()
  }

  private setupSocketServer() {
    this.io = new SocketIOServer(this.httpServer, {
      path: this.config.server.path,
      cors: this.config.server.cors,
      transports: this.config.server.transports,
    })
  }

  private setupRedisAdapter() {
    if (this.config.redis.enabled) {
      this.redisClient = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db,
      })

      const subClient = this.redisClient.duplicate()
      this.io.adapter(createAdapter(this.redisClient, subClient))
    }
  }

  private setupHandlers() {
    this.connectionHandler = new ConnectionHandler(this.io, this.config)
    this.messageHandler = new MessageHandler(this.io, this.config)
    this.roomHandler = new RoomHandler(this.io, this.config)
    this.presenceHandler = new PresenceHandler(this.io, this.config)
    this.authHandler = new AuthHandler(this.config)
  }

  private setupEventListeners() {
    this.io.use(this.authHandler.authenticate.bind(this.authHandler))

    this.io.on('connection', socket => {
      console.log(`User connected: ${socket.id}`)

      // Handle connection
      this.connectionHandler.handleConnection(socket)

      // Message events
      socket.on('message', data => {
        this.messageHandler.handleMessage(socket, data)
      })

      socket.on('typing', data => {
        this.messageHandler.handleTyping(socket, data)
      })

      // Room events
      socket.on('join-room', data => {
        this.roomHandler.handleJoinRoom(socket, data)
      })

      socket.on('leave-room', data => {
        this.roomHandler.handleLeaveRoom(socket, data)
      })

      socket.on('create-room', data => {
        this.roomHandler.handleCreateRoom(socket, data)
      })

      // Presence events
      socket.on('presence-update', data => {
        this.presenceHandler.handlePresenceUpdate(socket, data)
      })

      // Disconnect handling
      socket.on('disconnect', reason => {
        console.log(`User disconnected: ${socket.id}, reason: ${reason}`)
        this.connectionHandler.handleDisconnection(socket, reason)
        this.presenceHandler.handleDisconnection(socket)
      })

      // Error handling
      socket.on('error', error => {
        console.error(`Socket error for ${socket.id}:`, error)
      })
    })
  }

  broadcast(event: string, data: any, room?: string) {
    if (room) {
      this.io.to(room).emit(event, data)
    } else {
      this.io.emit(event, data)
    }
  }

  broadcastToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  getConnectedUsers(): number {
    return this.io.engine.clientsCount
  }

  getRoomUsers(room: string): string[] {
    const roomData = this.io.sockets.adapter.rooms.get(room)
    return roomData ? Array.from(roomData) : []
  }

  async shutdown() {
    if (this.redisClient) {
      await this.redisClient.quit()
    }
    this.io.close()
  }
}
```

### Message Handler

```typescript
// api/src/websockets/handlers/messageHandler.ts
import { Socket } from 'socket.io'
import { MessageService } from '../services/messageService'
import { RoomService } from '../services/roomService'
import { BroadcastService } from '../services/broadcastService'

export class MessageHandler {
  private messageService: MessageService
  private roomService: RoomService
  private broadcastService: BroadcastService

  constructor(
    private io: any,
    private config: WebSocketConfig,
  ) {
    this.messageService = new MessageService(config)
    this.roomService = new RoomService(config)
    this.broadcastService = new BroadcastService(io)
  }

  async handleMessage(socket: Socket, data: MessageData) {
    try {
      const userId = (socket as any).user?.id
      if (!userId) {
        socket.emit('error', { message: 'Authentication required' })
        return
      }

      // Validate message
      const validation = this.validateMessage(data)
      if (!validation.valid) {
        socket.emit('error', { message: validation.error })
        return
      }

      // Check room permissions
      if (data.roomId) {
        const canSend = await this.roomService.canUserSendMessage(userId, data.roomId)
        if (!canSend) {
          socket.emit('error', { message: 'Insufficient permissions' })
          return
        }
      }

      // Process message
      const processedMessage = await this.messageService.processMessage({
        ...data,
        senderId: userId,
        timestamp: new Date(),
      })

      // Persist message
      if (this.config.messaging.enablePersistence) {
        await this.messageService.saveMessage(processedMessage)
      }

      // Broadcast message
      await this.broadcastMessage(processedMessage)

      // Acknowledge to sender
      socket.emit('message-sent', {
        id: processedMessage.id,
        timestamp: processedMessage.timestamp,
      })
    } catch (error) {
      console.error('Message handling error:', error)
      socket.emit('error', { message: 'Failed to process message' })
    }
  }

  async handleTyping(socket: Socket, data: TypingData) {
    try {
      const userId = (socket as any).user?.id
      if (!userId || !data.roomId) return

      const typingEvent = {
        userId,
        username: (socket as any).user?.username,
        roomId: data.roomId,
        isTyping: data.isTyping,
        timestamp: new Date(),
      }

      // Broadcast typing indicator to room (except sender)
      socket.to(data.roomId).emit('user-typing', typingEvent)

      // Set typing timeout
      if (data.isTyping) {
        this.setTypingTimeout(socket, data.roomId, userId)
      }
    } catch (error) {
      console.error('Typing handling error:', error)
    }
  }

  private validateMessage(data: MessageData): ValidationResult {
    if (!data.content || typeof data.content !== 'string') {
      return { valid: false, error: 'Message content is required' }
    }

    if (data.content.length > this.config.messaging.maxMessageLength) {
      return {
        valid: false,
        error: `Message too long (max ${this.config.messaging.maxMessageLength} characters)`,
      }
    }

    if (data.type && !['text', 'image', 'file', 'system'].includes(data.type)) {
      return { valid: false, error: 'Invalid message type' }
    }

    return { valid: true }
  }

  private async broadcastMessage(message: ProcessedMessage) {
    if (message.roomId) {
      // Broadcast to room
      await this.broadcastService.broadcastToRoom(message.roomId, 'new-message', message)
    } else if (message.recipientId) {
      // Direct message
      await this.broadcastService.broadcastToUser(message.recipientId, 'new-message', message)
      await this.broadcastService.broadcastToUser(message.senderId, 'new-message', message)
    } else {
      // Global broadcast
      await this.broadcastService.broadcastGlobal('new-message', message)
    }
  }

  private setTypingTimeout(socket: Socket, roomId: string, userId: string) {
    const timeoutKey = `typing-${roomId}-${userId}`

    // Clear existing timeout
    if ((socket as any)[timeoutKey]) {
      clearTimeout((socket as any)[timeoutKey])
    }

    // Set new timeout
    ;(socket as any)[timeoutKey] = setTimeout(() => {
      socket.to(roomId).emit('user-typing', {
        userId,
        roomId,
        isTyping: false,
        timestamp: new Date(),
      })
      delete (socket as any)[timeoutKey]
    }, 3000) // 3 seconds typing timeout
  }
}

interface MessageData {
  content: string
  type?: 'text' | 'image' | 'file' | 'system'
  roomId?: string
  recipientId?: string
  replyToId?: string
  metadata?: Record<string, any>
}

interface TypingData {
  roomId: string
  isTyping: boolean
}

interface ProcessedMessage extends MessageData {
  id: string
  senderId: string
  timestamp: Date
}

interface ValidationResult {
  valid: boolean
  error?: string
}
```

### Room Service

```typescript
// api/src/websockets/services/roomService.ts
import { PrismaClient } from '@prisma/client'

export class RoomService {
  private prisma = new PrismaClient()

  constructor(private config: WebSocketConfig) {}

  async createRoom(data: CreateRoomData): Promise<Room> {
    const room = await this.prisma.room.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type || 'public',
        createdById: data.createdById,
        maxUsers: data.maxUsers || this.config.rooms.maxUsersPerRoom,
        isPrivate: data.isPrivate || false,
      },
      include: {
        members: true,
        createdBy: {
          select: { id: true, username: true },
        },
      },
    })

    // Add creator as admin member
    await this.addUserToRoom(room.id, data.createdById, 'admin')

    return room
  }

  async joinRoom(roomId: string, userId: string): Promise<RoomMember> {
    // Check if room exists and has space
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { _count: { select: { members: true } } },
    })

    if (!room) {
      throw new Error('Room not found')
    }

    if (room._count.members >= room.maxUsers) {
      throw new Error('Room is full')
    }

    // Check if user is already a member
    const existingMember = await this.prisma.roomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
    })

    if (existingMember) {
      return existingMember
    }

    // Add user to room
    return this.addUserToRoom(roomId, userId, 'member')
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await this.prisma.roomMember.delete({
      where: {
        roomId_userId: { roomId, userId },
      },
    })

    // Check if room is empty and should be deleted
    const memberCount = await this.prisma.roomMember.count({
      where: { roomId },
    })

    if (memberCount === 0) {
      await this.deleteRoom(roomId)
    }
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    const userRooms = await this.prisma.roomMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            _count: { select: { members: true } },
            members: {
              include: {
                user: {
                  select: { id: true, username: true },
                },
              },
            },
          },
        },
      },
    })

    return userRooms.map(ur => ur.room)
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    return this.prisma.roomMember.findMany({
      where: { roomId },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    })
  }

  async canUserSendMessage(userId: string, roomId: string): Promise<boolean> {
    const member = await this.prisma.roomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
    })

    return member !== null && !member.isMuted
  }

  async updateRoomSettings(roomId: string, userId: string, settings: RoomSettings): Promise<Room> {
    // Check if user is admin
    const member = await this.prisma.roomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
    })

    if (!member || member.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data: settings,
    })
  }

  async deleteRoom(roomId: string): Promise<void> {
    // Delete all messages in the room
    await this.prisma.message.deleteMany({
      where: { roomId },
    })

    // Delete all room members
    await this.prisma.roomMember.deleteMany({
      where: { roomId },
    })

    // Delete the room
    await this.prisma.room.delete({
      where: { id: roomId },
    })
  }

  private async addUserToRoom(roomId: string, userId: string, role: 'admin' | 'member'): Promise<RoomMember> {
    return this.prisma.roomMember.create({
      data: {
        roomId,
        userId,
        role,
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    })
  }
}

interface CreateRoomData {
  name: string
  description?: string
  type?: 'public' | 'private'
  createdById: string
  maxUsers?: number
  isPrivate?: boolean
}

interface RoomSettings {
  name?: string
  description?: string
  maxUsers?: number
  isPrivate?: boolean
}

interface Room {
  id: string
  name: string
  description?: string
  type: string
  maxUsers: number
  isPrivate: boolean
  createdAt: Date
  members?: RoomMember[]
  _count?: { members: number }
}

interface RoomMember {
  id: string
  roomId: string
  userId: string
  role: 'admin' | 'member'
  isMuted: boolean
  joinedAt: Date
  user?: {
    id: string
    username: string
  }
}
```

### React Socket Hook

```typescript
// web/src/websockets/hooks/useSocket.ts
import { useEffect, useContext, useCallback } from 'react'
import { SocketContext } from '../providers/SocketProvider'

export const useSocket = () => {
  const context = useContext(SocketContext)

  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }

  const { socket, isConnected, reconnectAttempts } = context

  const emit = useCallback(
    (event: string, data: any) => {
      if (socket && isConnected) {
        socket.emit(event, data)
      } else {
        console.warn('Socket not connected, cannot emit event:', event)
      }
    },
    [socket, isConnected],
  )

  const on = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      if (socket) {
        socket.on(event, handler)
        return () => socket.off(event, handler)
      }
      return () => {}
    },
    [socket],
  )

  const off = useCallback(
    (event: string, handler?: (...args: any[]) => void) => {
      if (socket) {
        if (handler) {
          socket.off(event, handler)
        } else {
          socket.removeAllListeners(event)
        }
      }
    },
    [socket],
  )

  return {
    socket,
    isConnected,
    reconnectAttempts,
    emit,
    on,
    off,
  }
}
```

### React Chat Room Component

```typescript
// web/src/websockets/components/ChatRoom.tsx
import React, { useState, useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import { useRoom } from '../hooks/useRoom'
import { useMessages } from '../hooks/useMessages'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { UserList } from './UserList'

interface ChatRoomProps {
  roomId: string
  onLeave?: () => void
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onLeave }) => {
  const { emit, on, off } = useSocket()
  const { room, members, joinRoom, leaveRoom } = useRoom(roomId)
  const { messages, sendMessage, loadMessages } = useMessages(roomId)

  const [isTyping, setIsTyping] = useState<string[]>([])
  const [showUserList, setShowUserList] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    joinRoom()

    // Set up event listeners
    const cleanup = [
      on('new-message', handleNewMessage),
      on('user-joined', handleUserJoined),
      on('user-left', handleUserLeft),
      on('user-typing', handleUserTyping),
    ]

    return () => {
      cleanup.forEach(cleanupFn => cleanupFn())
      leaveRoom()
    }
  }, [roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleNewMessage = (message: any) => {
    // Message will be handled by useMessages hook
  }

  const handleUserJoined = (data: { user: any }) => {
    // Show notification or update user list
    console.log(`${data.user.username} joined the room`)
  }

  const handleUserLeft = (data: { user: any }) => {
    console.log(`${data.user.username} left the room`)
  }

  const handleUserTyping = (data: { userId: string; username: string; isTyping: boolean }) => {
    setIsTyping(prev => {
      if (data.isTyping) {
        return prev.includes(data.username)
          ? prev
          : [...prev, data.username]
      } else {
        return prev.filter(name => name !== data.username)
      }
    })
  }

  const handleSendMessage = async (content: string, type = 'text') => {
    try {
      await sendMessage({
        content,
        type,
        roomId,
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleTyping = (typing: boolean) => {
    emit('typing', { roomId, isTyping: typing })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!room) {
    return <div className="loading">Loading room...</div>
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <div className="room-info">
          <h2>{room.name}</h2>
          <span className="member-count">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="room-actions">
          <button
            className="user-list-toggle"
            onClick={() => setShowUserList(!showUserList)}
          >
            👥
          </button>
          {onLeave && (
            <button className="leave-button" onClick={onLeave}>
              Leave Room
            </button>
          )}
        </div>
      </div>

      <div className="chat-content">
        <div className="chat-messages">
          <MessageList
            messages={messages}
            currentUserId={/* get from auth context */}
          />

          {isTyping.length > 0 && (
            <div className="typing-indicator">
              {isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {showUserList && (
          <div className="user-list-sidebar">
            <UserList
              users={members}
              roomId={roomId}
              onClose={() => setShowUserList(false)}
            />
          </div>
        )}
      </div>

      <div className="chat-input">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          placeholder={`Message #${room.name}...`}
        />
      </div>
    </div>
  )
}
```

### GraphQL Subscriptions Integration

```typescript
// api/src/websockets/resolvers/subscriptionResolvers.ts
import { withFilter } from 'graphql-subscriptions'
import { pubsub } from '../events/eventEmitter'
import { requireAuth } from '../../auth/middleware'

export const subscriptionResolvers = {
  Subscription: {
    messageAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['MESSAGE_ADDED']),
        (payload, variables, context) => {
          // Only send messages from rooms the user has access to
          return (
            payload.messageAdded.roomId === variables.roomId &&
            context.user &&
            context.roomMemberships.includes(variables.roomId)
          )
        },
      ),
      resolve: (payload: any) => payload.messageAdded,
    },

    userPresenceChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['USER_PRESENCE_CHANGED']),
        (payload, variables, context) => {
          // Filter by room or global presence
          return !variables.roomId || payload.userPresenceChanged.roomId === variables.roomId
        },
      ),
      resolve: (payload: any) => payload.userPresenceChanged,
    },

    roomUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['ROOM_UPDATED']),
        (payload, variables, context) => {
          return payload.roomUpdated.id === variables.roomId && context.roomMemberships.includes(variables.roomId)
        },
      ),
      resolve: (payload: any) => payload.roomUpdated,
    },

    notificationReceived: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['NOTIFICATION_RECEIVED']),
        (payload, variables, context) => {
          return payload.notificationReceived.userId === context.user.id
        },
      ),
      resolve: (payload: any) => payload.notificationReceived,
    },
  },
}

// Example usage in message service
export const publishMessage = (message: any) => {
  pubsub.publish('MESSAGE_ADDED', { messageAdded: message })
}

export const publishPresenceChange = (presence: any) => {
  pubsub.publish('USER_PRESENCE_CHANGED', { userPresenceChanged: presence })
}
```

## Database Schema

```prisma
// Add to schema.prisma
model Room {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  type        String   @default("public") // public, private, direct
  maxUsers    Int      @default(50)
  isPrivate   Boolean  @default(false)
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  createdBy   User         @relation("CreatedRooms", fields: [createdById], references: [id])
  members     RoomMember[]
  messages    Message[]

  @@map("rooms")
}

model RoomMember {
  id       String   @id @default(cuid())
  roomId   String
  userId   String
  role     String   @default("member") // admin, member
  isMuted  Boolean  @default(false)
  joinedAt DateTime @default(now())

  room     Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user     User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([roomId, userId])
  @@map("room_members")
}

model Message {
  id          String    @id @default(cuid())
  content     String    @db.Text
  type        String    @default("text") // text, image, file, system
  senderId    String
  roomId      String?
  recipientId String?   // For direct messages
  replyToId   String?   // For threaded conversations
  metadata    Json?     // File info, images, etc.
  editedAt    DateTime?
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())

  sender      User      @relation("SentMessages", fields: [senderId], references: [id])
  room        Room?     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  recipient   User?     @relation("ReceivedMessages", fields: [recipientId], references: [id])
  replyTo     Message?  @relation("MessageReplies", fields: [replyToId], references: [id])
  replies     Message[] @relation("MessageReplies")

  @@index([roomId, createdAt])
  @@index([senderId, createdAt])
  @@map("messages")
}

model UserPresence {
  id           String    @id @default(cuid())
  userId       String    @unique
  status       String    @default("offline") // online, offline, away, busy
  lastSeenAt   DateTime  @default(now())
  socketId     String?   // Current socket connection ID
  customStatus String?   // Custom status message
  updatedAt    DateTime  @updatedAt

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_presence")
}

model SocketConnection {
  id          String   @id @default(cuid())
  socketId    String   @unique
  userId      String?
  ipAddress   String?
  userAgent   String?  @db.Text
  connectedAt DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("socket_connections")
}

// Extend User model
model User {
  id               String   @id @default(cuid())
  createdRooms     Room[]   @relation("CreatedRooms")
  roomMemberships  RoomMember[]
  sentMessages     Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  presence         UserPresence?
  socketConnections SocketConnection[]
  // ... other user fields
}
```

## Installation Steps

1. **Install WebSocket Dependencies**

   ```bash
   # Backend
   pnpm add socket.io @socket.io/redis-adapter ioredis
   pnpm add -D @types/socket.io

   # Frontend
   pnpm add socket.io-client
   ```

2. **Configure Environment Variables**

   ```env
   # WebSocket Configuration
   WEBSOCKET_PORT=3002
   WEBSOCKET_PATH=/socket.io
   WEBSOCKET_CORS_ORIGIN=http://localhost:3000

   # Redis for scaling
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   REDIS_DB=2

   # Authentication
   JWT_SECRET=your-jwt-secret

   # Messaging
   MAX_MESSAGE_LENGTH=2000
   MAX_MESSAGES_PER_MINUTE=60
   ENABLE_FILE_SHARING=true
   MAX_FILE_SIZE=10MB
   ```

3. **Database Migration**

   ```bash
   pnpm prisma migrate dev --name add-websockets-system
   ```

4. **Start Redis Server**
   ```bash
   docker run -d --name redis-websockets -p 6379:6379 redis:7-alpine
   ```

This WebSocket system provides enterprise-grade real-time communication with room management, presence tracking, message persistence, and horizontal scaling capabilities.
