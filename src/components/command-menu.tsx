import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Laptop, Moon, Sun } from 'lucide-react'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { ScrollArea } from './ui/scroll-area'

type CommandNavGroup = {
  title: string
  items: { title: string; url: string }[]
}

const commandNavGroups: CommandNavGroup[] = [
  {
    title: 'Site',
    items: [
      { title: 'Home', url: '/' },
      { title: 'Console', url: '/console' },
      { title: 'Arcade', url: '/arcade' },
      { title: 'Schedule', url: '/schedule' },
      { title: 'Songs', url: '/songs' },
      { title: 'Song Pool', url: '/song-pool' },
      { title: 'Results', url: '/results' },
      { title: 'Rewards', url: '/rewards' },
      { title: 'Apply', url: '/apply' },
      { title: 'Contact', url: '/contact' },
    ],
  },
  {
    title: 'Ops',
    items: [
      { title: 'Arcade Control', url: '/ops/arcade-control' },
      { title: 'Arcade Broadcast', url: '/ops/arcade-broadcast' },
    ],
  },
]

export function CommandMenu() {
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type a command or search...' />
      <CommandList>
        <ScrollArea type='hover' className='h-72 pe-1'>
          <CommandEmpty>No results found.</CommandEmpty>
          {commandNavGroups.map((group) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.map((navItem, i) => (
                  <CommandItem
                    key={`${navItem.url}-${i}`}
                    value={navItem.title}
                    onSelect={() => {
                      runCommand(() => navigate({ to: navItem.url }))
                    }}
                  >
                    <div className='flex size-4 items-center justify-center'>
                      <ArrowRight className='size-2 text-muted-foreground/80' />
                    </div>
                    {navItem.title}
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading='Theme'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='scale-90' />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
