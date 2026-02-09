- skelton loading (chats loading) and chat update
- remove hard coded session ids here
- add payments for special credits and also 
- show the payments plans for pro and free etc here
- logout button to be added here
- make the middleware.ts file work
- add links for localhost in notion and gmail, claendar insgration links there
- add a smaple message when user is onboarded

 const [messages, setMessages] = useState<any[]>([
        {
            id: "default-123",
            conversationId: "default",
            userId: "anushay123",
            role: "assistant",
            message: "How can I help you ?",
            payload: {},
            creditsUsed: 0,
        }
    ]);