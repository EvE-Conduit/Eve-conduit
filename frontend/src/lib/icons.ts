import {
  Activity, Anchor, Award, BarChart3, Bell, BookOpen, Box, Boxes, Briefcase, Building2, Calendar, Clock, Coins,
  Compass, Crosshair, Factory, FileText, Flag, FlaskConical, Gauge, Gem, Globe, GraduationCap, Hammer, Heart,
  Landmark, LayoutDashboard, LifeBuoy, Map, MessageSquare, Mic, Moon, Package, Pickaxe, Puzzle, Radar, Rocket, Satellite,
  ScrollText, Shield, ShieldCheck, ShoppingCart, Sparkles, Star, Swords, Target, Timer, Trophy, Truck, Users,
  Wallet, Wrench, Zap, type LucideIcon,
} from "lucide-react";

/** Icons a plugin can name in its nav entries (lucide names, kebab-case). */
const ICONS: Record<string, LucideIcon> = {
  activity: Activity, anchor: Anchor, award: Award, "bar-chart": BarChart3, bell: Bell, "book-open": BookOpen,
  box: Box, boxes: Boxes, briefcase: Briefcase, building: Building2, calendar: Calendar, clock: Clock, coins: Coins,
  compass: Compass, crosshair: Crosshair, factory: Factory, "file-text": FileText, flag: Flag,
  "flask-conical": FlaskConical, gauge: Gauge, gem: Gem, globe: Globe, "graduation-cap": GraduationCap,
  hammer: Hammer, heart: Heart, landmark: Landmark, "layout-dashboard": LayoutDashboard, "life-buoy": LifeBuoy,
  map: Map, "message-square": MessageSquare, mic: Mic, moon: Moon, package: Package, pickaxe: Pickaxe, puzzle: Puzzle, radar: Radar,
  rocket: Rocket, satellite: Satellite, scroll: ScrollText, shield: Shield, "shield-check": ShieldCheck,
  "shopping-cart": ShoppingCart, sparkles: Sparkles, star: Star, swords: Swords, target: Target, timer: Timer,
  trophy: Trophy, truck: Truck, users: Users, wallet: Wallet, wrench: Wrench, zap: Zap,
};

export function iconFor(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name]) || Box;
}
