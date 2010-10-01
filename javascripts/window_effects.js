Effect.ResizeWindow = Class.create();
Object.extend(Object.extend(Effect.ResizeWindow.prototype, Effect.Base.prototype), {
  initialize: function(win, top, left, width, height) {
    this.window = win;
    this.window.resizing = true;

    var size = win.getSize();
    this.initWidth    = parseFloat(size.width);
    this.initHeight   = parseFloat(size.height);

    var location = win.getLocation();
    this.initTop    = parseFloat(location.top);
    this.initLeft   = parseFloat(location.left);

    this.width    = width != null  ? parseFloat(width)  : this.initWidth;
    this.height   = height != null ? parseFloat(height) : this.initHeight;
    this.top      = top != null    ? parseFloat(top)    : this.initTop;
    this.left     = left != null   ? parseFloat(left)   : this.initLeft;

    this.dx     = this.left   - this.initLeft;
    this.dy     = this.top    - this.initTop;
    this.dw     = this.width  - this.initWidth;
    this.dh     = this.height - this.initHeight;

    this.content = $(this.window.getContent());

    this.contentOverflow = this.content.getStyle('overflow') || 'auto';
    this.content.setStyle({overflow: 'hidden'});

    // Wired mode
    if (this.window.options.wiredDrag) {
      this.window.currentDrag = win._createWiredElement();
      this.window.currentDrag.show();
      this.window.element.hide();
    }

//    if (this.window.shadow) this.window.shadow.hide();

    this.start(arguments[5]);
  },

  update: function(position) {
    var width  = Math.floor(this.initWidth  + this.dw * position);
    var height = Math.floor(this.initHeight + this.dh * position);
    var top    = Math.floor(this.initTop    + this.dy * position);
    var left   = Math.floor(this.initLeft   + this.dx * position);

    this.window._resize(width, height);
    this.window.setLocation(top, left);
  },

  finish: function(position) {
    // Wired mode
    if (this.window.options.wiredDrag) {
      this.window._hideWiredElement();
      this.window.element.show();
    }

    this.window.setSize(this.width, this.height);
    this.window.setLocation(this.top, this.left);
    
    this.content.setStyle({overflow: this.contentOverflow});
      
    this.window.resizing = false;
  }
});

Effect.ModalSlideDown = function(element) {
  var height = element.getStyle('height');
  element.setStyle({top: - (parseFloat(height) - Windows.getPageSize().pageTop) + 'px'});

  element.show();
  return new Effect.Move(element, Object.extend({ x: 0, y: parseFloat(height) }, arguments[1] || {}));
};

Effect.ModalSlideUp = function(element) {
  var height = element.getStyle('height');
  return new Effect.Move(element, Object.extend({ x: 0, y: -parseFloat(height) }, arguments[1] || {}));
};

PopupEffect = Class.create();
PopupEffect.prototype = {
  initialize: function(htmlElement) {
    this.html = $(htmlElement);
    this.options = Object.extend({className: 'popup_effect', duration: 0.4}, arguments[1] || {});

  },

  show: function(element, options) { 
    var position = Element.cumulativeOffset(this.html);
    var size = this.html.getDimensions();

    this.element = $(element);

    // Create a div
    if (!this.div) {
      this.div = new Element('div', {className: this.options.className});
      document.body.appendChild(this.div);
    }
    this.div.setStyle({
      height: size.height + 'px',
      left: position[0] + 'px',
      position: 'absolute',
      top: position[1] + 'px',
      width: size.width  + 'px'
    });
    if (this.options.fromOpacity)
      this.div.setStyle({opacity: this.options.fromOpacity});

    this.div.show();

    var style = {
      height: this.element.getStyle('height'),
      left: this.element.getStyle('left'),
      top: this.element.getStyle('top'),
      width: this.element.getStyle('width')
    };
    if (this.options.toOpacity)
      style = Object.extend({opacity: this.options.toOpacity.toString()}, style);

    new Effect.Morph(this.div ,{style: style, duration: this.options.duration, afterFinish: this._showWindow.bind(this)});
  },

  hide: function(element, options) {     
    var position = Element.cumulativeOffset(this.html);      
    var size = this.html.getDimensions();    

    this.div.setStyle({
      height: this.element.getStyle('height'),
      left: this.element.getStyle('left'),
      top: this.element.getStyle('top'),
      width: this.element.getStyle('width')
    });

    if (this.options.toOpacity)
      this.div.setStyle({opacity: this.options.toOpacity});

    this.element.hide();
    this.div.show();                                 

    var style = {
      height: size.height + 'px',
      left: position[0] + 'px',
      top: position[1] + 'px',
      width: size.width + 'px'
    };
    if (this.options.toOpacity)
      style = Object.extend({opacity: this.options.fromOpacity.toString()}, style);

    new Effect.Morph(this.div ,{style: style, duration: this.options.duration, afterFinish: this._hideDiv.bind(this)});
  },

  _showWindow: function() {
    this.div.hide();
    this.element.show();
  },

  _hideDiv: function() {
    this.div.hide();
  }
}

