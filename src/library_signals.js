// 'use strict'
var funs = {
  _sigalrm_handler: 0,
  _itimers: {},

  signal__deps: ['_sigalrm_handler'],
  signal: function(sig, func) {
    if (sig == 14 /*SIGALRM*/ && func !== 1) {
      __sigalrm_handler = func;
    } else {
#if ASSERTIONS
      Module.printErr('Calling stub instead of signal()');
#endif
    }
    return 0;
  },
  sigemptyset: function(set) {
    {{{ makeSetValue('set', '0', '0', 'i32') }}};
    return 0;
  },
  sigfillset: function(set) {
    {{{ makeSetValue('set', '0', '-1>>>0', 'i32') }}};
    return 0;
  },
  sigaddset: function(set, signum) {
    {{{ makeSetValue('set', '0', makeGetValue('set', '0', 'i32') + '| (1 << (signum-1))', 'i32') }}};
    return 0;
  },
  sigdelset: function(set, signum) {
    {{{ makeSetValue('set', '0', makeGetValue('set', '0', 'i32') + '& (~(1 << (signum-1)))', 'i32') }}};
    return 0;
  },
  sigismember: function(set, signum) {
    return {{{ makeGetValue('set', '0', 'i32') }}} & (1 << (signum-1));
  },
  sigaction: function(signum, act, oldact) {
    //int sigaction(int signum, const struct sigaction *act, struct sigaction *oldact);
#if ASSERTIONS
    Module.printErr('Calling stub instead of sigaction()');
#endif
    return 0;
  },
  sigprocmask: function() {
#if ASSERTIONS
    Module.printErr('Calling stub instead of sigprocmask()');
#endif
    return 0;
  },
  __libc_current_sigrtmin: function() {
#if ASSERTIONS
    Module.printErr('Calling stub instead of __libc_current_sigrtmin');
#endif
    return 0;
  },
  __libc_current_sigrtmax: function() {
#if ASSERTIONS
    Module.printErr('Calling stub instead of __libc_current_sigrtmax');
#endif
    return 0;
  },
  kill__deps: ['$ERRNO_CODES', '__setErrNo'],
  kill: function(pid, sig) {
    // http://pubs.opengroup.org/onlinepubs/000095399/functions/kill.html
    // Makes no sense in a single-process environment.
	  // Should kill itself somtimes depending on `pid`
#if ASSERTIONS
    Module.printErr('Calling stub instead of kill()');
#endif
    ___setErrNo(ERRNO_CODES.EPERM);
    return -1;
  },

  killpg__deps: ['$ERRNO_CODES', '__setErrNo'],
  killpg: function() {
#if ASSERTIONS
    Module.printErr('Calling stub instead of killpg()');
#endif
    ___setErrNo(ERRNO_CODES.EPERM);
    return -1;
  },
  siginterrupt: function() {
#if ASSERTIONS
    Module.printErr('Calling stub instead of siginterrupt()');
#endif
    return 0;
  },

  raise__deps: ['$ERRNO_CODES', '__setErrNo'],
  raise: function(sig) {
#if ASSERTIONS
    Module.printErr('Calling stub instead of raise()');
#endif
  ___setErrNo(ERRNO_CODES.ENOSYS);
#if ASSERTIONS
    warnOnce('raise() returning an error as we do not support it');
#endif
    return -1;
  },

  // http://pubs.opengroup.org/onlinepubs/000095399/functions/alarm.html
  alarm__deps: ['_sigalrm_handler'],
  alarm: function(seconds) {
    setTimeout(function() {
      if (__sigalrm_handler) Module['dynCall_vi'](__sigalrm_handler, 0);
    }, seconds*1000);
  },

  // http://pubs.opengroup.org/onlinepubs/009695399/functions/ualarm.html
  ualarm__deps: ['_sigalrm_handler'],
  ualarm: function(timeOut, intervals) {
    if (timeOut < 0 || intervals < 0) {
       ___setErrNo(ERRNO_CODES.EINVAL);
       return -1;
    }
    setTimeout(function() {
      if (__sigalrm_handler) Runtime.dynCall('vi', __sigalrm_handler, [0]);
      }, timeOut / 1000);
    setInterval(function() {
      if (__sigalrm_handler) Runtime.dynCall('vi', __sigalrm_handler, [0]);
    }, intervals / 1000);
    return 0;
  },

  // http://pubs.opengroup.org/onlinepubs/9699919799/functions/getitimer.html
  // On the same page as `getitimer`
  // struct of thisTimer object:
  // {shot: [single shot timeout], shotTimer: [returned by setTimeout],
  // interval: [interval timeout], intervalTimer: [returned by setInterval]}
  setitimer__deps: ['_sigalrm_handler'],
  setitimer: function(which, new_value, old_value) {
    if (which == 0 || which == 1 || which == 2) {
      var thisTimer = __itimers[which];
      if (thisTimer) {
        getitimer(which, old_value);
      }
      thisTimer = {};
      if (new_value) {
        var oneshot_sec = {{{makeGetValue('new_value', C_STRUCTS.itimerspec.it_value.tv_sec, 'i16')}}};
        var oneshot_usec = {{{makeGetValue('new_value', C_STRUCTS.itimerspec.it_value.tv_nsec, 'i16')}}};
        var interval_sec = {{{makeGetValue('new_value', C_STRUCTS.itimerspec.it_interval.tv_sec, 'i16')}}};
        var interval_usec = {{{makeGetValue('new_value', C_STRUCTS.itimerspec.it_interval.tv_nsec, 'i16')}}};
        if (thisTimer) {
          clearInterval(thisTimer.intervalTimer);
          clearTimeout(thisTimer.shotTimer);
        }
        if (oneshot_sec < 0 || oneshot_usec < 0 || oneshot_usec > 999999 || interval_sec < 0 || interval_usec < 0 || interval_usec > 999999) {
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        }
        if (oneshot_sec !== null || oneshot_usec !== null) {
          thisTimer.shot = {tv_sec: oneshot_sec, tv_usec: oneshot_usec};
          thisTimer.shotTimer = setTimeout(function() {
            if (__sigalrm_handler) Runtime.dynCall('vi', __sigalrm_handler, [0]);
            thisTimer.shot = thisTimer.interval;
          }, oneshot_sec * 1000 + oneshot_usec / 1000);
        }
        if (interval_sec !== null || interval_usec !== null) {
          thisTimer.interval = {tv_sec: interval_sec, tv_usec: interval_usec};
          thisTimer.intervalTimer = setInterval(function() {
            if (__sigalrm_handler) Runtime.dynCall('vi', __sigalrm_handler, [0]);
          }, interval_sec * 1000 + interval_usec / 1000);
        }
        __itimers[which] = thisTimer;
      }
      return 0;
    }
    ___setErrNo(ERRNO_CODES.EINVAL);
    return -1;
  },

  // http://pubs.opengroup.org/onlinepubs/9699919799/functions/getitimer.html
  getitimer__deps: ['_sigalrm_handler'],
  getitimer: function(which, curr_value) {
    if (which == 0 || which == 1 || which == 2) {
      var thisTimer = __itimers[which];
      if (thisTimer && curr_value) {
        {{{ makeSetValue('curr_value', C_STRUCTS.itimerspec.it_value.tv_sec, 'thisTimer.shot.tv_sec', 'i16') }}}
        {{{ makeSetValue('curr_value', C_STRUCTS.itimerspec.it_value.tv_nsec, 'thisTimer.shot.tv_usec', 'i16') }}}
        {{{ makeSetValue('curr_value', C_STRUCTS.itimerspec.it_interval.tv_sec, 'thisTimer.interval.tv_sec', 'i16') }}}
        {{{ makeSetValue('curr_value', C_STRUCTS.itimerspec.it_interval.tv_nsec, 'thisTimer.interval.tv_usec', 'i16') }}}
        return 0;
      }
      {{{ makeSetValue('curr_value', C_STRUCTS.itimerspec.it_value.tv_sec, '0', 'i16') }}}
      {{{ makeSetValue('curr_value', C_STRUCTS.itimerspec.it_value.tv_nsec, '0', 'i16') }}}
      {{{ makeSetValue('curr_value', C_STRUCTS.itimerspec.it_interval.tv_sec, '0', 'i16') }}}
      {{{ makeSetValue('curr_value', C_STRUCTS.itimerspec.it_interval.tv_nsec, '0', 'i16') }}}
      return 0;
    }
    ___setErrNo(ERRNO_CODES.EINVAL);
    return -1;
  },

  pause__deps: ['__setErrNo', '$ERRNO_CODES'],
  pause: function() {
    // int pause(void);
    // http://pubs.opengroup.org/onlinepubs/000095399/functions/pause.html
    // We don't support signals, so we return immediately.
#if ASSERTIONS
    Module.printErr('Calling stub instead of pause()');
#endif
    ___setErrNo(ERRNO_CODES.EINTR);
    return -1;
  },
#if ASSERTIONS
  siglongjmp__deps: ['longjmp'],
  siglongjmp: function(env, value) {
    // We cannot wrap the sigsetjmp, but I hope that
    // in most cases siglongjmp will be called later.

    // siglongjmp can be called very many times, so don't flood the stderr.
    warnOnce("Calling longjmp() instead of siglongjmp()");
    _longjmp(env, value);
  },
#else
  siglongjmp: 'longjmp',
#endif
  sigpending: function(set) {
    {{{ makeSetValue('set', 0, 0, 'i32') }}};
    return 0;
  }
  //signalfd
  //ppoll
  //epoll_pwait
  //pselect
  //sigvec
  //sigmask
  //sigblock
  //sigsetmask
  //siggetmask
  //sigsuspend
  //bsd_signal
  //siginterrupt
  //sigqueue
  //sysv_signal
  //signal
  //pthread_kill
  //gsignal
  //ssignal
  //psignal
  //psiginfo
  //sigpause
  //sigisemptyset
  //sigtimedwait
  //sigwaitinfo
  //sigreturn
  //sigstack
  //sigaltstack(2)
  //sigsetops(3),
  //sighold
  //sigrelse
  //sigignore
  //sigset
};

autoAddDeps(funs, '_itimers');
mergeInto(LibraryManager.library, funs);
