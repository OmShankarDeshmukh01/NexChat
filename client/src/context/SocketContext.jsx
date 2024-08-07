import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { userInfo } = useAppStore();

    useEffect(() => {
        if (userInfo) {
            const newSocket = io(HOST, {
                withCredentials: true,
                query: { userId: userInfo.id },
            });

            newSocket.on("connect", () => {
                console.log("Connected to socket server");
            });

            const handleReceiveMessage = (message) => {
                const { selectedChatData, selectedChatType, addMessage ,addContactsInDMContacts } = useAppStore.getState();
                if (
                    selectedChatType !== undefined &&
                    (selectedChatData._id === message.sender._id || selectedChatData._id === message.recipient._id)
                ) {
                    console.log("message received", message);
                    addMessage(message);
                }
                addContactsInDMContacts(message);
            };

            const handleReceiveChannelMessage = (message) => {
                const { selectedChatData, selectedChatType, addMessage,addChannelInChannelList  } = useAppStore.getState();

                if (selectedChatType !== undefined && selectedChatData._id === message.channelId) {
                    addMessage(message);
                }
                addChannelInChannelList(message);
            };

            newSocket.on("receiveMessage", handleReceiveMessage);
            newSocket.on("receive-channel-message", handleReceiveChannelMessage);

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [userInfo]);

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
