"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
class UserManager {
    constructor() {
        this.rooms = new Map;
    }
    addUser(name, userId, roomId, ws) {
        var _a;
        if (!this.rooms.get(roomId)) {
            this.rooms.set(roomId, {
                users: []
            });
        }
        (_a = this.rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.users.push({
            id: userId,
            name,
            conn: ws
        });
        ws.on('close', () => {
            this.removeUser(roomId, userId);
        });
    }
    removeUser(roomId, userId) {
        var _a;
        console.log("removed user");
        const users = (_a = this.rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.users;
        if (users) {
            users.filter(({ id }) => id !== userId);
        }
        if ((users === null || users === void 0 ? void 0 : users.length) === 0) {
            this.rooms.delete(roomId);
        }
    }
    getUser(roomId, userId) {
        var _a;
        const user = (_a = this.rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.users.find((({ id }) => id === userId));
        return user !== null && user !== void 0 ? user : null;
    }
    broadcast(roomId, userId, message) {
        const user = this.getUser(roomId, userId);
        if (!user) {
            console.error("User not found");
            return;
        }
        const room = this.rooms.get(roomId);
        if (!room) {
            console.error("Room not found");
            return;
        }
        room.users.forEach(({ conn, id }) => {
            if (id === userId) {
                return;
            }
            console.log("outgoing message" + JSON.stringify(message));
            conn.send(JSON.stringify(message));
        });
    }
}
exports.UserManager = UserManager;
