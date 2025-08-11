import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSlack } from '../context/SlackContext';
import { useAuth } from '../context/AuthContext';
import { useGlobalLoading } from '../context/GlobalLoadingContext';
import * as logger from '../lib/logger';
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
  LayoutDashboard,
  Menu,
  X
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
import { useIsMobile } from '../hooks/use-mobile';
import '../styles/responsive.css';
import '../styles/mobile-fixes.css';

export default function MainLayout() {
  const { isConnected, slackWorkspace, disconnectSlack, channels, loadingChannels } = useSlack();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { currentUser, signOut, getSafeProfileImageUrl, setProfileImageError } = useAuth();
  const [channelSectionsExpanded, setChannelSectionsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  // Close sidebar when route changes
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Toggle body class for sidebar open state
  useEffect(() => {
    if (isMobile) {
      if (sidebarOpen) {
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    }

    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [sidebarOpen, isMobile]);

  // Close sidebar when clicking outside on mobile (optimized)
  useEffect(() => {
    // Only set up the handler if sidebar is open and we're on mobile
    if (!sidebarOpen || !isMobile) return;

    // Handler for outside clicks
    const handleOutsideClick = (e) => {
      // Make sure the click isn't on the sidebar or the toggle button
      if (!e.target.closest('.sidebar') &&
        !e.target.closest('.mobile-menu-button')) {
        setSidebarOpen(false);
      }
    };

    // Add with a delay to ensure animation completes first
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
    }, 300);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [sidebarOpen, isMobile]);

  // Demo effect: Simulate receiving Slack notifications
  useEffect(() => {
    // Only simulate notifications if connected to Slack
    if (!isConnected) return;

    // Function to simulate a new notification
    const simulateNewNotification = () => {
      // Randomly decide if we should add a notification (30% chance)
      if (Math.random() < 0.3) {
        setNotificationCount(prev => prev + 1);

        // Optional: Show browser notification if supported
        if (Notification.permission === "granted") {
          const notification = new Notification("New Slack Message", {
            body: "You have a new message in Slack",
            icon: "/favicon.ico"
          });
        }
      }
    };

    // Set up interval to potentially trigger notifications (every 30-60 seconds)
    const interval = setInterval(() => {
      simulateNewNotification();
    }, Math.random() * 30000 + 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

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
    <div className="h-screen flex overflow-hidden bg-white layout-container relative">
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            requestAnimationFrame(() => {
              setSidebarOpen(false);
            });
          }}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`sidebar bg-white border-r border-slate-200 flex flex-col ${sidebarOpen ? 'open' : ''} ${isMobile ? 'mobile-sidebar w-[85%] max-w-[280px]' : 'w-[240px]'}`}>
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
              {isConnected ? (
                <>
                  {slackWorkspace ? (
                    <>
                      {isLoading ? (
                        <div className="flex justify-center py-2">
                          <InlineLoader size="sm" />
                        </div>
                      ) : (
                        <>
                          {channels && channels.length > 0 ? (
                            channels.map(channel => (
                              <NavLink
                                key={channel.id}
                                to={`/channel/${channel.id}`}
                                className={({ isActive }) =>
                                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left ${isActive
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                                  }`
                                }
                              >
                                {channel.isPrivate ? (
                                  <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 13h6m-3-3v6" />
                                    <circle cx="12" cy="12" r="10" />
                                  </svg>
                                ) : (
                                  <Hash size={16} strokeWidth={1.5} />
                                )}
                                <span>{channel.name}</span>
                              </NavLink>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-500">
                              No channels found
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      Connect to Slack to see channels
                    </div>
                  )}
                </>
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500">
                  Connect to Slack to see channels
                </div>
              )}
            </div>
          )}
        </div>

        {/* Workspace Section */}
        <div className="mt-auto p-4 border-t border-slate-100">
          {isConnected ? (
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-700">{slackWorkspace?.name || 'Workspace'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      // First disconnect the current connection
                      await disconnectSlack();
                      // Then redirect to Slack authorization
                      const { getSlackOAuthUrl } = await import('../services/slackService');
                      const url = await getSlackOAuthUrl();
                      window.location.href = url;
                    } catch (error) {
                      console.error('Error during reconnection:', error);
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-indigo-600"
                >
                  Reconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-xs text-slate-500">Not connected to Slack</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 main-content-area">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 px-4 md:px-6 flex items-center justify-between main-header">
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={(e) => {
                  e.preventDefault(); // Prevent default behavior
                  e.stopPropagation(); // Prevent event bubbling

                  // Use RAF to ensure UI is ready before state changes
                  requestAnimationFrame(() => {
                    setSidebarOpen(prevState => !prevState);
                  });
                }}
                className="mobile-menu-button p-2 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Toggle sidebar menu"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <h1 className="text-xl font-semibold text-slate-800">
              {isConnected ? slackWorkspace?.name + ' Workspace' : 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative">
                  <Bell size={18} />
                  {/* Notification badge - only shows when there are notifications */}
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {notificationCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {notificationCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNotificationCount(0)}
                      className="text-xs text-slate-500 hover:text-indigo-600"
                    >
                      Mark all as read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationCount > 0 ? (
                  <>
                    <DropdownMenuItem className="cursor-default p-3 hover:bg-slate-50">
                      <div className="flex flex-row gap-3">
                        <div className="bg-slate-100 rounded-full p-2 flex-shrink-0 h-10 w-10 flex items-center justify-center">
                          <MessageCircle size={16} className="text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">New message in #general</p>
                          <p className="text-xs text-slate-500 mt-1">@sarah.jones: "Team, can someone review the latest PR?"</p>
                          <p className="text-xs text-slate-400 mt-1">3 minutes ago</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-default p-3 hover:bg-slate-50">
                      <div className="flex flex-row gap-3">
                        <div className="bg-slate-100 rounded-full p-2 flex-shrink-0 h-10 w-10 flex items-center justify-center">
                          <MessageCircle size={16} className="text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">New message in #dev-team</p>
                          <p className="text-xs text-slate-500 mt-1">@mike.wilson: "The deployment is complete!"</p>
                          <p className="text-xs text-slate-400 mt-1">12 minutes ago</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-default p-3 hover:bg-slate-50">
                      <div className="flex flex-row gap-3">
                        <div className="bg-slate-100 rounded-full p-2 flex-shrink-0 h-10 w-10 flex items-center justify-center">
                          <MessageCircle size={16} className="text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">Direct message from @alex</p>
                          <p className="text-xs text-slate-500 mt-1">@alex: "Can we meet to discuss the requirements?"</p>
                          <p className="text-xs text-slate-400 mt-1">25 minutes ago</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                    <Bell size={24} className="text-slate-300 mb-2" />
                    <p className="text-sm text-slate-600">No new notifications</p>
                    <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

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
                          logger.info('Profile image failed to load, using fallback');

                          // Handle rate limiting specifically (429 error)
                          if (error && error.message && error.message.includes('429')) {
                            logger.warn('Rate limit detected when loading profile image');
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
              <DropdownMenuContent align="end" className="w-auto mt-2">
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
        <main className="flex-1 overflow-auto bg-white p-3 sm:p-4 md:p-6 content-container">
          <div className="max-w-6xl mx-auto h-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-10 md:py-20">
                <InlineLoader color="#4338CA" size={isMobile ? "40px" : "60px"} />
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
