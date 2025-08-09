import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useSlack } from '../context/SlackContext';
import { useGlobalLoading } from '../context/GlobalLoadingContext';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  MessageCircle, 
  Calendar, 
  LogOut, 
  Search, 
  Plus, 
  Hash, 
  ChevronDown,
  Bell
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import Logo from '@/assets/Logo.svg';
import InlineLoader from '@/components/ui/inline-loader';

export default function MainLayout() {
  const { isConnected, slackWorkspace, disconnectSlack } = useSlack();
  const { showLoading, hideLoading } = useGlobalLoading();
  const [channelSectionsExpanded, setChannelSectionsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handlePageAction = async (action) => {
    setIsLoading(true);
    // Simulate API call or data loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // Continue with action...
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Top Header Bar */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-gray-600">
        <div className="flex items-center">
          <img src={Logo} alt="Threadly Logo" className="h-8 w-auto mr-2" />
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-indigo-600">
            <Bell size={18} />
          </Button>
          <Avatar className="h-8 w-8 bg-white">
            <span className="text-xs font-medium text-indigo-700">TD</span>
          </Avatar>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-[#F5F5F5] flex flex-col overflow-hidden border-r border-gray-200">
          {/* Workspace Selector */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium text-[#000000]">{slackWorkspace?.name || 'Workspace'}</span>
                <ChevronDown className="h-4 w-4 text-[#6B6B6B] ml-1" />
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-[#EAEAEA] hover:bg-gray-300">
                <Plus size={16} className="text-[#6B6B6B]" />
              </Button>
            </div>
            <div className="mt-3 relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-[#6B6B6B]" />
              <input 
                type="text" 
                placeholder="Search Threadly"
                className="w-full bg-white border border-gray-300 text-[#000000] pl-9 pr-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-700"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
            <nav className="px-2 space-y-1">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => 
                  `flex items-center gap-2 px-3 py-2 rounded text-sm ${
                    isActive 
                      ? 'bg-indigo-700 text-white' 
                      : 'text-[#000000] hover:bg-[#EAEAEA]'
                  }`
                }
              >
                <Home size={18} />
                <span>Dashboard</span>
              </NavLink>
              
              <NavLink
                to="/send-message"
                className={({ isActive }) => 
                  `flex items-center gap-2 px-3 py-2 rounded text-sm ${
                    isActive 
                      ? 'bg-indigo-700 text-white' 
                      : 'text-[#000000] hover:bg-[#EAEAEA]'
                  }`
                }
              >
                <MessageCircle size={18} />
                <span>Send Message</span>
              </NavLink>
              
              <NavLink
                to="/scheduled"
                className={({ isActive }) => 
                  `flex items-center gap-2 px-3 py-2 rounded text-sm ${
                    isActive 
                      ? 'bg-indigo-700 text-white' 
                      : 'text-[#000000] hover:bg-[#EAEAEA]'
                  }`
                }
              >
                <Calendar size={18} />
                <span>Scheduled Messages</span>
              </NavLink>
            </nav>
            
            {/* Channel Section */}
            <div className="mt-6 px-2">
              <button
                onClick={() => setChannelSectionsExpanded(!channelSectionsExpanded)}
                className="flex items-center justify-between w-full text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
              >
                <span>Channels</span>
                <ChevronDown className={`h-3 w-3 ${channelSectionsExpanded ? '' : 'transform -rotate-90'}`} />
              </button>

              {channelSectionsExpanded && (
                <div className="mt-1 space-y-1">
                  <button className="flex items-center gap-2 px-3 py-1 rounded text-sm w-full text-left text-gray-600 hover:bg-[#EAEAEA]">
                    <Hash size={16} />
                    <span>design</span>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1 rounded text-sm w-full text-left text-gray-600 hover:bg-[#EAEAEA]">
                    <Hash size={16} />
                    <span>marketing</span>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1 rounded text-sm w-full text-left text-gray-600 hover:bg-[#EAEAEA]">
                    <Hash size={16} />
                    <span>general</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer with Disconnect Button */}
          <div className="p-3 border-t border-gray-200">
            {isConnected && (
              <Button
                variant="destructive"
                className="w-full flex items-center gap-2 bg-red-600 hover:bg-red-700 text-sm"
                onClick={disconnectSlack}
              >
                <LogOut className="h-4 w-4" />
                Disconnect Slack
              </Button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative">
          <div className="max-w-6xl mx-auto p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <InlineLoader color="#4A154B" size="60px" />
                <p className="mt-4 text-gray-600">Loading content...</p>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
