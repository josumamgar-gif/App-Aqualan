// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  if (typeof window === 'undefined') return;
  var e = window.addEventListener;
  e('error', function(ev) {
    if (ev.message && ev.message.indexOf('Cannot redefine property: ethereum') !== -1) {
      ev.preventDefault();
      ev.stopPropagation();
      return true;
    }
  }, true);
  var op = Object.defineProperty;
  Object.defineProperty = function(o, p, d) {
    if (o === window && p === 'ethereum') {
      try {
        var desc = Object.getOwnPropertyDescriptor(window, 'ethereum');
        if (desc && desc.configurable) delete window.ethereum;
      } catch (_) {}
    }
    return op.call(this, o, p, d);
  };
  if (!Object.getOwnPropertyDescriptor(window, 'ethereum')) {
    try {
      op(window, 'ethereum', { value: undefined, writable: true, configurable: true, enumerable: true });
    } catch (_) {}
  }
})();
            `.trim(),
          }}
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        {/*
          Disable body scrolling on web to make ScrollView components work correctly.
          If you want to enable scrolling, remove `ScrollViewStyleReset` and
          set `overflow: auto` on the body style below.
        */}
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </body>
    </html>
  );
}
