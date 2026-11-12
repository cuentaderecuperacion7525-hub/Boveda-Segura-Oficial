/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "index.html",
    "revision": "e0558a0d52527059b6017b1d507b3ec9"
  }, {
    "url": "confirmar.html",
    "revision": "af90d57fedeb57a110d019aac7e6a29e"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/web-Cgiycfvf.js",
    "revision": null
  }, {
    "url": "assets/web-CCiJT0Y9.js",
    "revision": null
  }, {
    "url": "assets/web-B2Yzjajn.js",
    "revision": null
  }, {
    "url": "assets/pdf.worker.min-DKQKFyKK.js",
    "revision": null
  }, {
    "url": "assets/index-DXnzb4tZ.css",
    "revision": null
  }, {
    "url": "assets/index-BcBr_amV.js",
    "revision": null
  }, {
    "url": "assets/index-BQqhwTJW.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "813594dd35a5b76c97d2bee027373305"
  }, {
    "url": "icon.svg",
    "revision": "b33f4b0737a5b4d38923f7cfa6afa28f"
  }, {
    "url": "pwa-192x192.png",
    "revision": "ec6532ad027d6a35482d922632a1d7ba"
  }, {
    "url": "pwa-512x512.png",
    "revision": "9a2898b94fe61c1cb4f3da16c5d1ee24"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "faaaf395e8581b65ffb58d499246da7d"
  }, {
    "url": "manifest.webmanifest",
    "revision": "4cdf73e1b2bb0eddfe8d3c8248fd6863"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
