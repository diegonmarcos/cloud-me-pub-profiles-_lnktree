// GENERATED FROM banners.json by front-data-json-js-wrapper.sh — DO NOT EDIT BY HAND.
// Re-generate with: bash a_Portals/linktree/src/data/build.sh
(function () {
  var g = (typeof globalThis !== "undefined") ? globalThis : (typeof window !== "undefined" ? window : this);
  g.PORTAL_DATA = g.PORTAL_DATA || {};
  g.PORTAL_DATA["banners"] = {
  "_description": "Source-of-truth manifest mapping remote banner URLs \u2192 local paths under linktree/public/. Read by 1_cicd/src/scripts/front-localize-assets.sh, which downloads each remote into the local path (idempotent) and rewrites every reference inside the sibling *.json files (projects.json / personal-profiles.json / professional-profiles.json) to the local path. Adding a new banner is purely declarative: insert a {remote, local} entry; the engine handles fetch + rewrite.",
  "assets": [
    {
      "slide": "professional-profile",
      "remote": "https://i.pinimg.com/originals/0a/17/73/0a1773b2fbb9b0918090afa415f8edc8.jpg",
      "local": "public/images/banners/professional-profile.jpg"
    },
    {
      "slide": "professional-profile",
      "remote": "https://v1.pinimg.com/videos/mc/720p/d1/0d/22/d10d22deed19360b09173ecbf49dad6a.mp4",
      "local": "public/videos/banners/professional-profile.mp4"
    },
    {
      "slide": "repos",
      "remote": "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXY3MjNidTNpNWthMmdwanl6OXlsdnhicnQ4a2tobmR3Y3l6NXdzMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZaidDjVkPzM7mi7HGy/giphy.gif",
      "local": "public/images/banners/repos.gif"
    },
    {
      "slide": "ducks",
      "remote": "local-asset:assembly-coding.gif (from notes/c_Projects/Other-2/System/wImages/)",
      "local": "public/images/banners/ducks.gif",
      "_doc": "Unix card banner. Assembly coding gif \u2014 unique banner distinct from the mytools/media/structural gif trio."
    },
    {
      "slide": "nexus",
      "_doc": "Squarespace CDN content-negotiates and serves WebP regardless of the .jpg URL suffix \u2014 local extension MUST match real content (.webp), or browsers fail to render the file.",
      "remote": "https://images.squarespace-cdn.com/content/v1/62b8b53ddecd3441cbee091d/ffee989d-1ab3-4a81-8fbb-764b6a42fd1b/JKP_0180revd.jpg",
      "local": "public/images/banners/nexus.webp"
    },
    {
      "slide": "suite",
      "remote": "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2YyZGNoOTlqanVkYTQ0ZXF5bjdoMXN2aXpsMXpmNDRnMzdqbmk0ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/F4nBKBWxcWzcdMJX2W/giphy.gif",
      "local": "public/images/banners/suite.gif"
    },
    {
      "slide": "lab-tools",
      "remote": "https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif",
      "local": "public/images/banners/lab-tools.gif"
    },
    {
      "slide": "cloud",
      "remote": "https://miro.medium.com/v2/resize:fit:720/format:webp/1*0N8CVKix7OGfBDsgh9DzrQ.gif",
      "local": "public/images/banners/cloud.gif"
    },
    {
      "slide": "circus",
      "remote": "https://media1.tenor.com/m/kIF7PM-7BAsAAAAC/penguin-exercise.gif",
      "local": "public/images/banners/circus.gif"
    },
    {
      "slide": "media",
      "remote": "https://media.giphy.com/media/hthdwKV0DExfqg0TF7/giphy.gif",
      "local": "public/images/banners/media.gif",
      "_aliases_note": "The retired MY TOOLS slide originally used this same giphy URL. We preserve a byte-identical copy under mytools.gif so the TOOLCHAIN overview slide can recover that banner without referencing media-slide semantics.",
      "aliases": [
        "public/images/banners/mytools.gif"
      ]
    },
    {
      "slide": "structural",
      "local": "public/images/banners/structural.gif",
      "remote": "https://media.giphy.com/media/hthdwKV0DExfqg0TF7/giphy.gif"
    },
    {
      "slide": "data",
      "remote": "https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif",
      "local": "public/images/banners/lab-tools.gif"
    },
    {
      "slide": "professional-pic",
      "remote": "https://ugc.production.linktr.ee/61669d4d-f89f-476d-a8e6-08051302e895_image.jpeg?io=true&size=avatar-v3_0",
      "local": "public/images/banners/professional-pic.jpeg"
    }
  ]
}
;
})();
