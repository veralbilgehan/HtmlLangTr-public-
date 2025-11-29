import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, File, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/auth";

const USERS = [
  { id: 1, name: "Ahmet Yılmaz", role: "Departman Müdürü", status: "online", avatar: "AY" },
  { id: 2, name: "Ayşe Demir", role: "İnsan Kaynakları", status: "busy", avatar: "AD" },
  { id: 3, name: "Mehmet Kaya", role: "Yazılım Uzmanı", status: "offline", avatar: "MK" },
  { id: 4, name: "Zeynep Çelik", role: "Proje Yöneticisi", status: "online", avatar: "ZÇ" },
  { id: 5, name: "Can Yıldız", role: "Grafik Tasarım", status: "away", avatar: "CY" },
];

const MESSAGES = [
  { id: 1, senderId: 2, text: "Merhaba Ahmet Bey, toplantı notlarını gönderiyorum.", time: "10:30", type: "text" },
  { id: 2, senderId: 1, text: "Teşekkürler Ayşe Hanım, inceleyip dönüş yapacağım.", time: "10:32", type: "sent" },
  { id: 3, senderId: 2, text: "Tamamdır, iyi çalışmalar.", time: "10:33", type: "text" },
  { id: 4, senderId: 2, fileName: "toplanti-notlari.pdf", size: "2.4 MB", time: "10:33", type: "file" },
];

interface ChatInterfaceProps {
  user: User;
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [activeUser, setActiveUser] = useState(USERS[1]);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(MESSAGES);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    
    setMessages([
      ...messages,
      {
        id: messages.length + 1,
        senderId: 1, // Self
        text: messageInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "sent"
      }
    ]);
    setMessageInput("");
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Sidebar */}
      <div className="w-80 bg-slate-50 border-r flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Kişi ara..." className="pl-8 bg-slate-50" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {USERS.map((user) => (
            <div 
              key={user.id}
              onClick={() => setActiveUser(user)}
              className={cn(
                "p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-100",
                activeUser.id === user.id && "bg-blue-50 hover:bg-blue-50"
              )}
            >
              <div className="relative">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.avatar}</AvatarFallback>
                </Avatar>
                <span className={cn(
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                  user.status === "online" ? "bg-green-500" : 
                  user.status === "busy" ? "bg-red-500" : 
                  user.status === "away" ? "bg-yellow-500" : "bg-slate-400"
                )} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-medium text-sm truncate">{user.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{user.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{activeUser.avatar}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold">{activeUser.name}</h3>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Çevrimiçi
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">Dosyalar</Button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.type === "sent" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[70%] p-3 rounded-2xl shadow-sm",
                msg.type === "sent" 
                  ? "bg-primary text-primary-foreground rounded-br-none" 
                  : "bg-white border text-slate-800 rounded-bl-none"
              )}>
                {msg.type === "file" ? (
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded">
                      <File className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{msg.fileName}</p>
                      <p className="text-xs opacity-70">{msg.size}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
                <p className={cn("text-[10px] mt-1 text-right opacity-70")}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input 
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Bir mesaj yazın..." 
              className="flex-1 rounded-full bg-slate-50 border-slate-200"
            />
            <Button onClick={handleSend} size="icon" className="rounded-full h-10 w-10 shrink-0">
              <Send className="h-4 w-4 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
