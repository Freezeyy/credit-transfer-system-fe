/** Imperative app dialogs — replaces window.alert / window.confirm / window.prompt */

let bridge = null;
const queue = [];

function normalize(options) {
  if (typeof options === "string") return { message: options };
  return options || {};
}

function runWhenReady(fn) {
  if (bridge) return fn(bridge);
  return new Promise((resolve, reject) => {
    queue.push({
      run: (b) => {
        Promise.resolve(fn(b)).then(resolve, reject);
      },
    });
  });
}

export function setDialogBridge(handlers) {
  bridge = handlers;
  if (!handlers) return;
  const pending = queue.splice(0);
  for (const item of pending) {
    item.run(handlers);
  }
}

export function alertDialog(options) {
  const opts = normalize(options);
  return runWhenReady((b) => b.alert(opts));
}

export function confirmDialog(options) {
  const opts = normalize(options);
  return runWhenReady((b) => b.confirm(opts));
}

export function promptDialog(options) {
  const opts = normalize(options);
  return runWhenReady((b) => b.prompt(opts));
}
