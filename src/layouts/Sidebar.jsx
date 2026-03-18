import React, { useState, useEffect } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings as SettingsIcon,
  PieChart,
  CreditCard,
  Calculator,
  ChevronDown,
  ChevronRight,
  X,
  Wrench,
  ShieldAlert,
  MessageSquare,
  ClipboardList,
  Landmark,
  Mail,
  User,
  Car
} from "lucide-react";
import clsx from "clsx";

/* =========================
   MENU CONFIG (FIXED)
 ========================= */

const NAV_ITEMS = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    children: [
      { label: "Overview", path: "/dashboard" },
      { label: "Vacancy Dashboard", path: "/vacancy" },
      { label: "Revenue Dashboard", path: "/revenue" }
    ]
  },
  {
    icon: Building2,
    label: "Properties",
    path: "/properties/buildings",
    children: [
      { label: "Buildings", path: "/properties/buildings" },
      { label: "Units", path: "/units" }
    ]
  },
  {
    icon: Users,
    label: "Tenants",
    path: "/tenants",
    children: [
      { label: "Tenant List", path: "/tenants" },
      { label: "Vehicle Management", path: "/tenants/vehicles" },
      // { label: "Owners", path: "/owners" },
      { label: "Insurance Alerts", path: "/insurance-alerts" }
    ]
  },
  {
    icon: Landmark,
    label: "Owners",
    path: "/owners"
  },
  {
    icon: FileText,
    label: "Leases",
    path: "/leases"
  },
  {
    icon: FileText,
    label: "Rent Roll",
    path: "/rent-roll"
  },
  {
    icon: FileText,
    label: "Documents",
    path: "/documents"
  },
  {
    icon: CreditCard,
    label: "Payments",
    path: "/payments/invoices",
    children: [
      { label: "Rent Invoices", path: "/payments/invoices" },
      { label: "Payments Received", path: "/payments/received" },
      { label: "Outstanding Dues", path: "/payments/outstanding" },
      { label: "Refunds & Adjustments", path: "/payments/refunds" }
    ]
  },
  {
    icon: Calculator,
    label: "Accounting",
    path: "/accounting",
    children: [
      { label: "QuickBooks Sync", path: "/settings/quickbooks" },
      { label: "Chart of Accounts", path: "/accounting/chart-of-accounts" },
      { label: "Tax Settings", path: "/accounting/tax-settings" }
    ]
  },
  {
    icon: PieChart,
    label: "Reports",
    path: "/reports"
  },
  {
    icon: MessageSquare,
    label: "Communication",
    path: "/communication"
  },
  {
    icon: Mail,
    label: "Email Logs",
    path: "/emails"
  },
  {
    icon: ClipboardList,
    label: "Maintenance",
    path: "/maintenance"
  },
  {
    icon: Wrench,
    label: "Tickets",
    path: "/tickets"
  },
  {
    icon: SettingsIcon,
    label: "Settings",
    path: "/settings"
  },
  {
    icon: User,
    label: "Profile",
    path: "/profile"
  }
];

/* =========================
   NAV ITEM
 ========================= */

const NavItem = ({ item, depth = 0, onClose }) => {
  const location = useLocation();
  const hasChildren = item.children?.length > 0;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (hasChildren) {
      const activeChild = item.children.some(child =>
        location.pathname.startsWith(child.path)
      );
      setIsOpen(activeChild);
    }
  }, [location.pathname]);

  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(prev => !prev);
    } else {
      onClose?.();
    }
  };

  return (
    <>
      <NavLink
        to={item.path}
        end={item.path === '/tenants' || item.path === '/dashboard' || item.path === '/properties/buildings'}
        onClick={handleClick}
        className={({ isActive }) =>
          clsx(
            "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden",
            isActive && !hasChildren
              ? "bg-primary-600 text-white shadow-xl shadow-primary-200"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )
        }
        style={{ paddingLeft: `calc(16px + ${depth * 14}px)` }}
      >
        {item.icon && <item.icon size={20} />}
        <span className="flex-1">{item.label}</span>
        {hasChildren && (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
      </NavLink>

      {hasChildren && isOpen && (
        <div className="ml-2">
          {item.children.map(child => (
            <NavItem
              key={child.path}
              item={child}
              depth={depth + 1}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </>
  );
};

/* =========================
   SIDEBAR
 ========================= */

export const Sidebar = ({ isOpen, onClose }) => {
  /* SCROLL PRESERVATION */
  const navRef = React.useRef(null);

  useEffect(() => {
    // Restore scroll position on mount
    const savedScroll = sessionStorage.getItem('adminSidebarScroll');
    if (navRef.current && savedScroll) {
      navRef.current.scrollTop = Number(savedScroll);
    }

    // Save scroll position on scroll
    const handleScroll = () => {
      if (navRef.current) {
        sessionStorage.setItem('adminSidebarScroll', navRef.current.scrollTop);
      }
    };

    const navElement = navRef.current;
    if (navElement) {
      navElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (navElement) {
        navElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 bg-black/40 z-40 lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={onClose}
      />

      <aside className={clsx(
        "fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-slate-100 shadow-2xl shadow-slate-200/50 z-50 transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        <div className="p-8 pb-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-black text-xl italic shadow-lg shadow-primary-200">M</div>
            <div>
             <h1 className="text-xl font-black tracking-tighter text-slate-800 uppercase italic leading-none">
                Mas<span className="text-primary-600">teko</span>
              </h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Admin Portal</p>
            </div> */}
            <img src="/assets/logo.png" alt="Masteko Logo" className="h-10 w-auto object-container" />
          </div>
          <button className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav ref={navRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          <div className="px-4 mb-2 mt-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Menu</p>
          </div>
          {NAV_ITEMS.map(item => (
            <NavItem key={item.label} item={item} onClose={onClose} />
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50 shrink-0">
          <Link to="/profile" className="block no-underline">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group cursor-pointer hover:border-primary-100 hover:bg-primary-50/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                  {JSON.parse(localStorage.getItem('user') || '{}').profilePictureUrl ? (
                    <img src={JSON.parse(localStorage.getItem('user') || '{}').profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    JSON.parse(localStorage.getItem('user') || '{}').firstName?.[0] || 'A'
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-black text-slate-800 truncate">{JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin User'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">Super Admin</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};
