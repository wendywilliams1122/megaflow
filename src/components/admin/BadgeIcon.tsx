import {
  Sparkles, MessageSquare, MessageCircle, Reply, Flame, Crown, Trophy, Star,
  Award, Medal, Shield, ShieldCheck, Users, Heart, ThumbsUp, Zap, Rocket,
  Gem, Diamond, Target, Flag, CheckCircle2, Feather, Lightbulb, BookOpen,
  Pen, Pencil, Coffee, Gift, PartyPopper, Anchor, Compass, Bookmark,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles, welcome: Sparkles,
  "message-square": MessageSquare, thread: MessageSquare, "first-thread": MessageSquare,
  "message-circle": MessageCircle, reply: Reply, "first-reply": Reply,
  flame: Flame, hot: Flame, acclaimed: Flame,
  crown: Crown, elite: Crown,
  trophy: Trophy, legend: Trophy, champion: Trophy,
  star: Star, centurion: Star, popular: Star,
  award: Award, medal: Medal,
  shield: Shield, "shield-check": ShieldCheck,
  users: Users, pillar: Users, "community-pillar": Users,
  heart: Heart, love: Heart,
  "thumbs-up": ThumbsUp,
  zap: Zap, rocket: Rocket, "thread-starter": Rocket,
  gem: Gem, diamond: Diamond,
  target: Target, flag: Flag,
  check: CheckCircle2, "check-circle": CheckCircle2,
  feather: Feather, lightbulb: Lightbulb, insightful: Lightbulb,
  book: BookOpen, "book-open": BookOpen,
  pen: Pen, pencil: Pencil, prolific: Pencil, conversationalist: Pencil,
  coffee: Coffee, gift: Gift, party: PartyPopper,
  anchor: Anchor, compass: Compass, bookmark: Bookmark,
};

// Anything with a non-ASCII char (emoji) is treated as emoji.
const isEmoji = (s: string) => /[^\x00-\x7F]/.test(s);

export function BadgeIcon({ icon, size = 22, className = "" }: { icon: string; size?: number; className?: string }) {
  if (!icon) return <Award size={size} className={className} />;
  if (isEmoji(icon)) return <span className={className} style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
  const key = icon.trim().toLowerCase().replace(/\s+/g, "-");
  const Icon = MAP[key] ?? Award;
  return <Icon size={size} className={className} />;
}
