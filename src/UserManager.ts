import {WebSocket} from "ws"
import { OutgoingMessage } from "./messages/outgoingMessages";

interface User{ 
    name  :string , 
    id : string ,
    conn :  WebSocket

}

interface Room { 
    users : User []
}

export class UserManager {
    private rooms : Map<string , Room>;

    constructor (){
        this.rooms  = new Map<string , Room>
    }

    addUser(name : string , userId : string , roomId : string , ws : WebSocket){
        if(!this.rooms.get(roomId)){
            this.rooms.set(roomId,{
                users : []
            })
        }
         this.rooms.get(roomId)?.users.push({
                  
            id : userId,
            name,
            conn : ws
         })
    ws.on('close' , () => {
        this.removeUser(roomId , userId)
    })
 
    }

    removeUser(roomId :string , userId: string){
        console.log("removed user");
        const users = this.rooms.get(roomId)?.users;
        if(users){
            users.filter(({id}) => id !== userId)
        }
        if(users?.length === 0){
           this.rooms.delete(roomId)
        }
    }  

    getUser(roomId : string , userId :string) : User | null{
        const user = this.rooms.get(roomId)?.users.find((({id}) => id === userId))

        return user?? null
    }

    broadcast(roomId :string  , userId : string , message : OutgoingMessage ){
        const user = this.getUser(roomId , userId);
        if(!user){
            console.error("User not found");
            return;
        }

        const room  = this.rooms.get(roomId);
  
        if(!room){
            console.error("Room not found");
            return;
        }

        room.users.forEach(({conn , id}) => {
            if(id === userId){
                return;
            }

            console.log("outgoing message" + JSON.stringify(message))
            conn.send(JSON.stringify(message));
        })
    }
}   