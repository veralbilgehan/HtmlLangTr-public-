import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, File, Search, X, Download, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/auth";

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  read: boolean;
  createdAt: string;
}

interface ChatUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department: string | null;
  avatar: string | null;
}

interface ChatInterfaceProps {
  user: User;
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeUser) {
      fetchMessages(activeUser.id);
      const interval = setInterval(() => fetchMessages(activeUser.id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        const otherUsers = data.users.filter((u: ChatUser) => u.id !== user.id);
        setUsers(otherUsers);
        if (otherUsers.length > 0 && !activeUser) {
          setActiveUser(otherUsers[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/messages/${userId}`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Hata",
          description: "Dosya boyutu 10MB'dan büyük olamaz",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Dosya yüklenemedi");
    }

    return response.json();
  };

  const handleSend = async () => {
    if (!activeUser) return;
    if (!messageInput.trim() && !selectedFile) return;

    setIsSending(true);
    try {
      let fileData = null;

      if (selectedFile) {
        setIsUploading(true);
        fileData = await uploadFile(selectedFile);
        setIsUploading(false);
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipientId: activeUser.id,
          content: messageInput.trim() || null,
          fileUrl: fileData?.fileUrl || null,
          fileName: fileData?.fileName || null,
          fileSize: fileData?.fileSize || null,
          fileType: fileData?.fileType || null,
        }),
      });

      if (response.ok) {
        setMessageInput("");
        clearSelectedFile();
        await fetchMessages(activeUser.id);
      } else {
        throw new Error("Mesaj gönderilemedi");
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Mesaj gönderilemedi",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isOwnMessage = (msg: Message) => msg.senderId === user.id;

  return (
    <div className="flex h-[500px] max-h-[70vh] border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        data-testid="input-file"
      />

      {/* Sidebar */}
      <div className="w-64 md:w-80 bg-slate-50 border-r flex flex-col shrink-0">
        <div className="p-4 border-b bg-white">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kişi ara..."
              className="pl-8 bg-slate-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-users"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((chatUser) => (
            <div
              key={chatUser.id}
              onClick={() => setActiveUser(chatUser)}
              className={cn(
                "p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-100",
                activeUser?.id === chatUser.id && "bg-blue-50 hover:bg-blue-50"
              )}
              data-testid={`user-${chatUser.id}`}
            >
              <div className="relative">
                <Avatar>
                  {chatUser.avatar ? (
                    <AvatarImage src={chatUser.avatar} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getInitials(chatUser.fullName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-medium text-sm truncate">{chatUser.fullName}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {chatUser.department || chatUser.role}
                </p>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Kullanıcı bulunamadı
            </p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeUser ? (
          <>
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <Avatar>
                  {activeUser.avatar ? (
                    <AvatarImage src={activeUser.avatar} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getInitials(activeUser.fullName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-bold">{activeUser.fullName}</h3>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Çevrimiçi
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", isOwnMessage(msg) ? "justify-end" : "justify-start")}
                  data-testid={`message-${msg.id}`}
                >
                  <div
                    className={cn(
                      "max-w-[70%] p-3 rounded-2xl shadow-sm",
                      isOwnMessage(msg)
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-white border text-slate-800 rounded-bl-none"
                    )}
                  >
                    {msg.fileUrl && (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg mb-2",
                          isOwnMessage(msg) ? "bg-primary-foreground/10" : "bg-slate-100"
                        )}
                        data-testid={`file-download-${msg.id}`}
                      >
                        <div
                          className={cn(
                            "p-2 rounded",
                            isOwnMessage(msg) ? "bg-primary-foreground/20" : "bg-slate-200"
                          )}
                        >
                          <File
                            className={cn(
                              "h-6 w-6",
                              isOwnMessage(msg) ? "text-primary-foreground" : "text-blue-500"
                            )}
                          />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p
                            className={cn(
                              "font-medium text-sm truncate",
                              isOwnMessage(msg) ? "text-primary-foreground" : "text-slate-800"
                            )}
                          >
                            {msg.fileName}
                          </p>
                          <p
                            className={cn(
                              "text-xs",
                              isOwnMessage(msg) ? "text-primary-foreground/70" : "text-slate-500"
                            )}
                          >
                            {msg.fileSize ? formatFileSize(msg.fileSize) : ""}
                          </p>
                        </div>
                        <Download
                          className={cn(
                            "h-4 w-4",
                            isOwnMessage(msg) ? "text-primary-foreground" : "text-blue-500"
                          )}
                        />
                      </a>
                    )}
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                    <p className="text-[10px] mt-1 text-right opacity-70">
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Henüz mesaj yok. İlk mesajı gönderin!
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected file preview */}
            {selectedFile && (
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-3">
                <File className="h-5 w-5 text-blue-500" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSelectedFile}
                  className="h-8 w-8"
                  data-testid="button-clear-file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="p-3 bg-white border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground shrink-0 h-8 w-8"
                  onClick={handleFileSelect}
                  disabled={isSending}
                  data-testid="button-attach-file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Mesaj yazın..."
                  className="flex-1 min-w-0 rounded-full bg-slate-50 border-slate-200 text-sm h-9"
                  disabled={isSending}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="rounded-full h-8 w-8 shrink-0"
                  disabled={isSending || (!messageInput.trim() && !selectedFile)}
                  data-testid="button-send-message"
                >
                  {isSending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
              </div>
              {isUploading && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Dosya yükleniyor...
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Sohbet başlatmak için bir kişi seçin</p>
          </div>
        )}
      </div>
    </div>
  );
}
