
export type UserId = string;

export interface Chat{
    id : string;
    name : string ;
    userId : UserId;
    message : string;
    upvotes : UserId[];
}

export abstract class Store {
    constructor() {
        
    }

    initializingRoom(roomId : string)  {

    }

    getChats(room : string , limit : number , offset : number) {

    }
    
    addChats(userId : UserId , room : string , name : string , message : string , chatID : string) {

    }

    upVote( userId : UserId , room : string , chatId : string) {

    }
}