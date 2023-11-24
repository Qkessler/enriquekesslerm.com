+++
title = "Open or Raise Emacs"
description = "AppleScript to open or raise emacs running in the background as a daemon."
date = 2022-04-17
[taxonomies]
tags = ["emacs", "software"]
[extra]
toc = false
+++

I use [Keyboard maestro](https://www.keyboardmaestro.com/main/) to Activate the applications I use the most, with the intention of reducing hand movement I endure every day. In my normal developing workflow, I would start working with Emacs to do my first Inbox Review, I would then open up the browser to search for anything while developing and I would then want to go back to Emacs to keep developing. Everything works with a keypress and following [mnemonics](https://www.merriam-webster.com/dictionary/mnemonics) to make the keys easier to remember.

The latter is the part that I have been interested in improving. I use the Emacs client-server approach to have a fast running Emacs instance at all times. If I would want to close Emacs, I would be back to an open instance instantly.

The problem with Emacs is that having the server running, we can't use the application condition with Keyboard maestro, since we already have an open application, even if it's running in the background.

The idea is then run an Apple script as the condition to check whether the Emacs process is running (and not the Emacs window) to launch the Emacs client, or only activate the window that is already there. To do so, I would want to use an Apple Script to grep for the background process.

Here is the script that I use as condition:

```applescript
tell application "System Events"
    set emacsWindowsCount to count of window 1 of (processes whose name is "Emacs")
    if emacsWindowsCount is 0 then
        error number -1
    end if
end tell
```

And here is the Keyboard maestro macro I ended up with. The LauchEmacsClient is an application that I created with Automator to just call the `emacsclient` binary with the buffer I want to start with.

![img](images/activate-emacs-macro.png "Activate Emacs keyboard maestro macro.")

If anyone is interested in the `.kmmacros` file, ping me on [email](mailto:enrique.kesslerm@gmail.com).
