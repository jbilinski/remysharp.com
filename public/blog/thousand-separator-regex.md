---
title: Thousand separator regex
date: '2007-10-19 12:18:46'
published: true
tags:
  - code
  - format
  - formatting
  - number
  - thousand
modified: '2014-09-03 16:15:12'
---
# Thousand separator regex

    s/\d{1,3}(?=(\d{3})+(?!\d))/$&,/g

The amount of code that goes in to formatting numbers can be silly sometimes, especially when you realise it can be done as a regex.

Note that if the number has a DP longer than 2, it'll format it - I suggest splitting out the DP first, and bash them back together.

([via](http://macromates.com/blog/2007/recursion-in-regular-expressions))
