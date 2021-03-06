---
title: jQuery Mousehold Event
date: '2006-12-15 19:58:03'
published: true
tags:
  - clickhold
  - jquery
  - mousehold
  - code
modified: '2014-09-03 16:15:12'
---
# jQuery Mousehold Event

I'm working on a web application for [Work](http://www.digitallook.com) and we're working towards recreating an existing desktop application on a web page (don't get me started on that one!).

Anyway, traditional applications have 'spinners' that make numbers or items go up and down (I'm working on that too).  This [jQuery](http://jquery.com) plugin adds the missing 'repeat' event.

[Download the mousehold plugin](https://gist.github.com/remy/0361b2b5d77c0b82535957ec88825cb4).

<!--more-->

The 'repeat' is when you keep a key pressed down and it keeps printing the character, or you keep the mouse button pressed down and it keeps firing the click event.

The plugin works by setting a 'mousedown' event and keeps firing the function at the given interval until the 'mouseup' event **or** the mouse moves off the element.

This last logic is because if it wasn't in place, the function specified would keep firing (since the mouse up event fired, but not on the element we set it on).

Feedback and so on is welcome.
