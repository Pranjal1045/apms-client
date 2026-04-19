import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const SIDEBAR_OPEN_WIDTH  = 220;
const SIDEBAR_CLOSE_WIDTH = 52;

const DashboardLayout = ({ userRole }) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [open, setOpen] = useState(() => window.innerWidth >= 1024);
  const location = useLocation();

  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [location.pathname, isMobile]);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setOpen(!mobile);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const sidebarW = open ? SIDEBAR_OPEN_WIDTH : SIDEBAR_CLOSE_WIDTH;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar sidebarOpen={open} setSidebarOpen={setOpen} userRole={userRole} />

      <div style={{
        position: "fixed", top: "56px", left: 0, bottom: 0,
        width: isMobile ? (open ? `${SIDEBAR_OPEN_WIDTH}px` : "0px") : `${sidebarW}px`,
        transition: "width 0.22s ease", zIndex: 30, overflow: "hidden",
      }}>
        <Sidebar open={open} setOpen={setOpen} userRole={userRole} />
      </div>

      {isMobile && open && (
        <div onClick={() => setOpen(false)} style={{
          position: "fixed", inset: 0, zIndex: 29,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)"
        }} />
      )}

      <main style={{
        marginLeft: isMobile ? 0 : `${sidebarW}px`,
        marginTop: "56px",
        minHeight: "calc(100vh - 56px)",
        padding: isMobile ? "1rem 0.875rem" : "1.75rem 2rem",
        transition: "margin-left 0.22s ease",
        width: isMobile ? "100%" : `calc(100% - ${sidebarW}px)`,
        maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box",
      }}>
        <Outlet />
      </main>
    </div>
  );
};
export default DashboardLayout;
