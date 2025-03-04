import React, { useState, createContext, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Home, List, User, LogOut, FileText } from "lucide-react"; 
import { AuthContext } from "../utils/AuthContext"; 

const SidebarContext = createContext(undefined);

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

const DesktopSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <div
      className={cn(
        "h-screen fixed top-0 left-0 px-4 py-4 hidden md:flex md:flex-col bg-white flex-shrink-0 z-50", 
        className
      )}
      style={{
        width: animate ? (open ? "300px" : "60px") : "300px",
        transition: "width 0.3s ease",
        height: "100vh", 
        overflowY: "auto" 
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </div>
  );
};

const MobileSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-gray-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <button
            className="text-white cursor-pointer"
            onClick={() => setOpen(!open)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </div>
        {open && (
          <div
            style={{
              transform: open ? "translateX(0)" : "translateX(-100%)",
              opacity: open ? 1 : 0,
              transition: "transform 0.3s ease, opacity 0.3s ease"
            }}
            className={cn(
              "fixed h-full w-full inset-0 bg-gray-800 p-10 z-[100] flex flex-col",
              className
            )}
          >
            <div
              className="absolute right-10 top-10 z-50 text-white cursor-pointer"
              onClick={() => setOpen(!open)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            {children}
          </div>
        )}
      </div>
    </>
  );
};

const SidebarLink = ({
  link,
  className,
  ...props
}) => {
  const { open, animate } = useSidebar();
  const location = useLocation();
  const isActive = location.pathname === link.href;

  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center gap-2 p-2 rounded",
        isActive ? "bg-blue-600" : "hover:bg-gray-700",
        className
      )}
      {...props}
    >
      {link.icon}
      <span
        style={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
          transition: "opacity 0.3s ease"
        }}
        className="text-black text-sm whitespace-pre transition duration-150"
      >
        {link.label}
      </span>
    </Link>
  );
};

export default function AppSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    {
      label: "Home",
      href: "/",
      icon: <Home size={18} />
    },
    {
      label: "Scenarios",
      href: "/scenarios",
      icon: <List size={18} />
    },
    {
      label: "Review",
      href: "/review",
      icon: <FileText size={18} />
    }
  ];

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={true}>
      <div className={open ? "sidebar-expanded" : ""}>
        <div className="sidebar-overlay" onClick={() => setOpen(false)}></div> {/* Added overlay */}
        <MobileSidebar>
          <div className="flex flex-col gap-4 h-full">
            <div className="flex-grow">
              {links.map((link, index) => (
                <SidebarLink key={index} link={link} />
              ))}
            </div>
            {user && (
              <div className="mt-auto p-0 border-t border-gray-200 w-full sticky bottom-0 bg-white">
                <div className="flex items-center gap-1 px-0 py-3 pl-0">
                  <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200">
                    <User size={18} className="text-gray-700" />
                  </div>
                  <span
                    style={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                      transition: "opacity 0.3s ease"
                    }}
                    className="text-sm font-medium text-black"
                  >
                    {user.username}
                  </span>
                </div>
                <div
                  onClick={handleLogout}
                  className="flex items-center gap-1 p-0 pl-0 rounded cursor-pointer hover:bg-gray-100"
                >
                  <LogOut size={18} className="text-black" />
                  <span
                    style={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                      transition: "opacity 0.3s ease"
                    }}
                    className="text-black text-sm whitespace-pre transition duration-150"
                  >
                    Logout
                  </span>
                </div>
              </div>
            )}
          </div>
        </MobileSidebar>
        <DesktopSidebar className="bg-gray-800 text-black">
          <div className="flex flex-col gap-4 h-full">
            <div className="flex-grow">
              {links.map((link, index) => (
                <SidebarLink key={index} link={link} />
              ))}
            </div>
            {user && (
              <div className="mt-auto p-0 border-t border-gray-200 w-full sticky bottom-0 bg-white">
                <div className="flex items-center gap-1 px-0 py-3 pl-0">
                  <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200">
                    <User size={18} className="text-gray-700" />
                  </div>
                  <span
                    style={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                      transition: "opacity 0.3s ease"
                    }}
                    className="text-sm font-medium text-black"
                  >
                    {user.username}
                  </span>
                </div>
                <div
                  onClick={handleLogout}
                  className="flex items-center gap-1 p-0 pl-0 rounded cursor-pointer hover:bg-gray-100"
                >
                  <LogOut size={18} className="text-black" />
                  <span
                    style={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                      transition: "opacity 0.3s ease"
                    }}
                    className="text-black text-sm whitespace-pre transition duration-150"
                  >
                    Logout
                  </span>
                </div>
              </div>
            )}
          </div>
        </DesktopSidebar>
      </div>
    </SidebarProvider>
  );
}