// ==========================================================================
// Embedded Graph Data - Linktree Mindmap
// ==========================================================================
// This file contains the graph data embedded directly into the bundle
// to avoid CORS issues when opening via file:// protocol

import type { GraphData } from './types';

export const GRAPH_DATA: GraphData = {
  "root": {
    "id": "dnm",
    "label": "DNM",
    "fullLabel": "Diego Nepomuceno Marcos",
    "icon": "user",
    "color": "#2196F3",
    "children": ["professional", "personal"]
  },
  "nodes": {
    "professional": {
      "id": "professional",
      "label": "Professional",
      "icon": "briefcase",
      "color": "#4CAF50",
      "children": ["profile-pro", "repos", "nexus"]
    },
    "personal": {
      "id": "personal",
      "label": "Personal",
      "icon": "heart",
      "color": "#E91E63",
      "children": ["profile-personal", "deving", "tools", "circus"]
    },
    "profile-pro": {
      "id": "profile-pro",
      "label": "Profile",
      "icon": "user",
      "color": "#4CAF50",
      "children": ["contact-pro", "profiles-pro", "ventures", "curriculum"]
    },
    "repos": {
      "id": "repos",
      "label": "Repos",
      "icon": "brand-github",
      "color": "#4CAF50",
      "children": ["github-overview", "cs-repos", "eng-finance-repos"]
    },
    "nexus": {
      "id": "nexus",
      "label": "Nexus",
      "icon": "rocket",
      "color": "#4CAF50",
      "children": ["nexus-contact", "nexus-venture"]
    },
    "profile-personal": {
      "id": "profile-personal",
      "label": "Profile",
      "icon": "user",
      "color": "#E91E63",
      "children": ["contact-personal", "profiles-personal", "my-media", "my-endurance", "my-maps", "my-bucket"]
    },
    "deving": {
      "id": "deving",
      "label": "Deving",
      "icon": "code",
      "color": "#E91E63",
      "children": ["cloud-portal", "ai-tools", "inbox-tools", "productivity-tools", "dev-tools"]
    },
    "tools": {
      "id": "tools",
      "label": "Tools",
      "icon": "settings",
      "color": "#E91E63",
      "children": ["health-tools", "finance-tools", "content-tools"]
    },
    "circus": {
      "id": "circus",
      "label": "Circus",
      "icon": "sparkles",
      "color": "#E91E63",
      "children": ["games", "video", "audio"]
    },
    "contact-pro": {
      "id": "contact-pro",
      "label": "Contact",
      "icon": "mail",
      "color": "#81C784",
      "links": [
        { "label": "Email", "url": "mailto:me@diegonmarcos.com", "icon": "mail" },
        { "label": "LinkedIn", "url": "https://linkedin.com/in/diegonmarcos", "icon": "brand-linkedin" },
        { "label": "vCard", "url": "public/diegonmarcos-contact_photo.vcf", "icon": "user", "download": true }
      ]
    },
    "profiles-pro": {
      "id": "profiles-pro",
      "label": "Profiles",
      "icon": "world",
      "color": "#81C784",
      "links": [
        { "label": "Landpage", "url": "https://diegonmarcos.com/", "icon": "world" },
        { "label": "LinkedIn", "url": "https://linkedin.com/in/diegonmarcos", "icon": "brand-linkedin" },
        { "label": "Github", "url": "https://github.com/diegonmarcos", "icon": "brand-github" }
      ]
    },
    "ventures": {
      "id": "ventures",
      "label": "Ventures",
      "icon": "rocket",
      "color": "#81C784",
      "links": [
        { "label": "Nexus", "url": "https://diegonmarcos.github.io/nexus/", "icon": "rocket" }
      ]
    },
    "curriculum": {
      "id": "curriculum",
      "label": "Curriculum",
      "icon": "file-type-pdf",
      "color": "#81C784",
      "links": [
        { "label": "CV (web)", "url": "https://diegonmarcos.github.io/cv_web", "icon": "file-type-html" },
        { "label": "CV (pdf)", "url": "https://diegonmarcos.github.io/cv_pdf", "icon": "file-type-pdf" }
      ]
    },
    "github-overview": {
      "id": "github-overview",
      "label": "Overview",
      "icon": "brand-github",
      "color": "#81C784",
      "links": [
        { "label": "Github", "url": "https://github.com/diegonmarcos", "icon": "brand-github" }
      ]
    },
    "cs-repos": {
      "id": "cs-repos",
      "label": "Computer Science",
      "icon": "brain",
      "color": "#81C784",
      "links": [
        { "label": "Back-End", "url": "https://github.com/diegonmarcos/back-System", "icon": "settings" },
        { "label": "Cyber-Security", "url": "https://github.com/diegonmarcos/cyber-Cyberwarfare", "icon": "bolt" },
        { "label": "DevOps", "url": "https://github.com/diegonmarcos/ops-Tooling", "icon": "git-branch" },
        { "label": "Front-End", "url": "https://github.com/diegonmarcos/diegonmarcos.github.io", "icon": "world" },
        { "label": "ARM Mobile", "url": "https://github.com/diegonmarcos/front-android-Portfolio", "icon": "device-desktop" },
        { "label": "Data Science", "url": "https://github.com/diegonmarcos/ml-DataScience", "icon": "brain" }
      ]
    },
    "eng-finance-repos": {
      "id": "eng-finance-repos",
      "label": "Engineering & Finance",
      "icon": "database",
      "color": "#81C784",
      "links": [
        { "label": "Civil Engineer", "url": "https://github.com/diegonmarcos/cveng_AFrame", "icon": "settings" },
        { "label": "Macro Economics", "url": "https://github.com/diegonmarcos/ecoqt-thesis1", "icon": "world-longitude" },
        { "label": "Quant Finance", "url": "https://github.com/diegonmarcos/ecoqt-thesis2", "icon": "database" }
      ]
    },
    "nexus-contact": {
      "id": "nexus-contact",
      "label": "Contact",
      "icon": "mail",
      "color": "#81C784",
      "links": [
        { "label": "Email", "url": "mailto:me@diegonmarcos.com", "icon": "mail" },
        { "label": "LinkedIn", "url": "https://linkedin.com/in/diegonmarcos", "icon": "brand-linkedin" }
      ]
    },
    "nexus-venture": {
      "id": "nexus-venture",
      "label": "Venture",
      "icon": "rocket",
      "color": "#81C784",
      "links": [
        { "label": "Website", "url": "https://diegonmarcos.github.io/nexus/", "icon": "rocket" },
        { "label": "Slides", "url": "https://diegonmarcos.github.io/nexus/slides", "icon": "slideshow" }
      ]
    },
    "contact-personal": {
      "id": "contact-personal",
      "label": "Contact",
      "icon": "send",
      "color": "#F48FB1",
      "links": [
        { "label": "Telegram", "url": "https://t.me/diegonmarcos", "icon": "send" },
        { "label": "WhatsApp", "url": "https://wa.me/34634769833", "icon": "brand-whatsapp" }
      ]
    },
    "profiles-personal": {
      "id": "profiles-personal",
      "label": "Profiles",
      "icon": "user",
      "color": "#F48FB1",
      "links": [
        { "label": "MyProfile", "url": "https://diegonmarcos.github.io/myprofile", "icon": "user" }
      ]
    },
    "my-media": {
      "id": "my-media",
      "label": "Media",
      "icon": "headphones",
      "color": "#F48FB1",
      "links": [
        { "label": "TIDAL", "url": "https://tidal.com/@diegonmarcos", "icon": "headphones" },
        { "label": "YouTube", "url": "https://www.youtube.com/@diegonmarcos1", "icon": "brand-youtube" },
        { "label": "Pinterest", "url": "https://www.pinterest.com/diegonmarcos", "icon": "slideshow" },
        { "label": "Instagram", "url": "https://www.instagram.com/diegonmarcos", "icon": "brand-instagram" }
      ]
    },
    "my-endurance": {
      "id": "my-endurance",
      "label": "Endurance",
      "icon": "bike",
      "color": "#F48FB1",
      "links": [
        { "label": "Komoot", "url": "https://www.komoot.com/user/2474200810898/routes", "icon": "christmas-tree" },
        { "label": "Strava", "url": "https://www.strava.com/athletes/4662170", "icon": "bike" }
      ]
    },
    "my-maps": {
      "id": "my-maps",
      "label": "Maps",
      "icon": "map-pin-2",
      "color": "#F48FB1",
      "links": [
        { "label": "NomadMania", "url": "https://nomadmania.com/profile/73889", "icon": "brand-google-maps" },
        { "label": "Google Maps", "url": "https://www.google.com/maps/d/u/0/edit?mid=1Wpors-fGHMZOYPx41nDtyF9vXOJcpsY", "icon": "map-pin-2" },
        { "label": "Earth", "url": "https://earth.google.com/earth/d/1WF5_9NDew9IB5xkTqXPpm9e9n8JM0a3H", "icon": "world-longitude" }
      ]
    },
    "my-bucket": {
      "id": "my-bucket",
      "label": "Bucket List",
      "icon": "checklist",
      "color": "#F48FB1",
      "links": [
        { "label": "50 Things", "url": "https://bucketlistjourney.net/my-bucket-list", "icon": "checklist" }
      ]
    },
    "cloud-portal": {
      "id": "cloud-portal",
      "label": "Cloud Portal",
      "icon": "settings",
      "color": "#F48FB1",
      "links": [
        { "label": "Portal", "url": "https://diegonmarcos.github.io/cloud", "icon": "settings" }
      ]
    },
    "ai-tools": {
      "id": "ai-tools",
      "label": "AI",
      "icon": "robot",
      "color": "#F48FB1",
      "links": [
        { "label": "Chat Multi-Model", "url": "https://diegonmarcos.github.io/cloud/products.html", "icon": "robot" },
        { "label": "WebIDE", "url": "https://diegonmarcos.github.io/cloud/products.html", "icon": "device-desktop" }
      ]
    },
    "inbox-tools": {
      "id": "inbox-tools",
      "label": "Inbox",
      "icon": "mail",
      "color": "#F48FB1",
      "links": [
        { "label": "Mail&Cal", "url": "https://diegonmarcos.github.io/mymail", "icon": "mail" },
        { "label": "MyFeed", "url": "https://diegonmarcos.github.io/myfeed", "icon": "file-stack" }
      ]
    },
    "productivity-tools": {
      "id": "productivity-tools",
      "label": "Productivity",
      "icon": "file-stack",
      "color": "#F48FB1",
      "links": [
        { "label": "Suite", "url": "https://suite.diegonmarcos.com", "icon": "file-stack" },
        { "label": "JSON Vision", "url": "https://diegonmarcos.github.io/json-vision", "icon": "database" }
      ]
    },
    "dev-tools": {
      "id": "dev-tools",
      "label": "DEV",
      "icon": "git-branch",
      "color": "#F48FB1",
      "links": [
        { "label": "API Endpoints", "url": "https://diegonmarcos.github.io/cloud/api", "icon": "git-branch" },
        { "label": "MCP Tools", "url": "https://diegonmarcos.github.io/cloud/mcp", "icon": "settings" }
      ]
    },
    "health-tools": {
      "id": "health-tools",
      "label": "Health",
      "icon": "heart",
      "color": "#F48FB1",
      "links": [
        { "label": "MyHealth FeedYourself", "url": "https://diegonmarcos.github.io/myhealth-feedyourself", "icon": "brain" },
        { "label": "MyHealth Profile", "url": "https://diegonmarcos.github.io/myhealth-profile", "icon": "heart" }
      ]
    },
    "finance-tools": {
      "id": "finance-tools",
      "label": "Finance",
      "icon": "database",
      "color": "#F48FB1",
      "links": [
        { "label": "Market Watch", "url": "https://diegonmarcos.github.io/market_watch", "icon": "database" },
        { "label": "Central Bank", "url": "https://diegonmarcos.github.io/central_bank", "icon": "database" }
      ]
    },
    "content-tools": {
      "id": "content-tools",
      "label": "Content",
      "icon": "map-pin-2",
      "color": "#F48FB1",
      "links": [
        { "label": "MyMaps Navigation", "url": "https://diegonmarcos.github.io/mymaps-navigation", "icon": "map-pin-2" }
      ]
    },
    "games": {
      "id": "games",
      "label": "Games",
      "icon": "device-gamepad",
      "color": "#F48FB1",
      "links": [
        { "label": "Games", "url": "https://diegonmarcos.github.io/games", "icon": "device-gamepad" }
      ]
    },
    "video": {
      "id": "video",
      "label": "Video",
      "icon": "brand-youtube",
      "color": "#F48FB1",
      "links": [
        { "label": "MyVideos", "url": "https://diegonmarcos.github.io/myvideos", "icon": "video" },
        { "label": "Movies", "url": "https://diegonmarcos.github.io/movies/", "icon": "brand-youtube" }
      ]
    },
    "audio": {
      "id": "audio",
      "label": "Audio",
      "icon": "headphones",
      "color": "#F48FB1",
      "links": [
        { "label": "Music", "url": "https://diegonmarcos.github.io/music/", "icon": "headphones" }
      ]
    }
  }
};
