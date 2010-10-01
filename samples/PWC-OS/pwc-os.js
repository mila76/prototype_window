// Overide Windows getPageSize to remove dock height (for maximized windows)
Windows._oldGetPageSize = Windows.getPageSize;
Windows.getPageSize = function() {
  var size = Windows._oldGetPageSize(document.body);
  var dockHeight = $('dock').getHeight();

  size.pageHeight -= dockHeight;
  size.windowHeight -= dockHeight;
  return size;
};    


// Overide Windows minimize to move window inside dock  
//Class.create(OSWindow, 
var OSWindow = Class.create(Window, {
  // Overide minimize function
  _minimize: function() {
    if (this.element.visible()) {
      // Hide current window
      this.hide();            

      // Create a dock element
      var element = new Element('span', {className: 'dock_icon'}).hide();
      $('dock').appendChild(element);
      $(element).observe("mouseup", this.restoreFromDock.bind(this));
      $(element).update(this.getTitle());

      new Effect.Appear(element)
    }
  },                 

  // Restore function
  restoreFromDock: function(event) { 
    // Show window
    this.show();
    this.toFront();
    // Fade and destroy icon
    new Effect.Fade(event.element(), {afterFinish: function() {event.element().remove()}})
  }
});

// blur focused window if click on document
Event.observe(document, "click", function(event) {   
  var e = Event.element(event);
  var win = e.up(".dialog");
  var dock = e == $('dock') || e.up("#dock"); 
  if (!win && !dock && Windows.focusedWindow) {
    Windows.blur(Windows.focusedWindow.getId());                    
  }
});

// Chnage theme callback
var currentTheme = 0;
function changeTheme(event) {
  var index = Event.element(event).selectedIndex;
  if (index == currentTheme)
    return;

  var theme, blurTheme;
  switch (index) {
    case 0:
      theme = "lighting";
      blurTheme = "lighting";
      break;
    case 1:
      theme = "osx";
      blurTheme = "osx";
      break;
    case 2:
      theme = "smoothness";
      blurTheme = "smoothness";
      break;
  }
  Windows.windows.each(function(win) {
    win.options.focusClassName = theme; 
    win.options.blurClassName = blurTheme;
    win.changeClassName(blurTheme)
  });
  if (Windows.focusedWindow)
    Windows.focusedWindow.changeClassName(theme);
  currentTheme = index;
}

// Drop callback
function dropIcon(draggable, droppable) {
  draggable.setStyle({top:"10px", left:"10px"})
  droppable.appendChild(draggable)
} 

Draggables.addObserver({ 
    onStart: function(eventName, draggable) {   
      document.body.appendChild(draggable.element)
    }
}); 

// Init webOS, create 3 windows
function initWebOS() {         
  // Create 3 windows
  $R(1,3).each(function(index) {
    var win = new OSWindow({className:"lighting", blurClassName:"lighting", title:"window #"+index, width:250, height:170, top: 100 + index*50, left:100 + index*50});
    win.setContent("<h1>Window #" + index + "</h1>Drop area :<div class='drop' id='drop_" + index + "'></div>");
    win.show();
  	date = new Date();
    date.setMonth(date.getMonth()+3);
    win.setCookie("pwc-os-"+index, date);
    Droppables.add("drop_" + index, {hoverclass: "drop_hover", onDrop: dropIcon});
  });                                                                      
  //
  $('theme').selectedIndex = currentTheme;
  Event.observe($('theme'), "change", changeTheme);

  new Draggable("drag");
}
Event.observe(window, "load", initWebOS);
