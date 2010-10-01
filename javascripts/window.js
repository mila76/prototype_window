// Copyright (c) 2006-2007 Sébastien Gruhier
// (http://xilinus.com, http://itseb.com)
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// VERSION 2.0b1

/** 
 *  A class for showing windows on screen.
 *
 *  <h4>Options</h4>
 *
 *  * `className` (`String`): The CSS `className` for the window. Default is
 *    `lighting`.
 *  * `blurClassName` (`String`): The CSS `className` for the non selected
 *    window. Default is `null`.
 *  * `zIndex` (`Number`): The CSS `z-index` for the window. Default is
 *    `1000`.
 *  * `minWidth` (`Number`): The minimum `Width` for the window. Default is
 *    `120`.
 *  * `minHeight` (`Number`): The minimum `Height` for the window. Default is
 *    `30` or the Height of title bar and status bar.
 *  * `maxWidth` (`Number`): The maximum `Width` for the window. Default is
 *    `null`.
 *  * `maxHeight` (`Number`): The maximum `Height` for the window. Default is
 *    `null`.
 *  * `resizable` (`Boolean`): Whether the window should be resizable.
 *    Default is `true`.
 *  * `closable` (`Boolean`): Whether the window have the close button. Default
 *    is `true`.
 *  * `closeKeyCode` (`Number`): `Keycode` of the key used to close. Default is
 *    `ESC`.
 *  * `closeOnKey` (`Boolean`): Whether the window closes when a key is pressed.
 *    Default is `false`.
 *  * `minimizable` (`Boolean`): Whether the window have the minimize button.
 *    Default is `true`.
 *  * `maximizable` (`Boolean`): Whether the window have the maximize button.
 *    Default is `true`.
 *  * `draggable` (`Boolean`): Whether the window should be draggable (with
 *    the window's title bar as the handle). Default is `true`.
 *  * `haveShadow` (`Boolean`): Whether the window have the shadown. Default is
 *    `true`. 
 *  * `useEffects` (`Boolean`): Whether the window use script.aculo.us effects.
 *    Default is `true`. 
 *  * `title` (`String`): The text to display in the window's title bar.
 *    Default is `""`.
 *  
 *  <h4>Events</h4>
 *
**/
var Window = Class.create({
  /**
   *  new Window(options)
   *  
   *  Note that **the window is not displayed on screen when it is
   *  created**. You must explicitly call [[Window#show]] first.
  **/
  initialize: function() {
    var id = arguments[0] ? arguments[0].id : null;

    // Generate unique ID if not specified
    if (!id || $(id))
      id = 'window_' + new Date().getTime();

    this.id = id;

    this.options = Object.extend({
      className:         'lighting',
      blurClassName:     null,
      width:             null,
      height:            null,
      top:               null,
      left:              null,
      right:             null,
      bottom:            null,
      zIndex:            null,
      title:             '',
      centered:          false,
      recenterAuto:      true,
      autoExpand:        false,
      resizable:         true,
      closable:          true,
      closeKeyCode:      Event.KEY_ESC,
      closeOnKey:        false,
      destroyOnClose:    false,
      minimizable:       true,
      maximizable:       true,
      draggable:         true,
      haveShadow:        true,
      parent:            document.body,
      url:               null,
      addModal:          false,
      minWidth:          120,
      minHeight:         30,
      maxWidth:          null,
      maxHeight:         null,
      gridX:             1,
      gridY:             1,
      useEffects:        false,
      showEffect:        Element.show,
      hideEffect:        Element.hide,
      effectDuration:    0.4,
      opacity:           1,
      showEffectOptions: {},
      hideEffectOptions: {},
      onload:            Prototype.emptyFunction,
      closeCallback:     null
    }, arguments[0] || {});

    if (this.options.useEffects && !Object.isUndefined(Effect)) {
      if (this.options.showEffect == Element.show) this.options.showEffect = Effect.Appear;
      if (this.options.hideEffect == Element.hide) this.options.hideEffect = Effect.Fade;
    }
    if (!this.options.showEffectOptions.to) this.options.showEffectOptions.to = this.options.opacity;
    if (!this.options.showEffectOptions.duration) this.options.showEffectOptions.duration = this.options.effectDuration;
    if (!this.options.showEffectOptions.from) this.options.hideEffectOptions.from = this.options.opacity;
    if (!this.options.hideEffectOptions.duration) this.options.hideEffectOptions.duration = this.options.effectDuration;

    this.width = this.options.width;
    this.height = this.options.height;

    if (!this.options.centered) {
      if (!this.options.left && !this.options.right)
        this.options.left = this._round(Math.random() * 600, this.options.gridX);
      if (!this.options.top && !this.options.bottom)
        this.options.top = this._round(Math.random() * 400, this.options.gridY);
    }

    if (this.options.parent != document.body)
      this.options.parent = $(this.options.parent);

    this.constraint = false;
    this.constraintPad = {top: 0, left:0, bottom:0, right:0};

    this._createWindow(id);
    Windows.register(this);

    if (this.options.zIndex) this.setZIndex(this.options.zIndex);

    if (this.options.draggable)
      this.titleBar.addClassName('draggable');

    // Bind event listener
    this.eventMouseDown = this._initDrag.bindAsEventListener(this);
    this.eventMouseUp = this._endDrag.bindAsEventListener(this);
    this.eventMouseMove = this._updateDrag.bindAsEventListener(this);
    this.eventMouseDownContent = this.toFront.bindAsEventListener(this);
    this.eventResize = this._recenter.bindAsEventListener(this);
    this.eventCloseKey = this._closeOnKey.bindAsEventListener(this);

    Event.observe(this.titleBar, 'mousedown', this.eventMouseDown);
    Event.observe(this.content, 'mousedown', this.eventMouseDownContent);
    Event.observe(window, 'resize', this.eventResize);
    Event.observe(window, 'scroll', this.eventResize);
    Event.observe(this.options.parent, 'scroll', this.eventResize);

    if (this.options.resizable)
      Event.observe(this.sizer, 'mousedown', this.eventMouseDown);

    if (this.options.closeOnKey) this.setCloseOnKey();

    this.storedLocation = null;
  },

  // Destructor
  destroy: function() {
    this._notify('onDestroy');
    Event.stopObserving(this.titleBar, 'mousedown', this.eventMouseDown);
    Event.stopObserving(this.content, 'mousedown', this.eventMouseDownContent);

    Event.stopObserving(window, 'resize', this.eventResize);
    Event.stopObserving(window, 'scroll', this.eventResize);
    Event.stopObserving(this.options.parent, 'scroll', this.eventResize);

    Event.stopObserving(this.content, 'load', this.options.onload);

    if (this._oldParent) {
      var originalContent = this.content.down();
      if (originalContent)
        this._oldParent.insert(originalContent);
      this._oldParent = null;
    }

    if (this.sizer)
      Event.stopObserving(this.sizer, 'mousedown', this.eventMouseDown);

    if (this.options.closeOnKey) {
      Event.stopObserving(document, 'keydown', this.eventCloseKey);
    }

    if (this.options.url)
      this.content.src = null

    Element.remove(this.element);
    Windows.unregister(this);
  },

  // Creates HTML window code
  _createWindow: function(id) {
    if (!$('overlay_modal'))
      this.options.parent.insert(this._createOverlay());

    this.element = new Element('div', {id: id, className: this.options.className}).setStyle({position: 'absolute', outline: '0'});
    this.element.setStyle({opacity: this.options.opacity});

    this.titleBar = new Element('div', {className: 'title'}).update(this.options.title);

    this.content = new Element('div', {className: 'content'});
    Event.observe(this.content, 'load', this.options.onload);
    if (this.options.url) this.content.insert(this._createIFrame(id));

    this.element.insert(this.titleBar).insert(this.content);

    this.statusBar = new Element('div', {className:'statusbar'});
    this.element.insert(this.statusBar);

    if (this.options.haveShadow)
      this.element.addClassName('pwc_shadow');

    if (this.options.closable) {
      var closeLink = new Element('div', {className: 'close'});
      closeLink.observe('click', function(event) {
        this.close();
        Event.stop(event);
      }.bindAsEventListener(this));

      this.element.insert(closeLink);
    }
    if (this.options.maximizable) {
      var maximizeLink = new Element('div', {className: 'maximize'});
      maximizeLink.observe('click', function(event) {
        this._maximize();
        Event.stop(event);
      }.bindAsEventListener(this));

      this.element.insert(maximizeLink);
    }
    if (this.options.minimizable) {
      var minimizeLink = new Element('div', {className: 'minimize'});
      minimizeLink.observe('click', function(event) {
        this._minimize();
        Event.stop(event);
      }.bindAsEventListener(this));

      this.element.insert(minimizeLink);
    }
    if (this.options.resizable) {
      this.sizer = new Element('div', {className: 'sizer'});
      this.element.insert(this.sizer);
    }

    this.element.hide();
    this.options.parent.insert(this.element);

    this._getWindowBorderHeight();
  },

  _createIFrame: function(id) {
    this.iframe = new Element('iframe', {id: id + '_iframe', name: id + '_content', frameBorder: 0, src: this.options.url});
    return this.iframe;
  },

  _createOverlay: function() {
    var objOverlay = new Element('div', {id: 'overlay_modal', className: 'pwc_overlay'});
    objOverlay.hide();

    return objOverlay;
  },

  _getWindowBorderHeight: function() {
    if (this.element.visible())
      this.borderHeight = this._calculateBorderHeight();
    else {
      this.element.setStyle({visibility: 'hidden'}).show();
      this.borderHeight = this._calculateBorderHeight();
      this.element.hide().setStyle({visibility: 'visible'});
    }
  },

  _calculateBorderHeight: function() {
    var bordersHeight = this.titleBar.measure('margin-box-height') + this.statusBar.measure('margin-box-height');
    bordersHeight += this.content.measure('margin-box-height') - this.content.measure('height');
    if (this.buttonPanel) bordersHeight += this.buttonPanel.measure('margin-box-height');

    if (this.options.minHeight < bordersHeight) this.options.minHeight = bordersHeight;

    return bordersHeight;
  },

  _setPosition: function() {
    if (this.options.left)
      this.element.setStyle({left: parseInt(this.options.left) + 'px'});
    else
      this.element.setStyle({right: parseInt(this.options.right) + 'px'});

    if (this.options.top)
      this.element.setStyle({top: parseInt(this.options.top) + 'px'});
    else
      this.element.setStyle({bottom: parseInt(this.options.bottom) + 'px'});

    this.element.setStyle({visibility: 'hidden'}).show();
    var offsetPosition = this.element.positionedOffset();
    this.element.hide().setStyle({visibility: 'visible'});

    this.element.setStyle({right: null, bottom: null});
    this.setLocation(offsetPosition.top, offsetPosition.left);
  },

  _computeSize: function() {
    if (this.height) {
      if (!this.options.autoExpand)
        this.content.setStyle({height: this.height + 'px'});
      else
        this.content.setStyle({minHeight: this.height + 'px'});
    }
    if (this.width)
      this.element.setStyle({width: this.width + 'px'});

    this.element.setStyle({visibility: 'hidden'}).show();

    var dim = this.element.getDimensions();
    if (!this.height) this.height = dim.height;
    if (!this.width) this.width = dim.width;

    this.element.hide().setStyle({visibility: 'visible'});
  },

  // Return window content element
  getContent: function () {
    return this.content;
  },

  getId: function () {
    return this.id;
  },

  getURL: function() {
    return this.options.url || null;
  },

  getTitle: function() {
    return this.titleBar.innerHTML;
  },

  getLocation: function() {
    return {top: this.element.getStyle('top'), left: this.element.getStyle('left')};
  },

  // Gets window size
  getSize: function() {
    return {width: this.width, height: this.height};
  },

  isVisible: function() {
    return this.element.visible();
  },

  isMinimized: function() {
    return this.minimized;
  },

  isMaximized: function() {
    return (this.storedLocation != null);
  },

  setZIndex: function(zindex) {
    this.element.setStyle({zIndex: zindex});
    Windows.updateZindex(zindex, this);
  },

  setCentered: function(top, left) {
    this.options.centered = true;
    this.options.top = top || null;
    this.options.left = left || null;

    return this;
  },

  setModal: function(modal) {
    this.options.addModal = modal || true;
  },

  setTitle: function(newTitle) {
    this.titleBar.update(newTitle);
  },

  setStatusBar: function(element) {
    this.statusBar.update(element);
  },

  // Sets window location
  setLocation: function(top, left) {
    top = this._updateTopConstraint(top);
    left = this._updateLeftConstraint(left);

    this.element.setStyle({top: top + 'px', left: left + 'px'});
  },

  // Sets window size
  setSize: function(width, height, useEffects) {
    var width = parseInt(width), height = parseInt(height);

    // Check min and max size
    if (width < this.options.minWidth)
      width = this.options.minWidth;

    if (!this.isMinimized() && height < this.options.minHeight)
      height = this.options.minHeight;

    if (this.options.maxHeight && height > this.options.maxHeight)
      height = this.options.maxHeight;

    if (this.options.maxWidth && width > this.options.maxWidth)
      width = this.options.maxWidth;

    if (this.element.visible() && this.options.useEffects && Effect.ResizeWindow && useEffects) {
      new Effect.ResizeWindow(this, null, null, width, height, {duration: this.options.effectDuration});
    } else {
      this._resize(width, height);
    }

    this.width = width;
    this.height = height;
  },

  _resize: function(width, height) {
    if (!isNaN(width)) this.element.setStyle({width: width + 'px'});
    if (!isNaN(height)) {
      if (height - this.borderHeight >= 0) {
        var val = height - this.borderHeight + 'px';
        if (this.options.autoExpand && this.isMinimized())
          this.content.setStyle({minHeight: null, 'height': val});
        else if (!this.options.autoExpand)
          this.content.setStyle({height: val});
        else
          this.content.setStyle({minHeight: val});
      }
    }
  },

  // Sets close callback, if it sets, it should return true to be able to close the window.
  setCloseCallback: function(callback) {
    this.options.closeCallback = callback;

    return this;
  },

  // Sets the content HTML or Element
  setContent: function(content) {
    if (this.iframe) {
      this.iframe.remove();
      this.options.url = null;
      this.iframe = null;
    }

    if (Object.isElement(content))
      this._oldParent = content.parentNode;
    this.content.update(content);

    return this;
  },

  setHTMLContent: function(content) {
  	this.setContent(content);
  },

  // Sets the content with Ajax
  setAjaxContent: function(url, options) {
    options = options || {};

    this.onComplete = options.onComplete;
    if (!this._onCompleteHandler)
      this._onCompleteHandler = this._setAjaxContent.bind(this);
    options.onComplete = this._onCompleteHandler;

    new Ajax.Request(url, options);
    options.onComplete = this.onComplete;
  },

  _setAjaxContent: function(originalRequest) {
    this.setContent(originalRequest.responseText);
    if (this.onComplete)
      this.onComplete(originalRequest);
    this.onComplete = null;

    if (!this.element.visible())
      this.show();
  },

  // Sets the content to an URL (or update current URL)
  setURL: function(url) {
    this.options.url = url;
    if (!this.iframe) this.content.update(this._createIFrame(this.id));

    this.iframe.src = this.options.url;

    return this;
  },

  refreshURL: function() {
    if (this.iframe) this.iframe.src = this.options.url;
  },

  // Detroys itself when closing
  setDestroyOnClose: function() {
    this.options.destroyOnClose = true;

    return this;
  },

  setConstraint: function(bool, padding) {
    this.constraint = bool;
    this.constraintPad = Object.extend(this.constraintPad, padding || {});
    // Reset location to apply constraint
    this.setLocation(parseInt(this.element.style.top), parseInt(this.element.style.left));

    return this;
  },

  setCloseOnKey: function(keyCode) {
    if (keyCode) this.options.closeKeyCode = keyCode;
    this.options.closeOnKey = true;

    Event.observe(document, 'keydown', this.eventCloseKey);
  },

  _closeOnKey: function(event) {
    if (event.keyCode == this.options.closeKeyCode) this.close();
  },

  changeClassName: function(newClassName) {
    this.element.removeClassName(this.options.className).addClassName(newClassName);
    this.options.className = newClassName;

    this._getWindowBorderHeight();
    this.setSize(this.width, this.height);

    return this;
  },

  // Brings window to front
  toFront: function() {
    if (this.element.style.zIndex < Windows.maxZIndex)
      this.setZIndex(Windows.maxZIndex + 1);
    Windows.focusedWindow = this;
  },

  // Test and Rebuild this
  resizeOnContent: function(width, height) {
    if (arguments.length == 0) {
      width = true;
      height = true;
    }
    if (width) {
      this.width = null;
      this.element.setStyle({width: 'auto'});
      this.content.setStyle({width: 'auto'});
    }
    if (height) {
      this.height = null;
      this.element.setStyle({height: 'auto'});
      this.content.setStyle({height: 'auto'});
    }

    if (!this.width || !this.height) {
      this._computeSize();
      this.setSize(this.width, this.height);
      if (this.options.centered)
        this._center();
      this.element.show();
    }
  },

  // Displays window
  show: function() {
    if (this.options.addModal) {
      Windows.addModalWindow(this.options);
      this.setZIndex(Windows.maxZIndex + 1);
    } else {
      if (!this.element.style.zIndex) this.setZIndex(Windows.maxZIndex + 1);
    }

    if (!this.width || !this.height)
      this._computeSize();

    this.setSize(this.width, this.height);

    if (this.options.centered)
      this._center();
    else
      this._setPosition();

    this._notify('onBeforeShow');

    this.options.showEffect(this.element, this.options.showEffectOptions);

    Windows.focusedWindow = this;
    this._notify('onShow');

    return this;
  },

  showCenter: function() {
    this.options.centered = true;
    this.show();

    return this;
  },

  // Hides window
  hide: function() {
    this.options.hideEffect(this.element, this.options.hideEffectOptions);

    if (this.options.addModal)
      Windows.removeModalWindow(this.options);

    if (!this.doNotNotifyHide)
      this._notify('onHide');

    return this;
  },

  close: function() {
    // Asks closeCallback if exists
    if (this.element.visible()) {
      if (this.options.closeCallback && !this.options.closeCallback(this))
        return;

      if (this.options.destroyOnClose) {
        var destroyFunc = this.destroy.bind(this);
        if (this.options.hideEffectOptions.afterFinish) {
          var func = this.options.hideEffectOptions.afterFinish;
          this.options.hideEffectOptions.afterFinish = function() {func(); destroyFunc();}
        }
        else
          this.options.hideEffectOptions.afterFinish = function() {destroyFunc();}
      }
      Windows.updateFocusedWindow();

      this.doNotNotifyHide = true;
      this.hide();
      this.doNotNotifyHide = false;
      if (this.options.destroyOnClose && !this.options.useEffects) this.destroy();
      this._notify('onClose');
    }

    return this;
  },

  _minimize: function() {
    if (this.isMaximized() || this.resizing)
      return;

    if (!this.minimized) {
      this.minimized = true;
      this.heightOrg = this.height;
      // To avoid scrolling bar
      this.oldStyle = this.content.getStyle('overflow') || 'auto';
      this.content.setStyle({overflow: 'hidden'});

      this.setSize(this.width, this.borderHeight, true);
    }
    else {
      this.minimized = false;
      if (this.options.autoExpand) this.content.setStyle({height: null});
      this.content.setStyle({overflow: this.oldStyle});
      this.setSize(this.width, this.heightOrg, true);
      this.toFront();
    }
    this._notify('onMinimize');

    // Store new location/size if need be
    this._saveCookie();
  },

  _maximize: function() {
    if (this.isMinimized() || this.resizing)
      return;

    if (this.storedLocation != null) {
      this._restoreLocation();
    }
    else {
      this._storeLocation();

      var pageSize = Windows.getPageSize(this.options.parent);
      var left = pageSize.left;
      var top = pageSize.top;

      if (this.options.haveShadow)
        this.element.removeClassName('pwc_shadow');
      if (this.constraint) {
        pageSize.width -= Math.max(0, this.constraintPad.left) + Math.max(0, this.constraintPad.right);
        pageSize.height -= Math.max(0, this.constraintPad.top) + Math.max(0, this.constraintPad.bottom);
        left +=  Math.max(0, this.constraintPad.left);
        top +=  Math.max(0, this.constraintPad.top);
      }

      var width = pageSize.width, height = pageSize.height;
      width -= this.element.measure('margin-box-width') - this.element.measure('width');
      height -= this.element.measure('margin-box-height') - this.element.measure('height');

      if (this.options.useEffects && Effect.ResizeWindow)
        new Effect.ResizeWindow(this, top, left, width, height, {duration: this.options.effectDuration});
      else {
        this.element.setStyle({left: left + 'px', top: top + 'px'});
        this.setSize(width, height);
      }
      this.toFront();
    }
    this._notify('onMaximize');
    // Store new location/size if need be
    this._saveCookie();
  },

  _center: function() {
    var top = 0, left = 0, pageSize = Windows.getPageSize(this.options.parent), dimensions = this.element.getDimensions();

    if (!this.options.top)
      top = (pageSize.height - (dimensions.height))/2;
    else
      top = this.options.top;
    top += pageSize.top;

    if (!this.options.left)
      left = (pageSize.width - (dimensions.width))/2;
    else
      left = this.options.left;
    left += pageSize.left;

    this.setLocation(top, left);
    this.toFront();
  },

  _recenter: function(event) {
    var pageSize = Windows.getPageSize(this.options.parent);
    if (this.options.recenterAuto)
      this._center();

    if ($('overlay_modal'))
      $('overlay_modal').setStyle({height: pageSize.height + 'px', left: pageSize.left + 'px', top: pageSize.top + 'px'});
  },

  // initDrag event
  _initDrag: function(event) {
    // No resize on minimized window
    if (Event.element(event) == this.sizer && this.isMinimized())
      return;

    // No move on maximzed window
    if (Event.element(event) != this.sizer && this.isMaximized())
      return;

    // Get pointer X,Y
    this.pointer = [this._round(Event.pointerX(event), this.options.gridX), this._round(Event.pointerY(event), this.options.gridY)];

    // Resize
    if (Event.element(event) == this.sizer) {
      this.doResize = true;
      this.widthOrg = this.width;
      this.heightOrg = this.height;
      this._notify('onStartResize');
    }
    else {
      this.doResize = false;
      this.toFront();

      if (!this.options.draggable)
        return;
      this._notify('onStartMove');
    }
    // Register global event to capture mouseUp and mouseMove
    Event.observe(document, 'mouseup', this.eventMouseUp);
    Event.observe(document, 'mousemove', this.eventMouseMove);

    // Stop selection while dragging
    document.body.ondrag = function () { return false; };
    document.body.onselectstart = function () { return false; };

    Event.stop(event);
  },

  // updateDrag event
  _updateDrag: function(event) {
    var pointer = [this._round(Event.pointerX(event), this.options.gridX), this._round(Event.pointerY(event), this.options.gridY)];
    var dx = pointer[0] - this.pointer[0];
    var dy = pointer[1] - this.pointer[1];

    // Resize case, update width/height
    if (this.doResize) {
      var w = this.widthOrg + dx;
      var h = this.heightOrg + dy;

      // Check if it's a right position, update it to keep upper-left corner at the same position
      w = this._updateWidthConstraint(w);
      h = this._updateHeightConstraint(h);

      this.setSize(w, h);
      this._notify('onResize');
    }
    // Move case, update top/left
    else {
      this.pointer = pointer;

      var left =  parseInt(this.element.getStyle('left')) + dx, newLeft = this._updateLeftConstraint(left);
      this.pointer[0] += newLeft - left;
      this.element.setStyle({left: newLeft + 'px'});

      var top =  parseInt(this.element.getStyle('top')) + dy, newTop = this._updateTopConstraint(top);
      this.pointer[1] += newTop - top;
      this.element.setStyle({top: newTop + 'px'});

      this._notify('onMove');
    }

    this.storedLocation = null;
    Event.stop(event);
  },

   // endDrag callback
  _endDrag: function(event) {
    if (this.doResize)
      this._notify('onEndResize');
    else
      this._notify('onEndMove');

    // Release event observing
    Event.stopObserving(document, 'mouseup', this.eventMouseUp);
    Event.stopObserving(document, 'mousemove', this.eventMouseMove);

    Event.stop(event);

    // Store new location/size if need be
    this._saveCookie()

    // Restore selection
    document.body.ondrag = null;
    document.body.onselectstart = null;
  },

  _updateLeftConstraint: function(left) {
    if (this.constraint) {
      var pageSize = Windows.getPageSize(this.options.parent);
      var constraintLeft = this.constraintPad.left + pageSize.left;
      var constraintRight = this.constraintPad.right - pageSize.left;

      if (left < constraintLeft)
        left = constraintLeft;
      if (left + this.width > pageSize.width - constraintRight)
        left = pageSize.width - constraintRight - this.width;
    }
    return left;
  },

  _updateTopConstraint: function(top) {
    if (this.constraint) {
      var pageSize = Windows.getPageSize(this.options.parent);
      var constraintTop = this.constraintPad.top + pageSize.top;
      var constraintBottom = this.constraintPad.bottom - pageSize.top;

      if (top < constraintTop) top = constraintTop;

      if (top + this.height > pageSize.height - constraintBottom)
        top = pageSize.height - constraintBottom - this.height;
    }
    return top;
  },

  _updateWidthConstraint: function(width) {
    if (this.constraint) {
      var windowWidth = Windows.getPageSize(this.options.parent).width;
      var left = parseInt(this.element.getStyle('left'));

      if (left + width > windowWidth - this.constraintPad.right)
        width = windowWidth - this.constraintPad.right - left;
    }
    return width;
  },

  _updateHeightConstraint: function(height) {
    if (this.constraint) {
      var windowHeight = Windows.getPageSize(this.options.parent).height;
      var top = parseInt(this.element.getStyle('top'));

      if (top + height > windowHeight - this.constraintPad.bottom)
        height = windowHeight - this.constraintPad.bottom - top;
    }
    return height;
  },

  _storeLocation: function() {
    if (this.storedLocation == null)
      this.storedLocation = {top: this.element.getStyle('top'), left: this.element.getStyle('left'), width: this.width, height: this.height};
  },

  _restoreLocation: function() {
    if (this.storedLocation != null) {
      if (this.options.haveShadow)
        this.element.addClassName('pwc_shadow');

      if (this.options.useEffects && Effect.ResizeWindow)
        new Effect.ResizeWindow(this, this.storedLocation.top, this.storedLocation.left, this.storedLocation.width, this.storedLocation.height, {duration: this.options.effectDuration});
      else {
        this.element.setStyle({left: this.storedLocation.left, top: this.storedLocation.top});
        this.setSize(this.storedLocation.width, this.storedLocation.height);
      }
      this.storedLocation = null;
    }
  },

  // Stores position/size in a cookie, by default named with window id
  setCookie: function(name, expires, path, domain, secure) {
    name = name || this.id;
    this.cookie = [name, expires, path, domain, secure];

    // Get cookie
    var value = this.getCookie(name)
    // If exists
    if (value) {
      var values = value.split(',');
      var x = values[0].split(':');
      var y = values[1].split(':');

      var w = parseInt(values[2]), h = parseInt(values[3]);
      var mini = values[4];
      var maxi = values[5];

      this.setSize(w, h);
      if (mini == 'true')
        this.doMinimize = true; // Minimize will be done at onload window event
      else if (maxi == 'true')
        this.doMaximize = true; // Maximize will be done at onload window event

      this.element.setStyle({left: x[1]});
      this.element.setStyle({top: y[1]});
    }
  },

  getCookie: function(name) {
    var dc = document.cookie;
    var prefix = name + '=';
    var begin = dc.indexOf('; ' + prefix);
    if (begin == -1) {
      begin = dc.indexOf(prefix);
      if (begin != 0) return null;
    } else {
      begin += 2;
    }
    var end = document.cookie.indexOf(';', begin);
    if (end == -1) {
      end = dc.length;
    }
    return unescape(dc.substring(begin + prefix.length, end));
  },

  _saveCookie: function() {
    if (this.cookie) {
      var value = '';
      value += 'l:' +  (this.storedLocation ? this.storedLocation.left : this.element.getStyle('left'))
      value += ',t:' + (this.storedLocation ? this.storedLocation.top : this.element.getStyle('top'))
      value += ',' + (this.storedLocation ? this.storedLocation.width : this.width);
      value += ',' + (this.storedLocation ? this.storedLocation.height : this.height);
      value += ',' + this.isMinimized();
      value += ',' + this.isMaximized();

      parameters = this.cookie;
      document.cookie = parameters[0] + '=' + escape(value) +
      ((parameters[1]) ? '; expires=' + parameters[1].toGMTString() : '') +
      ((parameters[2]) ? '; path=' + parameters[2] : '') +
      ((parameters[3]) ? '; domain=' + parameters[3] : '') +
      ((parameters[4]) ? '; secure' : '');
    }
  },

  _notify: function(eventName) {
    if (this.options[eventName])
      this.options[eventName](this);
    else
      Windows.notify(eventName, this);
  },

  _round: function(val, round) {
    return round == 1 ? Math.floor(val) : val = Math.floor(val / round) * round;
  }
});

// Windows containers, register all page windows
var Windows = {
  windows: [],
  observers: [],
  focusedWindow: null,
  maxZIndex: 0,

  addObserver: function(observer) {
    this.removeObserver(observer);
    this.observers.push(observer);
  },

  removeObserver: function(observer) {
    this.observers = this.observers.reject( function(o) { return o==observer });
  },

  // onDestroy onStartResize onStartMove onResize onMove onEndResize onEndMove onFocus onBlur onBeforeShow onShow onHide onMinimize onMaximize onClose
  notify: function(eventName, win) {
    this.observers.each( function(o) {if(o[eventName]) o[eventName](eventName, win);});
  },

  // Gets window from its id
  getWindow: function(id) {
    return this.windows.find(function(d) { return d.id == id });
  },

  // Gets the last focused window
  getFocusedWindow: function() {
    return this.focusedWindow;
  },

  updateFocusedWindow: function() {
    this.focusedWindow = this.windows.length >= 2 ? this.windows[this.windows.length-2] : null; // ?????
  },

  // Registers a new window (called by Windows constructor)
  register: function(win) {
    this.windows.push(win);
  },

  // Unregisters a window (called by Windows destructor)
  unregister: function(win) {
    this.windows = this.windows.reject(function(d) { return d==win });
  },

  // Closes all windows
  closeAll: function() {
    this.windows.each( function(w) {Windows.close(w.id)} );
  },

  setAllWinCloseOnKey: function(keyCode) {
    this.windows.each(function(win) {
      win.setCloseOnKey(keyCode)
    });
  },

  // Minimizes a window with its id
  minimize: function(id, event) {
    var win = this.getWindow(id)
    if (win && win.visible)
      win._minimize();
    Event.stop(event);
  },

  // Maximizes a window with its id
  maximize: function(id, event) {
    var win = this.getWindow(id)
    if (win && win.visible)
      win._maximize();
    Event.stop(event);
  },

  // Closes a window with its id
  close: function(id, event) {
    var win = this.getWindow(id);
    if (win)
      win.close();
    if (event)
      Event.stop(event);
  },

  blur: function(id) {
    var win = this.getWindow(id);
    if (!win)
      return;
    if (win.options.blurClassName)
      win.changeClassName(win.options.blurClassName);
    if (this.focusedWindow == win)
      this.focusedWindow = null;
    win._notify('onBlur');
  },

  focus: function(id) {
    var win = this.getWindow(id);
    if (!win)
      return;
    if (this.focusedWindow)
      this.blur(this.focusedWindow.id)

    if (win.options.blurClassName)
      win.changeClassName(win.options.className);
    this.focusedWindow = win;
    win._notify('onFocus');
  },

  updateZindex: function(zindex, win) {
    if (zindex > this.maxZIndex) {
      this.maxZIndex = zindex;
      if (this.focusedWindow)
        this.blur(this.focusedWindow.id)
    }
    this.focusedWindow = win;
    //if (this.focusedWindow)
    this.focus(this.focusedWindow.id)
  },

  // Add a modal window
  addModalWindow: function(options) {
    if (!$('overlay_modal').visible()) {
      var objOverlay = $('overlay_modal'), pageSize = this.getPageSize(objOverlay.parentNode);

      objOverlay.setStyle({zIndex: Windows.maxZIndex + 1});
      Windows.maxZIndex++;

      objOverlay.setStyle({height: pageSize.height + 'px', left: pageSize.left + 'px', top: pageSize.top + 'px'});
      if (options.useEffects)
        new Effect.Appear(objOverlay, {from: 0, to:objOverlay.getStyle('opacity'), duration: options.effectDuration});
      else
        objOverlay.show();
    }
  },

  removeModalWindow: function(options) {
    var objOverlay = $('overlay_modal');
    if (objOverlay) {
      // hide lightbox and overlay
      if (options.useEffects)
        new Effect.Fade(objOverlay, {from: objOverlay.getStyle('opacity'), to:0, duration: options.effectDuration});
      else
        objOverlay.hide();
    }
  },

  getPageSize: function(parent) {
    if (parent != document.body)
      var windowSize = parent.getDimensions(), scrollOffset = Element._returnOffset(parent.scrollLeft, parent.scrollTop);
    else
      var windowSize = document.viewport.getDimensions(), scrollOffset = document.viewport.getScrollOffsets();

    return {width: windowSize.width, height: windowSize.height, top: scrollOffset.top, left: scrollOffset.left};
  }
};


var Dialog = {
  init: function(parameters) {
    this.options = {
      parent:         document.body,
      centered:       true,
      resizable:      false,
      minimizable:    false,
      maximizable:    false,
      draggable:      false,
      closable:       false,
      addModal:       true,
      destroyOnClose: true,
      okLabel:        '  Ok  ',
      cancelLabel:    'Cancel'
    };

    var parameters = parameters || {};

    this.options = Object.extend(this.options, parameters || {});
  },

  confirm: function(content, parameters) {
    var content = content || '';

    this.init(parameters);
    this._createDialog();

    var inputOk = new Element('input', {type: 'button', value: this.options.okLabel, className: 'cancel_button'});
    inputOk.onclick = this.okCallback.bindAsEventListener(this);
    var inputCancel = new Element('input', {type: 'button', value: this.options.cancelLabel, className: 'ok_button'});
    inputCancel.onclick = this.cancelCallback.bindAsEventListener(this);

    this.win.buttonPanel = new Element('div', {className: 'buttonpanel'});
    this.win.content.insert({after: this.win.buttonPanel.insert(inputOk).insert(inputCancel)});

    if (!Object.isString(content) && !Object.isElement(content)) {
      this._runAjaxRequest(content, parameters, Dialog.confirm);
      return;
    }

    return this._openDialog(content);
  },

  alert: function(content, parameters) {
    var content = content || '';

    this.init(parameters);
    this._createDialog();

    var input = new Element('input', {type: 'button', value: this.options.okLabel, className: 'ok_button'});
    input.onclick = this.okCallback.bindAsEventListener(this);

    this.win.buttonPanel = new Element('div', {className: 'buttonpanel'});
    this.win.content.insert({after: this.win.buttonPanel.insert(input)});

    if (!Object.isString(content) && !Object.isElement(content)) {
      this._runAjaxRequest(content, parameters, Dialog.alert);
      return;
    }

    return this._openDialog(content);
  },

  info: function(content, parameters) {
    var content = content || '';

    this.init(parameters);
    this._createDialog();

    if (!Object.isString(content) && !Object.isElement(content)) {
      this._runAjaxRequest(content, parameters, Dialog.info);
      return;
    }

    return this._openDialog(content);
  },

  setMessage: function(message) {
    this.win.content.update(message);
  },

  close: function() {
    this.win.close();
  },

  _createDialog: function() {
    this.win = new Window(this.options);
    this.win.okCallback = this.options.onOk;
    this.win.cancelCallback = this.options.onCancel;
  },

  _openDialog: function(content) {
    this.win.setContent(content);
    this.win._getWindowBorderHeight();
    this.win.show();

    return this.win;
  },

  _runAjaxRequest: function(message, parameters, callFunc) {
    if (message.options == null)
      message.options = {};

    this.onComplete = message.options.onComplete;

    message.options.onComplete = this._getAjaxContent.bind(this);
    new Ajax.Request(message.url, message.options);
  },

  _getAjaxContent: function(originalRequest) {
    this._openDialog(originalRequest.responseText);
    if (this.onComplete)
      this.onComplete(originalRequest);
    this.onComplete = null;
  },

  okCallback: function() {
    if (!this.win.okCallback || this.win.okCallback(this.win)) // close if not exist callback or if return true
      this.close();
  },

  cancelCallback: function() {
    this.close();
    if (this.win.cancelCallback)
      this.win.cancelCallback(this.win);
  }
};
