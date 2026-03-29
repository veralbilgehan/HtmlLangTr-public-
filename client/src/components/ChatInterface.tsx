import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, File, Search, X, Download, Loader2, Camera, Image } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
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
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    fetchUsers();
    // Re-fetch user list every 30s so new users appear and list recovers from failures
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeUser) {
      const isNewConversation = activeUser.id !== activeUserIdRef.current;
      activeUserIdRef.current = activeUser.id;
      fetchMessages(activeUser.id, isNewConversation);
      const interval = setInterval(() => fetchMessages(activeUser.id, false), 3000);
      return () => clearInterval(interval);
    }
  }, [activeUser]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const fetchUsers = async (retry = true) => {
    let loaded = false;
    try {
      const response = await fetch("/api/conversations", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        const otherUsers = data.users.filter((u: ChatUser) => u.id !== user.id);
        if (otherUsers.length > 0) {
          setUsers(otherUsers);
          setActiveUser(prev => prev ?? otherUsers[0]);
          loaded = true;
        }
      }
    } catch {
      // fall through to fallback
    }
    if (!loaded) {
      // Fallback: load all users if conversations endpoint fails or returns empty
      try {
        const response = await fetch("/api/users", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          const otherUsers = data.users.filter((u: ChatUser) => u.id !== user.id);
          if (otherUsers.length > 0) {
            setUsers(otherUsers);
            setActiveUser(prev => prev ?? otherUsers[0]);
            loaded = true;
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }
    // Retry once after 3s if still no users (e.g. server still starting up)
    if (!loaded && retry) {
      setTimeout(() => fetchUsers(false), 3000);
    }
  };

  const fetchMessages = async (userId: string, scrollToBottom = false) => {
    try {
      const response = await fetch(`/api/messages/${userId}`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        if (scrollToBottom) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 50);
        }
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
    setCapturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startCamera = async () => {
    try {
      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      
      setCameraStream(stream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error: any) {
      let message = "Kamera açılamadı";
      if (error.name === "NotAllowedError") {
        message = "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.";
      } else if (error.name === "NotFoundError") {
        message = "Kamera bulunamadı";
      }
      toast({
        title: "Hata",
        description: message,
        variant: "destructive",
      });
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
  }, [cameraStream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(dataUrl);
        
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
      }
    }
  };

  const useCapturedPhoto = async () => {
    if (capturedImage) {
      try {
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const fileName = `foto_${Date.now()}.jpg`;
        const file = new window.File([blob], fileName, { type: "image/jpeg" });
        setSelectedFile(file);
        setShowCamera(false);
        setCapturedImage(null);
      } catch (error) {
        console.error("Error creating file:", error);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
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
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Dosya yüklenemedi (${response.status})`);
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
        await fetchMessages(activeUser.id, true);
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Mesaj gönderilemedi (${response.status})`);
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

  const isImageFile = (type: string | null) => {
    return type?.startsWith("image/");
  };

  return (
    <div className="flex flex-col md:flex-row h-[70vh] md:h-[500px] md:max-h-[70vh] border rounded-lg overflow-hidden bg-white shadow-sm relative">
      {/* Hidden elements */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        data-testid="input-file"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Modal */}
      {showCamera && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-3 bg-black/80">
            <h3 className="text-white font-medium text-sm">Fotoğraf Çek</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={stopCamera}
              className="text-white hover:bg-white/20 h-8 w-8"
              data-testid="button-close-camera"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Çekilen fotoğraf"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          <div className="p-4 bg-black/80 flex items-center justify-center gap-4">
            {capturedImage ? (
              <>
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                  data-testid="button-retake-photo"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Tekrar Çek
                </Button>
                <Button
                  onClick={useCapturedPhoto}
                  className="bg-primary"
                  data-testid="button-use-photo"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Kullan
                </Button>
              </>
            ) : (
              <Button
                onClick={capturePhoto}
                size="lg"
                className="rounded-full h-14 w-14 bg-white hover:bg-gray-200"
                data-testid="button-capture-photo"
              >
                <Camera className="h-6 w-6 text-black" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Sidebar - Rehber (1/4) */}
      <div className="w-full md:w-1/4 h-1/3 md:h-full bg-slate-50 border-b md:border-b-0 md:border-r flex flex-col shrink-0">
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
                "p-3 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-100",
                activeUser?.id === chatUser.id && "bg-blue-50 hover:bg-blue-50"
              )}
              data-testid={`user-${chatUser.id}`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate">{chatUser.fullName}</h4>
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {chatUser.department || chatUser.role}
              </p>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Kullanıcı bulunamadı
            </p>
          )}
        </div>
      </div>

      {/* Main Chat Area - Sohbet (3/4) */}
      <div className="w-full md:w-3/4 h-2/3 md:h-full flex flex-col bg-white min-w-0">
        {activeUser ? (
          <>
            <div className="p-3 border-b flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm">{activeUser.fullName}</h3>
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
                      isImageFile(msg.fileType) ? (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mb-2"
                        >
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName || "Fotoğraf"}
                            className="max-w-full rounded-lg max-h-48 object-cover"
                          />
                        </a>
                      ) : (
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
                      )
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

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/webp,image/heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
            />

            {/* Message input and file controls */}
            <div className="p-2 bg-white border-t shrink-0">
              {/* Selected file/image preview */}
              {selectedFile && (
                <div className="mb-2 px-2 py-2 bg-blue-50 rounded-lg flex items-center gap-2">
                  {selectedFile.type.startsWith("image/") ? (
                    <Image className="h-4 w-4 text-blue-500 shrink-0" />
                  ) : (
                    <File className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate flex-1">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatFileSize(selectedFile.size)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearSelectedFile}
                    className="h-6 w-6 shrink-0"
                    data-testid="button-clear-file"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-1">
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground shrink-0 h-8 w-8"
                  onClick={startCamera}
                  disabled={isSending}
                  data-testid="button-open-camera"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Mesaj yazın..."
                  className="flex-1 min-w-0 rounded-full bg-slate-50 border-slate-200 text-sm h-8"
                  disabled={isSending}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="rounded-full h-8 w-8 shrink-0 bg-primary"
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
                <p className="text-xs text-muted-foreground text-center mt-1">
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
