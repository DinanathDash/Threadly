import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useSlack } from '../context/SlackContext';
import { useAuth } from '../context/AuthContext';
import { useGlobalLoading } from '../context/GlobalLoadingContext';
import { Button } from '@/components/ui/button';
import {
  Home,
  MessageCircle,
  Calendar,
  LogOut,
  Search,
  Hash,
  ChevronDown,
  Bell,
  User,
  CircleUser,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Logo from '@/assets/Logo.svg';
import InlineLoader from '@/components/ui/inline-loader';

export default function MainLayout() {
  const { isConnected, slackWorkspace, disconnectSlack } = useSlack();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { currentUser, signOut, getSafeProfileImageUrl, setProfileImageError } = useAuth();
  const [channelSectionsExpanded, setChannelSectionsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handlePageAction = async (action) => {
    setIsLoading(true);
    // Simulate API call or data loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // Continue with action...
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirecting to root (login page) is handled by AuthContext
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Left Sidebar */}
      <aside className="w-[240px] bg-white border-r border-slate-200 flex flex-col">
        {/* Sidebar Header with Logo */}
        <div className="h-16 flex items-center justify-center border-b border-slate-100">
          <img src={Logo} alt="Threadly Logo" className="h-10 w-auto" />
        </div>

        {/* Search Box */}
        <div className="p-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 pl-10 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Main Navigation */}
        <div className="px-3 pt-2">
          <p className="text-xs font-medium text-slate-500 px-3 pb-2 uppercase tracking-wider">OVERVIEW</p>
          <nav className="space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`
              }
            >
              <Home size={18} strokeWidth={1.5} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/send-message"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`
              }
            >
              <MessageCircle size={18} strokeWidth={1.5} />
              <span>Send Message</span>
            </NavLink>

            <NavLink
              to="/scheduled"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`
              }
            >
              <Calendar size={18} strokeWidth={1.5} />
              <span>Scheduled Messages</span>
            </NavLink>
          </nav>
        </div>

        {/* Channels Section */}
        <div className="px-3 pt-6 flex-1 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">CHANNELS</p>
            <button onClick={() => setChannelSectionsExpanded(!channelSectionsExpanded)} className="text-slate-400 hover:text-slate-600">
              <ChevronDown className={`h-4 w-4 ${channelSectionsExpanded ? '' : 'transform -rotate-90'}`} />
            </button>
          </div>

          {channelSectionsExpanded && (
            <div className="space-y-1 mt-1">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left text-slate-600 hover:bg-slate-50">
                <Hash size={16} strokeWidth={1.5} />
                <span>design</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left text-slate-600 hover:bg-slate-50">
                <Hash size={16} strokeWidth={1.5} />
                <span>marketing</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left text-slate-600 hover:bg-slate-50">
                <Hash size={16} strokeWidth={1.5} />
                <span>general</span>
              </button>
            </div>
          )}
        </div>

        {/* Workspace Section */}
        <div className="mt-auto p-4 border-t border-slate-100">
          {isConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700">{slackWorkspace?.name || 'Workspace'}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnectSlack}
                className="text-xs text-slate-500 hover:text-red-600"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-xs text-slate-500">Not connected to Slack</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              {isConnected ? 'Connected to ' + slackWorkspace?.name : 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 hover:bg-slate-100">
              <Bell size={18} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 bg-white cursor-pointer border border-slate-200">
                  {getSafeProfileImageUrl(currentUser) ? (
                    <React.Fragment>
                      <AvatarImage
                        src={getSafeProfileImageUrl(currentUser)}
                        alt={currentUser?.displayName || 'User'}
                        onError={(e) => {
                          const error = e?.target?.error;
                          console.log('Profile image failed to load, using fallback', error);
                          
                          // Handle rate limiting specifically (429 error)
                          if (error && error.message && error.message.includes('429')) {
                            console.warn('Rate limit detected when loading profile image');
                            // Store a flag in localStorage to remember rate limiting for this user
                            localStorage.setItem(`image_rate_limited_${currentUser.uid}`, 'true');
                          }
                          
                          setProfileImageError(true);
                          e.target.style.display = 'none'; // Hide the broken image
                        }}
                      />
                      {/* Fallback will show if image fails to load */}
                      <AvatarFallback className="bg-indigo-50 text-indigo-700">
                        {currentUser?.displayName ?
                          `${currentUser.displayName.charAt(0)}${currentUser.displayName.split(' ')[1]?.charAt(0) || ''}` :
                          <User size={16} />}
                      </AvatarFallback>
                    </React.Fragment>
                  ) : (
                    <AvatarFallback className="bg-indigo-50 text-indigo-700">
                      {currentUser?.displayName ?
                        `${currentUser.displayName.charAt(0)}${currentUser.displayName.split(' ')[1]?.charAt(0) || ''}` :
                        <User size={16} />}
                    </AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{currentUser?.displayName || 'User'}</span>
                    <span className="text-xs text-slate-500">{currentUser?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-white p-6">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <InlineLoader color="#4338CA" size="60px" />
                <p className="mt-4 text-slate-600">Loading content...</p>
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
