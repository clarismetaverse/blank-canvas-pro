import { Home, CalendarDays, Send } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/activities', label: 'Activities', icon: CalendarDays },
  { to: '/activities/invite', label: 'Invite', icon: Send },
];

export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
      <div className="mx-auto flex max-w-md justify-around">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end className={({ isActive }) => `flex flex-col items-center gap-1 py-3 text-xs ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
