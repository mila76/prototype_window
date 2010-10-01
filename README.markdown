Prototype Window Class
======================

#### This Javascript class allows you to add window in a HTML page ####

This is an update of the original Sébastien Gruhier [PWC 1.3](http://prototype-window.xilinus.com/).
Is not a refactoring like PrototypeUI but a 2.0 version with use of DIV instead of TABLE.
In many circumstances this version in compatible with the old release, but with little differences.

New Feature:
------------

* Simple HTML Markup instead of a big nested TABLE.
* Simplify of the Source Code. Half of the size, same functionality.
* Use of CSS3 for Skinnable Windows and Shadow.
* Chaining functionality. `new Window().setContent('Hello World').show();`.
* New Options: autoExpand, haveShadow, useEffects, addModal, centered, closeOnKey, effectDuration.

Backward incompatibility:
-------------------------

* The old constructor `new Window ('id', {options});` is removed. Use `new Window ({options});`.
* Window#setContent is the main function to add content (dom element, html, new Element) and now you can't pass the id, pass $(id) instead.
* Effects is not automatically used if you include effect.js. Add `useEffects: true` to the options.
* IE6 Compatibility is removed. IE8 work well (i think IE7 too).
