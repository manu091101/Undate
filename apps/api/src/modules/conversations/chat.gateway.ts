import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// SECURITY: this gateway is DISABLED in production until the auth handshake +
// participant-membership check + entitlement guard land. It is mounted in dev
// only so the front-end team can iterate against the wire protocol.
// See docs/SECURITY.md and the review finding C1 in REVIEW_FINDINGS.md.
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: process.env.WEB_ORIGIN?.split(',') ?? false, credentials: true },
})
export class ChatGateway {
  private readonly log = new Logger(ChatGateway.name);
  private readonly enabled = process.env.NODE_ENV !== 'production';

  @WebSocketServer()
  server!: Server;

  private requireEnabled() {
    if (!this.enabled) {
      throw new WsException('chat_gateway_disabled');
    }
  }

  // Phase 1 wires this to: (1) verify JWT off socket.handshake.auth.token,
  // (2) load the user, (3) confirm the user is a ConversationParticipant of
  // the requested conversation, (4) attach the user id to the socket data.
  private async authorize(socket: Socket, conversationId: string): Promise<void> {
    this.requireEnabled();
    const token = socket.handshake.auth?.token;
    if (!token) throw new WsException('unauthenticated');
    if (!conversationId) throw new WsException('missing_conversation');
    // TODO Phase 1 W11: verify JWT, load participant row, attach userId.
    // Until then the gateway is dev-only and we no-op the lookup.
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    await this.authorize(socket, data.conversationId);
    await socket.join(`conv:${data.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('send')
  async handleSend(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { conversationId: string; body: string },
  ) {
    await this.authorize(socket, payload.conversationId);
    this.log.debug(`recv from ${socket.id} for conv ${payload.conversationId.slice(0, 8)}…`);
    // Body content intentionally NOT logged — PII / message content.
    this.server.to(`conv:${payload.conversationId}`).emit('message', {
      conversationId: payload.conversationId,
      body: payload.body,
      ts: Date.now(),
    });
    return { ok: true };
  }
}
