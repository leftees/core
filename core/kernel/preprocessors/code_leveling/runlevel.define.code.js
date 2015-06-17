if (platform.kernel.runlevels.hasOwnProperty('%s') === false) {
  Object.defineProperty('platform.kernel.runlevels', '%s', {
    value: false,
    set: function (new_value,previous_value,stored_value,runtime_update) {
      if (stored_value !== new_value) {
        if (platform.configuration.debug.kernel.runlevel === true) {
          if (new_value === true) {
            console.debug('code runlevel %s enabled');
          } else {
            console.debug('code runlevel %s disabled');
          }
        }
        if (platform.events != null) {
          platform.events.raise('kernel.runlevel.change', '%s', new_value);
        }
      }
      return new_value;
    }
  });
}