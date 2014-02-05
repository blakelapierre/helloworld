exports.config = {
  "modules": [
    "copy",
    
    "csslint",
    "server",
    "require",
    "minify-js",
    "minify-css",
    "live-reload"
  ],
  "watch": {
    "sourceDir": "public",
    "javascriptDir": "js"
  },
  "server": {
    "defaultServer": { "enabled": false },
    "path": "server.js",
    "port": 3006,
    "views": { "path": "" }
  }
}