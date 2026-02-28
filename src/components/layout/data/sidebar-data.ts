import {
  Construction,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileX,
  HelpCircle,
  Lock,
  Bell,
  Package,
  Palette,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  ShieldCheck,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/admin',
          icon: LayoutDashboard,
        },
        {
          title: 'Tasks',
          url: '/admin/tasks',
          icon: ListTodo,
        },
        {
          title: 'Apps',
          url: '/admin/apps',
          icon: Package,
        },
        {
          title: 'Chats',
          url: '/admin/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: 'Users',
          url: '/admin/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: ShieldCheck,
          items: [
            {
              title: 'Sign In',
              url: '/sign-in',
            },
          ],
        },
        {
          title: 'Errors',
          icon: Bug,
          items: [
            {
              title: 'Unauthorized',
              url: '/admin/errors/unauthorized',
              icon: Lock,
            },
            {
              title: 'Forbidden',
              url: '/admin/errors/forbidden',
              icon: UserX,
            },
            {
              title: 'Not Found',
              url: '/admin/errors/not-found',
              icon: FileX,
            },
            {
              title: 'Internal Server Error',
              url: '/admin/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: 'Maintenance Error',
              url: '/admin/errors/maintenance-error',
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/admin/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/admin/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/admin/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/admin/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/admin/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/admin/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
