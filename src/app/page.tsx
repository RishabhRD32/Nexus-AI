'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Mic, Camera, ImageIcon, Video, FileText, 
  Code, Search, Brain, Settings, Sparkles, Send, 
  Volume2, VolumeX, Eye, Cpu, Database, Zap,
  Bot, User, ChevronRight, X, 
  RefreshCw, Copy, Check, Trash2, PanelLeftClose, PanelLeft,
  LogIn, LogOut, Play, BookOpen, Network,
  TrendingUp, Award, Target, Layers, ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AIEmotion {
  type: 'neutral' | 'happy' | 'thinking' | 'speaking' | 'listening' | 'error';
}

interface SystemStats {
  cpu: number;
  memory: number;
  learning: number;
}

// Enhanced AI Avatar with realistic emotions
function AIAvatar({ emotion, isProcessing, size = 150 }: { emotion: AIEmotion; isProcessing: boolean; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrame: number;
    let time = 0;
    const baseRadius = size * 0.4;
    const centerX = size / 2;
    const centerY = size / 2;

    const draw = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Outer glow rings
      for (let i = 3; i >= 0; i--) {
        const glowRadius = baseRadius * (1.3 + i * 0.15);
        const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, glowRadius);
        const intensity = isProcessing ? 0.12 + Math.sin(time * 3 + i) * 0.05 : 0.08;
        gradient.addColorStop(0, `rgba(59, 130, 246, ${intensity})`);
        gradient.addColorStop(0.5, `rgba(139, 92, 246, ${intensity * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main sphere
      const coreGradient = ctx.createRadialGradient(
        centerX - baseRadius * 0.3, centerY - baseRadius * 0.3, 0,
        centerX, centerY, baseRadius
      );
      coreGradient.addColorStop(0, '#2a4a7f');
      coreGradient.addColorStop(0.5, '#0f172a');
      coreGradient.addColorStop(1, '#020617');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Neural network pattern
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.25 + Math.sin(time * 2) * 0.1})`;
      ctx.lineWidth = 1;
      
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = baseRadius * (0.25 + ring * 0.22);
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + time * 0.4;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * baseRadius * 0.2, centerY + Math.sin(angle) * baseRadius * 0.2);
        ctx.lineTo(centerX + Math.cos(angle + Math.sin(time) * 0.15) * baseRadius * 0.75, centerY + Math.sin(angle + Math.sin(time) * 0.15) * baseRadius * 0.75);
        ctx.stroke();
        
        ctx.fillStyle = `rgba(96, 165, 250, ${0.4 + Math.sin(time * 2 + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(centerX + Math.cos(angle) * baseRadius * 0.5, centerY + Math.sin(angle) * baseRadius * 0.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eyes
      const eyeY = centerY - baseRadius * 0.05;
      const eyeSpacing = baseRadius * 0.22;
      const eyeSize = emotion.type === 'happy' ? baseRadius * 0.1 : emotion.type === 'thinking' ? baseRadius * 0.06 : baseRadius * 0.08;
      const eyeHeight = emotion.type === 'listening' ? baseRadius * 0.04 : eyeSize;

      const drawEye = (x: number) => {
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = isProcessing ? 15 + Math.sin(time * 5) * 5 : 8;
        
        const eyeGradient = ctx.createRadialGradient(x, eyeY, 0, x, eyeY, eyeSize);
        eyeGradient.addColorStop(0, '#60a5fa');
        eyeGradient.addColorStop(0.5, '#3b82f6');
        eyeGradient.addColorStop(1, '#1d4ed8');
        
        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.ellipse(x, eyeY, eyeSize, eyeHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e3a5f';
        ctx.beginPath();
        ctx.arc(x, eyeY, eyeSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(x - eyeSize * 0.25, eyeY - eyeSize * 0.25, eyeSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
      };

      drawEye(centerX - eyeSpacing);
      drawEye(centerX + eyeSpacing);

      // Eyebrows
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      const mouthY = centerY + baseRadius * 0.25;
      
      // Left eyebrow
      ctx.beginPath();
      if (emotion.type === 'thinking') {
        ctx.moveTo(centerX - eyeSpacing - eyeSize, eyeY - eyeSize * 1.8);
        ctx.lineTo(centerX - eyeSpacing + eyeSize * 0.5, eyeY - eyeSize * 1.5);
      } else if (emotion.type === 'happy') {
        ctx.moveTo(centerX - eyeSpacing - eyeSize, eyeY - eyeSize * 1.5);
        ctx.quadraticCurveTo(centerX - eyeSpacing, eyeY - eyeSize * 2, centerX - eyeSpacing + eyeSize, eyeY - eyeSize * 1.5);
      } else {
        ctx.moveTo(centerX - eyeSpacing - eyeSize, eyeY - eyeSize * 1.5);
        ctx.lineTo(centerX - eyeSpacing + eyeSize, eyeY - eyeSize * 1.5);
      }
      ctx.stroke();
      
      // Right eyebrow
      ctx.beginPath();
      if (emotion.type === 'thinking') {
        ctx.moveTo(centerX + eyeSpacing - eyeSize * 0.5, eyeY - eyeSize * 1.5);
        ctx.lineTo(centerX + eyeSpacing + eyeSize, eyeY - eyeSize * 1.8);
      } else if (emotion.type === 'happy') {
        ctx.moveTo(centerX + eyeSpacing - eyeSize, eyeY - eyeSize * 1.5);
        ctx.quadraticCurveTo(centerX + eyeSpacing, eyeY - eyeSize * 2, centerX + eyeSpacing + eyeSize, eyeY - eyeSize * 1.5);
      } else {
        ctx.moveTo(centerX + eyeSpacing - eyeSize, eyeY - eyeSize * 1.5);
        ctx.lineTo(centerX + eyeSpacing + eyeSize, eyeY - eyeSize * 1.5);
      }
      ctx.stroke();

      // Mouth
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      if (emotion.type === 'happy') {
        ctx.arc(centerX, mouthY - 5, baseRadius * 0.12, 0.2, Math.PI - 0.2);
        ctx.stroke();
      } else if (emotion.type === 'speaking') {
        const mouthOpen = Math.abs(Math.sin(time * 8)) * 8;
        ctx.ellipse(centerX, mouthY, baseRadius * 0.1, mouthOpen + 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.stroke();
      } else if (emotion.type === 'thinking') {
        ctx.moveTo(centerX - 12, mouthY);
        ctx.lineTo(centerX + 12, mouthY - 5);
        ctx.stroke();
      } else {
        ctx.moveTo(centerX - baseRadius * 0.1, mouthY);
        ctx.lineTo(centerX + baseRadius * 0.1, mouthY);
        ctx.stroke();
      }

      // Processing particles
      if (isProcessing) {
        for (let i = 0; i < 10; i++) {
          const particleAngle = (i / 10) * Math.PI * 2 + time * 2;
          const particleRadius = baseRadius + 15 + Math.sin(time * 3 + i) * 8;
          
          ctx.fillStyle = `rgba(139, 92, 246, ${0.4 + Math.sin(time * 2 + i) * 0.3})`;
          ctx.beginPath();
          ctx.arc(centerX + Math.cos(particleAngle) * particleRadius, centerY + Math.sin(particleAngle) * particleRadius, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [emotion, isProcessing, size]);

  return (
    <canvas ref={canvasRef} width={size} height={size} className="drop-shadow-[0_0_25px_rgba(59,130,246,0.4)]" />
  );
}

// Voice Wave
function VoiceWave({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-0.5 h-12">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
          animate={{ height: isActive ? `${Math.random() * 50 + 10}%` : '10%' }}
          transition={{ duration: 0.1, repeat: isActive ? Infinity : 0 }}
        />
      ))}
    </div>
  );
}

// Camera Feed
function CameraFeed({ isActive, onCapture }: { isActive: boolean; onCapture: (image: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isActive && !streamRef.current) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(s => {
          streamRef.current = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(console.error);
    } else if (!isActive && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isActive]);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        onCapture(canvas.toDataURL('image/png'));
      }
    }
  }, [onCapture]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
      {isActive ? (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-40 object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <Button size="sm" onClick={captureImage} className="bg-blue-500 hover:bg-blue-600">
              <Camera className="w-3 h-3 mr-1" /> Capture
            </Button>
          </div>
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        </>
      ) : (
        <div className="w-full h-40 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Camera Off</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings Modal
function SettingsModal({ isOpen, onClose, user, onLogout }: {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string } | null;
  onLogout: () => void;
}) {
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    autoLearn: true,
    responseStyle: 'detailed'
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" /> Settings
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-4 space-y-4">
            {user ? (
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={onLogout} className="text-red-400 border-red-400/30">
                  <LogOut className="w-4 h-4 mr-1" /> Logout
                </Button>
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">Login to save preferences</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Voice Responses</span>
                <button
                  onClick={() => setSettings(s => ({ ...s, voiceEnabled: !s.voiceEnabled }))}
                  className={cn("w-10 h-5 rounded-full transition-colors", settings.voiceEnabled ? "bg-blue-500" : "bg-slate-700")}
                >
                  <div className={cn("w-4 h-4 rounded-full bg-white transition-transform", settings.voiceEnabled ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto Learning</span>
                <button
                  onClick={() => setSettings(s => ({ ...s, autoLearn: !s.autoLearn }))}
                  className={cn("w-10 h-5 rounded-full transition-colors", settings.autoLearn ? "bg-blue-500" : "bg-slate-700")}
                >
                  <div className={cn("w-4 h-4 rounded-full bg-white transition-transform", settings.autoLearn ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-sm">Response Style</span>
                <div className="flex gap-2">
                  {['concise', 'balanced', 'detailed'].map(style => (
                    <button
                      key={style}
                      onClick={() => setSettings(s => ({ ...s, responseStyle: style }))}
                      className={cn(
                        "px-3 py-1 rounded text-xs capitalize transition-colors",
                        settings.responseStyle === style ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Login Modal
function LoginModal({ isOpen, onClose, onLogin }: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: { name: string; email: string }) => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleLogin = () => {
    if (email.trim()) {
      onLogin({ name: name || email.split('@')[0], email });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-400" /> Login
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-slate-800 border-slate-600"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Name (optional)</label>
              <Input
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-slate-800 border-slate-600"
              />
            </div>

            <Button className="w-full" onClick={handleLogin} disabled={!email.trim()}>
              Login / Register
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Training Panel
function TrainingPanel({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: { name: string; email: string } | null }) {
  const [learnTopic, setLearnTopic] = useState('');
  const [isLearning, setIsLearning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const learnTopicHandler = async () => {
    if (!learnTopic.trim() || !user) return;
    
    setIsLearning(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: learnTopic })
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(`Learned about: ${data.knowledge.title}`);
        setLearnTopic('');
      } else {
        setResult('Learning failed. Please try again.');
      }
    } catch {
      setResult('Connection error. Please try again.');
    } finally {
      setIsLearning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-900">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-400" /> AI Training
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Learn from Internet */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-green-400" /> Learn from Internet
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter topic to learn..."
                  value={learnTopic}
                  onChange={e => setLearnTopic(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                  onKeyDown={e => e.key === 'Enter' && learnTopicHandler()}
                />
                <Button onClick={learnTopicHandler} disabled={isLearning || !user}>
                  {isLearning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
              {!user && <p className="text-xs text-yellow-400 mt-2">Login required</p>}
              {result && <p className="text-sm text-green-400 mt-2">{result}</p>}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Message Bubble
function MessageBubble({ message, onSpeak }: { message: Message; onSpeak?: (text: string) => void }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3 p-4 rounded-lg", isUser ? "bg-blue-500/10" : "bg-slate-800/50")}
    >
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", isUser ? "bg-blue-500" : "bg-purple-500")}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{isUser ? 'You' : 'NEXUS'}</span>
          <span className="text-xs text-slate-500">{message.timestamp.toLocaleTimeString()}</span>
        </div>
        <div className="text-slate-300 text-sm whitespace-pre-wrap break-words">
          {message.content}
          {message.isStreaming && <span className="animate-pulse">▌</span>}
        </div>
        {!isUser && !message.isStreaming && (
          <div className="flex gap-2 mt-2">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-slate-500" onClick={copyToClipboard}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
            {onSpeak && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-slate-500" onClick={() => onSpeak(message.content)}>
                <Volume2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Main Component
export default function NEXUSAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emotion, setEmotion] = useState<AIEmotion>({ type: 'neutral' });
  const [isListening, setIsListening] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [stats, setStats] = useState<SystemStats>({ cpu: 23, memory: 45, learning: 0 });
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('nexus_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Fetch system stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success) {
          setStats({
            cpu: data.stats.cpu,
            memory: data.stats.memory,
            learning: user ? data.stats.learning : 0
          });
        }
      } catch {
        // Use simulated stats
        setStats({
          cpu: Math.round(20 + Math.random() * 15),
          memory: Math.round(40 + Math.random() * 20),
          learning: user ? Math.round(50 + Math.random() * 30) : 0
        });
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Auto scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setShowScrollButton(target.scrollHeight - target.scrollTop - target.clientHeight > 100);
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    setEmotion({ type: 'thinking' });

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: content,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
        }),
      });

      const data = await response.json();
      const responseContent = data.response || data.error || 'I apologize, I could not process that request.';

      setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: responseContent, isStreaming: false } : m));
      setEmotion({ type: 'happy' });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: 'Connection error. Please try again.', isStreaming: false } : m));
      setEmotion({ type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [messages, isProcessing]);

  // Voice recording
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        const formData = new FormData();
        formData.append('audio', audioBlob);
        
        try {
          const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
          const data = await response.json();
          if (data.text) sendMessage(data.text);
        } catch (error) {
          console.error('Transcription error:', error);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      setEmotion({ type: 'listening' });
    } catch (error) {
      console.error('Microphone error:', error);
    }
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Text to speech
  const speakText = useCallback(async (text: string) => {
    setEmotion({ type: 'speaking' });
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      const audioBlob = await response.blob();
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onended = () => setEmotion({ type: 'neutral' });
      await audio.play();
    } catch (error) {
      console.error('Speech error:', error);
      setEmotion({ type: 'neutral' });
    }
  }, []);

  // Camera capture
  const handleCameraCapture = useCallback(async (imageData: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: '📸 Analyze this image', timestamp: new Date() }]);
    setIsProcessing(true);
    setEmotion({ type: 'thinking' });
    
    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.description || 'Image analyzed.', timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Vision analysis failed.', timestamp: new Date() }]);
    } finally {
      setIsProcessing(false);
      setEmotion({ type: 'neutral' });
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleLogin = (loggedInUser: { name: string; email: string }) => {
    setUser(loggedInUser);
    localStorage.setItem('nexus_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nexus_user');
    setShowSettings(false);
  };

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl shrink-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Brain className="w-8 h-8 text-blue-500" />
                <Sparkles className="w-4 h-4 text-purple-500 absolute -top-0.5 -right-0.5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">NEXUS AI</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Personal Intelligence System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user ? (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  <User className="w-3 h-3 mr-1" />{user.name}
                </Badge>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowLogin(true)} className="text-blue-400">
                  <LogIn className="w-3 h-3 mr-1" /> Login
                </Button>
              )}
              
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />Online
              </Badge>
              
              <div className="hidden lg:flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}>
                  <PanelLeft className={cn("w-4 h-4", leftPanelCollapsed && "rotate-180")} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}>
                  <PanelLeftClose className={cn("w-4 h-4", rightPanelCollapsed && "rotate-180")} />
                </Button>
              </div>
              
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowTraining(true)}>
                <Network className="w-4 h-4 text-purple-400" />
              </Button>
              
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 min-h-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          
          {/* Left Panel */}
          <AnimatePresence>
            {!leftPanelCollapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="lg:col-span-3 hidden lg:flex flex-col gap-4 overflow-y-auto"
              >
                {/* AI Core */}
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-xl overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                  <div className="p-4 border-b border-slate-700/50">
                    <h3 className="font-semibold text-blue-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI Core
                    </h3>
                  </div>
                  <div className="p-4 flex flex-col items-center">
                    <AIAvatar emotion={emotion} isProcessing={isProcessing} size={140} />
                    <h3 className="mt-3 font-semibold">NEXUS</h3>
                    <p className="text-xs text-slate-400">AI Assistant</p>
                    <Badge variant="outline" className="mt-2 bg-slate-900/50 border-blue-500/30 text-blue-400 text-xs">
                      {emotion.type === 'speaking' ? 'Speaking' : emotion.type === 'listening' ? 'Listening' : emotion.type === 'thinking' ? 'Thinking...' : 'Ready'}
                    </Badge>
                  </div>
                </div>

                {/* System Stats */}
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-xl overflow-hidden shrink-0">
                  <div className="p-4 border-b border-slate-700/50">
                    <h3 className="font-semibold text-blue-400 flex items-center gap-2">
                      <Cpu className="w-4 h-4" /> System
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">CPU</span>
                        <span className="text-blue-400">{stats.cpu}%</span>
                      </div>
                      <Progress value={stats.cpu} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Memory</span>
                        <span className="text-purple-400">{stats.memory}%</span>
                      </div>
                      <Progress value={stats.memory} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Learning</span>
                        <span className="text-green-400">{user ? `${stats.learning}%` : 'Guest'}</span>
                      </div>
                      <Progress value={user ? stats.learning : 0} className="h-1.5" />
                    </div>
                  </div>
                </div>

                {/* Camera */}
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-xl overflow-hidden shrink-0">
                  <div className="p-4 border-b border-slate-700/50">
                    <h3 className="font-semibold text-blue-400 flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Camera
                    </h3>
                  </div>
                  <div className="p-4">
                    <CameraFeed isActive={isCameraActive} onCapture={handleCameraCapture} />
                    <Button
                      className="w-full mt-3"
                      size="sm"
                      variant={isCameraActive ? "destructive" : "default"}
                      onClick={() => setIsCameraActive(!isCameraActive)}
                    >
                      <Camera className="w-3 h-3 mr-1" />{isCameraActive ? 'Stop' : 'Start'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Panel */}
          <div className={cn("flex flex-col min-h-0", leftPanelCollapsed && rightPanelCollapsed ? "lg:col-span-12" : "lg:col-span-6")}>
            <div className="relative flex-1 flex flex-col bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-xl overflow-hidden min-h-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
              
              <div className="shrink-0 p-4 border-b border-slate-700/50 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-blue-400">Chat</h3>
                <Badge variant="secondary" className="ml-auto">{messages.length}</Badge>
              </div>
              
              {/* Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <Brain className="w-16 h-16 text-blue-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Hello, I'm NEXUS</h3>
                    <p className="text-slate-400 text-sm max-w-md mb-6">
                      Your personal AI assistant. I can help with conversations, code, images, and more.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Hello!', 'Write code', 'Search web', 'Generate image'].map(s => (
                        <Button key={s} variant="outline" size="sm" onClick={() => sendMessage(s)} className="border-blue-500/30 hover:bg-blue-500/10">
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map(m => <MessageBubble key={m.id} message={m} onSpeak={speakText} />)}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
              
              {/* Scroll button */}
              <AnimatePresence>
                {showScrollButton && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={scrollToBottom}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 shadow-lg z-10"
                  >
                    <ArrowDown className="w-3 h-3" /> Scroll down
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className="shrink-0 p-4 border-t border-slate-700/50">
                {isListening ? (
                  <div className="flex flex-col items-center gap-3">
                    <VoiceWave isActive={true} />
                    <Button size="lg" className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600" onClick={stopListening}>
                      <VolumeX className="w-6 h-6" />
                    </Button>
                    <p className="text-sm text-slate-400">Listening... Click to stop</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Message NEXUS..."
                      rows={1}
                      className="flex-1 min-h-[44px] max-h-24 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                    <Button className="bg-blue-500 hover:bg-blue-600 h-[44px] w-[44px]" onClick={() => sendMessage(inputValue)} disabled={!inputValue.trim() || isProcessing}>
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="border-slate-700 h-[44px] w-[44px]" onClick={startListening}>
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <AnimatePresence>
            {!rightPanelCollapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="lg:col-span-3 hidden lg:flex flex-col gap-4 overflow-y-auto"
              >
                {/* Memory */}
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-xl overflow-hidden shrink-0">
                  <div className="p-4 border-b border-slate-700/50">
                    <h3 className="font-semibold text-blue-400 flex items-center gap-2">
                      <Database className="w-4 h-4" /> Memory
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-400" /> Messages</span>
                      <Badge variant="secondary">{messages.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-purple-400" /> Knowledge</span>
                      <Badge variant="secondary">{user ? 'Active' : 'Guest'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Learning</span>
                      <Badge variant="secondary">{user ? 'On' : 'Off'}</Badge>
                    </div>
                    <Separator />
                    <Button variant="outline" size="sm" className="w-full border-red-500/30 text-red-400" onClick={() => setMessages([])}>
                      <Trash2 className="w-3 h-3 mr-1" /> Clear Chat
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden border-t border-slate-800 bg-slate-900/90 backdrop-blur-xl shrink-0 z-40">
        <div className="flex items-center justify-around py-2">
          <Button variant="ghost" className="flex-col h-auto py-2 gap-1 text-blue-400">
            <MessageSquare className="w-5 h-5" /><span className="text-[10px]">Chat</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2 gap-1" onClick={() => setShowTraining(true)}>
            <Network className="w-5 h-5" /><span className="text-[10px]">Train</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2 gap-1" onClick={() => isListening ? stopListening() : startListening()}>
            <Mic className={cn("w-5 h-5", isListening && "text-red-400")} /><span className="text-[10px]">Voice</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2 gap-1" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" /><span className="text-[10px]">Settings</span>
          </Button>
        </div>
      </nav>

      {/* Modals */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} user={user} onLogout={handleLogout} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin} />
      <TrainingPanel isOpen={showTraining} onClose={() => setShowTraining(false)} user={user} />
    </div>
  );
}
