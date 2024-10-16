"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const outgoingMessages_1 = require("./messages/outgoingMessages");
const UserManager_1 = require("./UserManager");
const incomingMessages_1 = require("./messages/incomingMessages");
const InMemoryStore_1 = require("./store/InMemoryStore");
// Create an HTTP server
const server = http_1.default.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
// Initialize user manager and in-memory store
const userManager = new UserManager_1.UserManager();
const store = new InMemoryStore_1.InMemoryStore();
// Start the HTTP server
server.listen(8080, function () {
    console.log((new Date()) + ' Server is listening on port 8080');
});
// Create a WebSocket server
const wsServer = new ws_1.WebSocketServer({ server });
// Function to validate origin
function originIsAllowed(origin) {
    return true; // Implement your origin validation logic here
}
// Handle WebSocket connections
wsServer.on('connection', function connection(ws) {
    console.log((new Date()) + ' Connection accepted.');
    ws.on('message', function (message) {
        try {
            const parsedMessage = JSON.parse(message);
            messageHandler(ws, parsedMessage);
        }
        catch (e) {
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
function messageHandler(ws, message) {
    if (message.type === incomingMessages_1.SupportedMessage.JoinRoom) {
        const payload = message.payload;
        userManager.addUser(payload.name, payload.userId, payload.roomId, ws);
    }
    if (message.type === incomingMessages_1.SupportedMessage.SendMessage) {
        const payload = message.payload;
        const user = userManager.getUser(payload.roomId, payload.userId);
        if (!user) {
            console.error("User not found in the db");
            return;
        }
        let chat = store.addChats(payload.userId, user.name, payload.roomId, payload.message);
        if (!chat) {
            return;
        }
        const outgoingPayload = {
            type: outgoingMessages_1.SupportedMessage.AddChat,
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
    if (message.type === incomingMessages_1.SupportedMessage.UpvoteMessage) {
        const payload = message.payload;
        const chat = store.upVote(payload.userId, payload.roomId, payload.chatId);
        console.log("inside upvote");
        if (!chat) {
            return;
        }
        const outgoingPayload = {
            type: outgoingMessages_1.SupportedMessage.UpdateChat,
            payload: {
                chatId: payload.chatId,
                roomId: payload.roomId,
                upVotes: chat.upvotes.length
            }
        };
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }
}
