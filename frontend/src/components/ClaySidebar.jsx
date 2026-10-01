import React, { useState } from "react";
import {
  IconMessageSquare,
  IconFileText,
  IconBarChart,
  IconCpu,
  IconSettings,
  IconPlus,
  IconSearch,
  IconLayers,
  IconUser,
  IconShield
} from "./Icons.jsx";

export default function ClaySidebar({
  activeView,
  setActiveView,
  onNewChat,
  recentChats = [],
  documentsCount = 0
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const navItems = [
    { id: "chat", label: "Playground & Chat", icon: IconMessageSquare },
    { id: "documents", label: "Documents", icon: IconFileText, badge: documentsCount },
    { id: "collections", label: "Collections", icon: IconLayers },
    { id: "analytics", label: "Observability", icon: IconBarChart },
    { id: "inspector", label: "Retrieval Inspector", icon: IconCpu },
    { id: "settings", label: "Settings", icon: IconSettings }
  ];

  const defaultChats = [
    { id: "c1", title: "Email & Contact Query", time: "10m ago" },
    { id: "c2", title: "Resume Skills Comparison", time: "2h ago" },
    { id: "c3", title: "Architecture Tech Stack", time: "1d ago" }
  ];

  const displayChats = recentChats.length > 0 ? recentChats : defaultChats;
  const filteredChats = displayChats.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="clay-sidebar">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-600/20">
          ⚡
        </div>
        <div>
          <h1 className="font-bold text-base text-slate-900 tracking-tight leading-none">DocuMind</h1>
          <span className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">Enterprise RAG</span>
        </div>
      </div>

      {/* New Chat Session Button */}
      <button
        onClick={onNewChat}
        className="clay-button clay-button-primary w-full mb-5 py-2.5 text-sm flex items-center justify-center gap-2 font-semibold"
      >
        <IconPlus className="w-4 h-4" />
        <span>New Chat Session</span>
      </button>

      {/* Main Navigation */}
      <div className="space-y-1 mb-6">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Platform Views
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon className={isActive ? "text-indigo-600" : "text-slate-400"} />
              <span className="flex-1 text-sm font-semibold">{item.label}</span>
              {item.badge !== undefined && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Sessions */}
      <div className="flex-1 overflow-hidden flex flex-col mb-4">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
          <span>Recent Sessions</span>
        </div>

        {/* Search Input */}
        <div className="relative mb-3 px-1">
          <IconSearch className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>

        <div className="overflow-y-auto space-y-1 pr-1 flex-1">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveView("chat")}
              className="px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition flex items-center justify-between group font-medium"
            >
              <span className="truncate flex-1 mr-2 group-hover:text-indigo-600">{chat.title}</span>
              <span className="text-[10px] text-slate-400 flex-shrink-0">{chat.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="pt-3 border-t border-slate-200 flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm">
          <IconUser className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-900 truncate">Omkar Virakt</div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
            <IconShield className="w-3 h-3 text-emerald-600" />
            <span className="truncate">Admin • RBAC Level 5</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
