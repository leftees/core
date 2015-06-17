platform.kernel.runlevels = platform.kernel.runlevels || {};

if (platform.events != null) {
  if (platform.events.exists('kernel.runlevel.change') === false) {
    platform.events.register('kernel.runlevel.change',null,null,true);
  }
}