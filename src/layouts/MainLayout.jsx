import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useSlack } from '../context/SlackContext';
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, MessageCircle, Calendar, LogOut, Search, Plus, Hash, ChevronDown } from 'lucide-react';
import { ChannelItem } from '@/components/ui/channel-item';

export default function MainLayout() {
  const { isConnected, slackWorkspace, disconnectSlack } = useSlack();
  const [channelSectionsExpanded, setChannelSectionsExpanded] = useState(true);

  return (
    <div className="min-h-screen flex">
      <SidebarProvider defaultOpen>
        <Sidebar className="border-r border-border bg-slate-800 text-white">
          <SidebarHeader className="pb-2">
            <div className="flex items-center justify-between px-3 py-2">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span className="text-white">Threadly</span>
                <button className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center">
                  <ChevronDown className="h-3 w-3 text-slate-300" />
                </button>
              </h1>
            </div>
            {isConnected && (
              <div className="bg-slate-700 mx-3 rounded p-1.5 flex items-center gap-2 text-sm text-slate-300 hover:bg-slate-600 transition-colors cursor-pointer">
                <Search className="h-3.5 w-3.5" />
                <span className="flex-1">Search {slackWorkspace?.name}</span>
              </div>
            )}
          </SidebarHeader>
          <SidebarContent className="pt-3">
            <div className="flex flex-col space-y-2 px-2">
              <ChannelItem
                to="/dashboard"
                icon={<Home className="h-4 w-4" />}
                label="Home"
              />
              <ChannelItem
                to="/send-message"
                icon={<MessageCircle className="h-4 w-4" />}
                label="Send Message"
              />
              <ChannelItem
                to="/scheduled"
                icon={<Calendar className="h-4 w-4" />}
                label="Scheduled Messages"
              />

              {/* Channel Section */}
              <div className="mt-4">
                <button
                  onClick={() => setChannelSectionsExpanded(!channelSectionsExpanded)}
                  className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
                >
                  <span>Channels</span>
                  <ChevronDown className={`h-3 w-3 ${channelSectionsExpanded ? '' : 'transform -rotate-90'}`} />
                </button>

                {channelSectionsExpanded && (
                  <div className="mt-1 space-y-0.5">
                    <ChannelItem
                      icon={<Hash className="h-4 w-4" />}
                      label="design"
                      onClick={() => { }}
                    />
                    <ChannelItem
                      icon={<Hash className="h-4 w-4" />}
                      label="marketing"
                      onClick={() => { }}
                    />
                    <ChannelItem
                      icon={<Hash className="h-4 w-4" />}
                      label="general"
                      onClick={() => { }}
                    />
                  </div>
                )}
              </div>
            </div>
          </SidebarContent>
          <SidebarFooter>
            {isConnected && (
              <Button
                variant="destructive"
                className="w-full flex items-center gap-2"
                onClick={disconnectSlack}>
                <LogOut className="h-4 w-4" />
                Disconnect Slack
              </Button>
            )}
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
