import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { OutgoingMessage, SupportedMessage as OutgoingSupportedMessages } from './messages/outgoingMessages';
import { UserManager } from "./UserManager";
import { IncomingMessage, SupportedMessage } from "./messages/incomingMessages"
import { InMemoryStore } from "./store/InMemoryStore";
import { Chat } from './store/Store';


// Create an HTTP server
const server = http.createServer(function (request: any, response: any) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

// Initialize user manager and in-memory store
const userManager = new UserManager();
const store = new InMemoryStore();

// Start the HTTP server
server.listen(8080, function () {
    console.log((new Date()) + ' Server is listening on port 8080');
});

// Create a WebSocket server
const wsServer = new WebSocketServer({ server });

// Function to validate origin
function originIsAllowed(origin: string) {
    return true; // Implement your origin validation logic here
}

// Handle WebSocket connections
wsServer.on('connection', function connection(ws: WebSocket) {
    console.log((new Date()) + ' Connection accepted.');

    ws.on('message', function (message: string) {
        try {
            const parsedMessage = JSON.parse(message);
            messageHandler(ws, parsedMessage);
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });

    ws.on('close', () => {
        console.log((new Date()) + ' Connection closed.');
        // Here you could remove the user or do other cleanup if needed
    });

    ws.on('error', console.error);
});

// Message handler to process incoming messages
function messageHandler(ws: WebSocket, message: IncomingMessage) {
    if (message.type === SupportedMessage.JoinRoom) {
        const payload = message.payload;
        userManager.addUser(payload.name, payload.userId, payload.roomId, ws);
        console.log("User Added")
    }
   

    if (message.type === SupportedMessage.SendMessage) {
        const payload = message.payload;
        const user = userManager.getUser(payload.roomId, payload.userId);

        if (!user) {
            console.error("User not found in the db");
            return;
        }

        let chat = store.addChats(payload.userId, user.name, payload.roomId, payload.message ) as Chat;
        if (!chat) {
            return;
        }

        const outgoingPayload: OutgoingMessage = {
            type: OutgoingSupportedMessages.AddChat,
            payload: {
                chatId: chat.id,
                roomId: payload.roomId,
                message: payload.message,
                name: user.name,
                upVotes: 0
            }
        };
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }

    if (message.type === SupportedMessage.UpvoteMessage) {
        const payload = message.payload;
        const chat = store.upVote(payload.userId, payload.roomId, payload.chatId);
        console.log("inside upvote");

        if (!chat) {
            return;
        }

        const outgoingPayload: OutgoingMessage = {
            type: OutgoingSupportedMessages.UpdateChat,
            payload: {
                chatId: payload.chatId,
                roomId: payload.roomId,
                upVotes: chat.upvotes.length
            }
        };

        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }
}
