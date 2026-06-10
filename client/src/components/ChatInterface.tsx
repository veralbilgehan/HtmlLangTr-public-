import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, File, Search, X, Download, Loader2, Camera, Image, Users, Plus, Trash2, UserPlus, ChevronLeft, PenLine, AlignJustify, MessageSquare, Settings, Phone, Video, Mic, MicOff } from "lucide-react";
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

interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
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

interface ChatGroup {
  id: string;
  name: string;
  companyId: string | null;
  createdBy: string | null;
  memberCount: number;
  createdAt: string;
}

interface ChatInterfaceProps {
  user: User;
}

type TabType = "sohbetler" | "kisiler" | "ayarlar";

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const { toast } = useToast();

  // Tab
  const [activeTab, setActiveTab] = useState<TabType>("sohbetler");

  // Direct chat state
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Group chat state
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Shared state
  const [messageInput, setMessageInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const activeGroupIdRef = useRef<string | null>(null);

  // ─── User fetching ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchUsers();
    fetchGroups();
    const interval = setInterval(() => { fetchUsers(); fetchGroups(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Tüm kullanıcıların son mesajlarını arka planda yükle
  useEffect(() => {
    if (users.length === 0) return;
    const prefetch = async () => {
      for (const u of users) {
        try {
          const res = await fetch(`/api/messages/${u.id}`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              const last = data.messages[data.messages.length - 1];
              setLastMessagesMap(prev => ({
                ...prev,
                [u.id]: last.content || (last.fileName ? "📎 " + last.fileName : "")
              }));
              setLastMessageTimesMap(prev => ({
                ...prev,
                [u.id]: last.createdAt
              }));
              const unread = data.messages.filter((m: any) => !m.read && m.senderId !== user.id).length;
              if (unread > 0) setUnreadCountMap(prev => ({ ...prev, [u.id]: unread }));
            }
          }
        } catch {}
      }
    };
    prefetch();
  }, [users]);

  const formatShortTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Dün";
    if (diffDays < 7) return d.toLocaleDateString("tr-TR", { weekday: "short" });
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
  };

  useEffect(() => {
    if (activeUser) {
      const isNew = activeUser.id !== activeUserIdRef.current;
      activeUserIdRef.current = activeUser.id;
      fetchMessages(activeUser.id, isNew);
      const interval = setInterval(() => fetchMessages(activeUser.id, false), 3000);
      return () => clearInterval(interval);
    }
  }, [activeUser]);

  useEffect(() => {
    if (activeGroup) {
      const isNew = activeGroup.id !== activeGroupIdRef.current;
      activeGroupIdRef.current = activeGroup.id;
      fetchGroupMessages(activeGroup.id, isNew);
      const interval = setInterval(() => fetchGroupMessages(activeGroup.id, false), 3000);
      return () => clearInterval(interval);
    }
  }, [activeGroup]);

  useEffect(() => {
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    };
  }, [cameraStream]);

  const fetchUsers = async (retry = true) => {
    let loaded = false;
    try {
      const res = await fetch("/api/conversations", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const others = data.users.filter((u: ChatUser) => u.id !== user.id);
        if (others.length > 0) {
          setUsers(others);
          setActiveUser(prev => prev ?? others[0]);
          loaded = true;
        }
      }
    } catch {}
    if (!loaded) {
      try {
        const res = await fetch("/api/users", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const others = data.users.filter((u: ChatUser) => u.id !== user.id);
          if (others.length > 0) {
            setUsers(others);
            setActiveUser(prev => prev ?? others[0]);
            loaded = true;
          }
        }
      } catch (e) { console.error("Error fetching users:", e); }
    }
    if (!loaded && retry) setTimeout(() => fetchUsers(false), 3000);
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (e) { console.error("Error fetching groups:", e); }
  };

  const fetchMessages = async (userId: string, scrollToBottom = false) => {
    try {
      const res = await fetch(`/api/messages/${userId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        if (data.messages.length > 0) {
          const last = data.messages[data.messages.length - 1];
          setLastMessagesMap(prev => ({ ...prev, [userId]: last.content || (last.fileName ? "📎 " + last.fileName : "") }));
        }
        if (scrollToBottom) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch (e) { console.error("Error fetching messages:", e); }
  };

  const fetchGroupMessages = async (groupId: string, scrollToBottom = false) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setGroupMessages(data.messages);
        if (scrollToBottom) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch (e) { console.error("Error fetching group messages:", e); }
  };

  // ─── File handling ────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Hata", description: "Dosya boyutu 10MB'dan büyük olamaz", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setCapturedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (file: File) => {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Dosya okunamadı"));
      reader.readAsDataURL(file);
    });

    const res = await fetch("/api/upload-base64", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, name: file.name, type: file.type }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Dosya yüklenemedi (${res.status})`);
    }
    return res.json();
  };

  // ─── Camera ───────────────────────────────────────────────────────────────

  const startCamera = async () => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (error: any) {
      let message = "Kamera açılamadı";
      if (error.name === "NotAllowedError") message = "Kamera izni reddedildi.";
      else if (error.name === "NotFoundError") message = "Kamera bulunamadı";
      toast({ title: "Hata", description: message, variant: "destructive" });
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); }
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
        setCapturedImage(canvas.toDataURL("image/jpeg", 0.8));
        if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); }
      }
    }
  };

  const useCapturedPhoto = async () => {
    if (capturedImage) {
      try {
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new window.File([blob], `foto_${Date.now()}.jpg`, { type: "image/jpeg" });
        setSelectedFile(file);
        setShowCamera(false);
        setCapturedImage(null);
      } catch (e) { console.error("Error creating file:", e); }
    }
  };

  const retakePhoto = () => { setCapturedImage(null); startCamera(); };

  // ─── Send message ─────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (activeUser) {
      await handleSendDirect();
    } else {
      await handleSendGroup();
    }
  };

  const handleSendDirect = async () => {
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
      const res = await fetch("/api/messages", {
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
      if (res.ok) {
        setMessageInput("");
        clearSelectedFile();
        await fetchMessages(activeUser.id, true);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Mesaj gönderilemedi (${res.status})`);
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Mesaj gönderilemedi", variant: "destructive" });
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleSendGroup = async () => {
    if (!activeGroup) return;
    if (!messageInput.trim() && !selectedFile) return;
    setIsSending(true);
    try {
      let fileData = null;
      if (selectedFile) {
        setIsUploading(true);
        fileData = await uploadFile(selectedFile);
        setIsUploading(false);
      }
      const res = await fetch(`/api/groups/${activeGroup.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: messageInput.trim() || null,
          fileUrl: fileData?.fileUrl || null,
          fileName: fileData?.fileName || null,
          fileSize: fileData?.fileSize || null,
          fileType: fileData?.fileType || null,
        }),
      });
      if (res.ok) {
        setMessageInput("");
        clearSelectedFile();
        await fetchGroupMessages(activeGroup.id, true);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Mesaj gönderilemedi (${res.status})`);
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Mesaj gönderilemedi", variant: "destructive" });
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  // ─── Create group ─────────────────────────────────────────────────────────

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({ title: "Hata", description: "Grup adı gerekli", variant: "destructive" });
      return;
    }
    setIsCreatingGroup(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newGroupName.trim(), memberIds: selectedMemberIds }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Başarılı", description: `"${newGroupName}" grubu oluşturuldu` });
        setNewGroupName("");
        setSelectedMemberIds([]);
        setShowCreateGroup(false);
        await fetchGroups();
        setActiveGroup({ ...data.group, memberCount: selectedMemberIds.length + 1 });
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Grup oluşturulamadı");
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Grup oluşturulamadı", variant: "destructive" });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`"${groupName}" grubunu silmek istediğinizden emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        toast({ title: "Başarılı", description: "Grup silindi" });
        setActiveGroup(null);
        await fetchGroups();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Grup silinemedi");
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const isImageFile = (type: string | null) => type?.startsWith("image/");

  // Slide panel state
  const [chatOpen, setChatOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  // Last messages map
  const [lastMessagesMap, setLastMessagesMap] = useState<Record<string, string>>({});
  const [lastMessageTimesMap, setLastMessageTimesMap] = useState<Record<string, string>>({});
  const [unreadCountMap, setUnreadCountMap] = useState<Record<string, number>>({});

  const filteredUsers = users
    .filter(u => {
      if (u.id === user.id) return false;
      if (!searchTerm) return true;
      return (
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      // Mesajlaşılanlar üstte (son mesaj zamanına göre), diğerleri alta
      const aTime = lastMessageTimesMap[a.id] ? new Date(lastMessageTimesMap[a.id]).getTime() : 0;
      const bTime = lastMessageTimesMap[b.id] ? new Date(lastMessageTimesMap[b.id]).getTime() : 0;
      return bTime - aTime;
    });

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isManager = user.role === "manager" || user.role === "super_admin";

  // User lookup map for group messages
  const userMap = new Map<string, ChatUser>(users.map(u => [u.id, u]));

  // ─── Message bubble (shared) ──────────────────────────────────────────────

  const renderFileBubble = (msg: Message | GroupMessage, isOwn: boolean) => (
    <>
      {msg.fileUrl && (
        isImageFile(msg.fileType) ? (
          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
            <img src={msg.fileUrl} alt={msg.fileName || "Fotoğraf"} className="max-w-full rounded-lg max-h-48 object-cover" />
          </a>
        ) : (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("flex items-center gap-3 p-2 rounded-lg mb-2", isOwn ? "bg-primary-foreground/10" : "bg-slate-100")}
          >
            <div className={cn("p-2 rounded", isOwn ? "bg-primary-foreground/20" : "bg-slate-200")}>
              <File className={cn("h-6 w-6", isOwn ? "text-primary-foreground" : "text-blue-500")} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className={cn("font-medium text-sm truncate", isOwn ? "text-primary-foreground" : "text-slate-800")}>{msg.fileName}</p>
              <p className={cn("text-xs", isOwn ? "text-primary-foreground/70" : "text-slate-500")}>
                {msg.fileSize ? formatFileSize(msg.fileSize) : ""}
              </p>
            </div>
            <Download className={cn("h-4 w-4", isOwn ? "text-primary-foreground" : "text-blue-500")} />
          </a>
        )
      )}
      {msg.content && <p className="text-sm">{msg.content}</p>}
    </>
  );

  // ─── Message input bar (shared) ───────────────────────────────────────────

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
      toast({ title: "Sesli mesaj", description: "Sesli mesaj gönderme yakında aktif olacak." });
    } else {
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    }
  };

  const formatRecordingTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const renderInputBar = () => (
    <div className="px-3 py-2 bg-white border-t border-slate-100 shrink-0">
      {selectedFile && (
        <div className="mb-2 px-2 py-2 bg-blue-50 rounded-lg flex items-center gap-2">
          {selectedFile.type.startsWith("image/") ? (
            <Image className="h-4 w-4 text-blue-500 shrink-0" />
          ) : (
            <File className="h-4 w-4 text-blue-500 shrink-0" />
          )}
          <span className="text-xs font-medium truncate flex-1">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(selectedFile.size)}</span>
          <Button variant="ghost" size="icon" onClick={clearSelectedFile} className="h-6 w-6 shrink-0" data-testid="button-clear-file">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      {isRecording ? (
        <div className="flex items-center gap-2 py-1">
          <button onClick={toggleRecording} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500" data-testid="button-stop-recording">
            <MicOff className="h-4 w-4" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-500">{formatRecordingTime(recordingSeconds)}</span>
            <span className="text-xs text-slate-400">Kayıt yapılıyor...</span>
          </div>
          <Button onClick={toggleRecording} size="sm" className="rounded-full bg-red-500 hover:bg-red-600 h-8 px-3 text-xs" data-testid="button-send-recording">
            <Send className="h-3 w-3 mr-1" /> Gönder
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="chat-file-input"
            className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-slate-400 shrink-0 cursor-pointer hover:bg-slate-100 transition-colors ${isSending ? "opacity-50 pointer-events-none" : ""}`}
            data-testid="button-attach-file"
          >
            <Paperclip className="h-4 w-4" />
          </label>
          <button onClick={startCamera} disabled={isSending} className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors shrink-0" data-testid="button-open-camera">
            <Camera className="h-4 w-4" />
          </button>
          <Input
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Mesaj yazın..."
            className="flex-1 min-w-0 rounded-full bg-slate-50 border-slate-200 text-sm h-9"
            disabled={isSending}
            data-testid="input-message"
          />
          {messageInput.trim() || selectedFile ? (
            <Button
              onClick={handleSend}
              size="icon"
              className="rounded-full h-9 w-9 shrink-0 bg-primary"
              disabled={isSending}
              data-testid="button-send-message"
            >
              {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          ) : (
            <button onClick={toggleRecording} className="h-9 w-9 flex items-center justify-center rounded-full bg-primary text-white shrink-0 hover:bg-primary/90 transition-colors" data-testid="button-record-voice">
              <Mic className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      {isUploading && <p className="text-xs text-muted-foreground text-center mt-1">Dosya yükleniyor...</p>}
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  const openChat = (chatUser: ChatUser | null, group: ChatGroup | null) => {
    if (chatUser) {
      setActiveUser(chatUser);
      setActiveGroup(null);
      setUnreadCountMap(prev => { const n = { ...prev }; delete n[chatUser.id]; return n; });
    } else if (group) {
      setActiveGroup(group);
      setActiveUser(null);
    }
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Süper Admin';
      case 'manager': return 'Yönetici';
      case 'employee': return 'Çalışan';
      default: return role;
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white" style={{minHeight: 0, paddingTop: "5mm", paddingLeft: "5mm", paddingRight: "5mm"}}>
      <canvas ref={canvasRef} className="hidden" />
      <input
        id="chat-file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isSending}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        data-testid="input-file"
      />

      {/* Camera Modal */}
      {showCamera && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-3 bg-black/80">
            <h3 className="text-white font-medium text-sm">Fotoğraf Çek</h3>
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white hover:bg-white/20 h-8 w-8" data-testid="button-close-camera">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {capturedImage ? (
              <img src={capturedImage} alt="Çekilen fotoğraf" className="max-w-full max-h-full object-contain" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="max-w-full max-h-full object-contain" />
            )}
          </div>
          <div className="p-4 bg-black/80 flex items-center justify-center gap-4">
            {capturedImage ? (
              <>
                <Button variant="outline" onClick={retakePhoto} className="bg-white/10 text-white border-white/30 hover:bg-white/20" data-testid="button-retake-photo">
                  <Camera className="mr-2 h-4 w-4" /> Tekrar Çek
                </Button>
                <Button onClick={useCapturedPhoto} className="bg-primary" data-testid="button-use-photo">
                  <Send className="mr-2 h-4 w-4" /> Kullan
                </Button>
              </>
            ) : (
              <Button onClick={capturePhoto} size="lg" className="rounded-full h-14 w-14 bg-white hover:bg-gray-200" data-testid="button-capture-photo">
                <Camera className="h-6 w-6 text-black" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-base">Yeni Grup Oluştur</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateGroup(false)} className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Grup Adı</label>
                <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Örn: Satış Ekibi" data-testid="input-group-name" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Üyeler <span className="text-muted-foreground font-normal">({selectedMemberIds.length} seçildi)</span>
                </label>
                <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {users.map(u => (
                    <label key={u.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(u.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedMemberIds(prev => [...prev, u.id]);
                          else setSelectedMemberIds(prev => prev.filter(id => id !== u.id));
                        }}
                        className="accent-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground">{u.department || getRoleLabel(u.role)}</p>
                      </div>
                    </label>
                  ))}
                  {users.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Kullanıcı bulunamadı</p>}
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateGroup(false)}>İptal</Button>
              <Button className="flex-1" onClick={handleCreateGroup} disabled={isCreatingGroup || !newGroupName.trim()} data-testid="button-create-group">
                {isCreatingGroup ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Oluştur
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sliding container: 2 panels side by side, shifts left when chat open */}
      <div
        className="flex flex-1 min-h-0 transition-transform duration-300 ease-in-out"
        style={{ width: "200%", transform: chatOpen ? "translateX(-50%)" : "translateX(0)" }}
      >
        {/* Panel 1: Contact list */}
        <div className="flex flex-col bg-white overflow-hidden relative" style={{ width: "50%", flexShrink: 0, height: "100%" }}>

          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
            <span className="text-lg font-bold text-primary">
              {activeTab === "sohbetler" ? "Mesajlar" : activeTab === "kisiler" ? "Kişiler" : "Ayarlar"}
            </span>
            {activeTab !== "ayarlar" && (
              <div className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer">
                <Search className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>

          {/* Arama çubuğu — Sohbetler ve Kişiler tabında görünür */}
          {activeTab !== "ayarlar" && (
            <div className="px-3 pb-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder={activeTab === "kisiler" ? "Kişi ara..." : "Sohbet, kişi ara..."}
                  className="pl-9 bg-slate-100 h-9 text-sm rounded-full border-0 focus-visible:ring-1"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-2.5">
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Story / Hızlı erişim avatarlar — sadece Sohbetler tabında ve arama yokken */}
          {activeTab === "sohbetler" && !searchTerm && (
            <div className="px-3 pb-2 shrink-0">
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {users.slice(0, 8).map((u, idx) => (
                  <button
                    key={u.id}
                    onClick={() => openChat(u, null)}
                    className="flex flex-col items-center gap-1 shrink-0"
                    data-testid={`story-${u.id}`}
                  >
                    <div className="relative">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.fullName}
                          className={cn(
                            "w-12 h-12 rounded-full object-cover",
                            idx === 0 ? "ring-2 ring-primary ring-offset-1" : "ring-1 ring-slate-200"
                          )}
                        />
                      ) : (
                        <div className={cn(
                          "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm",
                          idx === 0 ? "ring-2 ring-primary ring-offset-1" : "ring-1 ring-slate-200"
                        )}>
                          {getInitials(u.fullName)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <span className="text-[10px] text-slate-600 max-w-[48px] truncate text-center">{u.fullName.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content area — tab'a göre değişir */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Sohbetler tab ── */}
            {activeTab === "sohbetler" && (<>
              {filteredUsers.map(chatUser => (
                <div
                  key={chatUser.id}
                  onClick={() => openChat(chatUser, null)}
                  className="flex items-center gap-3 py-3 px-3 cursor-pointer hover:bg-slate-50 active:bg-blue-50 transition-colors border-b border-slate-100"
                  data-testid={`user-${chatUser.id}`}
                >
                  <div className="relative shrink-0">
                    {chatUser.avatar ? (
                      <img src={chatUser.avatar} alt={chatUser.fullName} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {getInitials(chatUser.fullName)}
                      </div>
                    )}
                    <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={cn("font-semibold text-sm truncate", unreadCountMap[chatUser.id] ? "text-slate-900" : "text-slate-700")}>{chatUser.fullName}</h4>
                      {lastMessageTimesMap[chatUser.id] && (
                        <span className={cn("text-[10px] font-medium shrink-0", unreadCountMap[chatUser.id] ? "text-primary" : "text-slate-400")}>
                          {formatShortTime(lastMessageTimesMap[chatUser.id])}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className={cn("text-xs truncate", unreadCountMap[chatUser.id] ? "text-slate-700 font-medium" : "text-slate-400")}>
                        {lastMessagesMap[chatUser.id] || chatUser.department || getRoleLabel(chatUser.role)}
                      </p>
                      {unreadCountMap[chatUser.id] ? (
                        <span className="shrink-0 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {unreadCountMap[chatUser.id]}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {filteredGroups.map(group => (
                <div
                  key={group.id}
                  onClick={() => openChat(null, group)}
                  className="flex items-center gap-3 py-3 px-3 cursor-pointer hover:bg-slate-50 active:bg-blue-50 transition-colors border-b border-slate-100"
                  data-testid={`group-${group.id}`}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-800 truncate">{group.name}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">{group.memberCount} üye</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">Grup sohbeti</p>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && filteredGroups.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8 px-4">
                  {searchTerm ? "Sonuç bulunamadı" : "Henüz yazışma yok."}
                </p>
              )}
            </>)}

            {/* ── Kişiler tab — tüm kullanıcılar ── */}
            {activeTab === "kisiler" && (() => {
              const filtered = users.filter(u => u.id !== user.id && (
                !searchTerm ||
                u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.department?.toLowerCase().includes(searchTerm.toLowerCase())
              )).sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));

              if (filtered.length === 0) return (
                <p className="text-center text-muted-foreground text-sm py-8">Kişi bulunamadı</p>
              );

              const grouped: Record<string, typeof filtered> = {};
              filtered.forEach(u => {
                const letter = u.fullName[0].toLocaleUpperCase("tr");
                if (!grouped[letter]) grouped[letter] = [];
                grouped[letter].push(u);
              });

              return Object.keys(grouped).sort((a, b) => a.localeCompare(b, "tr")).map(letter => (
                <div key={letter}>
                  <div className="px-3 py-1 bg-slate-50 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{letter}</span>
                  </div>
                  {grouped[letter].map(u => (
                    <div
                      key={u.id}
                      onClick={() => { openChat(u, null); setActiveTab("sohbetler"); }}
                      className="flex items-center gap-3 py-2.5 px-3 cursor-pointer hover:bg-slate-50 active:bg-blue-50 transition-colors border-b border-slate-100"
                      data-testid={`contact-${u.id}`}
                    >
                      <div className="relative shrink-0">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.fullName} className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {getInitials(u.fullName)}
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-800 truncate">{u.fullName}</h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{u.department || getRoleLabel(u.role)}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); toast({ title: "Sesli Arama", description: `${u.fullName} aranıyor...` }); }}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors shrink-0"
                        data-testid={`call-contact-${u.id}`}
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ));
            })()}

            {/* ── Ayarlar tab ── */}
            {activeTab === "ayarlar" && (
              <div className="p-4 space-y-4">
                {/* Profil kartı */}
                <div className="flex flex-col items-center py-6 gap-3">
                  <div className="relative">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.fullName} className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
                        <span className="text-primary font-bold text-2xl">{getInitials(user.fullName)}</span>
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-base text-slate-900">{user.fullName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{getRoleLabel(user.role)}{user.department ? ` · ${user.department}` : ""}</p>
                  </div>
                </div>

                {/* Bölücü */}
                <div className="h-px bg-slate-100" />

                {/* Menü öğeleri */}
                <div className="space-y-1">
                  {isManager && (
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="w-full flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                      data-testid="settings-new-group"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">Yeni Grup Oluştur</p>
                        <p className="text-xs text-slate-400">Şirket içi grup sohbeti başlat</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-slate-300 rotate-180 shrink-0" />
                    </button>
                  )}

                  <div className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-slate-50">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">Bildirimler</p>
                      <p className="text-xs text-slate-400">Mesaj bildirimleri açık</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-slate-50">
                    <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">Durum</p>
                      <p className="text-xs text-slate-400">Çevrimiçi</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating compose button — tab bar'ın üstünde */}
          <button
            onClick={() => { setActiveTab("kisiler"); }}
            className="absolute bottom-16 right-4 w-12 h-12 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
            title="Yeni Sohbet"
            data-testid="button-new-chat"
          >
            <PenLine className="h-5 w-5" />
          </button>

          {/* Alt tab bar */}
          <div className="shrink-0 flex border-t border-slate-100 bg-white pb-safe">
            {([
              { key: "sohbetler", label: "Sohbetler", Icon: MessageSquare },
              { key: "kisiler",   label: "Kişiler",   Icon: Users },
              { key: "ayarlar",  label: "Ayarlar",   Icon: Settings },
            ] as const).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center pt-2 pb-3 gap-0.5 relative transition-colors",
                  activeTab === key ? "text-primary" : "text-slate-400"
                )}
                data-testid={`tab-${key}`}
              >
                {activeTab === key && (
                  <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-b-full" />
                )}
                <Icon className={cn("h-5 w-5", activeTab === key && "stroke-[2.5px]")} />
                <span className={cn("text-[10px] font-medium", activeTab === key ? "font-semibold" : "")}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Panel 2: Chat area */}
        <div className="flex flex-col overflow-hidden" style={{ width: "50%", flexShrink: 0, height: "100%", background: "#f5f7fa" }}>
          {activeUser ? (
            <>
              {/* Header */}
              <div className="px-3 py-2.5 bg-white flex items-center gap-2.5 shrink-0 border-b border-slate-100 shadow-sm">
                <button onClick={closeChat} className="p-1 rounded-full hover:bg-slate-100 text-slate-500" data-testid="button-back-chat">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="relative shrink-0">
                  {activeUser.avatar ? (
                    <img src={activeUser.avatar} alt={activeUser.fullName} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {getInitials(activeUser.fullName)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm leading-tight text-slate-900">{activeUser.fullName}</h3>
                  <p className="text-[11px] text-green-600 font-medium">Çevrimiçi</p>
                </div>
                {/* Çağrı butonları */}
                <button
                  onClick={() => toast({ title: "Sesli Arama", description: "Sesli arama özelliği yakında aktif olacak." })}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
                  data-testid="button-voice-call"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toast({ title: "Görüntülü Arama", description: "Görüntülü arama özelliği yakında aktif olacak." })}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
                  data-testid="button-video-call"
                >
                  <Video className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 px-3 py-3 overflow-y-auto space-y-2">
                {messages.map((msg, i) => {
                  const isOwn = msg.senderId === user.id;
                  const prevMsg = messages[i - 1];
                  const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                  return (
                    <div key={msg.id} data-testid={`message-${msg.id}`}>
                      {showDate && (
                        <div className="flex items-center gap-2 my-3">
                          <div className="flex-1 h-px bg-slate-200" />
                          <span className="text-[10px] text-slate-400 font-medium px-2">
                            {new Date(msg.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                          </span>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>
                      )}
                      <div className={cn("flex items-end gap-1.5", isOwn ? "justify-end" : "justify-start")}>
                        {!isOwn && (
                          activeUser.avatar
                            ? <img src={activeUser.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mb-0.5" />
                            : <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-0.5 text-[9px] font-bold text-primary">{getInitials(activeUser.fullName)}</div>
                        )}
                        <div className={cn(
                          "max-w-[72%] px-3 py-2 rounded-2xl shadow-sm text-sm",
                          isOwn
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
                        )}>
                          {renderFileBubble(msg, isOwn)}
                          <p className={cn("text-[10px] mt-1 text-right", isOwn ? "text-white/60" : "text-slate-400")}>
                            {formatTime(msg.createdAt)}
                            {isOwn && <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 pt-16">
                    <MessageSquare className="h-10 w-10 text-slate-200" />
                    <p className="text-sm">{activeUser.fullName} ile sohbet başlat</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {renderInputBar()}
            </>
          ) : activeGroup ? (
            <>
              {/* Group Header */}
              <div className="px-3 py-2.5 bg-white flex items-center gap-2.5 shrink-0 border-b border-slate-100 shadow-sm">
                <button onClick={closeChat} className="p-1 rounded-full hover:bg-slate-100 text-slate-500" data-testid="button-back-chat">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm leading-tight text-slate-900">{activeGroup.name}</h3>
                  <p className="text-[11px] text-slate-400">{activeGroup.memberCount} üye</p>
                </div>
                {(activeGroup.createdBy === user.id || user.role === "super_admin") && (
                  <button className="p-1.5 rounded-full hover:bg-red-50 text-red-400" onClick={() => handleDeleteGroup(activeGroup.id, activeGroup.name)} data-testid="button-delete-group">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Group Messages */}
              <div className="flex-1 px-3 py-3 overflow-y-auto space-y-2">
                {groupMessages.map((msg, i) => {
                  const isOwn = msg.senderId === user.id;
                  const sender = userMap.get(msg.senderId);
                  const prevMsg = groupMessages[i - 1];
                  const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                  const showSender = !isOwn && (!prevMsg || prevMsg.senderId !== msg.senderId);
                  return (
                    <div key={msg.id} data-testid={`group-message-${msg.id}`}>
                      {showDate && (
                        <div className="flex items-center gap-2 my-3">
                          <div className="flex-1 h-px bg-slate-200" />
                          <span className="text-[10px] text-slate-400 font-medium px-2">
                            {new Date(msg.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                          </span>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>
                      )}
                      <div className={cn("flex items-end gap-1.5", isOwn ? "justify-end" : "justify-start")}>
                        {!isOwn && (
                          sender?.avatar
                            ? <img src={sender.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mb-0.5" />
                            : <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-0.5 text-[9px] font-bold text-primary">{getInitials(sender?.fullName || "?")}</div>
                        )}
                        <div className="max-w-[72%]">
                          {showSender && !isOwn && (
                            <p className="text-[10px] text-primary font-semibold mb-1 ml-1">{sender?.fullName || "Bilinmeyen"}</p>
                          )}
                          <div className={cn(
                            "px-3 py-2 rounded-2xl shadow-sm text-sm",
                            isOwn
                              ? "bg-primary text-white rounded-br-sm"
                              : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
                          )}>
                            {renderFileBubble(msg, isOwn)}
                            <p className={cn("text-[10px] mt-1 text-right", isOwn ? "text-white/60" : "text-slate-400")}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {groupMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 pt-16">
                    <Users className="h-10 w-10 text-slate-200" />
                    <p className="text-sm">{activeGroup.name} grubuna ilk mesajı gönder</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {renderInputBar()}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary/40" />
              </div>
              <p className="text-sm text-slate-400 text-center px-4">Sohbet başlatmak için<br/>bir kişi veya grup seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
